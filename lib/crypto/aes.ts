import { base64ToBytes, bytesToBase64, hexToBytes } from '../encoding';

/**
 * AES via the native Web Crypto API. Two modes:
 *   - GCM: authenticated; tag is appended to ciphertext by the browser.
 *   - CBC: confidentiality only; callers are warned it needs separate integrity.
 *
 * Self-describing bundle (passphrase mode), Base64 encoded:
 *   [ salt(16) | iv(12 GCM / 16 CBC) | ciphertext(+16-byte GCM tag) ]
 * Raw-key mode omits the salt:
 *   [ iv | ciphertext(+tag) ]
 */

export type AesMode = 'GCM' | 'CBC';
export type AesKeyBits = 128 | 192 | 256;
export type Pbkdf2Hash = 'SHA-256' | 'SHA-512';

export const DEFAULT_PBKDF2_ITERATIONS = 250_000;
const SALT_LEN = 16;
const IV_LEN: Record<AesMode, number> = { GCM: 12, CBC: 16 };

function subtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error(
      'Web Crypto (crypto.subtle) is unavailable. Open this page over HTTPS or localhost.',
    );
  }
  return crypto.subtle;
}

function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  hash: Pbkdf2Hash,
  bits: AesKeyBits,
  mode: AesMode,
): Promise<CryptoKey> {
  const baseKey = await subtle().importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return subtle().deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash },
    baseKey,
    { name: `AES-${mode}`, length: bits },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function importRawKey(
  hexKey: string,
  bits: AesKeyBits,
  mode: AesMode,
): Promise<CryptoKey> {
  const raw = hexToBytes(hexKey);
  if (raw.length !== bits / 8) {
    throw new Error(
      `Raw key must be ${bits / 8} bytes (${bits / 4} hex chars) for AES-${bits}; got ${raw.length} bytes.`,
    );
  }
  return subtle().importKey(
    'raw',
    raw as BufferSource,
    { name: `AES-${mode}`, length: bits },
    false,
    ['encrypt', 'decrypt'],
  );
}

export interface AesEncryptParams {
  mode: AesMode;
  data: Uint8Array;
  passphrase?: string;
  rawKeyHex?: string;
  keyBits?: AesKeyBits;
  iterations?: number;
  hash?: Pbkdf2Hash;
}

export interface AesEncryptResult {
  bundleB64: string;
  saltHex?: string;
  ivHex: string;
  iterations?: number;
  keyBits: AesKeyBits;
  mode: AesMode;
}

export async function encryptAes(
  p: AesEncryptParams,
): Promise<AesEncryptResult> {
  const mode = p.mode;
  const keyBits = p.keyBits ?? 256;
  const iv = randomBytes(IV_LEN[mode]);
  let key: CryptoKey;
  let salt: Uint8Array | undefined;
  let iterations: number | undefined;

  if (p.passphrase != null && p.passphrase !== '') {
    salt = randomBytes(SALT_LEN);
    iterations = p.iterations ?? DEFAULT_PBKDF2_ITERATIONS;
    key = await deriveKey(
      p.passphrase,
      salt,
      iterations,
      p.hash ?? 'SHA-256',
      keyBits,
      mode,
    );
  } else if (p.rawKeyHex) {
    key = await importRawKey(p.rawKeyHex, keyBits, mode);
  } else {
    throw new Error('Provide a passphrase or a raw hex key.');
  }

  const cipherBuf = await subtle().encrypt(
    mode === 'GCM'
      ? { name: 'AES-GCM', iv: iv as BufferSource }
      : { name: 'AES-CBC', iv: iv as BufferSource },
    key,
    p.data as BufferSource,
  );
  const cipher = new Uint8Array(cipherBuf);
  const bundle = salt ? concat(salt, iv, cipher) : concat(iv, cipher);

  return {
    bundleB64: bytesToBase64(bundle),
    saltHex: salt ? bytesToHex(salt) : undefined,
    ivHex: bytesToHex(iv),
    iterations,
    keyBits,
    mode,
  };
}

export interface AesDecryptParams {
  mode: AesMode;
  bundleB64: string;
  passphrase?: string;
  rawKeyHex?: string;
  keyBits?: AesKeyBits;
  iterations?: number;
  hash?: Pbkdf2Hash;
}

export async function decryptAes(p: AesDecryptParams): Promise<Uint8Array> {
  const mode = p.mode;
  const keyBits = p.keyBits ?? 256;
  let bundle: Uint8Array;
  try {
    bundle = base64ToBytes(p.bundleB64.trim());
  } catch {
    throw new Error('Ciphertext is not valid Base64.');
  }
  const ivLen = IV_LEN[mode];
  const usesPass = p.passphrase != null && p.passphrase !== '';
  const headerLen = usesPass ? SALT_LEN + ivLen : ivLen;
  if (bundle.length <= headerLen) {
    throw new Error(
      'Decryption failed — ciphertext is too short or corrupted.',
    );
  }

  let key: CryptoKey;
  let iv: Uint8Array;
  if (usesPass) {
    const salt = bundle.slice(0, SALT_LEN);
    iv = bundle.slice(SALT_LEN, SALT_LEN + ivLen);
    key = await deriveKey(
      p.passphrase as string,
      salt,
      p.iterations ?? DEFAULT_PBKDF2_ITERATIONS,
      p.hash ?? 'SHA-256',
      keyBits,
      mode,
    );
  } else if (p.rawKeyHex) {
    iv = bundle.slice(0, ivLen);
    key = await importRawKey(p.rawKeyHex, keyBits, mode);
  } else {
    throw new Error('Provide the passphrase or raw hex key used to encrypt.');
  }
  const cipher = bundle.slice(headerLen);

  try {
    const plainBuf = await subtle().decrypt(
      mode === 'GCM'
        ? { name: 'AES-GCM', iv: iv as BufferSource }
        : { name: 'AES-CBC', iv: iv as BufferSource },
      key,
      cipher as BufferSource,
    );
    return new Uint8Array(plainBuf);
  } catch {
    // Never leak partial plaintext: GCM tag mismatch or wrong key both land here.
    throw new Error(
      'Decryption failed — wrong key/passphrase or corrupted data.',
    );
  }
}

// local hex helper to avoid a circular import on encoding's bytesToHex name
function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++)
    out += bytes[i].toString(16).padStart(2, '0');
  return out;
}
