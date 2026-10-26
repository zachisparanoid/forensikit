import CryptoJS from 'crypto-js';
import { bytesToBase64, hexToBytes } from '../encoding';
import { bytesToWordArray, type WordArray } from './wordarray';

export const HMAC_ALGOS = [
  'SHA-256',
  'SHA-1',
  'SHA-384',
  'SHA-512',
  'MD5',
  'RIPEMD-160',
] as const;

export type HmacAlgo = (typeof HMAC_ALGOS)[number];

type HmacFn = (
  message: WordArray,
  key: WordArray,
) => { toString: () => string };

const MAP: Record<HmacAlgo, HmacFn> = {
  'SHA-256': CryptoJS.HmacSHA256,
  'SHA-1': CryptoJS.HmacSHA1,
  'SHA-384': CryptoJS.HmacSHA384,
  'SHA-512': CryptoJS.HmacSHA512,
  MD5: CryptoJS.HmacMD5,
  'RIPEMD-160': CryptoJS.HmacRIPEMD160,
};

export function hmacHex(
  algo: HmacAlgo,
  message: Uint8Array,
  key: Uint8Array,
): string {
  return MAP[algo](bytesToWordArray(message), bytesToWordArray(key)).toString();
}

export function hmacResult(
  algo: HmacAlgo,
  message: Uint8Array,
  key: Uint8Array,
): { hex: string; base64: string } {
  const hex = hmacHex(algo, message, key);
  return { hex, base64: bytesToBase64(hexToBytes(hex)) };
}
