import {
  Activity,
  Archive,
  AudioLines,
  BarChart3,
  Binary,
  Calculator,
  Camera,
  Clock,
  Code2,
  Fingerprint,
  FileCode2,
  FileDigit,
  FileSearch,
  FlipHorizontal2,
  Grid3x3,
  Hash,
  KeyRound,
  KeySquare,
  Layers,
  Link as LinkIcon,
  Lock,
  QrCode,
  Radio,
  RefreshCw,
  Regex,
  RotateCw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  ToggleRight,
  Type,
} from 'lucide-react';
import type { ToolCategory, ToolDefinition } from './types';

export const TOOLS: ToolDefinition[] = [
  /* ----------------------------- Hashing -------------------------------- */
  {
    id: 'hash-generator',
    slug: 'hash-generator',
    name: 'Hash Generator',
    shortDesc: 'MD5, SHA-1/2/3 & RIPEMD-160 digests of text, side by side.',
    category: 'Hashing',
    keywords: [
      'md5',
      'sha256',
      'sha512',
      'sha3',
      'ripemd',
      'checksum',
      'digest',
      'integrity',
    ],
    icon: Hash,
    acceptsFile: false,
    relatedArticles: ['hashing-and-integrity'],
  },
  {
    id: 'file-hasher',
    slug: 'file-hasher',
    name: 'File Hasher',
    shortDesc:
      'Chunked MD5/SHA checksums of a file with expected-hash compare.',
    category: 'Hashing',
    keywords: [
      'file',
      'checksum',
      'verify',
      'md5',
      'sha256',
      'integrity',
      'fixity',
    ],
    icon: FileDigit,
    acceptsFile: true,
    relatedArticles: ['hashing-and-integrity', 'chain-of-custody'],
  },
  {
    id: 'hmac-generator',
    slug: 'hmac-generator',
    name: 'HMAC Generator',
    shortDesc: 'Keyed-hash message authentication codes (SHA, MD5, RIPEMD).',
    category: 'Hashing',
    keywords: ['hmac', 'mac', 'authentication', 'key', 'sha256'],
    icon: KeyRound,
    acceptsFile: false,
    relatedArticles: ['hashing-and-integrity'],
  },
  {
    id: 'hash-identifier',
    slug: 'hash-identifier',
    name: 'Hash Identifier',
    shortDesc: 'Guess a hash algorithm from its length, charset & format.',
    category: 'Hashing',
    keywords: [
      'identify',
      'detect',
      'hash type',
      'bcrypt',
      'ntlm',
      'recognize',
    ],
    icon: ScanSearch,
    acceptsFile: false,
    relatedArticles: ['hashing-and-integrity', 'ctf-cheatsheet'],
  },

  /* ----------------------------- Encoding ------------------------------- */
  {
    id: 'encoding-multitool',
    slug: 'encoding-multitool',
    name: 'Encoding Multitool',
    shortDesc: 'Base64/32, hex, binary, URL, HTML & Unicode — all at once.',
    category: 'Encoding',
    keywords: [
      'base64',
      'base32',
      'hex',
      'binary',
      'url',
      'html',
      'unicode',
      'convert',
    ],
    icon: Binary,
    acceptsFile: false,
    relatedArticles: ['ctf-cheatsheet'],
  },
  {
    id: 'base64-tool',
    slug: 'base64-tool',
    name: 'Base64 Tool',
    shortDesc: 'Encode/decode text & files to Base64 (download, never upload).',
    category: 'Encoding',
    keywords: ['base64', 'data uri', 'file', 'encode', 'decode'],
    icon: FileCode2,
    acceptsFile: true,
  },
  {
    id: 'url-encoder',
    slug: 'url-encoder',
    name: 'URL Encoder / Decoder',
    shortDesc: 'Percent-encode and decode URL components safely.',
    category: 'Encoding',
    keywords: ['url', 'percent', 'uri', 'encode', 'decode', 'querystring'],
    icon: LinkIcon,
    acceptsFile: false,
  },
  {
    id: 'html-entity-tool',
    slug: 'html-entity-tool',
    name: 'HTML Entity Tool',
    shortDesc: 'Encode/decode HTML entities and numeric character references.',
    category: 'Encoding',
    keywords: ['html', 'entity', 'escape', 'xss', 'encode', 'decode'],
    icon: Code2,
    acceptsFile: false,
  },

  /* -------------------------- Classical Crypto -------------------------- */
  {
    id: 'caesar-cipher',
    slug: 'caesar-cipher',
    name: 'Caesar Cipher',
    shortDesc: 'Shift cipher with a live slider and 26-shift brute force.',
    category: 'Classical Crypto',
    keywords: ['caesar', 'shift', 'rot', 'brute force', 'substitution'],
    icon: RotateCw,
    acceptsFile: false,
    relatedArticles: ['classical-ciphers'],
  },
  {
    id: 'rot13',
    slug: 'rot13',
    name: 'ROT13',
    shortDesc: 'One-click ROT13 — the self-inverse letter rotation.',
    category: 'Classical Crypto',
    keywords: ['rot13', 'rotate', 'caesar', 'obfuscate'],
    icon: RefreshCw,
    acceptsFile: false,
    relatedArticles: ['classical-ciphers'],
  },
  {
    id: 'atbash',
    slug: 'atbash',
    name: 'Atbash Cipher',
    shortDesc: 'Mirror-alphabet substitution (A↔Z, B↔Y, …).',
    category: 'Classical Crypto',
    keywords: ['atbash', 'mirror', 'substitution', 'hebrew'],
    icon: FlipHorizontal2,
    acceptsFile: false,
    relatedArticles: ['classical-ciphers'],
  },
  {
    id: 'vigenere-cipher',
    slug: 'vigenere-cipher',
    name: 'Vigenère Cipher',
    shortDesc: 'Polyalphabetic keyword cipher with encrypt/decrypt.',
    category: 'Classical Crypto',
    keywords: ['vigenere', 'polyalphabetic', 'keyword', 'tabula recta'],
    icon: KeySquare,
    acceptsFile: false,
    relatedArticles: ['classical-ciphers'],
  },
  {
    id: 'xor-cipher',
    slug: 'xor-cipher',
    name: 'XOR Cipher',
    shortDesc: 'Repeating-key XOR on text or files; hex/Base64 output.',
    category: 'Classical Crypto',
    keywords: ['xor', 'key', 'crib', 'ctf', 'bitwise'],
    icon: ToggleRight,
    acceptsFile: true,
    relatedArticles: ['classical-ciphers', 'ctf-cheatsheet'],
  },
  {
    id: 'morse-code',
    slug: 'morse-code',
    name: 'Morse Code',
    shortDesc: 'Text ↔ Morse with audio playback and visual dots/dashes.',
    category: 'Classical Crypto',
    keywords: ['morse', 'audio', 'beep', 'sos', 'telegraph'],
    icon: AudioLines,
    acceptsFile: false,
    relatedArticles: ['classical-ciphers'],
  },

  /* --------------------------- Modern Crypto ---------------------------- */
  {
    id: 'aes-tool',
    slug: 'aes-tool',
    name: 'AES Encrypt / Decrypt',
    shortDesc: 'AES-GCM/CBC with PBKDF2 passphrase or raw key, text or file.',
    category: 'Modern Crypto',
    keywords: [
      'aes',
      'gcm',
      'cbc',
      'encrypt',
      'decrypt',
      'pbkdf2',
      'symmetric',
    ],
    icon: Lock,
    acceptsFile: true,
    relatedArticles: ['symmetric-vs-asymmetric'],
  },
  {
    id: 'rsa-tool',
    slug: 'rsa-tool',
    name: 'RSA & ECDSA Toolkit',
    shortDesc: 'Generate keys, encrypt, and sign/verify in the browser.',
    category: 'Modern Crypto',
    keywords: [
      'rsa',
      'ecdsa',
      'oaep',
      'pss',
      'public key',
      'sign',
      'verify',
      'pem',
    ],
    icon: KeySquare,
    acceptsFile: false,
    relatedArticles: ['symmetric-vs-asymmetric'],
  },
  {
    id: 'pbkdf2-tool',
    slug: 'pbkdf2-tool',
    name: 'PBKDF2 Key Derivation',
    shortDesc: 'Derive keys from a password + salt with tunable iterations.',
    category: 'Modern Crypto',
    keywords: ['pbkdf2', 'kdf', 'derive', 'salt', 'iterations', 'password'],
    icon: KeyRound,
    acceptsFile: false,
    relatedArticles: ['hashing-and-integrity', 'symmetric-vs-asymmetric'],
  },
  {
    id: 'bcrypt-tool',
    slug: 'bcrypt-tool',
    name: 'bcrypt Hash & Verify',
    shortDesc: 'Generate bcrypt hashes (cost slider) and verify a password.',
    category: 'Modern Crypto',
    keywords: ['bcrypt', 'password hash', 'cost', 'salt', 'verify'],
    icon: ShieldCheck,
    acceptsFile: false,
    relatedArticles: ['hashing-and-integrity'],
  },
  {
    id: 'jwt-decoder',
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    shortDesc:
      'Decode header/payload, humanize claims & verify HMAC signatures.',
    category: 'Modern Crypto',
    keywords: ['jwt', 'token', 'jws', 'bearer', 'claims', 'hs256'],
    icon: Ticket,
    acceptsFile: false,
    relatedArticles: ['symmetric-vs-asymmetric'],
  },

  /* ---------------------------- File Analysis --------------------------- */
  {
    id: 'file-signature-id',
    slug: 'file-signature-id',
    name: 'File Signature Identifier',
    shortDesc: 'Identify true file type by magic bytes; flag disguised files.',
    category: 'File Analysis',
    keywords: ['magic', 'signature', 'file type', 'mime', 'header', 'carving'],
    icon: FileSearch,
    acceptsFile: true,
    relatedArticles: ['file-carving-and-signatures'],
  },
  {
    id: 'hex-inspector',
    slug: 'hex-inspector',
    name: 'Hex Inspector',
    shortDesc: 'Virtualized hex+ASCII dump with jump-to-offset & search.',
    category: 'File Analysis',
    keywords: ['hex', 'dump', 'binary', 'offset', 'viewer', 'ascii'],
    icon: Grid3x3,
    acceptsFile: true,
    relatedArticles: ['file-carving-and-signatures'],
  },
  {
    id: 'string-extractor',
    slug: 'string-extractor',
    name: 'String Extractor',
    shortDesc:
      'Pull printable ASCII & UTF-16 strings with offsets from a file.',
    category: 'File Analysis',
    keywords: ['strings', 'malware', 'triage', 'utf16', 'ascii', 'extract'],
    icon: Type,
    acceptsFile: true,
    relatedArticles: ['file-carving-and-signatures', 'ctf-cheatsheet'],
  },
  {
    id: 'entropy-analyzer',
    slug: 'entropy-analyzer',
    name: 'Entropy Analyzer',
    shortDesc: 'Shannon entropy, byte histogram & window chart for triage.',
    category: 'File Analysis',
    keywords: [
      'entropy',
      'shannon',
      'encrypted',
      'compressed',
      'packed',
      'histogram',
    ],
    icon: Activity,
    acceptsFile: true,
    relatedArticles: ['file-carving-and-signatures', 'steganography'],
  },
  {
    id: 'zip-inspector',
    slug: 'zip-inspector',
    name: 'ZIP Inspector',
    shortDesc: 'List archive entries & flag traversal / bomb-shaped archives.',
    category: 'File Analysis',
    keywords: [
      'zip',
      'archive',
      'entries',
      'crc',
      'zip bomb',
      'path traversal',
    ],
    icon: Archive,
    acceptsFile: true,
    relatedArticles: ['file-carving-and-signatures'],
  },
  {
    id: 'exif-viewer',
    slug: 'exif-viewer',
    name: 'EXIF / Metadata Viewer',
    shortDesc:
      'Read camera, GPS & timestamps; strip metadata for a clean copy.',
    category: 'File Analysis',
    keywords: [
      'exif',
      'metadata',
      'gps',
      'xmp',
      'iptc',
      'geolocation',
      'camera',
    ],
    icon: Camera,
    acceptsFile: true,
    relatedArticles: ['metadata-and-exif'],
  },
  {
    id: 'stego-lsb',
    slug: 'stego-lsb',
    name: 'Steganography LSB Helper',
    shortDesc:
      'Reveal LSB bit-planes of PNG/BMP images and extract hidden bytes.',
    category: 'File Analysis',
    keywords: ['steganography', 'lsb', 'hidden', 'bit plane', 'png', 'ctf'],
    icon: Layers,
    acceptsFile: true,
    relatedArticles: ['steganography'],
  },

  /* ---------------------------- Text Analysis --------------------------- */
  {
    id: 'password-analyzer',
    slug: 'password-analyzer',
    name: 'Password Analyzer',
    shortDesc: 'Entropy, crack-time & dictionary check — all offline.',
    category: 'Text Analysis',
    keywords: ['password', 'strength', 'entropy', 'crack time', 'zxcvbn'],
    icon: ShieldAlert,
    acceptsFile: false,
    relatedArticles: ['hashing-and-integrity'],
  },
  {
    id: 'character-inspector',
    slug: 'character-inspector',
    name: 'Character Inspector',
    shortDesc: 'Per-character code points; flag invisible & confusable chars.',
    category: 'Text Analysis',
    keywords: [
      'unicode',
      'code point',
      'homoglyph',
      'zero width',
      'rtl',
      'confusable',
    ],
    icon: Type,
    acceptsFile: false,
    relatedArticles: ['metadata-and-exif'],
  },
  {
    id: 'regex-tester',
    slug: 'regex-tester',
    name: 'Regex Tester',
    shortDesc: 'Live match highlighting, capture groups & token explanations.',
    category: 'Text Analysis',
    keywords: ['regex', 'regexp', 'pattern', 'match', 'capture', 'grep'],
    icon: Regex,
    acceptsFile: false,
  },
  {
    id: 'frequency-analyzer',
    slug: 'frequency-analyzer',
    name: 'Frequency Analyzer',
    shortDesc:
      'Letter frequency & index of coincidence to crack classical ciphers.',
    category: 'Text Analysis',
    keywords: [
      'frequency',
      'index of coincidence',
      'cryptanalysis',
      'substitution',
      'ctf',
    ],
    icon: BarChart3,
    acceptsFile: false,
    relatedArticles: ['classical-ciphers', 'ctf-cheatsheet'],
  },

  /* ----------------------------- Generators ----------------------------- */
  {
    id: 'password-generator',
    slug: 'password-generator',
    name: 'Password Generator',
    shortDesc: 'Random passwords or diceware passphrases with live entropy.',
    category: 'Generators',
    keywords: ['password', 'generate', 'random', 'passphrase', 'diceware'],
    icon: KeyRound,
    acceptsFile: false,
  },
  {
    id: 'uuid-tool',
    slug: 'uuid-tool',
    name: 'UUID Tool',
    shortDesc: 'Generate v4/v7 UUIDs; validate & decode version/variant/time.',
    category: 'Generators',
    keywords: ['uuid', 'guid', 'v4', 'v7', 'unique id'],
    icon: Fingerprint,
    acceptsFile: false,
  },
  {
    id: 'qr-tool',
    slug: 'qr-tool',
    name: 'QR Tool',
    shortDesc: 'Encode text to a QR PNG and decode QR codes from images.',
    category: 'Generators',
    keywords: ['qr', 'qrcode', 'barcode', 'encode', 'decode'],
    icon: QrCode,
    acceptsFile: true,
  },

  /* ----------------------------- Converters ----------------------------- */
  {
    id: 'number-base-converter',
    slug: 'number-base-converter',
    name: 'Number Base Converter',
    shortDesc: 'Convert between binary, octal, decimal, hex & Base64 live.',
    category: 'Converters',
    keywords: ['base', 'binary', 'octal', 'decimal', 'hex', 'radix', 'convert'],
    icon: Calculator,
    acceptsFile: false,
  },
  {
    id: 'timestamp-converter',
    slug: 'timestamp-converter',
    name: 'Timestamp Converter',
    shortDesc: 'Unix/ISO plus FILETIME, WebKit & Mac forensic epochs.',
    category: 'Converters',
    keywords: [
      'timestamp',
      'unix',
      'epoch',
      'filetime',
      'webkit',
      'iso8601',
      'date',
    ],
    icon: Clock,
    acceptsFile: false,
  },
];

