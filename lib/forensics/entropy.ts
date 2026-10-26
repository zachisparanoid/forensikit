import type { EntropyResult, EntropyVerdict } from '../types';

/** Shannon entropy in bits/byte (0 = uniform, 8 = maximally random). */
export function shannonEntropy(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  const counts = new Uint32Array(256);
  for (let i = 0; i < bytes.length; i++) counts[bytes[i]]++;
  let h = 0;
  const n = bytes.length;
  for (let i = 0; i < 256; i++) {
    if (counts[i] === 0) continue;
    const p = counts[i] / n;
    h -= p * Math.log2(p);
  }
  return h;
}

export function byteHistogram(bytes: Uint8Array): number[] {
  const counts = new Array<number>(256).fill(0);
  for (let i = 0; i < bytes.length; i++) counts[bytes[i]]++;
  return counts;
}

/**
 * Entropy sampled over a sliding window, returning at most `samples` points so
 * the chart stays cheap for huge files. Highlights packed/embedded regions.
 */
export function slidingWindowEntropy(
  bytes: Uint8Array,
  windowSize = 1024,
  samples = 256,
): number[] {
  if (bytes.length === 0) return [];
  const win = Math.min(windowSize, bytes.length);
  const step = Math.max(1, Math.floor((bytes.length - win) / samples) || 1);
  const out: number[] = [];
  for (let start = 0; start + win <= bytes.length; start += step) {
    out.push(shannonEntropy(bytes.subarray(start, start + win)));
    if (out.length >= samples) break;
  }
  if (out.length === 0) out.push(shannonEntropy(bytes));
  return out;
}

export function entropyVerdict(shannon: number): EntropyVerdict {
  if (shannon >= 7.5) return 'high (likely encrypted/compressed)';
  if (shannon >= 5.0) return 'medium';
  return 'low';
}

export function analyzeEntropy(
  bytes: Uint8Array,
  windowSize = 1024,
): EntropyResult {
  const shannon = shannonEntropy(bytes);
  return {
    shannon,
    perByte: slidingWindowEntropy(bytes, windowSize),
    histogram: byteHistogram(bytes),
    verdict: entropyVerdict(shannon),
  };
}
