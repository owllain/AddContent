'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app-store';
import * as LucideIcons from 'lucide-react';
import { ArrowRight, Search, Sparkles, Filter, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  authorId: string | null;
  author?: { id: string; name: string } | null;
  children?: { id: string; title: string; slug: string; icon: string; order: number }[];
}

/* ---------- Helpers ---------- */

function NodeIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = (LucideIcons as any)[name] || LucideIcons.FileText;
  return <Icon className={className} style={style} />;
}

/* Gradient palettes for service cards (warm tones) */
const CARD_GRADIENTS = [
  'linear-gradient(135deg, #F37338 0%, #CF4500 100%)',
  'linear-gradient(135deg, #F9C49C 0%, #F37338 100%)',
  'linear-gradient(135deg, #F3F0EE 0%, #E8E2DA 100%)',
  'linear-gradient(135deg, #CF4500 0%, #9A3A0A 100%)',
  'linear-gradient(135deg, #FDEBD0 0%, #F9C49C 100%)',
  'linear-gradient(135deg, #F37338 0%, #F9C49C 100%)',
];

/* Icon color based on gradient index */
const ICON_COLORS = [
  '#FFFFFF',
  '#FFFFFF',
  '#CF4500',
  '#FFFFFF',
  '#CF4500',
  '#FFFFFF',
];

/* ---------- Service Card ---------- */

interface ServiceCardProps {
  node: ApiNode;
  index: number;
  onClick: () => void;
}

function ServiceCard({ node, index, onClick }: ServiceCardProps) {
  const gradientIndex = index % CARD_GRADIENTS.length;
  const gradient = CARD_GRADIENTS[gradientIndex];
  const iconColor = ICON_COLORS[gradientIndex];
  const childCount = node.children?.length || 0;

  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col overflow-hidden rounded-[32px] border border-[var(--mc-dust-taupe)] bg-white p-6 transition-all hover:-translate-y-1 hover:border-[var(--mc-dust-taupe)] hover:shadow-[0px_20px_40px_rgba(0,0,0,0.06)] active:scale-[0.98]"
    >
      {/* Visual Header: Gradient Icon Box */}
      <div className="flex items-start justify-between mb-6">
        <div 
          className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110"
          style={{ background: gradient }}
        >
          <NodeIcon
            name={node.icon}
            className="h-8 w-8"
            style={{ color: iconColor }}
          />
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mc-canvas)] text-[var(--mc-slate)] opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowRight className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-start text-left gap-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--mc-slate)] opacity-70">
          Categoría
        </span>
        <h3 className="text-xl font-bold tracking-tight text-[var(--mc-ink)]">{node.title}</h3>
        
        <div className="mt-4 flex items-center gap-2">
           <Badge variant="outline" className="rounded-lg border-[var(--mc-dust-taupe)] bg-[var(--mc-canvas)] text-[11px] font-medium text-[var(--mc-slate)]">
             {childCount} Item{childCount !== 1 ? 's' : ''}
           </Badge>
           {index < 3 && (
             <Badge className="bg-orange-100 text-[var(--mc-light-signal-orange)] border-none text-[10px] h-5">POPULAR</Badge>
           )}
        </div>
      </div>

      {/* Subtle background decoration */}
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-[var(--mc-canvas)] opacity-50 transition-transform group-hover:scale-150" />
    </button>
  );
}

/* ---------- Orbital Arc SVG ---------- */


/* ---------- Main Component ---------- */

export default function HomeServices() {
  const { setSelectedNodeId, setView } = useAppStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data, isLoading } = useQuery<{ nodes: ApiNode[] }>({
    queryKey: ['nodes', 'root'],
    queryFn: async () => {
      const res = await fetch('/api/nodes?parentId=null');
      if (!res.ok) throw new Error('Error al cargar servicios');
      return res.json();
    },
  });

  const rootNodes = data?.nodes || [];
  
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return rootNodes;
    return rootNodes.filter(n => 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.icon.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rootNodes, searchTerm]);

  const handleCardClick = (node: ApiNode) => {
    setSelectedNodeId(node.id);
    setView('content');
  };

  if (isLoading) {
    return (
      <section className="relative w-full px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-12">
            <Skeleton className="mb-3 h-4 w-32" />
            <Skeleton className="h-10 w-[480px] rounded-[20px]" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
             {[1, 2, 3, 4].map(i => (
               <Skeleton key={i} className="h-[220px] w-full rounded-[32px]" />
             ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden px-6 py-16 md:px-12 md:py-24">
      {/* Ghost Watermark */}
      <div
        className="mc-ghost-watermark pointer-events-none absolute right-[-5%] top-[5%] select-none lg:right-[-8%]"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        aria-hidden="true"
      >
        EXPLORER
      </div>

      <div className="mx-auto max-w-[1280px]">
        {/* Section Header & Search */}
        <div className="mb-12 flex flex-col items-center justify-between gap-8 md:flex-row md:items-end md:mb-16">
          <div className="flex flex-col gap-3 max-md:text-center">
            <span className="mc-eyebrow text-[var(--mc-slate)] uppercase tracking-[0.2em]">• Centro de Contenido</span>
            <h2 className="mc-h2 max-w-[580px]">Nuestro contenido</h2>
          </div>

          <div className="relative w-full max-w-[400px]">
             <div className="group relative">
                <Input
                  placeholder="¿Qué estás buscando?..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 rounded-2xl border-[var(--mc-dust-taupe)] bg-white/50 pl-12 pr-12 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-orange-500/5 backdrop-blur-sm"
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--mc-slate)] transition-colors group-focus-within:text-[var(--mc-light-signal-orange)]" />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--mc-slate)] hover:text-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
             </div>
          </div>
        </div>

        {/* Dynamic Grid */}
        {filteredNodes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredNodes.map((node, index) => (
              <ServiceCard
                key={node.id}
                node={node}
                index={index}
                onClick={() => handleCardClick(node)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--mc-canvas)] text-[var(--mc-slate)]">
               <Search className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-[var(--mc-ink)]">No encontramos nada similar</h3>
            <p className="mt-2 text-[var(--mc-slate)]">Prueba con otras palabras clave o explora las categorías principales.</p>
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm('')}
              className="mt-6 rounded-xl border-[var(--mc-dust-taupe)]"
            >
              Ver todo el contenido
            </Button>
          </div>
        )}
      </div>

      {/* Decorative gradient sphere */}
      <div className="absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-orange-100/30 blur-[100px]" />
    </section>
  );
}
