'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Star } from 'lucide-react';
import { getToolBySlug } from '@/lib/tool-registry';
import { getToolComponent } from '@/lib/tool-components';
import { getArticle } from '@/lib/articles';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/cn';
import { ToolErrorBoundary } from './ToolErrorBoundary';

export function ToolWorkbench({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const addRecent = useAppStore((s) => s.addRecent);

  useEffect(() => {
    if (tool) addRecent(tool.id);
  }, [tool, addRecent]);

  if (!tool) {
    return (
      <div className="p-6 text-sm text-muted">Tool “{slug}” was not found.</div>
    );
  }

  const Icon = tool.icon;
  const Tool = getToolComponent(tool.slug);
  const isFav = favorites.includes(tool.id);
  const related = (tool.relatedArticles ?? [])
    .map((s) => getArticle(s))
    .filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-5 border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="bg-accent/12 flex h-10 w-10 shrink-0 items-center justify-center rounded-btn text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-text">
                {tool.name}
              </h1>
              <button
                type="button"
                onClick={() => toggleFavorite(tool.id)}
                aria-label={
                  isFav ? 'Remove from favorites' : 'Add to favorites'
                }
                aria-pressed={isFav}
                className={cn(
                  'rounded-md p-1 transition',
                  isFav ? 'text-warning' : 'text-muted hover:text-text',
                )}
              >
                <Star
                  className="h-4 w-4"
                  fill={isFav ? 'currentColor' : 'none'}
                />
              </button>
            </div>
            <p className="mt-0.5 text-sm text-secondary">{tool.shortDesc}</p>
            {related.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1 text-muted">
                  <BookOpen className="h-3.5 w-3.5" /> Related guides:
                </span>
                {related.map(
                  (a) =>
                    a && (
                      <Link
                        key={a.slug}
                        href={`/learn/${a.slug}`}
                        className="text-indigo hover:underline"
                      >
                        {a.title}
                      </Link>
                    ),
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <ToolErrorBoundary>
        {Tool ? (
          <Tool />
        ) : (
          <div className="p-6 text-sm text-muted">
            This tool could not be loaded.
          </div>
        )}
      </ToolErrorBoundary>
    </div>
  );
}
