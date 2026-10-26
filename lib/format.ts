/** Human-readable + forensic timestamp formatting helpers. */

export function bytesToHuman(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB', 'PB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${units[i]}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function groupHex(hex: string, group = 2, separator = ' '): string {
  return (hex.match(new RegExp(`.{1,${group}}`, 'g')) ?? []).join(separator);
}

/* -------------------------------------------------------------------------- */
/*  Forensic timestamp epochs                                                  */
/* -------------------------------------------------------------------------- */

// Seconds between epochs and the Unix epoch (1970-01-01).
const SECONDS_1601_TO_1970 = 11_644_473_600;
const SECONDS_1970_TO_2001 = 978_307_200;
const SECONDS_1904_TO_1970 = 2_082_844_800;

function safeDate(ms: number): Date | null {
  // JS Date supports ±8.64e15 ms from epoch.
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return null;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function unixSecondsToDate(s: number): Date | null {
  return safeDate(s * 1000);
}
export function unixMillisToDate(ms: number): Date | null {
  return safeDate(ms);
}
/** Windows FILETIME: 100-ns ticks since 1601-01-01 UTC. */
export function filetimeToDate(ticks: number): Date | null {
  return safeDate(ticks / 10_000 - SECONDS_1601_TO_1970 * 1000);
}
/** Chrome / WebKit: microseconds since 1601-01-01 UTC. */
export function webkitToDate(micros: number): Date | null {
  return safeDate(micros / 1000 - SECONDS_1601_TO_1970 * 1000);
}
/** Apple Cocoa / CFAbsoluteTime: seconds since 2001-01-01 UTC. */
export function macAbsoluteToDate(s: number): Date | null {
  return safeDate((s + SECONDS_1970_TO_2001) * 1000);
}
/** Classic Mac HFS+: seconds since 1904-01-01. */
export function hfsToDate(s: number): Date | null {
  return safeDate((s - SECONDS_1904_TO_1970) * 1000);
}

export function dateToUnixSeconds(d: Date): number {
  return Math.floor(d.getTime() / 1000);
}

export function isoUtc(d: Date): string {
  return d.toISOString();
}

export function relativeTime(target: number, now = Date.now()): string {
  const diff = target - now;
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [1000 * 60 * 60 * 24 * 365, 'year'],
    [1000 * 60 * 60 * 24 * 30, 'month'],
    [1000 * 60 * 60 * 24 * 7, 'week'],
    [1000 * 60 * 60 * 24, 'day'],
    [1000 * 60 * 60, 'hour'],
    [1000 * 60, 'minute'],
    [1000, 'second'],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [ms, unit] of units) {
    if (abs >= ms || unit === 'second') {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return 'now';
}

/** Seconds → "3 years", "2 days", "5 minutes" for crack-time estimates. */
export function humanizeSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'effectively forever';
  if (seconds < 1e-3) return 'instantly';
  if (seconds < 1) return 'less than a second';
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
    [100, 'year'],
    [10, 'century'],
    [10, 'millennium'],
  ];
  let value = seconds;
  let label = 'second';
  for (let i = 0; i < units.length; i++) {
    const [factor, name] = units[i];
    if (value < factor || i === units.length - 1) {
      label = name;
      break;
    }
    value /= factor;
    label = units[i + 1][1];
  }
  if (value >= 1e6) return 'effectively forever';
  const rounded = Math.round(value);
  const plural = rounded === 1 ? label : `${label}s`;
  return `${formatNumber(rounded)} ${plural}`;
}
