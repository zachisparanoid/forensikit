import { describe, expect, it } from 'vitest';
import {
  atbash,
  caesarAllShifts,
  caesarShift,
  morseToText,
  rot13,
  textToMorse,
  vigenere,
  xorBytes,
} from '@/lib/crypto/classical';

describe('caesar / rot13 / atbash', () => {
  it('shifts and preserves case + punctuation', () => {
    expect(caesarShift('Abc, Xyz!', 3)).toBe('Def, Abc!');
    expect(caesarShift('Def', -3)).toBe('Abc');
  });
  it('rot13 is its own inverse', () => {
    expect(rot13('Hello, World!')).toBe('Uryyb, Jbeyq!');
    expect(rot13(rot13('Anything'))).toBe('Anything');
  });
  it('atbash maps a<->z', () => {
    expect(atbash('abc')).toBe('zyx');
    expect(atbash(atbash('Forensics'))).toBe('Forensics');
  });
  it('produces all 26 shifts', () => {
    const all = caesarAllShifts('abc');
    expect(all).toHaveLength(26);
    expect(all[0].text).toBe('abc');
    expect(all[25].text).toBe('zab');
  });
});

describe('vigenere', () => {
  it('matches the classic ATTACKATDAWN/LEMON vector', () => {
    expect(vigenere('ATTACKATDAWN', 'LEMON', 'encrypt')).toBe('LXFOPVEFRNHR');
    expect(vigenere('LXFOPVEFRNHR', 'LEMON', 'decrypt')).toBe('ATTACKATDAWN');
  });
  it('preserves non-alpha and case', () => {
    const ct = vigenere('Hello, World!', 'key', 'encrypt');
    expect(vigenere(ct, 'key', 'decrypt')).toBe('Hello, World!');
  });
});

describe('xor', () => {
  it('is symmetric with a repeating key', () => {
    const data = new TextEncoder().encode('secret message');
    const key = new TextEncoder().encode('k3y');
    const round = xorBytes(xorBytes(data, key), key);
    expect(new TextDecoder().decode(round)).toBe('secret message');
  });
});

describe('morse', () => {
  it('encodes and decodes round-trip', () => {
    expect(textToMorse('SOS')).toBe('... --- ...');
    expect(textToMorse('HELLO WORLD')).toBe(
      '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    );
    expect(morseToText('.... . .-.. .-.. --- / .-- --- .-. .-.. -..')).toBe(
      'HELLO WORLD',
    );
  });
});
