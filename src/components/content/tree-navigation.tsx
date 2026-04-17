'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app-store';
import { Search, ChevronRight, ChevronDown, FileQuestion } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

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

interface TreeNode extends Omit<ApiNode, 'children'> {
  children: TreeNode[];
}

/* ---------- Helpers ---------- */

function buildTree(flatNodes: ApiNode[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();

  for (const node of flatNodes) {
    nodeMap.set(node.id, {
      id: node.id,
      title: node.title,
      slug: node.slug,
      content: node.content,
      icon: node.icon,
      order: node.order,
      parentId: node.parentId,
      published: node.published,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      authorId: node.authorId,
      author: node.author,
      children: [],
    });
  }

  const roots: TreeNode[] = [];
  for (const node of flatNodes) {
    const treeNode = nodeMap.get(node.id)!;
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  const sortTree = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .sort((a, b) => a.order - b.order)
      .map((n) => {
        n.children = sortTree(n.children);
        return n;
      });
  };

  return sortTree(roots);
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes;
  const lowerQuery = query.toLowerCase();

  const filtered = nodes
    .map((node) => {
      const matches = node.title.toLowerCase().includes(lowerQuery);
      const filteredChildren = filterTree(node.children, query);
      if (matches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean) as TreeNode[];

  return filtered;
}

function NodeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name] || LucideIcons.FileText;
  return <Icon className={className} />;
}

/* ---------- Tree Node Item ---------- */

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  expandedIds: Set<string>;
  selectedId: string | null;
  mode: 'published' | 'all';
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

function TreeNodeItem({ node, depth, expandedIds, selectedId, mode, onToggle, onSelect }: TreeNodeItemProps) {
  if (mode === 'published' && !node.published) return null;

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  const handleClick = () => {
    onSelect(node.id);
    if (hasChildren && !isExpanded) {
      onToggle(node.id);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`group flex w-full items-center gap-2 rounded-[20px] px-3 py-2 text-left transition-colors cursor-pointer ${
          isSelected
            ? 'border-l-[3px] border-l-[var(--mc-light-signal-orange)] bg-[var(--mc-canvas-lifted)]'
            : 'border-l-[3px] border-l-transparent hover:bg-[var(--mc-canvas-lifted)]'
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        <NodeIcon name={node.icon} className="h-4 w-4 shrink-0 text-[var(--mc-slate)]" />
        <span
          className="mc-body flex-1 truncate text-[14px]"
          style={{ fontWeight: isSelected ? 600 : 450 }}
        >
          {node.title}
        </span>
        {hasChildren && (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-[var(--mc-slate)]" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[var(--mc-slate)]" />
            )}
          </span>
        )}
        {!node.published && mode === 'all' && (
          <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-[var(--mc-slate)]">
            Borrador
          </span>
        )}
      </button>

      {isExpanded && hasChildren && (
        <div className="overflow-hidden">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              mode={mode}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Main Component ---------- */

interface TreeNavigationProps {
  mode?: 'published' | 'all';
  className?: string;
}

export default function TreeNavigation({ mode = 'published', className = '' }: TreeNavigationProps) {
  const { selectedNodeId, setSelectedNodeId, setView } = useAppStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allNodes, isLoading, error } = useQuery<ApiNode[]>({
    queryKey: ['nodes', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/nodes?all=true');
      if (!res.ok) throw new Error('Error al cargar nodos');
      const data = await res.json();
      return data.nodes;
    },
  });

  const tree = useMemo(() => {
    if (!allNodes) return [];
    const fullTree = buildTree(allNodes);
    return filterTree(fullTree, searchQuery);
  }, [allNodes, searchQuery]);

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (id: string) => {
    setSelectedNodeId(id);
    setView('content');
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col gap-4 p-4 ${className}`}>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-full rounded-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-[20px]" style={{ marginLeft: `${(i % 3) * 8}px` }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center gap-3 p-6 text-center ${className}`}>
        <FileQuestion className="h-8 w-8 text-[var(--mc-slate)]" />
        <p className="mc-body text-[14px] text-[var(--mc-slate)]">Error al cargar la navegación</p>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[var(--mc-dust-taupe)] px-4 pb-4 pt-4">
        <h4 className="mc-h4">Navegación</h4>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mc-slate)]" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-full border-[var(--mc-dust-taupe)] bg-[var(--mc-white)] pl-9 pr-3 text-[14px] focus-visible:border-[var(--mc-light-signal-orange)] focus-visible:ring-[var(--mc-light-signal-orange)]/20"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="custom-scrollbar flex-1 overflow-y-auto px-2 py-2">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <FileQuestion className="h-10 w-10 text-[var(--mc-dust-taupe)]" />
            <p className="mc-body text-[14px] text-[var(--mc-slate)]">
              {searchQuery ? 'No se encontraron resultados' : 'No hay contenido disponible'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {tree.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                depth={0}
                expandedIds={expandedIds}
                selectedId={selectedNodeId}
                mode={mode}
                onToggle={handleToggle}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
