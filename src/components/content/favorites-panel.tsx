'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, FileText } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { Skeleton } from '@/components/ui/skeleton';

interface ApiNode {
  id: string;
  title: string;
  slug: string;
  content: string;
  icon: string;
  order: number;
  parentId: string | null;
  published: boolean;
}

export default function FavoritesPanel() {
  const { user, getFavoriteNodeIds, setSelectedNodeId, setView } = useAppStore();
  const favoriteIds = getFavoriteNodeIds();

  const { data: allNodes, isLoading } = useQuery<ApiNode[]>({
    queryKey: ['nodes', 'favorites'],
    queryFn: async () => {
      const res = await fetch('/api/nodes?all=true');
      if (!res.ok) throw new Error('Error al cargar nodos');
      const data = await res.json();
      return data.nodes;
    },
    enabled: !!user,
  });

  const favoriteNodes = useMemo(() => {
    if (!allNodes?.length || favoriteIds.length === 0) return [];
    const favoriteSet = new Set(favoriteIds);
    return allNodes.filter((node) => favoriteSet.has(node.id));
  }, [allNodes, favoriteIds]);

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
        <p className="mc-body text-[var(--mc-slate)]">Inicia sesión para gestionar tus favoritos.</p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[960px] px-6 py-8 md:px-12 md:py-12">
      <div className="mb-8">
        <h2 className="mc-h2">Favoritos</h2>
        <p className="mc-body mt-1 text-[14px] text-[var(--mc-slate)]">
          Guarda y accede rápido a tus protocolos y documentos principales.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[20px]" />
          ))}
        </div>
      ) : favoriteNodes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[30px] bg-[var(--mc-canvas-lifted)] py-16 text-center">
          <Star className="h-8 w-8 text-[var(--mc-dust-taupe)]" />
          <p className="mc-body text-[var(--mc-slate)]">No tienes favoritos todavía.</p>
          <button
            onClick={() => setView('content')}
            className="mc-btn-primary px-6 py-2.5"
          >
            Explorar contenido
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {favoriteNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className="flex items-center justify-between rounded-[20px] border border-[var(--mc-dust-taupe)] bg-[var(--mc-white)] px-4 py-4 text-left transition-shadow hover:shadow-[0px_4px_18px_0px_rgba(0,0,0,0.05)]"
            >
              <div className="min-w-0">
                <p className="mc-body truncate font-semibold text-[var(--mc-ink)]">{node.title}</p>
                <p className="truncate text-[12px] text-[var(--mc-slate)]">/{node.slug}</p>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--mc-slate)]" />
                <Star className="h-4 w-4 fill-[var(--mc-light-signal-orange)] text-[var(--mc-light-signal-orange)]" />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
