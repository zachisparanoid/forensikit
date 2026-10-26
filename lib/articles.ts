import type { Article } from './types';
import { TOOLS } from './tool-registry';

/**
 * Canonical article metadata. MDX files under content/<slug>.mdx hold the body;
 * keeping metadata here (not in frontmatter) makes it importable on the client
 * for the command palette and avoids parsing files in two places.
 */
export const ARTICLES: Article[] = [
  {
    slug: 'what-is-digital-forensics',
    title: 'What Is Digital Forensics?',
    summary:
      'The investigative process, core principles, and where the discipline is applied.',
    category: 'Foundations',
    readingMinutes: 7,
    updated: '2026-06-14',
    tags: ['foundations', 'process', 'methodology'],
  },
  {
    slug: 'chain-of-custody',
    title: 'Chain of Custody & Evidence Integrity',
    summary:
      'How to document, preserve, and defend the integrity of digital evidence.',
    category: 'Foundations',
    readingMinutes: 8,
    updated: '2026-06-14',
    tags: ['legal', 'integrity', 'process', 'admissibility'],
  },
  {
    slug: 'disk-imaging-and-write-blockers',
    title: 'Disk Imaging & Write Blockers',
    summary:
      'Bit-for-bit acquisition, write protection, and verifying your images.',
    category: 'Acquisition',
    readingMinutes: 9,
    updated: '2026-06-14',
    tags: ['acquisition', 'imaging', 'hardware'],
  },
  {
    slug: 'file-systems-ntfs-ext4-apfs',
    title: 'File Systems: NTFS, ext4 & APFS',
    summary:
      'How major file systems store data, metadata, and the artifacts they leave.',
    category: 'File Systems',
    readingMinutes: 11,
    updated: '2026-06-14',
    tags: ['file systems', 'ntfs', 'ext4', 'apfs', 'artifacts'],
  },
  {
    slug: 'file-carving-and-signatures',
    title: 'File Carving & Signatures',
    summary:
      'Recovering files from unallocated space using headers, footers, and structure.',
    category: 'File Systems',
    readingMinutes: 9,
    updated: '2026-06-14',
    tags: ['carving', 'recovery', 'magic bytes', 'signatures'],
  },
  {
    slug: 'memory-forensics',
    title: 'Memory Forensics',
    summary:
      'Why RAM matters, how to capture it, and what volatile memory reveals.',
    category: 'Specializations',
    readingMinutes: 8,
    updated: '2026-06-14',
    tags: ['memory', 'volatility', 'malware', 'ram'],
  },
  {
    slug: 'network-forensics',
    title: 'Network Forensics',
    summary:
      'Packet captures, flow data, and reconstructing activity from the wire.',
    category: 'Specializations',
    readingMinutes: 8,
    updated: '2026-06-14',
    tags: ['network', 'pcap', 'traffic', 'logs'],
  },
  {
    slug: 'mobile-forensics',
    title: 'Mobile Forensics',
    summary:
      'Acquisition methods, encryption hurdles, and artifacts on iOS and Android.',
    category: 'Specializations',
    readingMinutes: 8,
    updated: '2026-06-14',
    tags: ['mobile', 'ios', 'android', 'acquisition'],
  },
  {
    slug: 'hashing-and-integrity',
    title: 'Hashing & Integrity',
    summary:
      'How cryptographic hashes prove that evidence has not changed — and their limits.',
    category: 'Cryptography',
    readingMinutes: 9,
    updated: '2026-06-14',
    tags: ['hashing', 'integrity', 'md5', 'sha', 'collisions'],
  },
  {
    slug: 'symmetric-vs-asymmetric',
    title: 'Symmetric vs Asymmetric Cryptography',
    summary:
      'Keys, trade-offs, and where AES, RSA, and elliptic curves each fit.',
    category: 'Cryptography',
    readingMinutes: 10,
    updated: '2026-06-14',
    tags: ['crypto', 'aes', 'rsa', 'keys', 'pki'],
  },
  {
    slug: 'classical-ciphers',
    title: 'Classical Ciphers',
    summary:
      'Caesar, Vigenère, substitution, and how to break them with frequency analysis.',
    category: 'Cryptography',
    readingMinutes: 9,
    updated: '2026-06-14',
    tags: ['classical', 'caesar', 'vigenere', 'cryptanalysis', 'ctf'],
  },
  {
    slug: 'steganography',
    title: 'Steganography',
    summary:
      'Hiding data in plain sight — LSB, metadata, and detection strategies.',
    category: 'Specializations',
    readingMinutes: 8,
    updated: '2026-06-14',
    tags: ['steganography', 'lsb', 'hidden', 'ctf'],
  },
  {
    slug: 'metadata-and-exif',
    title: 'Metadata & EXIF',
    summary:
      'What images and documents reveal about who, when, where, and with what.',
    category: 'File Systems',
    readingMinutes: 7,
    updated: '2026-06-14',
    tags: ['metadata', 'exif', 'gps', 'privacy'],
  },
  {
    slug: 'ctf-cheatsheet',
    title: 'CTF Forensics Cheat-Sheet',
    summary:
      'A fast triage workflow and tool map for capture-the-flag forensics challenges.',
    category: 'Reference',
    readingMinutes: 10,
    updated: '2026-06-14',
    tags: ['ctf', 'cheatsheet', 'workflow', 'reference'],
  },
];

const BY_SLUG = new Map(ARTICLES.map((a) => [a.slug, a]));

export function getArticle(slug: string): Article | undefined {
  return BY_SLUG.get(slug);
}

export function allArticleSlugs(): string[] {
  return ARTICLES.map((a) => a.slug);
}

/** Tools that declared this article in their relatedArticles — inverse lookup. */
export function toolsForArticle(slug: string) {
  return TOOLS.filter((t) => t.relatedArticles?.includes(slug));
}

export function searchArticles(query: string): Article[] {
  const q = query.trim().toLowerCase();
  if (!q) return ARTICLES;
  const terms = q.split(/\s+/);
  return ARTICLES.filter((a) => {
    const hay = [a.title, a.summary, a.category, ...a.tags]
      .join(' ')
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export const ARTICLE_CATEGORIES = [
  'Foundations',
  'Acquisition',
  'File Systems',
  'Cryptography',
  'Specializations',
  'Reference',
] as const;
