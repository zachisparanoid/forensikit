import { describe, expect, it } from 'vitest';
import { hmacHex } from '@/lib/crypto/hmac';
import { utf8ToBytes } from '@/lib/encoding';

describe('HMAC (RFC 4231)', () => {
  it('HMAC-SHA256 test case 1', () => {
    const key = new Uint8Array(20).fill(0x0b);
    const data = utf8ToBytes('Hi There');
    expect(hmacHex('SHA-256', data, key)).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    );
  });
  it('HMAC-SHA256 with "Jefe" key', () => {
    const key = utf8ToBytes('Jefe');
    const data = utf8ToBytes('what do ya want for nothing?');
    expect(hmacHex('SHA-256', data, key)).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    );
  });
  it('HMAC-SHA1 with "Jefe" key', () => {
    const key = utf8ToBytes('Jefe');
    const data = utf8ToBytes('what do ya want for nothing?');
    expect(hmacHex('SHA-1', data, key)).toBe(
      'effcdf6ae5eb2fa2d27416d5f184df9c259a7c79',
    );
  });
});
