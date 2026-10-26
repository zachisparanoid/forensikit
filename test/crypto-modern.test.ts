import { describe, expect, it } from 'vitest';
import { decryptAes, encryptAes } from '@/lib/crypto/aes';
import { pbkdf2Derive } from '@/lib/crypto/pbkdf2';
import {
  ecdsaSign,
  ecdsaVerify,
  generateEcdsaKeyPair,
  generateRsaKeyPair,
  rsaDecrypt,
  rsaEncrypt,
  rsaSign,
  rsaVerify,
} from '@/lib/crypto/rsa';
import { bytesToHex, utf8ToBytes } from '@/lib/encoding';

describe('AES round-trips', () => {
  it('GCM with passphrase round-trips', async () => {
    const data = utf8ToBytes('top secret payload');
    const enc = await encryptAes({ mode: 'GCM', data, passphrase: 'hunter2' });
    const dec = await decryptAes({
      mode: 'GCM',
      bundleB64: enc.bundleB64,
      passphrase: 'hunter2',
    });
    expect(new TextDecoder().decode(dec)).toBe('top secret payload');
  });
  it('GCM wrong passphrase fails without leaking plaintext', async () => {
    const enc = await encryptAes({
      mode: 'GCM',
      data: utf8ToBytes('secret'),
      passphrase: 'right',
    });
    await expect(
      decryptAes({
        mode: 'GCM',
        bundleB64: enc.bundleB64,
        passphrase: 'wrong',
      }),
    ).rejects.toThrow(/Decryption failed/);
  });
  it('CBC with raw 256-bit key round-trips', async () => {
    const rawKeyHex = bytesToHex(new Uint8Array(32).fill(7));
    const enc = await encryptAes({
      mode: 'CBC',
      data: utf8ToBytes('cbc data'),
      rawKeyHex,
      keyBits: 256,
    });
    const dec = await decryptAes({
      mode: 'CBC',
      bundleB64: enc.bundleB64,
      rawKeyHex,
      keyBits: 256,
    });
    expect(new TextDecoder().decode(dec)).toBe('cbc data');
  });
});

describe('PBKDF2 (RFC 6070 SHA-1 vectors)', () => {
  it('c=1', async () => {
    const out = await pbkdf2Derive({
      password: 'password',
      salt: utf8ToBytes('salt'),
      iterations: 1,
      hash: 'SHA-1',
      dkLenBits: 160,
    });
    expect(bytesToHex(out)).toBe('0c60c80f961f0e71f3a9b524af6012062fe037a6');
  });
  it('c=2', async () => {
    const out = await pbkdf2Derive({
      password: 'password',
      salt: utf8ToBytes('salt'),
      iterations: 2,
      hash: 'SHA-1',
      dkLenBits: 160,
    });
    expect(bytesToHex(out)).toBe('ea6c014dc72d6f8ccd1ed92ace1d41f0d8de8957');
  });
});

describe('RSA & ECDSA', () => {
  it('RSA-OAEP encrypt/decrypt round-trips', async () => {
    const { publicPem, privatePem } = await generateRsaKeyPair(2048, 'encrypt');
    const ct = await rsaEncrypt(publicPem, 'hello rsa');
    expect(await rsaDecrypt(privatePem, ct)).toBe('hello rsa');
  }, 20000);
  it('RSA-PSS sign/verify', async () => {
    const { publicPem, privatePem } = await generateRsaKeyPair(2048, 'sign');
    const sig = await rsaSign(privatePem, 'message');
    expect(await rsaVerify(publicPem, 'message', sig)).toBe(true);
    expect(await rsaVerify(publicPem, 'tampered', sig)).toBe(false);
  }, 20000);
  it('ECDSA P-256 sign/verify', async () => {
    const { publicPem, privatePem } = await generateEcdsaKeyPair();
    const sig = await ecdsaSign(privatePem, 'ec message');
    expect(await ecdsaVerify(publicPem, 'ec message', sig)).toBe(true);
    expect(await ecdsaVerify(publicPem, 'changed', sig)).toBe(false);
  });
});
