'use client';

import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app-store';
import TreeNavigation from '@/components/content/tree-navigation';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Menu, ChevronRight, FileText, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

/* ---------- Breadcrumb Helper ---------- */

function buildBreadcrumb(nodes: ApiNode[], selectedId: string): ApiNode[] {
  const nodeMap = new Map<string, ApiNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }
  const breadcrumb: ApiNode[] = [];
  let current: ApiNode | undefined = nodeMap.get(selectedId);
  while (current) {
    breadcrumb.unshift(current);
    current = current.parentId ? nodeMap.get(current.parentId) : undefined;
  }
  return breadcrumb;
}

/* ---------- Main Component ---------- */

export default function ContentViewer() {
  const { selectedNodeId, setSelectedNodeId, setView } = useAppStore();
  const [treeSheetOpen, setTreeSheetOpen] = useState(false);

  const { data: allNodes, isLoading } = useQuery<ApiNode[]>({
    queryKey: ['nodes', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/nodes?all=true');
      if (!res.ok) throw new Error('Error al cargar nodos');
      const data = await res.json();
      return data.nodes;
    },
  });

  const selectedNode = useMemo(() => {
    if (!allNodes || !selectedNodeId) return null;
    return allNodes.find((n) => n.id === selectedNodeId) || null;
  }, [allNodes, selectedNodeId]);

  const breadcrumb = useMemo(() => {
    if (!allNodes || !selectedNodeId) return [];
    return buildBreadcrumb(allNodes, selectedNodeId);
  }, [allNodes, selectedNodeId]);

  const handleVolver = () => {
    setView('home');
  };

  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[300px] shrink-0 border-r border-[var(--mc-dust-taupe)] bg-[var(--mc-canvas)] md:block">
        <TreeNavigation mode="published" className="h-full" />
      </aside>

      {/* Mobile Tree Drawer */}
      <Sheet open={treeSheetOpen} onOpenChange={setTreeSheetOpen}>
        <SheetContent side="left" className="w-[300px] bg-[var(--mc-canvas)] p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <TreeNavigation mode="published" className="h-full" />
        </SheetContent>
      </Sheet>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[860px] px-6 py-8 md:px-12 md:py-12">
          {/* Mobile header */}
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <button
              onClick={() => setTreeSheetOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mc-ink)] text-[var(--mc-canvas)]"
              aria-label="Abrir navegación"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={handleVolver}
              className="flex items-center gap-2 text-[14px] font-medium text-[var(--mc-slate)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
          </div>

          {/* Desktop back button */}
          <div className="mb-6 hidden md:flex">
            <button
              onClick={handleVolver}
              className="mc-btn-secondary gap-2 px-5 py-2.5 text-[14px]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </button>
          </div>

          {/* No node selected placeholder */}
          {!selectedNodeId && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mc-ghost-watermark)]">
                <FileText className="h-10 w-10 text-[var(--mc-slate)]" />
              </div>
              <h2 className="mc-h3 text-[var(--mc-ink)]">Selecciona un nodo</h2>
              <p className="mc-body max-w-[360px] text-[var(--mc-slate)]">
                Selecciona un nodo del menú para ver su contenido
              </p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && selectedNodeId && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 w-3/4 rounded-[20px]" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-4 w-full rounded" style={{ width: `${100 - i * 10}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Node selected but not found */}
          {selectedNodeId && !isLoading && !selectedNode && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mc-ghost-watermark)]">
                <FileText className="h-10 w-10 text-[var(--mc-slate)]" />
              </div>
              <h2 className="mc-h3 text-[var(--mc-ink)]">Nodo no encontrado</h2>
              <p className="mc-body max-w-[360px] text-[var(--mc-slate)]">
                El nodo seleccionado no existe o ha sido eliminado
              </p>
            </div>
          )}

          {/* Node Content */}
          {selectedNode && (
            <article className="flex flex-col gap-6">
              {/* Breadcrumb */}
              {breadcrumb.length > 0 && (
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-[var(--mc-slate)]">
                  <button
                    onClick={handleVolver}
                    className="transition-colors hover:text-[var(--mc-ink)]"
                  >
                    Inicio
                  </button>
                  {breadcrumb.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                      <ChevronRight className="h-3 w-3 shrink-0" />
                      <button
                        onClick={() => setSelectedNodeId(crumb.id)}
                        className={`transition-colors ${
                          index === breadcrumb.length - 1
                            ? 'font-medium text-[var(--mc-ink)]'
                            : 'hover:text-[var(--mc-ink)]'
                        }`}
                      >
                        {crumb.title}
                      </button>
                    </React.Fragment>
                  ))}
                </nav>
              )}

              {/* Title */}
              <h1 className="mc-h2">{selectedNode.title}</h1>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[var(--mc-slate)]">
                {selectedNode.author && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>{selectedNode.author.name}</span>
                  </div>
                )}
                {selectedNode.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {format(new Date(selectedNode.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-[var(--mc-dust-taupe)]" />

              {/* Rich Markdown Content */}
              {selectedNode.content ? (
                <div className="node-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeRaw]}
                  >
                    {selectedNode.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-[20px] bg-[var(--mc-canvas-lifted)] py-16 text-center">
                  <FileText className="h-8 w-8 text-[var(--mc-dust-taupe)]" />
                  <p className="mc-body text-[14px] text-[var(--mc-slate)]">
                    Este nodo aún no tiene contenido
                  </p>
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
