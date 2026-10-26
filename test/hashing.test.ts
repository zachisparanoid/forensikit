import { describe, expect, it } from 'vitest';
import {
  createIncrementalHasher,
  hashHexText,
  hashesMatch,
} from '@/lib/crypto/hashing';
import { utf8ToBytes } from '@/lib/encoding';

describe('hash vectors', () => {
  it('MD5', () => {
    expect(hashHexText('MD5', '')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(hashHexText('MD5', 'abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
  });
  it('SHA-1', () => {
    expect(hashHexText('SHA-1', 'abc')).toBe(
      'a9993e364706816aba3e25717850c26c9cd0d89d',
    );
  });
  it('SHA-256', () => {
    expect(hashHexText('SHA-256', '')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(hashHexText('SHA-256', 'abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
  it('SHA-512', () => {
    expect(hashHexText('SHA-512', 'abc')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    );
  });
  it('SHA3-256 / SHA3-512', () => {
    expect(hashHexText('SHA3-256', 'abc')).toBe(
      '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
    );
    expect(hashHexText('SHA3-512', '')).toBe(
      'a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a615b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26',
    );
  });
  it('RIPEMD-160', () => {
    expect(hashHexText('RIPEMD-160', '')).toBe(
      '9c1185a5c5e9fc54612808977ee8f548b2258d31',
    );
    expect(hashHexText('RIPEMD-160', 'abc')).toBe(
      '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc',
    );
  });
});

describe('incremental hashing', () => {
  it('matches one-shot when chunked', () => {
    const h = createIncrementalHasher('SHA-256');
    h.update(utf8ToBytes('ab'));
    h.update(utf8ToBytes('c'));
    expect(h.finalizeHex()).toBe(hashHexText('SHA-256', 'abc'));
  });
});

describe('hashesMatch', () => {
  it('is case-insensitive and trims', () => {
    expect(hashesMatch('  ABC123 ', 'abc123')).toBe(true);
    expect(hashesMatch('abc', 'abd')).toBe(false);
    expect(hashesMatch('', '')).toBe(false);
  });
});
