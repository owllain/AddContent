'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MDXEditorMethods } from '@mdxeditor/editor';
import { useAppStore } from '@/stores/app-store';
import TreeNavigation from '@/components/content/tree-navigation';
import { toast } from 'sonner';
import * as LucideIcons from 'lucide-react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ShieldAlert,
  Menu,
  FileUp,
  Loader2,
  Info,
  ListOrdered,
  ChevronDown,
  Layout,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

// Dynamic import of VisualEditor to avoid SSR issues
const VisualEditor = dynamic(() => import('./visual-editor'), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-[20px]" />,
});

/* ---------- Types ---------- */

interface ApiNode {
  id: string;
  title: string;
  slug: string;
  content: string;
  icon: string;
  order: number;
  parentId: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string | null;
  author?: { id: string; name: string } | null;
  children?: ApiNode[];
}

/* ---------- Icon Helper ---------- */

function NodeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as any)[name] || LucideIcons.FileText;
  return <Icon className={className} />;
}

/* ---------- Available Icons for Selector ---------- */

const AVAILABLE_ICONS = [
  'FileText', 'Folder', 'FolderOpen', 'CreditCard', 'Shield', 'ShieldOff', 'ShieldCheck',
  'RefreshCw', 'Layers', 'Percent', 'Banknote', 'Wallet', 'Briefcase', 'UserPlus', 'Lock',
  'Unlock', 'Settings', 'HelpCircle', 'BookOpen', 'Code', 'Globe', 'Mail', 'Phone', 'Users',
  'BarChart3', 'Calendar', 'Clock', 'Tag', 'Archive', 'Star', 'Lightbulb', 'Database',
  'Server', 'Cloud', 'Home', 'Building', 'GraduationCap', 'Megaphone', 'Newspaper',
  'Presentation', 'Target', 'Award', 'Package', 'Headphones', 'MessageSquare', 'CheckCircle',
  'AlertTriangle', 'Info', 'Copy', 'Link', 'ExternalLink',
];

/* ---------- Slug Generator ---------- */

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/* ---------- Node Form Dialog ---------- */

interface NodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingNode: ApiNode | null;
  defaultParentId?: string | null;
  allNodes: ApiNode[];
  onSave: (data: {
    id?: string;
    title: string;
    slug: string;
    content: string;
    icon: string;
    parentId: string | null;
    published: boolean;
  }) => void;
  isSaving: boolean;
}

