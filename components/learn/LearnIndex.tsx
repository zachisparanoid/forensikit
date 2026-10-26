'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Search } from 'lucide-react';
import { ARTICLES, ARTICLE_CATEGORIES, searchArticles } from '@/lib/articles';
import { cn } from '@/lib/cn';

export function LearnIndex() {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  const allTags = useMemo(
    () => Array.from(new Set(ARTICLES.flatMap((a) => a.tags))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    let list = query ? searchArticles(query) : ARTICLES;
    if (tag) list = list.filter((a) => a.tags.includes(tag));
    return list;
  }, [query, tag]);

  const grouped = ARTICLE_CATEGORIES.map((category) => ({
    category,
    articles: filtered.filter((a) => a.category === category),
  })).filter((g) => g.articles.length > 0);

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-text">
        Knowledge base
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-secondary">
        Substantive, accurate primers on digital forensics and cryptography —
        written for smart beginners through intermediate practitioners, for
        lawful and educational use.
      </p>

      <div className="mt-5 flex max-w-md items-center gap-2 rounded-btn border border-border bg-surface px-3 focus-within:border-accent focus-within:shadow-glow">
        <Search className="h-4 w-4 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guides…"
          className="h-10 flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
          aria-label="Search guides"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTag(null)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs transition',
            tag === null
              ? 'border-accent/40 bg-accent/15 text-accent'
              : 'border-border text-secondary hover:text-text',
          )}
        >
          All
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTag(tag === t ? null : t)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition',
              tag === t
                ? 'border-accent/40 bg-accent/15 text-accent'
                : 'border-border text-secondary hover:text-text',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-8">
        {grouped.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            No guides match your filters.
          </p>
        ) : (
          grouped.map(({ category, articles }) => (
            <section key={category}>
              <h2 className="mb-3 font-display text-lg font-semibold text-text">
                {category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/learn/${a.slug}`}
                    className="flex flex-col rounded-card border border-border bg-card p-4 transition hover:border-indigo/40"
                  >
                    <h3 className="font-medium text-text">{a.title}</h3>
                    <p className="mt-1 flex-1 text-13 text-muted">
                      {a.summary}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1 text-2xs text-muted">
                      <Clock className="h-3 w-3" /> {a.readingMinutes} min read
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
