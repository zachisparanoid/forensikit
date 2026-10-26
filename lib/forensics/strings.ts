export interface ExtractedString {
  offset: number;
  value: string;
  encoding: 'ascii' | 'utf16le';
}

function isPrintable(byte: number): boolean {
  // Printable ASCII plus tab. Excludes most control chars.
  return (byte >= 0x20 && byte <= 0x7e) || byte === 0x09;
}

/** GNU strings-style ASCII run extraction. */
export function extractAsciiStrings(
  bytes: Uint8Array,
  minLength = 4,
): ExtractedString[] {
  const out: ExtractedString[] = [];
  let start = -1;
  for (let i = 0; i < bytes.length; i++) {
    if (isPrintable(bytes[i])) {
      if (start === -1) start = i;
    } else {
      if (start !== -1 && i - start >= minLength) {
        out.push({
          offset: start,
          value: bytesToAscii(bytes.subarray(start, i)),
          encoding: 'ascii',
        });
      }
      start = -1;
    }
  }
  if (start !== -1 && bytes.length - start >= minLength) {
    out.push({
      offset: start,
      value: bytesToAscii(bytes.subarray(start, bytes.length)),
      encoding: 'ascii',
    });
  }
  return out;
}

/** UTF-16LE runs: printable ASCII byte followed by 0x00. Common on Windows. */
export function extractUtf16Strings(
  bytes: Uint8Array,
  minLength = 4,
): ExtractedString[] {
  const out: ExtractedString[] = [];
  let start = -1;
  let chars: number[] = [];
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const lo = bytes[i];
    const hi = bytes[i + 1];
    if (hi === 0x00 && isPrintable(lo)) {
      if (start === -1) start = i;
      chars.push(lo);
    } else {
      if (start !== -1 && chars.length >= minLength) {
        out.push({
          offset: start,
          value: String.fromCharCode(...chars),
          encoding: 'utf16le',
        });
      }
      start = -1;
      chars = [];
    }
  }
  if (start !== -1 && chars.length >= minLength) {
    out.push({
      offset: start,
      value: String.fromCharCode(...chars),
      encoding: 'utf16le',
    });
  }
  return out;
}

export function extractStrings(
  bytes: Uint8Array,
  minLength = 4,
  mode: 'ascii' | 'utf16le' | 'both' = 'both',
): ExtractedString[] {
  const out: ExtractedString[] = [];
  if (mode === 'ascii' || mode === 'both')
    out.push(...extractAsciiStrings(bytes, minLength));
  if (mode === 'utf16le' || mode === 'both')
    out.push(...extractUtf16Strings(bytes, minLength));
  return out.sort((a, b) => a.offset - b.offset);
}

function bytesToAscii(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}
