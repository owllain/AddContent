'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app-store';
import * as LucideIcons from 'lucide-react';
import { ArrowRight, FolderOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
      className="group relative flex flex-col items-center gap-5 text-center transition-transform active:scale-[0.97]"
    >
      {/* Circle with satellite CTA */}
      <div className="relative">
        {/* Main Circle */}
        <div
          className="flex h-[180px] w-[180px] items-center justify-center rounded-full shadow-[0px_16px_40px_0px_rgba(207,69,0,0.15)] transition-shadow group-hover:shadow-[0px_20px_48px_0px_rgba(207,69,0,0.25)] sm:h-[220px] sm:w-[220px] lg:h-[260px] lg:w-[260px]"
          style={{ background: gradient }}
        >
          <NodeIcon
            name={node.icon}
            className="h-16 w-16 text-white transition-transform group-hover:scale-110 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
            style={{ color: iconColor }}
          />
        </div>

        {/* Satellite CTA */}
        <span
          className="absolute bottom-2 right-2 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] transition-transform group-hover:scale-110 sm:h-[56px] sm:w-[56px] lg:h-[60px] lg:w-[60px]"
        >
          <ArrowRight className="h-5 w-5 text-[var(--mc-ink)] sm:h-6 sm:w-6" />
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-1.5">
        {/* Eyebrow */}
        <span className="mc-eyebrow text-[12px] text-[var(--mc-slate)]">
          • SERVICIOS
        </span>

        {/* Title */}
        <h3 className="mc-h3 max-w-[260px]">{node.title}</h3>

        {/* Child count */}
        {childCount > 0 && (
          <span className="text-[13px] font-[450] text-[var(--mc-slate)]">
            {childCount} artículo{childCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </button>
  );
}

/* ---------- Orbital Arc SVG ---------- */

function OrbitalArcs({ count }: { count: number }) {
  if (count < 2) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 600"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* Arc between first and second card */}
      <path
        d="M 250 300 Q 450 100 650 300"
        stroke="var(--mc-light-signal-orange)"
        strokeWidth="1.5"
        strokeDasharray="8 6"
        opacity="0.4"
      />
      {/* Arc between second and third card */}
      {count >= 3 && (
        <path
          d="M 550 300 Q 750 100 950 300"
          stroke="var(--mc-light-signal-orange)"
          strokeWidth="1.5"
          strokeDasharray="8 6"
          opacity="0.3"
        />
      )}
      {/* Larger decorative arc */}
      {count >= 3 && (
        <path
          d="M 200 350 Q 600 -50 1000 350"
          stroke="var(--mc-light-signal-orange)"
          strokeWidth="1"
          opacity="0.2"
        />
      )}
      {/* Small orbit circles */}
      <circle cx="450" cy="150" r="4" fill="var(--mc-light-signal-orange)" opacity="0.3" />
      <circle cx="750" cy="150" r="4" fill="var(--mc-light-signal-orange)" opacity="0.25" />
      <circle cx="600" cy="80" r="3" fill="var(--mc-light-signal-orange)" opacity="0.2" />
    </svg>
  );
}

/* ---------- Main Component ---------- */

export default function HomeServices() {
  const { setSelectedNodeId, setView } = useAppStore();

  const { data, isLoading } = useQuery<{ nodes: ApiNode[] }>({
    queryKey: ['nodes', 'root'],
    queryFn: async () => {
      const res = await fetch('/api/nodes?parentId=null');
      if (!res.ok) throw new Error('Error al cargar servicios');
      return res.json();
    },
  });

  const rootNodes = data?.nodes || [];

  const handleCardClick = (node: ApiNode) => {
    setSelectedNodeId(node.id);
    setView('content');
  };

  if (isLoading) {
    return (
      <section className="relative w-full overflow-hidden px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-12">
            <Skeleton className="mb-3 h-4 w-32" />
            <Skeleton className="h-10 w-[480px] rounded-[20px] max-md:w-full" />
          </div>
          <div className="flex flex-wrap items-start justify-center gap-12 md:gap-16 lg:gap-20">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-5">
                <Skeleton className="h-[220px] w-[220px] rounded-full lg:h-[260px] lg:w-[260px]" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-40" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (rootNodes.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden px-6 py-16 md:px-12 md:py-24">
      {/* Ghost Watermark */}
      <div
        className="mc-ghost-watermark pointer-events-none absolute right-[-5%] top-[5%] select-none lg:right-[-8%]"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        aria-hidden="true"
      >
        CONTENT
      </div>

      <div className="mx-auto max-w-[1280px]">
        {/* Section Header */}
        <div className="mb-16 flex flex-col gap-3 md:mb-20">
          <span className="mc-eyebrow text-[var(--mc-slate)]">• LO QUE OFRECEMOS</span>
          <h2 className="mc-h2 max-w-[580px]">Explora nuestro contenido</h2>
        </div>

        {/* Cards Grid with Orbital Lines */}
        <div className="relative">
          <OrbitalArcs count={rootNodes.length} />
          <div className="flex flex-wrap items-start justify-center gap-12 md:gap-16 lg:gap-20">
            {rootNodes.map((node, index) => (
              <ServiceCard
                key={node.id}
                node={node}
                index={index}
                onClick={() => handleCardClick(node)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom arc line */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 400 40"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 0 40 Q 200 -10 400 40"
          stroke="var(--mc-light-signal-orange)"
          strokeWidth="1.5"
          opacity="0.4"
        />
      </svg>
    </section>
  );
}
