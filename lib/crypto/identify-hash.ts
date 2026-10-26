/**
 * Heuristic hash identification. We cannot know an algorithm from a digest with
 * certainty — same-length digests are indistinguishable — so we rank candidates
 * by how common they are in practice and explain the reasoning to the user.
 */

export interface HashGuess {
  algorithm: string;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

const HEX_LEN_TABLE: Record<number, HashGuess[]> = {
  16: [
    {
      algorithm: 'MySQL 3.x (16 hex)',
      confidence: 'low',
      note: '64-bit legacy digest',
    },
  ],
  32: [
    {
      algorithm: 'MD5',
      confidence: 'high',
      note: '128-bit; by far the most common 32-hex hash',
    },
    {
      algorithm: 'NTLM',
      confidence: 'medium',
      note: 'Windows password hash (MD4 of UTF-16LE)',
    },
    {
      algorithm: 'MD4',
      confidence: 'low',
      note: 'Obsolete predecessor to MD5',
    },
    { algorithm: 'MD2', confidence: 'low', note: 'Very old, rarely seen' },
  ],
  40: [
    {
      algorithm: 'SHA-1',
      confidence: 'high',
      note: '160-bit; the usual 40-hex hash',
    },
    {
      algorithm: 'RIPEMD-160',
      confidence: 'medium',
      note: 'Used in Bitcoin addresses',
    },
    { algorithm: 'SHA-0', confidence: 'low', note: 'Withdrawn original SHA' },
  ],
  56: [
    {
      algorithm: 'SHA-224',
      confidence: 'high',
      note: '224-bit truncated SHA-2',
    },
    { algorithm: 'SHA3-224', confidence: 'medium', note: 'Keccak-based' },
  ],
  64: [
    {
      algorithm: 'SHA-256',
      confidence: 'high',
      note: '256-bit; the dominant 64-hex hash',
    },
    { algorithm: 'SHA3-256', confidence: 'medium', note: 'Keccak-based SHA-3' },
    { algorithm: 'BLAKE2s-256', confidence: 'low', note: 'Modern fast hash' },
    { algorithm: 'RIPEMD-256', confidence: 'low', note: 'Less common' },
  ],
  96: [
    {
      algorithm: 'SHA-384',
      confidence: 'high',
      note: '384-bit truncated SHA-512',
    },
    { algorithm: 'SHA3-384', confidence: 'medium', note: 'Keccak-based' },
  ],
  128: [
    { algorithm: 'SHA-512', confidence: 'high', note: '512-bit SHA-2' },
    { algorithm: 'SHA3-512', confidence: 'medium', note: 'Keccak-based SHA-3' },
    { algorithm: 'Whirlpool', confidence: 'low', note: '512-bit, AES-derived' },
    { algorithm: 'BLAKE2b-512', confidence: 'low', note: 'Modern fast hash' },
  ],
};

export function identifyHash(input: string): HashGuess[] {
  const s = input.trim();
  if (!s) return [];

  // Prefixed / structured formats first — these are unambiguous.
  if (/^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(s))
    return [
      {
        algorithm: 'bcrypt',
        confidence: 'high',
        note: 'Modular crypt format ($2a/$2b/$2y$, cost + 22-char salt + 31-char hash)',
      },
    ];
  if (/^\$argon2(id|i|d)\$/.test(s))
    return [
      {
        algorithm: 'Argon2',
        confidence: 'high',
        note: 'PHC string format; memory-hard KDF',
      },
    ];
  if (/^\$6\$/.test(s))
    return [
      {
        algorithm: 'sha512crypt',
        confidence: 'high',
        note: 'Unix crypt ($6$) — SHA-512 based',
      },
    ];
  if (/^\$5\$/.test(s))
    return [
      {
        algorithm: 'sha256crypt',
        confidence: 'high',
        note: 'Unix crypt ($5$) — SHA-256 based',
      },
    ];
  if (/^\$1\$/.test(s))
    return [
      {
        algorithm: 'md5crypt',
        confidence: 'high',
        note: 'Unix crypt ($1$) — legacy MD5 based',
      },
    ];
  if (/^\$y\$/.test(s))
    return [
      {
        algorithm: 'yescrypt',
        confidence: 'high',
        note: 'Modern default on many Linux distros',
      },
    ];
  if (/^\{SSHA\}/i.test(s))
    return [
      {
        algorithm: 'SSHA (LDAP)',
        confidence: 'high',
        note: 'Salted SHA-1, Base64 encoded',
      },
    ];
  if (/^[0-9a-fA-F]{32}:[0-9a-fA-F]{32}$/.test(s))
    return [
      {
        algorithm: 'NTLM:LM pair',
        confidence: 'high',
        note: 'Windows SAM dump (LM:NT or user:NT)',
      },
    ];
  if (s.split('.').length === 3 && /^[A-Za-z0-9_-]+\./.test(s))
    return [
      {
        algorithm: 'JWT',
        confidence: 'medium',
        note: 'Three Base64URL segments — use the JWT Decoder',
      },
    ];

  const isHex = /^[0-9a-fA-F]+$/.test(s);
  if (isHex && HEX_LEN_TABLE[s.length]) {
    return HEX_LEN_TABLE[s.length];
  }
  if (isHex) {
    return [
      {
        algorithm: `Unknown hex digest (${s.length} chars, ${s.length * 4} bits)`,
        confidence: 'low',
        note: 'Length does not match a common algorithm',
      },
    ];
  }

  if (/^[A-Za-z0-9+/]+={0,2}$/.test(s)) {
    return [
      {
        algorithm: 'Base64-encoded digest',
        confidence: 'medium',
        note: 'Possibly a raw hash encoded as Base64 (e.g. an HMAC)',
      },
    ];
  }

  return [
    {
      algorithm: 'Unrecognized',
      confidence: 'low',
      note: 'Not hex, Base64, or a known crypt format',
    },
  ];
}
