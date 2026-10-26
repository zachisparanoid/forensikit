'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import type { ToolDefinition } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/cn';

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFav = favorites.includes(tool.id);
  const Icon = tool.icon;

  return (
    <div className="group relative">
      <Link
        href={`/tools/${tool.slug}`}
        className="block h-full rounded-card border border-border bg-card p-4 transition hover:border-accent/40 hover:bg-card/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div className="mb-2 flex items-center gap-2.5">
          <span className="bg-accent/12 flex h-9 w-9 shrink-0 items-center justify-center rounded-btn text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="font-medium text-text">{tool.name}</h3>
        </div>
        <p className="text-13 leading-relaxed text-muted">{tool.shortDesc}</p>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(tool.id)}
        aria-label={isFav ? `Unfavorite ${tool.name}` : `Favorite ${tool.name}`}
        aria-pressed={isFav}
        className={cn(
          'absolute right-3 top-3 rounded-md p-1 transition',
          isFav
            ? 'text-warning'
            : 'text-muted opacity-0 hover:text-text focus-visible:opacity-100 group-hover:opacity-100',
        )}
      >
        <Star className="h-4 w-4" fill={isFav ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
