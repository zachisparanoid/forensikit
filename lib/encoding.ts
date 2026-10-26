/**
 * Pure, dependency-free byte<->text encoders. Every decoder throws a
 * {@link DecodeError} carrying the offending character position so the UI can
 * surface "Not valid Base64 at position 14" instead of a blank failure.
 *
 * Convention: all functions operate on Uint8Array at the binary boundary and
 * String at the text boundary. We never assume Node Buffer or browser atob so
 * the same code runs identically in tests, SSR build, and the browser.
 */

export class DecodeError extends Error {
  /** Zero-based character index where decoding failed, or -1 if unknown. */
  position: number;
  constructor(message: string, position = -1) {
    super(message);
    this.name = 'DecodeError';
    this.position = position;
  }
}

const textEncoder = new TextEncoder();

export function utf8ToBytes(str: string): Uint8Array {
  return textEncoder.encode(str);
}

export function bytesToUtf8(bytes: Uint8Array, fatal = false): string {
  return new TextDecoder('utf-8', { fatal }).decode(bytes);
}

/** Latin-1 / ISO-8859-1: one byte per char, 0-255. */
export function latin1ToBytes(str: string): Uint8Array {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 0xff) {
      throw new DecodeError(
        `Character "${str[i]}" at position ${i} is not Latin-1 (code > 255)`,
        i,
      );
    }
    out[i] = code;
  }
  return out;
}

export function bytesToLatin1(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/* -------------------------------------------------------------------------- */
/*  Hex                                                                        */
/* -------------------------------------------------------------------------- */

const HEX = '0123456789abcdef';

export function bytesToHex(bytes: Uint8Array, separator = ''): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 0x0f];
    if (separator && i < bytes.length - 1) out += separator;
  }
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  // Tolerate whitespace, 0x prefixes and common separators.
  const clean = hex.replace(/0x/gi, '').replace(/[\s:,-]/g, '');
  if (clean.length % 2 !== 0) {
    throw new DecodeError(
      `Hex string has an odd number of digits (${clean.length})`,
      clean.length - 1,
    );
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    const hi = parseInt(clean[i], 16);
    const lo = parseInt(clean[i + 1], 16);
    if (Number.isNaN(hi)) {
      throw new DecodeError(`"${clean[i]}" is not a hex digit`, i);
    }
    if (Number.isNaN(lo)) {
      throw new DecodeError(`"${clean[i + 1]}" is not a hex digit`, i + 1);
    }
    out[i / 2] = (hi << 4) | lo;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Base64 / Base64URL                                                        */
/* -------------------------------------------------------------------------- */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP: Record<string, number> = {};
for (let i = 0; i < B64.length; i++) B64_LOOKUP[B64[i]] = i;

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out +=
      B64[(n >> 18) & 63] +
      B64[(n >> 12) & 63] +
      B64[(n >> 6) & 63] +
      B64[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + '==';
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + '=';
  }
  return out;
}

export function base64ToBytes(b64: string): Uint8Array {
  // Accept both standard and URL-safe alphabets, ignore whitespace.
  const clean = b64.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const noPad = clean.replace(/=+$/, '');
  for (let i = 0; i < noPad.length; i++) {
    if (!(noPad[i] in B64_LOOKUP)) {
      throw new DecodeError(
        `Invalid Base64 character "${noPad[i]}" at position ${i}`,
        i,
      );
    }
  }
  const byteLen = Math.floor((noPad.length * 6) / 8);
  const out = new Uint8Array(byteLen);
  let bits = 0;
  let acc = 0;
  let p = 0;
  for (let i = 0; i < noPad.length; i++) {
    acc = (acc << 6) | B64_LOOKUP[noPad[i]];
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[p++] = (acc >> bits) & 0xff;
    }
  }
  return out;
}

export function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return toBase64Url(bytesToBase64(bytes));
}

/* -------------------------------------------------------------------------- */
/*  Base32 (RFC 4648)                                                          */
/* -------------------------------------------------------------------------- */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const B32_LOOKUP: Record<string, number> = {};
for (let i = 0; i < B32.length; i++) B32_LOOKUP[B32[i]] = i;

