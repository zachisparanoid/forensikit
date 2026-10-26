import { describe, expect, it } from 'vitest';
import { identifyHash } from '@/lib/crypto/identify-hash';
import { analyzeEntropy, shannonEntropy } from '@/lib/forensics/entropy';
import { checkExtension, matchSignatures } from '@/lib/forensics/signatures';
import { extractStrings } from '@/lib/forensics/strings';
import { utf8ToBytes } from '@/lib/encoding';

describe('identifyHash', () => {
  it('flags bcrypt', () => {
    const g = identifyHash(
      '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW',
    );
    expect(g[0].algorithm).toBe('bcrypt');
  });
  it('ranks MD5 first for 32 hex', () => {
    expect(identifyHash('900150983cd24fb0d6963f7d28e17f72')[0].algorithm).toBe(
      'MD5',
    );
  });
  it('ranks SHA-256 first for 64 hex', () => {
    const g = identifyHash(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(g[0].algorithm).toBe('SHA-256');
  });
  it('returns empty for blank', () => {
    expect(identifyHash('   ')).toEqual([]);
  });
});

describe('entropy', () => {
  it('is 0 for a constant buffer', () => {
    expect(shannonEntropy(new Uint8Array(256).fill(42))).toBe(0);
  });
  it('is 8 for all 256 byte values once', () => {
    const all = new Uint8Array(256);
    for (let i = 0; i < 256; i++) all[i] = i;
    expect(shannonEntropy(all)).toBeCloseTo(8, 5);
  });
  it('verdicts low for plain text', () => {
    const txt = utf8ToBytes(
      'the quick brown fox jumps over the lazy dog '.repeat(20),
    );
    expect(analyzeEntropy(txt).verdict).toBe('low');
  });
});

describe('signatures', () => {
  it('detects PNG', () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0,
    ]);
    expect(matchSignatures(png)[0].ext).toBe('png');
  });
  it('flags a disguised zip named .jpg', () => {
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    const matches = matchSignatures(zip);
    const check = checkExtension('photo.jpg', matches);
    expect(check.mismatch).toBe(true);
  });
  it('treats docx as a legit zip', () => {
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    const check = checkExtension('report.docx', matchSignatures(zip));
    expect(check.mismatch).toBe(false);
  });
});

describe('strings', () => {
  it('extracts ascii runs with offsets', () => {
    const buf = new Uint8Array([0, 0, 72, 101, 108, 108, 111, 0, 1, 2]);
    const found = extractStrings(buf, 4, 'ascii');
    expect(found[0]).toMatchObject({ offset: 2, value: 'Hello' });
  });
  it('extracts utf16le runs', () => {
    const buf = new Uint8Array([72, 0, 105, 0, 33, 0]);
    const found = extractStrings(buf, 3, 'utf16le');
    expect(found[0].value).toBe('Hi!');
  });
});
