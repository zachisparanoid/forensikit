import signaturesData from '../../data/signatures.json';
import { bytesToHex } from '../encoding';
import type { SignatureMatch } from '../types';

interface RawSignature {
  ext: string;
  mime: string;
  description: string;
  /** Lowercase hex; "??" marks a wildcard byte. */
  magic: string;
  offset: number;
}

const SIGNATURES = signaturesData as RawSignature[];

/** Longest magic we might need, so callers know how many bytes to read. */
export const MAX_SIGNATURE_SCAN = 512;

function matchesAt(bytes: Uint8Array, sig: RawSignature): boolean {
  const pat = sig.magic.toLowerCase();
  const byteLen = pat.length / 2;
  if (sig.offset + byteLen > bytes.length) return false;
  for (let i = 0; i < byteLen; i++) {
    const hi = pat[i * 2];
    const lo = pat[i * 2 + 1];
    if (hi === '?' || lo === '?') continue; // wildcard byte
    const expected = parseInt(pat.slice(i * 2, i * 2 + 2), 16);
    if (bytes[sig.offset + i] !== expected) return false;
  }
  return true;
}

export function matchSignatures(bytes: Uint8Array): SignatureMatch[] {
  const out: SignatureMatch[] = [];
  for (const sig of SIGNATURES) {
    if (matchesAt(bytes, sig)) {
      const byteLen = sig.magic.replace(/\?/g, '0').length / 2;
      out.push({
        ext: sig.ext,
        mime: sig.mime,
        description: sig.description,
        offset: sig.offset,
        confidence: byteLen >= 4 ? 'exact' : 'likely',
      });
    }
  }
  // Longer / earlier matches first.
  return out.sort(
    (a, b) =>
      (b.confidence === 'exact' ? 1 : 0) - (a.confidence === 'exact' ? 1 : 0),
  );
}

/** First N bytes as a grouped hex string for display. */
export function leadingHex(bytes: Uint8Array, count = 64): string {
  return bytesToHex(bytes.slice(0, count), ' ');
}

export interface ExtensionCheck {
  declaredExt: string | null;
  matched: SignatureMatch[];
  mismatch: boolean;
  message: string;
}

/**
 * Flags disguised files: a `.jpg` whose header is "PK" (a ZIP/Office doc), etc.
 * This is a classic CTF and malware-triage signal.
 */
export function checkExtension(
  filename: string,
  matches: SignatureMatch[],
): ExtensionCheck {
  const dot = filename.lastIndexOf('.');
  const declaredExt = dot >= 0 ? filename.slice(dot + 1).toLowerCase() : null;

  if (matches.length === 0) {
    return {
      declaredExt,
      matched: [],
      mismatch: false,
      message:
        'No known signature matched the header bytes (unknown or plain data).',
    };
  }

  // Family aliases — a docx is legitimately a ZIP, etc.
  const aliases: Record<string, string[]> = {
    zip: [
      'zip',
      'docx',
      'xlsx',
      'pptx',
      'jar',
      'apk',
      'epub',
      'odt',
      'ods',
      'kmz',
    ],
    doc: ['doc', 'xls', 'ppt', 'msi', 'msg'],
    jpg: ['jpg', 'jpeg', 'jpe'],
    tif: ['tif', 'tiff'],
    mp4: ['mp4', 'm4a', 'm4v', 'mov'],
    exe: ['exe', 'dll', 'sys', 'scr'],
    macho: ['macho', 'dylib', 'o'],
  };

  if (!declaredExt) {
    return {
      declaredExt,
      matched: matches,
      mismatch: false,
      message: `Detected ${matches[0].description}. (No file extension to compare.)`,
    };
  }

  const ok = matches.some((m) => {
    const fam = aliases[m.ext] ?? [m.ext];
    return fam.includes(declaredExt);
  });

  if (ok) {
    return {
      declaredExt,
      matched: matches,
      mismatch: false,
      message: `Extension ".${declaredExt}" is consistent with the detected ${matches[0].description}.`,
    };
  }
  return {
    declaredExt,
    matched: matches,
    mismatch: true,
    message: `⚠ Extension ".${declaredExt}" does NOT match the content (${matches[0].description}). Possible disguised or renamed file.`,
  };
}
