'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Lock, Search } from 'lucide-react';
import { TOOLS, getToolById, searchTools } from '@/lib/tool-registry';
import { ARTICLES } from '@/lib/articles';
import { TOOL_CATEGORIES } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { ToolCard } from '@/components/shell/ToolCard';
import type { ToolDefinition } from '@/lib/types';

export function HomeDashboard() {
  const [query, setQuery] = useState('');
  const recents = useAppStore((s) => s.recents);
  const hydrated = useAppStore((s) => s.hydrated);

  const filtered = useMemo(() => (query ? searchTools(query) : TOOLS), [query]);

  const grouped = useMemo(() => {
    return TOOL_CATEGORIES.map((category) => ({
      category,
      tools: filtered.filter((t) => t.category === category),
    })).filter((g) => g.tools.length > 0);
  }, [filtered]);

  const recentTools = recents
    .map((r) => getToolById(r.id))
    .filter((t): t is ToolDefinition => Boolean(t))
    .slice(0, 6);

  const featured = ARTICLES.filter((a) =>
    [
      'what-is-digital-forensics',
      'ctf-cheatsheet',
      'hashing-and-integrity',
      'steganography',
    ].includes(a.slug),
  );

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      {/* Hero */}
      <section className="mb-8 text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
          <Lock className="h-3.5 w-3.5" />
          100% in-browser — nothing is uploaded
        </span>
        <h1 className="mx-auto max-w-3xl font-display text-2xl font-bold leading-tight text-text sm:text-3xl">
          A complete digital forensics &amp; cryptography workbench — in your
          browser, nothing uploaded.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-secondary">
          Hashing, encoding, classical &amp; modern crypto, EXIF, hex, entropy,
          steganography and more. Every byte is processed locally via the Web
          Crypto API and pure-JS libraries.
        </p>

        <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-btn border border-border bg-surface px-3 focus-within:border-accent focus-within:shadow-glow">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 35 tools — try “hash”, “base64”, “exif”…"
            className="h-12 flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
            aria-label="Search tools"
          />
          <kbd className="hidden rounded border border-border bg-card px-1.5 py-0.5 font-mono text-2xs text-muted sm:inline">
            ⌘K
          </kbd>
        </div>
      </section>

      {/* Recently used */}
      {hydrated && recentTools.length > 0 && query === '' && (
        <section className="mb-8">
          <h2 className="mb-3 text-2xs font-semibold uppercase tracking-wider text-muted">
            Recently used
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentTools.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>
      )}

      {/* Tool grid by category */}
      {grouped.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          No tools match “{query}”.
        </p>
      ) : (
        grouped.map(({ category, tools }) => (
          <section key={category} className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-text">
                {category}
              </h2>
              <span className="text-xs text-muted">{tools.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Learn strip */}
      <section className="mt-12 rounded-card border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo" />
            <h2 className="font-display text-lg font-semibold text-text">
              Learn the craft
            </h2>
          </div>
          <Link
            href="/learn"
            className="inline-flex items-center gap-1 text-sm text-indigo hover:underline"
          >
            All guides <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((a) => (
            <Link
              key={a.slug}
              href={`/learn/${a.slug}`}
              className="rounded-input border border-border bg-surface p-3 transition hover:border-indigo/40"
            >
              <p className="text-2xs uppercase tracking-wider text-muted">
                {a.category}
              </p>
              <p className="mt-1 text-sm font-medium text-text">{a.title}</p>
              <p className="mt-1 text-xs text-muted">
                {a.readingMinutes} min read
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