function NodeFormDialog({
  open,
  onOpenChange,
  editingNode,
  defaultParentId,
  allNodes,
  onSave,
  isSaving,
}: NodeFormDialogProps) {
  const isCreating = !editingNode;

  // Initialize state from props (component uses key pattern for remount)
  const [title, setTitle] = useState(editingNode?.title || '');
  const [slugOverride, setSlugOverride] = useState(editingNode?.slug || '');
  const [slugIsManual, setSlugIsManual] = useState(!!editingNode);
  const [icon, setIcon] = useState(editingNode?.icon || 'FileText');
  const [content, setContent] = useState(editingNode?.content || '');
  const [published, setPublished] = useState(editingNode?.published ?? true);
  const [parentId, setParentId] = useState<string | null>(editingNode?.parentId || defaultParentId || null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const editorRef = React.useRef<MDXEditorMethods | null>(null);

  const insertTemplateSnippet = (snippet: string) => {
    try {
      editorRef.current?.insertMarkdown(snippet);
    } catch {
      // Fallback: append at the end when the editor cursor API is unavailable.
      setContent((prev) => `${prev}${snippet}`);
    }
  };

  const handleImportPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecciona un archivo PDF válido');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errMsg = 'Error al procesar el PDF';
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {
          errMsg = `Error del servidor de importación (Status ${res.status})`;
        }
        throw new Error(errMsg);
      }

      const textualData = await res.text();
      let data;
      try {
        data = JSON.parse(textualData);
      } catch (e) {
        throw new Error('La respuesta del servidor no es código JSON válido. Servidor potencialmente desconectado.');
      }
      
      // Sustituir contenido
      setContent(data.html);
      
      // Intentar auto-rellenar título si se encontró uno y el campo está vacío
      if (data.title && !title.trim()) {
        handleTitleChange(data.title);
      }

      toast.success('PDF importado correctamente');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al importar PDF');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Derive slug: auto-generate from title unless user manually edited
  const displaySlug = slugIsManual ? slugOverride : generateSlug(title);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slugIsManual) {
      setSlugOverride(generateSlug(newTitle));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !displaySlug.trim()) return;
    onSave({
      ...(editingNode ? { id: editingNode.id } : {}),
      title: title.trim(),
      slug: displaySlug.trim(),
      content,
      icon,
      parentId,
      published,
    });
  };

  // Build parent options with indentation
  const parentOptions = useMemo(() => {
    const nodeMap = new Map<string, ApiNode>();
    for (const n of allNodes) nodeMap.set(n.id, n);

    const buildOptions = (nodes: ApiNode[], depth: number): { id: string; title: string; depth: number }[] => {
      const result: { id: string; title: string; depth: number }[] = [];
      const roots = nodes.filter((n) => !n.parentId || !nodeMap.has(n.parentId));
      for (const root of roots) {
        result.push({ id: root.id, title: root.title, depth });
        const children = nodes.filter((n) => n.parentId === root.id);
        result.push(...buildOptions(children, depth + 1));
      }
      return result;
    };

    return buildOptions(allNodes, 0);
  }, [allNodes]);

  // Filter out the current node and its descendants from parent options
  const filteredParentOptions = useMemo(() => {
    if (!editingNode) return parentOptions;
    const excludeIds = new Set<string>();
    const collectDescendants = (id: string) => {
      excludeIds.add(id);
      allNodes.filter((n) => n.parentId === id).forEach((n) => collectDescendants(n.id));
    };
    collectDescendants(editingNode.id);
    return parentOptions.filter((opt) => !excludeIds.has(opt.id));
  }, [parentOptions, editingNode, allNodes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="custom-scrollbar max-h-[92vh] w-[96vw] max-w-6xl overflow-y-auto rounded-[40px] p-6 pr-3 md:p-8 md:pr-4">
        <DialogHeader>
          <DialogTitle className="mc-h3">
            {isCreating ? 'Crear nuevo nodo' : 'Editar nodo'}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[var(--mc-slate)]">
            {isCreating
              ? 'Completa los campos para crear un nuevo nodo de contenido.'
              : 'Modifica los campos del nodo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-title" className="text-[13px] font-medium">
              Título *
            </Label>
            <Input
              id="node-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título del nodo"
              className="rounded-[20px] border-[var(--mc-dust-taupe)] bg-[var(--mc-white)]"
              required
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-slug" className="text-[13px] font-medium">
              Slug *
            </Label>
            <Input
              id="node-slug"
              value={displaySlug}
              onChange={(e) => {
                setSlugOverride(e.target.value);
                setSlugIsManual(true);
              }}
              placeholder="url-del-nodo"
              className="rounded-[20px] border-[var(--mc-dust-taupe)] bg-[var(--mc-white)] font-mono text-[13px]"
              required
            />
          </div>

          {/* Icon Selector */}
          <div className="flex flex-col gap-2">
            <Label className="text-[13px] font-medium">Icono</Label>
            <div className="custom-scrollbar grid max-h-[200px] grid-cols-6 gap-1.5 overflow-y-auto rounded-[20px] border border-[var(--mc-dust-taupe)] bg-[var(--mc-white)] p-3 sm:grid-cols-8 md:grid-cols-10">
              {AVAILABLE_ICONS.map((iconName) => {
                const isSelected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    title={iconName}
                    className={`flex h-9 w-full items-center justify-center rounded-[12px] transition-all ${
                      isSelected
                        ? 'bg-[var(--mc-light-signal-orange)] text-white shadow-sm'
                        : 'bg-transparent text-[var(--mc-slate)] hover:bg-[var(--mc-canvas)] hover:text-[var(--mc-ink)]'
                    }`}
                  >
                    <NodeIcon name={iconName} className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content with Snippets */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="node-content" className="text-[13px] font-medium">
                Contenido (HTML)
              </Label>
              <div className="flex items-center gap-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Info Box', snippet: '\n<div class="mc-info-box">**INFO:** Contenido destacado aquí.</div>\n', icon: <Info className="h-3 w-3" /> },
                    { label: 'Pasos 1-2-3', snippet: '\n<div class="mc-steps">\n  <div class="mc-step">\n    <div class="mc-step-number">1</div>\n    <div class="mc-step-content"><h4>Título del Paso</h4><p>Descripción del primer paso aquí.</p></div>\n  </div>\n  <div class="mc-step">\n    <div class="mc-step-number">2</div>\n    <div class="mc-step-content"><h4>Título del Paso</h4><p>Descripción del segundo paso aquí.</p></div>\n  </div>\n</div>\n', icon: <ListOrdered className="h-3 w-3" /> },
                    { label: 'Acordeón', snippet: '\n<details class="mc-accordion">\n  <summary class="mc-accordion-trigger">Título de la Sección</summary>\n  <div class="mc-accordion-content">Contenido desplegable que ayuda a organizar la información densa.</div>\n</details>\n', icon: <ChevronDown className="h-3 w-3" /> },
                    { label: 'Card Premium', snippet: '\n<div class="mc-display-card">\n  <h3>Título de la Card</h3>\n  <p>Este es un bloque destacado para resaltar información importante de manera visual.</p>\n</div>\n', icon: <Layout className="h-3 w-3" /> },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => insertTemplateSnippet(item.snippet)}
                      className="flex items-center gap-1 rounded-[12px] border border-[var(--mc-dust-taupe)] bg-[var(--mc-canvas)] px-2.5 py-1 text-[11px] font-medium text-[var(--mc-slate)] transition-colors hover:bg-[var(--mc-white)] hover:text-[var(--mc-ink)]"
                      title={`Insertar ${item.label}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                
                <div className="h-4 w-px bg-[var(--mc-dust-taupe)]" />
                
                <input
                  type="file"
                  accept=".pdf"
                  ref={fileInputRef}
                  onChange={handleImportPdf}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center gap-1.5 rounded-[12px] border border-[var(--mc-light-signal-orange)] bg-[var(--mc-light-signal-orange)]/10 px-3 py-1 text-[11px] font-bold text-[var(--mc-light-signal-orange)] transition-colors hover:bg-[var(--mc-light-signal-orange)] hover:text-white disabled:opacity-50"
                >
                  {isImporting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <FileUp className="h-3 w-3" />
                  )}
                  {isImporting ? 'PROCESANDO...' : 'IMPORTAR PDF'}
                </button>
              </div>
            </div>
            
            <VisualEditor
              markdown={content}
              onChange={setContent}
              editorRef={editorRef}
            />

            <p className="text-[11px] text-[var(--mc-slate)] italic">
              * El editor visual genera Markdown. Puedes usar los bloques predefinidos de arriba para insertar HTML avanzado.
            </p>
          </div>

          {/* Published Toggle */}
          <div className="flex items-center justify-between rounded-[20px] border border-[var(--mc-dust-taupe)] bg-[var(--mc-white)] p-4">
            <div>
              <Label className="text-[13px] font-medium">Publicado</Label>
              <p className="text-[12px] text-[var(--mc-slate)]">
                {published ? 'Visible para todos los usuarios' : 'Solo visible en administración'}
              </p>
            </div>
            <Switch checked={published} onCheckedChange={setPublished} />
          </div>

          {/* Parent Node */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium">Nodo padre (opcional)</Label>
            <Select
              value={parentId || '__none__'}
              onValueChange={(v) => setParentId(v === '__none__' ? null : v)}
            >
              <SelectTrigger className="w-full rounded-[20px] border-[var(--mc-dust-taupe)] bg-[var(--mc-white)]">
                <SelectValue placeholder="Sin nodo padre (raíz)" />
              </SelectTrigger>
              <SelectContent className="max-h-[240px]">
                <SelectItem value="__none__">Raíz (sin padre)</SelectItem>
                {filteredParentOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {'  '.repeat(opt.depth)}
                    {opt.depth > 0 && '└ '}
                    {opt.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <DialogFooter className="gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-[20px] border-[var(--mc-ink)]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !title.trim() || !displaySlug.trim()}
              className="rounded-[20px] bg-[var(--mc-ink)] text-[var(--mc-canvas)] hover:bg-[var(--mc-ink-warm)]"
            >
              {isSaving ? 'Guardando...' : isCreating ? 'Crear nodo' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Delete Confirmation Dialog ---------- */

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeTitle: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

function DeleteDialog({ open, onOpenChange, nodeTitle, onConfirm, isDeleting }: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[40px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="mc-h3">Eliminar nodo</AlertDialogTitle>
          <AlertDialogDescription className="text-[14px] text-[var(--mc-slate)]">
            ¿Estás seguro de que deseas eliminar <strong>&quot;{nodeTitle}&quot;</strong>? Esta acción
            no se puede deshacer y también eliminará todos sus nodos hijos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="rounded-[20px]">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-[20px] bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------- Main Admin Panel ---------- */

export default function AdminPanel() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'EDITOR');

  // Dialog state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingNode, setEditingNode] = useState<ApiNode | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiNode | null>(null);
  const [treeSheetOpen, setTreeSheetOpen] = useState(false);

  // Fetch all nodes
  const { data: allNodes, isLoading } = useQuery<ApiNode[]>({
    queryKey: ['nodes', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/nodes?all=true');
      if (!res.ok) throw new Error('Error al cargar nodos');
      const data = await res.json();
      return data.nodes;
    },
  });

  // Sort nodes
  const sortedNodes = useMemo(() => {
    if (!allNodes) return [];
    return [...allNodes].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  }, [allNodes]);

  const childrenByParentId = useMemo(() => {
    const map = new Map<string | null, ApiNode[]>();

    for (const node of sortedNodes) {
      const key = node.parentId ?? null;
      const siblings = map.get(key);
      if (siblings) {
        siblings.push(node);
      } else {
        map.set(key, [node]);
      }
    }

    return map;
  }, [sortedNodes]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      slug: string;
      content: string;
      icon: string;
      parentId: string | null;
      published: boolean;
      authorId?: string;
    }) => {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, authorId: user?.id }),
      });
      if (!res.ok) {
        let errMsg = 'Error al crear nodo';
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch(e) {
          errMsg = `Error del servidor (Status ${res.status})`;
        }
        throw new Error(errMsg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      toast.success('Nodo creado correctamente');
      setShowFormDialog(false);
      setEditingNode(null);
      setDefaultParentId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      slug?: string;
      content?: string;
      icon?: string;
      parentId?: string | null;
      published?: boolean;
      order?: number;
    }) => {
      const res = await fetch('/api/nodes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        let errMsg = 'Error al actualizar nodo';
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch(e) {
          errMsg = `Error del servidor (Status ${res.status})`;
        }
        throw new Error(errMsg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      toast.success('Nodo actualizado correctamente');
      setShowFormDialog(false);
      setEditingNode(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/nodes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar nodo');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      toast.success('Nodo eliminado correctamente');
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Toggle publish
  const handleTogglePublish = (node: ApiNode) => {
    updateMutation.mutate({ id: node.id, published: !node.published });
  };

  // Form save handler
  const handleFormSave = (data: {
    id?: string;
    title: string;
    slug: string;
    content: string;
    icon: string;
    parentId: string | null;
    published: boolean;
  }) => {
    if (data.id) {
      updateMutation.mutate({
        ...data,
        id: data.id,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  // Open create dialog
  const handleCreate = () => {
    setEditingNode(null);
    setDefaultParentId(null);
    setShowFormDialog(true);
  };

  // Open create dialog with parent
  const handleAddChild = (parentId: string) => {
    setEditingNode(null);
    setDefaultParentId(parentId);
    setShowFormDialog(true);
  };

  // Open edit dialog
  const handleEdit = (node: ApiNode) => {
    setEditingNode(node);
    setDefaultParentId(null);
    setShowFormDialog(true);
  };

  // Permission denied
  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-100px)] items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mc-ghost-watermark)]">
            <ShieldAlert className="h-10 w-10 text-[var(--mc-slate)]" />
          </div>
          <h2 className="mc-h3">Acceso restringido</h2>
          <p className="mc-body max-w-[360px] text-[var(--mc-slate)]">
            No tiene permisos para acceder a esta sección. Inicie sesión con una cuenta de
            administrador o editor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[300px] shrink-0 border-r border-[var(--mc-dust-taupe)] bg-[var(--mc-canvas)] md:block">
        <TreeNavigation mode="all" className="h-full" />
      </aside>

      {/* Mobile Tree Drawer */}
      <Sheet open={treeSheetOpen} onOpenChange={setTreeSheetOpen}>
        <SheetContent side="left" className="w-[300px] bg-[var(--mc-canvas)] p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <TreeNavigation mode="all" className="h-full" />
        </SheetContent>
      </Sheet>

      {/* Admin Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[960px] px-6 py-8 md:px-12 md:py-12">
          {/* Mobile header */}
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <button
              onClick={() => setTreeSheetOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mc-ink)] text-[var(--mc-canvas)]"
              aria-label="Abrir navegación"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="mc-h2">Panel de Administración</h2>
              <p className="mc-body mt-1 text-[14px] text-[var(--mc-slate)]">
                Gestiona los nodos de contenido del sistema
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="mc-btn-primary shrink-0 gap-2 px-6 py-3"
            >
              <Plus className="h-4 w-4" />
              Crear nodo
            </button>
          </div>

          {/* Node List (Hierarchical) */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-[20px]" />
              ))}
            </div>
          ) : sortedNodes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-[40px] bg-[var(--mc-canvas-lifted)] py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--mc-ghost-watermark)]">
                <Plus className="h-8 w-8 text-[var(--mc-slate)]" />
              </div>
              <p className="mc-body text-[var(--mc-slate)]">No hay nodos creados aún</p>
              <button onClick={handleCreate} className="mc-btn-primary gap-2 px-6 py-2.5">
                <Plus className="h-4 w-4" />
                Crear primer nodo
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(() => {
                const renderTree = (nodes: ApiNode[], depth: number = 0): React.ReactNode[] => {
                  return nodes.map((node) => {
                    const children = childrenByParentId.get(node.id) || [];

                    return (
                      <React.Fragment key={node.id}>
                        <div
                          className="group flex flex-col gap-3 rounded-[20px] border border-[var(--mc-dust-taupe)] bg-[var(--mc-white)] p-4 transition-shadow hover:shadow-[0px_4px_24px_0px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:gap-4"
                          style={{ marginLeft: `${depth * 24}px` }}
                        >
                          {/* Hierarchical line indicator */}
                          {depth > 0 && (
                            <div className="hidden h-full items-center sm:flex">
                              <div className="h-px w-4 bg-[var(--mc-dust-taupe)]" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex flex-1 items-center gap-3 overflow-hidden">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${depth === 0 ? 'bg-[var(--mc-canvas)]' : 'bg-[var(--mc-canvas-lifted)] border border-[var(--mc-dust-taupe)]'}`}>
                              <NodeIcon name={node.icon} className={`h-5 w-5 ${depth === 0 ? 'text-[var(--mc-ink)]' : 'text-[var(--mc-slate)]'}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`mc-body truncate text-[14px] ${depth === 0 ? 'font-bold text-[var(--mc-ink)]' : 'font-medium text-[var(--mc-charcoal)]'}`}>
                                  {node.title}
                                </span>
                                <Badge
                                  variant={node.published ? 'default' : 'secondary'}
                                  className={`shrink-0 text-[10px] font-medium uppercase ${
                                    node.published
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : 'bg-[var(--mc-canvas)] text-[var(--mc-slate)] border-[var(--mc-dust-taupe)]'
                                  }`}
                                >
                                  {node.published ? 'Publicado' : 'Borrador'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-[12px] text-[var(--mc-slate)]">
                                <span className="font-mono truncate max-w-[180px]">/{node.slug}</span>
                                {children.length > 0 && (
                                  <>
                                    <span>·</span>
                                    <span>{children.length} {children.length === 1 ? 'rama' : 'ramas'}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex shrink-0 items-center gap-1 border-t border-[var(--mc-dust-taupe)] pt-2 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                            <button
                              onClick={() => handleTogglePublish(node)}
                              title={node.published ? 'Despublicar' : 'Publicar'}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--mc-slate)] transition-colors hover:bg-[var(--mc-canvas)] hover:text-[var(--mc-ink)]"
                            >
                              {node.published ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(node)}
                              title="Editar"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--mc-slate)] transition-colors hover:bg-[var(--mc-canvas)] hover:text-[var(--mc-ink)]"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleAddChild(node.id)}
                              title="Agregar rama hijo"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--mc-slate)] transition-colors hover:bg-[var(--mc-canvas)] hover:text-[var(--mc-ink)]"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(node)}
                              title="Eliminar"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--mc-slate)] transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {children.length > 0 && renderTree(children, depth + 1)}
                      </React.Fragment>
                    );
                  });
                };

                const rootNodes = childrenByParentId.get(null) || [];
                return renderTree(rootNodes);
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <NodeFormDialog
        key={editingNode?.id || `new-${defaultParentId || 'root'}`}
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open);
          if (!open) {
            setEditingNode(null);
            setDefaultParentId(null);
          }
        }}
        editingNode={editingNode}
        defaultParentId={defaultParentId}
        allNodes={allNodes || []}
        onSave={handleFormSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        nodeTitle={deleteTarget?.title || ''}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
