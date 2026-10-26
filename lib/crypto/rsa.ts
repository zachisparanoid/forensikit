import {
  base64ToBytes,
  bytesToBase64,
  bytesToUtf8,
  utf8ToBytes,
} from '../encoding';

/**
 * Asymmetric crypto via Web Crypto. RSA-OAEP for encryption, RSA-PSS and ECDSA
 * (P-256) for signatures. Keys are generated and exported as PEM entirely in the
 * browser; private keys never leave the page.
 */

export type RsaModulus = 2048 | 4096;
export type RsaPurpose = 'encrypt' | 'sign';

function subtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error(
      'Web Crypto (crypto.subtle) is unavailable. Open this page over HTTPS or localhost.',
    );
  }
  return crypto.subtle;
}

// TS 5.7+ types Uint8Array as Uint8Array<ArrayBufferLike>, which no longer
// satisfies BufferSource directly. Narrow at the Web Crypto boundary.
const bs = (u: Uint8Array): BufferSource => u as BufferSource;

function toPem(der: ArrayBuffer, label: string): string {
  const b64 = bytesToBase64(new Uint8Array(der));
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

function fromPem(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '');
  if (!body) throw new Error('PEM is empty or malformed.');
  return base64ToBytes(body);
}

export interface PemKeyPair {
  publicPem: string;
  privatePem: string;
}

export async function generateRsaKeyPair(
  modulusLength: RsaModulus,
  purpose: RsaPurpose,
): Promise<PemKeyPair> {
  const algo =
    purpose === 'encrypt'
      ? {
          name: 'RSA-OAEP',
          modulusLength,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        }
      : {
          name: 'RSA-PSS',
          modulusLength,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        };
  const usages: KeyUsage[] =
    purpose === 'encrypt' ? ['encrypt', 'decrypt'] : ['sign', 'verify'];
  const pair = (await subtle().generateKey(
    algo,
    true,
    usages,
  )) as CryptoKeyPair;
  const spki = await subtle().exportKey('spki', pair.publicKey);
  const pkcs8 = await subtle().exportKey('pkcs8', pair.privateKey);
  return {
    publicPem: toPem(spki, 'PUBLIC KEY'),
    privatePem: toPem(pkcs8, 'PRIVATE KEY'),
  };
}

export async function generateEcdsaKeyPair(): Promise<PemKeyPair> {
  const pair = (await subtle().generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair;
  const spki = await subtle().exportKey('spki', pair.publicKey);
  const pkcs8 = await subtle().exportKey('pkcs8', pair.privateKey);
  return {
    publicPem: toPem(spki, 'PUBLIC KEY'),
    privatePem: toPem(pkcs8, 'PRIVATE KEY'),
  };
}

export async function rsaEncrypt(
  publicPem: string,
  message: string,
): Promise<string> {
  const key = await subtle().importKey(
    'spki',
    fromPem(publicPem) as BufferSource,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );
  const ct = await subtle().encrypt(
    { name: 'RSA-OAEP' },
    key,
    bs(utf8ToBytes(message)),
  );
  return bytesToBase64(new Uint8Array(ct));
}

export async function rsaDecrypt(
  privatePem: string,
  ciphertextB64: string,
): Promise<string> {
  const key = await subtle().importKey(
    'pkcs8',
    fromPem(privatePem) as BufferSource,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  );
  try {
    const pt = await subtle().decrypt(
      { name: 'RSA-OAEP' },
      key,
      bs(base64ToBytes(ciphertextB64.trim())),
    );
    return bytesToUtf8(new Uint8Array(pt));
  } catch {
    throw new Error(
      'Decryption failed — wrong private key or corrupted ciphertext.',
    );
  }
}

export async function rsaSign(
  privatePem: string,
  message: string,
): Promise<string> {
  const key = await subtle().importKey(
    'pkcs8',
    fromPem(privatePem) as BufferSource,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await subtle().sign(
    { name: 'RSA-PSS', saltLength: 32 },
    key,
    bs(utf8ToBytes(message)),
  );
  return bytesToBase64(new Uint8Array(sig));
}

export async function rsaVerify(
  publicPem: string,
  message: string,
  signatureB64: string,
): Promise<boolean> {
  const key = await subtle().importKey(
    'spki',
    fromPem(publicPem) as BufferSource,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return subtle().verify(
    { name: 'RSA-PSS', saltLength: 32 },
    key,
    bs(base64ToBytes(signatureB64.trim())),
    bs(utf8ToBytes(message)),
  );
}

export async function ecdsaSign(
  privatePem: string,
  message: string,
): Promise<string> {
  const key = await subtle().importKey(
    'pkcs8',
    fromPem(privatePem) as BufferSource,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const sig = await subtle().sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    bs(utf8ToBytes(message)),
  );
  return bytesToBase64(new Uint8Array(sig));
}

export async function ecdsaVerify(
  publicPem: string,
  message: string,
  signatureB64: string,
): Promise<boolean> {
  const key = await subtle().importKey(
    'spki',
    fromPem(publicPem) as BufferSource,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );
  return subtle().verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    bs(base64ToBytes(signatureB64.trim())),
    bs(utf8ToBytes(message)),
  );
}

/** HMAC-based JWT signature verification (HS256/384/512). */
export async function verifyJwtHmac(
  signingInput: string,
  signatureB64Url: string,
  secret: string,
  bits: 256 | 384 | 512,
): Promise<boolean> {
  const key = await subtle().importKey(
    'raw',
    bs(utf8ToBytes(secret)),
    { name: 'HMAC', hash: `SHA-${bits}` },
    false,
    ['verify'],
  );
  const sig = base64ToBytes(
    signatureB64Url.replace(/-/g, '+').replace(/_/g, '/'),
  );
  return subtle().verify('HMAC', key, bs(sig), bs(utf8ToBytes(signingInput)));
}
