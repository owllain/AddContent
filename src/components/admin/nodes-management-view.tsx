'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MDXEditorMethods } from '@mdxeditor/editor';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';
import * as LucideIcons from 'lucide-react';
import {
  Plus,
  ArrowLeft,
  Save,
  Loader2,
  Settings,
  Globe,
  PlusCircle,
  Sparkles,
  Command,
  Eraser,
  Columns2,
  Columns3,
  Table,
  Clock,
  Youtube,
  Info,
  BadgeAlert,
  CheckCircle2,
  ListOrdered,
  ChevronDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import ErrorBoundary from '@/components/ui/error-boundary';

// Dynamic imports
const VisualEditor = dynamic(() => import('./visual-editor'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full rounded-[40px]" />,
});

const AdvancedEditor = dynamic(() => import('./editor-js-wrapper'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full rounded-[40px]" />,
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
}

/* ---------- Icon Helper ---------- */
function NodeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as any)[name] || LucideIcons.FileText;
  return <Icon className={className} />;
}

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

export default function NodesManagementView() {
  const { user, editingNodeId, setEditingNodeId, setView, editingParentId, setEditingParentId } = useAppStore();
  const queryClient = useQueryClient();
  const editorRef = useRef<MDXEditorMethods | null>(null);

  // Status state
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [slugOverride, setSlugOverride] = useState('');
  const [slugIsManual, setSlugIsManual] = useState(false);
  const [icon, setIcon] = useState('FileText');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'advanced'>('visual');

  // Load existing node if editing
  const { data: nodes } = useQuery<ApiNode[]>({
    queryKey: ['nodes', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/nodes?all=true');
      if (!res.ok) throw new Error('Error al cargar nodos');
      const data = await res.json();
      return data.nodes;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/nodes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      toast.success('Nodo eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const editingNode = useMemo(() => {
    if (!editingNodeId || !nodes) return null;
    return nodes.find(n => n.id === editingNodeId) || null;
  }, [editingNodeId, nodes]);

  // Initial load
  useEffect(() => {
    if (editingNode) {
      setTitle(editingNode.title);
      setSlugOverride(editingNode.slug);
      setSlugIsManual(true);
      setIcon(editingNode.icon);
      setContent(editingNode.content);
      setPublished(editingNode.published);
      setParentId(editingNode.parentId);
      
      // Forzar actualización manual del editor si ya está cargado
      if (editorRef.current) {
        editorRef.current.setMarkdown(editingNode.content);
      }
    } else if (editingParentId) {
      setParentId(editingParentId);
      setContent('');
      if (editorRef.current) {
        editorRef.current.setMarkdown('');
      }
    }
  }, [editingNode, editingParentId]);

  const displaySlug = slugIsManual ? slugOverride : generateSlug(title);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slugIsManual) {
      setSlugOverride(generateSlug(newTitle));
    }
  };

  const insertSnippet = (snippet: string) => {
    const spacingSnippet = `\n\n${snippet.trim()}\n\n`;
    try {
      editorMode === 'visual' 
        ? editorRef.current?.insertMarkdown(spacingSnippet)
        : setContent(prev => `${prev}${spacingSnippet}`);
    } catch {
      setContent(prev => `${prev}${spacingSnippet}`);
    }
  };

  const deleteSelectedBlock = () => {
    if (editorMode === 'visual') {
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true,
        cancelable: true,
      });
      document.querySelector('.mdxeditor-rich [contenteditable="true"]')?.dispatchEvent(event);
      toast.info('Bloque eliminado');
    } else {
      toast.error('El borrado rápido solo está disponible en modo Visual');
    }
  };

  const handleClear = () => {
    if (content.trim() || title.trim()) {
      if (!confirm('¿Estás seguro de que quieres limpiar todo el contenido?')) {
        return;
      }
    }
    setTitle('');
    setSlugOverride('');
    setSlugIsManual(false);
    setIcon('FileText');
    setContent('');
    setPublished(true);
    editorRef.current?.setMarkdown('');
    toast.success('Formulario limpiado');
  };

  const handleSave = async () => {
    if (!title.trim() || !displaySlug.trim()) {
      toast.error('El título y el slug son obligatorios');
      return;
    }

    setIsSaving(true);
    try {
      const method = editingNode ? 'PUT' : 'POST';
      const body = {
        id: editingNode?.id,
        title: title.trim(),
        slug: displaySlug.trim(),
        content,
        icon,
        parentId,
        published,
        authorId: user?.id,
      };

      const res = await fetch('/api/nodes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el nodo');

      toast.success(editingNode ? 'Nodo actualizado' : 'Nodo creado');
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      setView('admin');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingNodeId(null);
    setEditingParentId(null);
    setView('admin');
  };

  const parentOptions = useMemo(() => {
    if (!nodes) return [];
    
    const buildOptions = (allNodes: ApiNode[], depth: number, excludeId?: string): any[] => {
      const options: any[] = [];
      const roots = allNodes.filter(n => !n.parentId && n.id !== excludeId);
      
      const process = (n: ApiNode, d: number) => {
        options.push({ id: n.id, title: n.title, depth: d });
        const children = allNodes.filter(child => child.parentId === n.id && child.id !== excludeId);
        children.forEach(c => process(c, d + 1));
      };

      roots.forEach(r => process(r, depth));
      return options;
    };

    return buildOptions(nodes, 0, editingNode?.id);
  }, [nodes, editingNode]);

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-[1600px] px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView('admin')}
                className="h-12 w-12 rounded-2xl bg-white border border-[var(--mc-dust-taupe)] text-[var(--mc-ink)] hover:bg-[var(--mc-canvas)]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--mc-ink)]">
                  {editingNode ? 'Editar Nodo' : 'Creador de Contenido'}
                </h1>
                <p className="text-[var(--mc-slate)]">
                  {editingNode ? `ID: ${editingNode.id}` : 'Gestiona y publica bloques de contenido dinámico'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            
            {/* Left Column: Metadata & Config (4/12) */}
            <div className="order-2 space-y-6 lg:order-1 lg:col-span-4">
              
              {/* Card: Identidad Visual */}
              <div className="group relative overflow-hidden rounded-[32px] border border-[var(--mc-dust-taupe)] bg-white p-6 shadow-sm shadow-black/5">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-[var(--mc-canvas)] opacity-50" />
                <div className="relative flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--mc-slate)]">Identidad del Nodo</span>
                    {published ? (
                        <Badge className="bg-green-100 text-green-700 border-none text-[9px] h-4">PÚBLICO</Badge>
                    ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] h-4">BORRADOR</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[var(--mc-ink)] text-white shadow-lg">
                      <NodeIcon name={icon} className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="truncate text-lg font-bold tracking-tight text-[var(--mc-ink)]">
                        {title || <span className="text-[var(--mc-dust-taupe)]">Sin Título</span>}
                      </h2>
                      <p className="truncate font-mono text-[11px] text-[var(--mc-slate)]">
                        /{displaySlug || '...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Detalles Básicos */}
              <div className="rounded-[32px] border border-[var(--mc-dust-taupe)] bg-white p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--mc-canvas)] text-[var(--mc-ink)]">
                    <Settings className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-[var(--mc-ink)]">Configuración</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[var(--mc-slate)]">Título del Nodo</Label>
                    <Input
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Ej: Políticas de Reembolso"
                      className="rounded-[16px] border-[var(--mc-dust-taupe)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[var(--mc-slate)]">Slug (URL)</Label>
                    <div className="relative">
                      <Input
                        value={displaySlug}
                        onChange={(e) => {
                          setSlugOverride(e.target.value);
                          setSlugIsManual(true);
                        }}
                        className="rounded-[16px] border-[var(--mc-dust-taupe)] pl-8 font-mono text-[13px]"
                      />
                      <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--mc-slate)]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[var(--mc-slate)]">Icono</Label>
                    <div className="custom-scrollbar grid max-h-[160px] grid-cols-5 gap-2 overflow-y-auto rounded-2xl border border-[var(--mc-dust-taupe)] bg-[var(--mc-canvas)] p-3">
                      {AVAILABLE_ICONS.map((iconName) => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setIcon(iconName)}
                          className={`flex h-10 w-full items-center justify-center rounded-xl transition-all ${
                            icon === iconName ? 'bg-[var(--mc-ink)] text-white shadow-lg' : 'text-[var(--mc-slate)] hover:bg-white'
                          }`}
                        >
                          <NodeIcon name={iconName} className="h-4.5 w-4.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[var(--mc-slate)]">Ubicación (Padre)</Label>
                    <Select value={parentId || '__none__'} onValueChange={(v) => setParentId(v === '__none__' ? null : v)}>
                      <SelectTrigger className="rounded-[16px] border-[var(--mc-dust-taupe)]">
                        <SelectValue placeholder="Raíz del sistema" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] rounded-2xl">
                        <SelectItem value="__none__">Sin padre</SelectItem>
                        {parentOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            <span className="flex items-center gap-2">
                              {'\u00A0'.repeat(opt.depth * 2)}{opt.depth > 0 && '└ '}{opt.title}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-[var(--mc-canvas)] p-4">
                    <div className="space-y-0.5">
                      <Label className="text-[13px] font-bold">Publicado</Label>
                      <p className="text-[11px] text-[var(--mc-slate)]">Visibilidad pública</p>
                    </div>
                    <Switch checked={published} onCheckedChange={setPublished} />
                  </div>
                </div>
              </div>

              {/* Card: Librería Premium (List Style) */}
              <div className="rounded-[32px] border border-[var(--mc-dust-taupe)] bg-white p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-[var(--mc-light-signal-orange)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-[var(--mc-ink)]">Librería Premium</h3>
                </div>
                
                <div className="space-y-6">
                  {/* Category: Estructura */}
                  <div>
                    <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--mc-slate)]">Estructura y Layout</h4>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { label: '2 Columnas', icon: <Columns2 className="h-4 w-4" />, snippet: '\n<div class="mc-grid-2">\n  <div class="mc-grid-col">Columna Izquierda</div>\n  <div class="mc-grid-col">Columna Derecha</div>\n</div>\n' },
                        { label: '3 Columnas', icon: <Columns3 className="h-4 w-4" />, snippet: '\n<div class="mc-grid-3">\n  <div class="mc-grid-col">Col 1</div>\n  <div class="mc-grid-col">Col 2</div>\n  <div class="mc-grid-col">Col 3</div>\n</div>\n' },
                        { label: 'Banner CTA', icon: <Sparkles className="h-4 w-4" />, snippet: '\n<div class="mc-banner-cta">\n  <h2>Título del Banner</h2>\n  <p>Descripción persuasiva del servicio.</p>\n  <button class="mc-button-premium">¡Empezar Ahora!</button>\n</div>\n' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-1 group">
                          <button 
                            onClick={() => insertSnippet(item.snippet)} 
                            className="flex items-center gap-3 flex-1 rounded-xl p-3 text-[13px] font-medium transition-all hover:bg-[var(--mc-canvas)] text-[var(--mc-ink)]"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--mc-white)] border border-[var(--mc-dust-taupe)] group-hover:border-[var(--mc-ink)] transition-colors">
                              {item.icon}
                            </div>
                            {item.label}
                          </button>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                             <button onClick={() => insertSnippet(item.snippet)} className="p-1 hover:text-[var(--mc-light-signal-orange)]" title="Insertar">
                               <Plus className="h-4 w-4" />
                             </button>
                             <button onClick={deleteSelectedBlock} className="p-1 hover:text-red-500" title="Borrar seleccionado">
                               <LucideIcons.Minus className="h-4 w-4" />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category: Componentes */}
                  <div>
                    <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--mc-slate)]">Componentes de Contenido</h4>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { label: 'Card Premium', icon: <PlusCircle className="h-4 w-4" />, snippet: '\n<div class="mc-display-card">\n  <h4>Título de la Tarjeta</h4>\n  <p>Contenido elegante y detallado.</p>\n</div>\n' },
                        { label: 'Pasos', icon: <ListOrdered className="h-4 w-4" />, snippet: '\n<div class="mc-steps">\n  <div class="mc-step">\n    <div class="mc-step-content">Paso 1: Descripción rápida</div>\n  </div>\n  <div class="mc-step">\n    <div class="mc-step-content">Paso 2: Acción siguiente</div>\n  </div>\n</div>\n' },
                        { label: 'Acordeón FAQ', icon: <ChevronDown className="h-4 w-4" />, snippet: '\n<details class="mc-accordion-item">\n  <summary>¿Pregunta Frecuente 1?</summary>\n  <div class="mc-accordion-content">\n    Respuesta detallada y clara aquí.\n  </div>\n</details>\n' },
                        { label: 'Línea de Tiempo', icon: <Clock className="h-4 w-4" />, snippet: '\n<div class="mc-timeline">\n  <div class="mc-timeline-item">\n    <div class="date">Enero 2024</div>\n    <p>Evento clave del proyecto.</p>\n  </div>\n</div>\n' },
                        { label: 'Tabla Precios', icon: <Table className="h-4 w-4" />, snippet: '\n<div class="mc-price-table">\n  <div class="mc-price-item active">\n    <h4>Plan Pro</h4>\n    <div class="price">$19/mes</div>\n    <ul><li>Opción 1</li><li>Opción 2</li></ul>\n    <button class="mc-button-premium">Suscribirse</button>\n  </div>\n</div>\n' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-1 group">
                          <button 
                            onClick={() => insertSnippet(item.snippet)} 
                            className="flex items-center gap-3 flex-1 rounded-xl p-3 text-[13px] font-medium transition-all hover:bg-[var(--mc-canvas)] text-[var(--mc-ink)]"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--mc-white)] border border-[var(--mc-dust-taupe)] group-hover:border-[var(--mc-ink)] transition-colors">
                              {item.icon}
                            </div>
                            {item.label}
                          </button>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                             <button onClick={() => insertSnippet(item.snippet)} className="p-1 hover:text-[var(--mc-light-signal-orange)]" title="Insertar">
                               <Plus className="h-4 w-4" />
                             </button>
                             <button onClick={deleteSelectedBlock} className="p-1 hover:text-red-500" title="Borrar seleccionado">
                               <LucideIcons.Minus className="h-4 w-4" />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Editor (8/12) */}
            <div className="order-1 lg:order-2 lg:col-span-8">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <Command className="h-4 w-4 text-[var(--mc-slate)]" />
                     <span className="text-[13px] font-bold text-[var(--mc-slate)] uppercase tracking-widest">Editor</span>
                   </div>
                   
                   {/* Editor Mode Toggle */}
                   <div className="flex items-center gap-1 bg-[var(--mc-canvas)] p-1 rounded-xl border border-[var(--mc-dust-taupe)]">
                      <button 
                        onClick={() => setEditorMode('visual')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${editorMode === 'visual' ? 'bg-white text-[var(--mc-ink)] shadow-sm' : 'text-[var(--mc-slate)] hover:text-[var(--mc-ink)]'}`}
                      >
                        VISUAL
                      </button>
                      <button 
                        onClick={() => setEditorMode('advanced')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${editorMode === 'advanced' ? 'bg-white text-[var(--mc-ink)] shadow-sm' : 'text-[var(--mc-slate)] hover:text-[var(--mc-ink)]'}`}
                      >
                        AVANZADO (BLOQUES)
                      </button>
                   </div>
                </div>
                 <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-[var(--mc-dust-taupe)] p-1 shadow-sm">
                      <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 rounded-lg text-red-500 hover:bg-red-50">
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Volver
                      </Button>
                      <div className="h-4 w-px bg-[var(--mc-dust-taupe)] mx-1" />
                      <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 rounded-lg text-[var(--mc-slate)]">
                        <Eraser className="h-3.5 w-3.5 mr-1" /> Limpiar
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving || !title.trim()} size="sm" className="h-8 rounded-lg bg-[var(--mc-ink)] text-white hover:bg-[var(--mc-ink-warm)] px-4">
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                        {editingNode ? 'Guardar' : 'Publicar'}
                      </Button>
                   </div>
                   <div className="h-4 w-px bg-[var(--mc-dust-taupe)]" />
                   <span className="text-[11px] text-[var(--mc-slate)]">{content.length} carac.</span>
                </div>
              </div>
              
              <div className="sticky top-24 bg-white rounded-[40px] border border-[var(--mc-dust-taupe)] shadow-sm overflow-hidden min-h-[600px]">
                {editorMode === 'visual' ? (
                  <VisualEditor
                    key={editingNodeId || 'new-visual'}
                    markdown={content}
                    onChange={setContent}
                    editorRef={editorRef}
                  />
                ) : (
                  <AdvancedEditor
                    key={editingNodeId || 'new-advanced'}
                    data={content}
                    onChange={setContent}
                    holder="advanced-editor-holder"
                  />
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
