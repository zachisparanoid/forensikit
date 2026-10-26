import { describe, expect, it } from 'vitest';
import { analyzePassword, isCommonPassword } from '@/lib/password';
import {
  bytesToHuman,
  filetimeToDate,
  humanizeSeconds,
  macAbsoluteToDate,
  unixSecondsToDate,
  webkitToDate,
} from '@/lib/format';

describe('password analyzer', () => {
  it('rates a common password as very weak', () => {
    const r = analyzePassword('password');
    expect(r.inDictionary).toBe(true);
    expect(r.score).toBe(0);
  });
  it('rates a long random passphrase highly', () => {
    const r = analyzePassword('correct-horse-Battery9-staple!Q');
    expect(r.score).toBeGreaterThanOrEqual(3);
  });
  it('detects sequences', () => {
    const r = analyzePassword('abcd1234');
    expect(r.warnings.join(' ')).toMatch(/sequential|digits/i);
  });
  it('isCommonPassword is case-insensitive', () => {
    expect(isCommonPassword('PASSWORD')).toBe(true);
    expect(isCommonPassword('zzx-not-common-x99')).toBe(false);
  });
});

describe('format helpers', () => {
  it('bytesToHuman', () => {
    expect(bytesToHuman(0)).toBe('0 B');
    expect(bytesToHuman(1024)).toBe('1.00 KB');
    expect(bytesToHuman(1536)).toBe('1.50 KB');
    expect(bytesToHuman(5 * 1024 * 1024)).toBe('5.00 MB');
  });
  it('humanizeSeconds', () => {
    expect(humanizeSeconds(0)).toBe('instantly');
    expect(humanizeSeconds(45)).toMatch(/second/);
    expect(humanizeSeconds(3600)).toMatch(/hour/);
  });
});

describe('forensic timestamps', () => {
  it('unix epoch 0 is 1970-01-01', () => {
    expect(unixSecondsToDate(0)?.toISOString()).toBe(
      '1970-01-01T00:00:00.000Z',
    );
  });
  it('FILETIME for 1970-01-01 is 116444736000000000', () => {
    expect(filetimeToDate(116444736000000000)?.toISOString()).toBe(
      '1970-01-01T00:00:00.000Z',
    );
  });
  it('WebKit 13256659200000000 ≈ 2021-01-01', () => {
    const d = webkitToDate(13256659200000000);
    expect(d?.getUTCFullYear()).toBe(2021);
  });
  it('Mac absolute 0 is 2001-01-01', () => {
    expect(macAbsoluteToDate(0)?.toISOString()).toBe(
      '2001-01-01T00:00:00.000Z',
    );
  });
  it('handles overflow without NaN', () => {
    expect(filetimeToDate(Number.MAX_VALUE)).toBeNull();
  });
});
