import CryptoJS from 'crypto-js';

/**
 * CryptoJS operates on its own 32-bit "WordArray" representation. These bridges
 * let the rest of the app speak Uint8Array everywhere and only convert at the
 * CryptoJS boundary (hashing, HMAC, AES, PBKDF2).
 */

export type WordArray = CryptoJS.lib.WordArray;

export function bytesToWordArray(u8: Uint8Array): WordArray {
  const words: number[] = [];
  for (let i = 0; i < u8.length; i++) {
    words[i >>> 2] |= u8[i] << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
}

export function wordArrayToBytes(wa: WordArray): Uint8Array {
  const { words, sigBytes } = wa;
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
}
