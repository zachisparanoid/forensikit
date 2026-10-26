/**
 * Classical / pre-modern ciphers. All alphabetic transforms preserve case and
 * pass non-alphabetic characters through untouched, which is what makes them
 * usable on real CTF text and quotations.
 */

const A = 'a'.charCodeAt(0);
const Z = 'z'.charCodeAt(0);
const UA = 'A'.charCodeAt(0);
const UZ = 'Z'.charCodeAt(0);

export function caesarShift(text: string, shift: number): string {
  const s = ((shift % 26) + 26) % 26;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= A && c <= Z) out += String.fromCharCode(((c - A + s) % 26) + A);
    else if (c >= UA && c <= UZ)
      out += String.fromCharCode(((c - UA + s) % 26) + UA);
    else out += text[i];
  }
  return out;
}

export function caesarAllShifts(
  text: string,
): { shift: number; text: string }[] {
  return Array.from({ length: 26 }, (_, shift) => ({
    shift,
    text: caesarShift(text, shift),
  }));
}

export function rot13(text: string): string {
  return caesarShift(text, 13);
}

export function atbash(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= A && c <= Z) out += String.fromCharCode(Z - (c - A));
    else if (c >= UA && c <= UZ) out += String.fromCharCode(UZ - (c - UA));
    else out += text[i];
  }
  return out;
}

export function vigenere(
  text: string,
  key: string,
  mode: 'encrypt' | 'decrypt' = 'encrypt',
): string {
  const cleanKey = key.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (cleanKey.length === 0) return text;
  let out = '';
  let k = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const isLower = c >= A && c <= Z;
    const isUpper = c >= UA && c <= UZ;
    if (!isLower && !isUpper) {
      out += text[i];
      continue;
    }
    const base = isLower ? A : UA;
    let shift = cleanKey.charCodeAt(k % cleanKey.length) - A;
    if (mode === 'decrypt') shift = 26 - shift;
    out += String.fromCharCode(((c - base + shift) % 26) + base);
    k++;
  }
  return out;
}

/** Repeating-key XOR over raw bytes (symmetric: same call decrypts). */
export function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length === 0) return data.slice();
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ key[i % key.length];
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Morse code                                                                 */
/* -------------------------------------------------------------------------- */

const MORSE_MAP: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
};

const MORSE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k]),
);

export function textToMorse(text: string): string {
  return text
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .map((word) =>
      Array.from(word)
        .map((ch) => MORSE_MAP[ch] ?? '')
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
    .join(' / ');
}

export function morseToText(morse: string): string {
  return morse
    .trim()
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .map((sym) => MORSE_REVERSE[sym] ?? (sym ? '?' : ''))
        .join(''),
    )
    .join(' ')
    .trim();
}

/** Used by the Morse tool to render dots/dashes and to schedule audio beeps. */
export function morseTimingUnits(morse: string): ('dot' | 'dash' | 'gap')[] {
  const seq: ('dot' | 'dash' | 'gap')[] = [];
  for (const ch of morse) {
    if (ch === '.') seq.push('dot');
    else if (ch === '-') seq.push('dash');
    else seq.push('gap');
  }
  return seq;
}
