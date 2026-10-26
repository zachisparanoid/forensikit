import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { ArrowLeft, Clock, Wrench } from 'lucide-react';
import {
  ARTICLES,
  allArticleSlugs,
  getArticle,
  toolsForArticle,
} from '@/lib/articles';
import { readArticleSource } from '@/lib/content';
import { mdxComponents } from '@/components/learn/MdxComponents';
import { Footer } from '@/components/shell/Footer';

interface Params {
  params: { topic: string };
}

export function generateStaticParams() {
  return allArticleSlugs().map((topic) => ({ topic }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: Params): Metadata {
  const a = getArticle(params.topic);
  if (!a) return { title: 'Guide not found' };
  return { title: a.title, description: a.summary };
}

export default async function ArticlePage({ params }: Params) {
  const article = getArticle(params.topic);
  const source = await readArticleSource(params.topic);
  if (!article || !source) notFound();

  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        ],
      },
    },
  });

  const relatedTools = toolsForArticle(article.slug);
  const relatedArticles = ARTICLES.filter(
    (a) =>
      a.slug !== article.slug && a.tags.some((t) => article.tags.includes(t)),
  ).slice(0, 3);

  return (
    <>
      <article className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/learn"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" /> All guides
        </Link>

        <header className="mb-6 border-b border-border pb-5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-accent">
            {article.category}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-text sm:text-3xl">
            {article.title}
          </h1>
          <p className="mt-2 text-secondary">{article.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {article.readingMinutes} min
              read
            </span>
            <span>Updated {article.updated}</span>
            <span className="flex flex-wrap gap-1.5">
              {article.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border px-2 py-0.5"
                >
                  {t}
                </span>
              ))}
            </span>
          </div>
        </header>

        <div className="prose-fk">{content}</div>

        <div className="mt-8 rounded-card border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
          Educational reference only. Use these techniques solely for lawful,
          authorized, and educational purposes.
        </div>

        {relatedTools.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-text">
              <Wrench className="h-4 w-4 text-accent" /> Try it in a tool
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedTools.map((t) => {
                const Icon = t.icon;
                return (
                  <Link
                    key={t.id}
                    href={`/tools/${t.slug}`}
                    className="flex items-center gap-3 rounded-card border border-border bg-card p-3 transition hover:border-accent/40"
                  >
                    <span className="bg-accent/12 flex h-9 w-9 items-center justify-center rounded-btn text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-text">
                        {t.name}
                      </span>
                      <span className="block text-xs text-muted">
                        {t.shortDesc}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {relatedArticles.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold text-text">
              Related guides
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {relatedArticles.map((a) => (
                <Link
                  key={a.slug}
                  href={`/learn/${a.slug}`}
                  className="rounded-card border border-border bg-card p-3 transition hover:border-indigo/40"
                >
                  <span className="block text-sm font-medium text-text">
                    {a.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {a.readingMinutes} min read
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
      <Footer />
    </>
  );
}
