import CryptoJS from 'crypto-js';
import { sha3_256, sha3_512 } from 'js-sha3';
import {
  bytesToBase64,
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
} from '../encoding';
import type { HashResult } from '../types';
import { bytesToWordArray } from './wordarray';

export const HASH_ALGOS = [
  'MD5',
  'SHA-1',
  'SHA-256',
  'SHA-384',
  'SHA-512',
  'SHA3-256',
  'SHA3-512',
  'RIPEMD-160',
] as const;

export type HashAlgo = (typeof HASH_ALGOS)[number];

const BITS: Record<HashAlgo, number> = {
  MD5: 128,
  'SHA-1': 160,
  'SHA-256': 256,
  'SHA-384': 384,
  'SHA-512': 512,
  'SHA3-256': 256,
  'SHA3-512': 512,
  'RIPEMD-160': 160,
};

export function hashBits(algo: HashAlgo): number {
  return BITS[algo];
}

/** Lowercase hex digest of `bytes` under `algo`. Synchronous & isomorphic. */
export function hashHex(algo: HashAlgo, bytes: Uint8Array): string {
  switch (algo) {
    case 'MD5':
      return CryptoJS.MD5(bytesToWordArray(bytes)).toString();
    case 'SHA-1':
      return CryptoJS.SHA1(bytesToWordArray(bytes)).toString();
    case 'SHA-256':
      return CryptoJS.SHA256(bytesToWordArray(bytes)).toString();
    case 'SHA-384':
      return CryptoJS.SHA384(bytesToWordArray(bytes)).toString();
    case 'SHA-512':
      return CryptoJS.SHA512(bytesToWordArray(bytes)).toString();
    case 'RIPEMD-160':
      return CryptoJS.RIPEMD160(bytesToWordArray(bytes)).toString();
    case 'SHA3-256':
      return sha3_256(bytes);
    case 'SHA3-512':
      return sha3_512(bytes);
    default: {
      const _exhaustive: never = algo;
      return _exhaustive;
    }
  }
}

export function hashHexText(algo: HashAlgo, text: string): string {
  return hashHex(algo, utf8ToBytes(text));
}

export function hashResult(algo: HashAlgo, bytes: Uint8Array): HashResult {
  const hex = hashHex(algo, bytes);
  return {
    algo,
    hex,
    base64: bytesToBase64(hexToBytes(hex)),
    bits: BITS[algo],
  };
}

/** All supported digests for the Hash Generator, in display order. */
export function hashAll(bytes: Uint8Array): HashResult[] {
  return HASH_ALGOS.map((a) => hashResult(a, bytes));
}

export function hashAllText(text: string): HashResult[] {
  return hashAll(utf8ToBytes(text));
}

/* -------------------------------------------------------------------------- */
/*  Incremental hashing for chunked/streamed large files                      */
/* -------------------------------------------------------------------------- */

export type StreamHashAlgo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

interface CjHasher {
  update: (wa: ReturnType<typeof bytesToWordArray>) => void;
  finalize: () => { toString: () => string };
}

const STREAM_FACTORY: Record<StreamHashAlgo, () => CjHasher> = {
  MD5: () => CryptoJS.algo.MD5.create() as unknown as CjHasher,
  'SHA-1': () => CryptoJS.algo.SHA1.create() as unknown as CjHasher,
  'SHA-256': () => CryptoJS.algo.SHA256.create() as unknown as CjHasher,
  'SHA-512': () => CryptoJS.algo.SHA512.create() as unknown as CjHasher,
};

export interface IncrementalHasher {
  update(chunk: Uint8Array): void;
  finalizeHex(): string;
}

export function createIncrementalHasher(
  algo: StreamHashAlgo,
): IncrementalHasher {
  const hasher = STREAM_FACTORY[algo]();
  return {
    update(chunk: Uint8Array) {
      hasher.update(bytesToWordArray(chunk));
    },
    finalizeHex() {
      return hasher.finalize().toString();
    },
  };
}

/** Case-insensitive, whitespace-trimmed hex comparison for "expected hash". */
export function hashesMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[\s:]/g, '');
  return norm(a) !== '' && norm(a) === norm(b);
}

export { bytesToHex };
