import commonPasswords from '../data/common-passwords.json';
import { humanizeSeconds } from './format';
import type { PasswordReport } from './types';

/**
 * A pragmatic, fully offline password strength estimator. It is intentionally
 * conservative: it combines a charset-based entropy estimate with pattern and
 * dictionary penalties (a zxcvbn-flavoured heuristic) rather than claiming a
 * single "true" entropy, which no estimator can know.
 */

const COMMON = new Set(
  (commonPasswords as string[]).map((p) => p.trim().toLowerCase()),
);

export function isCommonPassword(pw: string): boolean {
  return COMMON.has(pw.trim().toLowerCase());
}

function charsetSize(pw: string): number {
  let size = 0;
  if (/[a-z]/.test(pw)) size += 26;
  if (/[A-Z]/.test(pw)) size += 26;
  if (/[0-9]/.test(pw)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) size += 33; // printable symbols + space
  return size || 1;
}

/** Detects trivial structure that inflates a naive entropy estimate. */
function patternPenalty(pw: string): {
  bitsFactor: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  let factor = 1;

  if (/^(.)\1+$/.test(pw)) {
    warnings.push('Repeated single character.');
    factor *= 0.2;
  }
  if (/(.)\1{2,}/.test(pw)) {
    warnings.push('Contains a run of 3+ repeated characters.');
    factor *= 0.7;
  }
  if (isSequential(pw)) {
    warnings.push('Contains a sequential run (e.g. "1234" or "abcd").');
    factor *= 0.6;
  }
  if (/^[a-zA-Z]+\d{1,4}$/.test(pw)) {
    warnings.push(
      'Looks like a word followed by digits — a very common pattern.',
    );
    factor *= 0.7;
  }
  return { bitsFactor: factor, warnings };
}

function isSequential(pw: string): boolean {
  const lower = pw.toLowerCase();
  let asc = 1;
  let desc = 1;
  for (let i = 1; i < lower.length; i++) {
    const diff = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
    asc = diff === 1 ? asc + 1 : 1;
    desc = diff === -1 ? desc + 1 : 1;
    if (asc >= 4 || desc >= 4) return true;
  }
  return false;
}

const ATTACK_SPEEDS = {
  onlineThrottled: 100, // 100 guesses/sec
  offlineSlowHash: 1e4, // bcrypt-style
  offlineFastHash: 1e10, // GPU vs unsalted MD5/SHA1
} as const;

export function crackTimes(
  guesses: number,
): Record<keyof typeof ATTACK_SPEEDS, string> {
  return {
    onlineThrottled: humanizeSeconds(guesses / ATTACK_SPEEDS.onlineThrottled),
    offlineSlowHash: humanizeSeconds(guesses / ATTACK_SPEEDS.offlineSlowHash),
    offlineFastHash: humanizeSeconds(guesses / ATTACK_SPEEDS.offlineFastHash),
  };
}

export function analyzePassword(pw: string): PasswordReport {
  if (pw.length === 0) {
    return {
      score: 0,
      entropyBits: 0,
      guessesLog10: 0,
      crackTimeText: 'instantly',
      warnings: ['Empty password.'],
      suggestions: [
        'Use at least 12 characters mixing types, or a passphrase.',
      ],
      inDictionary: false,
    };
  }

  const inDictionary = isCommonPassword(pw);
  const baseBits = pw.length * Math.log2(charsetSize(pw));
  const { bitsFactor, warnings } = patternPenalty(pw);
  let entropyBits = baseBits * bitsFactor;

  if (inDictionary) {
    warnings.unshift(
      'This is one of the most common passwords — cracked instantly.',
    );
    entropyBits = Math.min(entropyBits, 8);
  }

  const suggestions: string[] = [];
  if (pw.length < 12) suggestions.push('Use at least 12–16 characters.');
  if (!/[A-Z]/.test(pw)) suggestions.push('Add uppercase letters.');
  if (!/[0-9]/.test(pw)) suggestions.push('Add digits.');
  if (!/[^a-zA-Z0-9]/.test(pw)) suggestions.push('Add symbols.');
  if (suggestions.length === 0 && entropyBits >= 80)
    suggestions.push('Strong. Use a password manager and never reuse it.');
  if (suggestions.length === 0)
    suggestions.push('Consider a longer random passphrase for extra margin.');

  // NIST-flavoured score bands by effective entropy.
  let score: PasswordReport['score'];
  if (inDictionary || entropyBits < 28) score = 0;
  else if (entropyBits < 36) score = 1;
  else if (entropyBits < 60) score = 2;
  else if (entropyBits < 90) score = 3;
  else score = 4;

  const guesses = Math.pow(2, entropyBits) / 2; // expected guesses ~ half the space
  const guessesLog10 = entropyBits * Math.LOG10E * Math.LN2 - Math.log10(2);

  return {
    score,
    entropyBits: Math.round(entropyBits * 10) / 10,
    guessesLog10: Math.round(guessesLog10 * 10) / 10,
    crackTimeText: humanizeSeconds(guesses / ATTACK_SPEEDS.offlineFastHash),
    warnings,
    suggestions,
    inDictionary,
  };
}

export const SCORE_LABELS = [
  'Very weak',
  'Weak',
  'Fair',
  'Strong',
  'Very strong',
];
