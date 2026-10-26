/**
 * localStorage wrappers, namespaced under `forensikit:`. Every access is guarded
 * so the app degrades silently in private mode / when storage is full or
 * unavailable — favorites & recents simply won't persist, tools keep working.
 * File contents are NEVER persisted; only tool ids and short text inputs.
 */

const NS = 'forensikit:';

function available(): boolean {
  try {
    const k = `${NS}__probe`;
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !available()) return fallback;
  try {
    const raw = localStorage.getItem(NS + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !available()) return;
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or blocked — ignore; persistence is best-effort.
  }
}

export function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(NS + key);
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  favorites: 'favorites',
  recents: 'recents',
  theme: 'theme',
  toolHistory: 'toolHistory',
  historyEnabled: 'historyEnabled',
} as const;

export const MAX_RECENTS = 12;
export const MAX_HISTORY_PER_TOOL = 5;
