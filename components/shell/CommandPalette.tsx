'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CornerDownLeft, Search, Star } from 'lucide-react';
import { searchTools } from '@/lib/tool-registry';
import { searchArticles } from '@/lib/articles';
import { useUiStore } from '@/lib/ui-store';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/cn';

interface Item {
  kind: 'tool' | 'article';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const recents = useAppStore((s) => s.recents);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global ⌘K / Ctrl+K toggle.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useUiStore.getState().paletteOpen);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // focus after paint
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const tools = searchTools(query)
      .slice(0, 8)
      .map<Item>((t) => ({
        kind: 'tool',
        id: t.id,
        title: t.name,
        subtitle: `${t.category} · ${t.shortDesc}`,
        href: `/tools/${t.slug}`,
      }));
    const articles = searchArticles(query)
      .slice(0, 5)
      .map<Item>((a) => ({
        kind: 'article',
        id: a.slug,
        title: a.title,
        subtitle: `Guide · ${a.summary}`,
        href: `/learn/${a.slug}`,
      }));
    return [...tools, ...articles];
  }, [query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  function go(item: Item) {
    setOpen(false);
    router.push(item.href);
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex animate-fade-in items-start justify-center bg-black/50 px-4 pt-[12vh]"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-xl animate-scale-in overflow-hidden rounded-card border border-border bg-card shadow-raised"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search tools and guides"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter' && items[active]) {
                e.preventDefault();
                go(items[active]);
              }
            }}
            placeholder="Search tools & guides…"
            className="h-12 flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
            aria-label="Search"
            aria-activedescendant={
              items[active] ? `cmd-${items[active].id}` : undefined
            }
          />
          <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-2xs text-muted">
            ESC
          </kbd>
        </div>

        {query === '' && recents.length > 0 && (
          <p className="px-4 pt-3 text-2xs font-semibold uppercase tracking-wider text-muted">
            Recent
          </p>
        )}

        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {items.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">
              No matches for “{query}”.
            </li>
          )}
          {items.map((item, i) => (
            <li
              key={`${item.kind}-${item.id}`}
              id={`cmd-${item.id}`}
              role="option"
              aria-selected={i === active}
            >
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition',
                  i === active ? 'bg-accent/15' : 'hover:bg-surface',
                )}
              >
                {item.kind === 'tool' ? (
                  <Star className="h-4 w-4 shrink-0 text-accent" />
                ) : (
                  <BookOpen className="h-4 w-4 shrink-0 text-indigo" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text">
                    {item.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {item.subtitle}
                  </span>
                </span>
                {i === active && (
                  <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