export function bytesToBase32(bytes: Uint8Array): string {
  let out = '';
  let bits = 0;
  let acc = 0;
  for (let i = 0; i < bytes.length; i++) {
    acc = (acc << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32[(acc >> bits) & 31];
    }
  }
  if (bits > 0) out += B32[(acc << (5 - bits)) & 31];
  while (out.length % 8 !== 0) out += '=';
  return out;
}

export function base32ToBytes(b32: string): Uint8Array {
  const clean = b32.replace(/\s/g, '').replace(/=+$/, '').toUpperCase();
  const out: number[] = [];
  let bits = 0;
  let acc = 0;
  for (let i = 0; i < clean.length; i++) {
    const v = B32_LOOKUP[clean[i]];
    if (v === undefined) {
      throw new DecodeError(
        `Invalid Base32 character "${clean[i]}" at position ${i}`,
        i,
      );
    }
    acc = (acc << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

/* -------------------------------------------------------------------------- */
/*  Binary / Decimal byte lists                                               */
/* -------------------------------------------------------------------------- */

export function bytesToBinary(bytes: Uint8Array, separator = ' '): string {
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, '0'))
    .join(separator);
}

export function binaryToBytes(bin: string): Uint8Array {
  const clean = bin.replace(/\s/g, '');
  if (!/^[01]*$/.test(clean)) {
    const pos = clean.search(/[^01]/);
    throw new DecodeError(`"${clean[pos]}" is not a binary digit`, pos);
  }
  if (clean.length % 8 !== 0) {
    throw new DecodeError(
      `Binary length ${clean.length} is not a multiple of 8`,
      clean.length - 1,
    );
  }
  const out = new Uint8Array(clean.length / 8);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 8, i * 8 + 8), 2);
  }
  return out;
}

export function bytesToDecimal(bytes: Uint8Array, separator = ' '): string {
  return Array.from(bytes).join(separator);
}

export function decimalToBytes(dec: string): Uint8Array {
  const parts = dec
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  const out = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) {
    const n = Number(parts[i]);
    if (!Number.isInteger(n) || n < 0 || n > 255) {
      throw new DecodeError(`"${parts[i]}" is not a byte value (0-255)`, i);
    }
    out[i] = n;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  URL & HTML entities                                                       */
/* -------------------------------------------------------------------------- */

export function urlEncode(str: string): string {
  return encodeURIComponent(str);
}

export function urlDecode(str: string): string {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch {
    const m = /%(?![0-9a-fA-F]{2})/.exec(str);
    throw new DecodeError(
      'Malformed percent-encoding (a % must be followed by two hex digits)',
      m ? m.index : -1,
    );
  }
}

const HTML_NAMED: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function htmlEncode(str: string): string {
  let out = '';
  for (const ch of str) {
    if (HTML_NAMED[ch]) out += HTML_NAMED[ch];
    else if (ch.codePointAt(0)! > 127) out += `&#${ch.codePointAt(0)};`;
    else out += ch;
  }
  return out;
}

const HTML_NAMED_DECODE: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
};

export function htmlDecode(str: string): string {
  return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (full, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    return HTML_NAMED_DECODE[body] ?? full;
  });
}

/* -------------------------------------------------------------------------- */
/*  Unicode code points                                                        */
/* -------------------------------------------------------------------------- */

export function textToCodePoints(str: string, prefix = 'U+'): string {
  return Array.from(str)
    .map(
      (ch) =>
        prefix + ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'),
    )
    .join(' ');
}

export function codePointsToText(input: string): string {
  const parts = input
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  let out = '';
  for (let i = 0; i < parts.length; i++) {
    const hex = parts[i].replace(/^(U\+|0x|\\u)/i, '');
    const code = parseInt(hex, 16);
    if (Number.isNaN(code) || code > 0x10ffff) {
      throw new DecodeError(`"${parts[i]}" is not a valid code point`, i);
    }
    out += String.fromCodePoint(code);
  }
  return out;
}
