import type { LucideIcon } from 'lucide-react';

/** Stable ordering — used by sidebar, home grid, tools index, palette. */
export const TOOL_CATEGORIES = [
  'Hashing',
  'Encoding',
  'Classical Crypto',
  'Modern Crypto',
  'File Analysis',
  'Text Analysis',
  'Generators',
  'Converters',
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export interface ToolDefinition {
  /** Stable kebab id, e.g. "hash-generator". */
  id: string;
  /** URL slug under /tools/. Usually equal to id. */
  slug: string;
  /** Display name. */
  name: string;
  /** One line for cards/search (<= 90 chars). */
  shortDesc: string;
  category: ToolCategory;
  /** Extra search terms. */
  keywords: string[];
  icon: LucideIcon;
  /** Whether the tool exposes a file drop. */
  acceptsFile: boolean;
  /**
   * Slugs into /learn. The lazy tool UI lives in lib/tool-components.tsx,
   * keyed by slug, so this metadata stays free of client component refs.
   */
  relatedArticles?: string[];
}

export interface Article {
  slug: string;
  title: string;
  summary: string;
  category: string;
  readingMinutes: number;
  /** ISO date. */
  updated: string;
  tags: string[];
}

export interface HashResult {
  algo: string;
  hex: string;
  base64?: string;
  bits: number;
}

export interface SignatureMatch {
  ext: string;
  mime: string;
  description: string;
  offset: number;
  confidence: 'exact' | 'likely';
}

export interface ExifResult {
  make?: string;
  model?: string;
  dateTimeOriginal?: string;
  gps?: { lat: number; lng: number };
  lensModel?: string;
  software?: string;
  orientation?: number | string;
  raw: Record<string, unknown>;
}

export type EntropyVerdict =
  | 'low'
  | 'medium'
  | 'high (likely encrypted/compressed)';

export interface EntropyResult {
  shannon: number;
  /** Sliding-window entropy samples. */
  perByte: number[];
  histogram: number[];
  verdict: EntropyVerdict;
}

export interface PasswordReport {
  score: 0 | 1 | 2 | 3 | 4;
  entropyBits: number;
  guessesLog10: number;
  crackTimeText: string;
  warnings: string[];
  suggestions: string[];
  inDictionary: boolean;
}

/** Persisted user state, namespaced under `forensikit:` in localStorage. */
export interface PersistedState {
  favorites: string[];
  recents: { id: string; at: number }[];
  theme: 'dark' | 'light';
  toolHistory: Record<string, string[]>;
}
