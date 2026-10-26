import { bytesToBase64, bytesToHex, utf8ToBytes } from '../encoding';

export type Pbkdf2Hash = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const PBKDF2_RECOMMENDATION =
  'OWASP (2023+) recommends ≥ 600,000 iterations for PBKDF2-HMAC-SHA256, or ≥ 210,000 for SHA-512. Higher is better; balance against device speed.';

export interface Pbkdf2Params {
  password: string;
  salt: Uint8Array;
  iterations: number;
  hash: Pbkdf2Hash;
  /** Derived key length in bits. */
  dkLenBits: number;
}

function subtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error(
      'Web Crypto (crypto.subtle) is unavailable. Open this page over HTTPS or localhost.',
    );
  }
  return crypto.subtle;
}

export async function pbkdf2Derive(p: Pbkdf2Params): Promise<Uint8Array> {
  if (p.iterations < 1) throw new Error('Iterations must be at least 1.');
  const baseKey = await subtle().importKey(
    'raw',
    utf8ToBytes(p.password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await subtle().deriveBits(
    {
      name: 'PBKDF2',
      salt: p.salt as BufferSource,
      iterations: p.iterations,
      hash: p.hash,
    },
    baseKey,
    p.dkLenBits,
  );
  return new Uint8Array(bits);
}

export async function pbkdf2Result(
  p: Pbkdf2Params,
): Promise<{ hex: string; base64: string }> {
  const out = await pbkdf2Derive(p);
  return { hex: bytesToHex(out), base64: bytesToBase64(out) };
}
