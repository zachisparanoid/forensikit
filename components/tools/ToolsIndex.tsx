'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { TOOLS, searchTools } from '@/lib/tool-registry';
import { TOOL_CATEGORIES } from '@/lib/types';
import { ToolCard } from '@/components/shell/ToolCard';

export function ToolsIndex() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => (query ? searchTools(query) : TOOLS), [query]);
  const grouped = TOOL_CATEGORIES.map((category) => ({
    category,
    tools: filtered.filter((t) => t.category === category),
  })).filter((g) => g.tools.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text">All tools</h1>
        <p className="mt-1 text-sm text-secondary">
          {TOOLS.length} privacy-first utilities, grouped by category.
        </p>
        <div className="mt-4 flex max-w-md items-center gap-2 rounded-btn border border-border bg-surface px-3 focus-within:border-accent focus-within:shadow-glow">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter tools…"
            className="h-10 flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
            aria-label="Filter tools"
          />
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          No tools match “{query}”.
        </p>
      ) : (
        grouped.map(({ category, tools }) => (
          <section key={category} className="mb-8">
            <h2 className="mb-3 font-display text-lg font-semibold text-text">
              {category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
