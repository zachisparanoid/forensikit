import { describe, expect, it } from 'vitest';
import {
  DecodeError,
  base32ToBytes,
  base64ToBytes,
  binaryToBytes,
  bytesToBase32,
  bytesToBase64,
  bytesToBinary,
  bytesToHex,
  codePointsToText,
  decimalToBytes,
  hexToBytes,
  htmlDecode,
  htmlEncode,
  textToCodePoints,
  urlDecode,
  utf8ToBytes,
} from '@/lib/encoding';

const enc = (s: string) => utf8ToBytes(s);

describe('base64 (RFC 4648 vectors)', () => {
  const vectors: [string, string][] = [
    ['', ''],
    ['f', 'Zg=='],
    ['fo', 'Zm8='],
    ['foo', 'Zm9v'],
    ['foob', 'Zm9vYg=='],
    ['fooba', 'Zm9vYmE='],
    ['foobar', 'Zm9vYmFy'],
  ];
  it.each(vectors)('encodes %j -> %j', (input, expected) => {
    expect(bytesToBase64(enc(input))).toBe(expected);
  });
  it.each(vectors)('decodes %j', (input, expected) => {
    expect(new TextDecoder().decode(base64ToBytes(expected))).toBe(input);
  });
  it('throws DecodeError with position on bad char', () => {
    try {
      base64ToBytes('Zm9v!Yg');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(DecodeError);
      expect((e as DecodeError).position).toBe(4);
    }
  });
});

describe('base32 (RFC 4648 vectors)', () => {
  const vectors: [string, string][] = [
    ['f', 'MY======'],
    ['fo', 'MZXQ===='],
    ['foo', 'MZXW6==='],
    ['foob', 'MZXW6YQ='],
    ['fooba', 'MZXW6YTB'],
    ['foobar', 'MZXW6YTBOI======'],
  ];
  it.each(vectors)('encodes %j -> %j', (input, expected) => {
    expect(bytesToBase32(enc(input))).toBe(expected);
  });
  it.each(vectors)('decodes %j', (input, expected) => {
    expect(new TextDecoder().decode(base32ToBytes(expected))).toBe(input);
  });
});

describe('hex', () => {
  it('round-trips', () => {
    expect(bytesToHex(enc('abc'))).toBe('616263');
    expect(new TextDecoder().decode(hexToBytes('616263'))).toBe('abc');
  });
  it('tolerates separators and 0x', () => {
    expect(bytesToHex(hexToBytes('0x61 62:63'))).toBe('616263');
  });
  it('rejects odd length and non-hex with position', () => {
    expect(() => hexToBytes('61626')).toThrow(DecodeError);
    try {
      hexToBytes('61zz');
      throw new Error('no throw');
    } catch (e) {
      expect((e as DecodeError).position).toBe(2);
    }
  });
});

describe('binary & decimal', () => {
  it('binary round-trips', () => {
    expect(bytesToBinary(enc('A'))).toBe('01000001');
    expect(new TextDecoder().decode(binaryToBytes('01000001'))).toBe('A');
  });
  it('decimal parses byte lists', () => {
    expect(new TextDecoder().decode(decimalToBytes('72 105'))).toBe('Hi');
  });
  it('rejects out-of-range bytes', () => {
    expect(() => decimalToBytes('300')).toThrow(DecodeError);
  });
});

describe('url & html', () => {
  it('url decodes + as space and percent', () => {
    expect(urlDecode('a%20b+c')).toBe('a b c');
  });
  it('url throws on malformed percent', () => {
    expect(() => urlDecode('%zz')).toThrow(DecodeError);
  });
  it('html encodes and decodes entities', () => {
    expect(htmlEncode('<a href="x">&')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;',
    );
    expect(htmlDecode('&lt;b&gt;&amp;&#65;&#x42;')).toBe('<b>&AB');
  });
});

describe('code points', () => {
  it('round-trips emoji and ascii', () => {
    expect(textToCodePoints('A🙂')).toBe('U+0041 U+1F642');
    expect(codePointsToText('U+0041 U+1F642')).toBe('A🙂');
  });
});
