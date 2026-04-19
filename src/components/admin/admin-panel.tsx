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
  const {
    user,
    setView,
    setEditingNodeId,
    setEditingParentId,
  } = useAppStore();
  const queryClient = useQueryClient();

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'EDITOR');

  // Dialog state
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

  // Redirection handlers to NodesManagementView
  const handleCreate = () => {
    setEditingNodeId(null);
    setEditingParentId(null);
    setView('nodes-management');
  };

  const handleAddChild = (parentId: string) => {
    setEditingNodeId(null);
    setEditingParentId(parentId);
    setView('nodes-management');
  };

  const handleEdit = (node: ApiNode) => {
    setEditingNodeId(node.id);
    setEditingParentId(null);
    setView('nodes-management');
  };

  // Update mutation (used for toggle publish)
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
      toast.success('Estado actualizado correctamente');
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
                <Layout className="h-8 w-8 text-[var(--mc-slate)]" />
              </div>
              <p className="mc-body text-[var(--mc-slate)]">No hay nodos creados aún</p>
              <p className="text-[14px] text-[var(--mc-slate)] opacity-80 max-w-[300px]">
                Usa la pestaña <strong>Maquetador</strong> para crear tu primer contenido.
              </p>
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