/* ----------------------------- Lookups -------------------------------- */

const BY_SLUG = new Map(TOOLS.map((t) => [t.slug, t]));
const BY_ID = new Map(TOOLS.map((t) => [t.id, t]));

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return BY_SLUG.get(slug);
}

export function getToolById(id: string): ToolDefinition | undefined {
  return BY_ID.get(id);
}

export function toolsByCategory(): {
  category: ToolCategory;
  tools: ToolDefinition[];
}[] {
  const map = new Map<ToolCategory, ToolDefinition[]>();
  for (const t of TOOLS) {
    const arr = map.get(t.category) ?? [];
    arr.push(t);
    map.set(t.category, arr);
  }
  return Array.from(map.entries()).map(([category, tools]) => ({
    category,
    tools,
  }));
}

export function allSlugs(): string[] {
  return TOOLS.map((t) => t.slug);
}

/** Lightweight fuzzy/substring search used by the command palette & home grid. */
export function searchTools(query: string): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  const terms = q.split(/\s+/);
  return TOOLS.map((t) => {
    const haystack = [t.name, t.shortDesc, t.category, ...t.keywords]
      .join(' ')
      .toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (t.name.toLowerCase().includes(term)) score += 5;
      else if (haystack.includes(term)) score += 2;
      else score -= 3;
    }
    return { t, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}
