import { promises as fs } from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/** Read a raw MDX article body by slug (build-time only). */
export async function readArticleSource(slug: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(CONTENT_DIR, `${slug}.mdx`), 'utf8');
  } catch {
    return null;
  }
}
