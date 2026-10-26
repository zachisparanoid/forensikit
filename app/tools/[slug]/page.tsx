import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allSlugs, getToolBySlug } from '@/lib/tool-registry';
import { ToolWorkbench } from '@/components/tools/ToolWorkbench';

interface Params {
  params: { slug: string };
}

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: Params): Metadata {
  const tool = getToolBySlug(params.slug);
  if (!tool) return { title: 'Tool not found' };
  return {
    title: tool.name,
    description: tool.shortDesc,
  };
}

export default function ToolPage({ params }: Params) {
  const tool = getToolBySlug(params.slug);
  if (!tool) notFound();
  return <ToolWorkbench slug={params.slug} />;
}
