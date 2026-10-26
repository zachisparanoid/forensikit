import '@testing-library/jest-dom/vitest';

/**
 * jsdom does not implement the Web Crypto SubtleCrypto API used by several
 * tools. Node 20+ exposes a Web-Crypto-compatible implementation on
 * `globalThis.crypto`, so we make sure it is present for tests that exercise
 * crypto.subtle (hashing, AES, PBKDF2, RSA).
 */
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

// jsdom lacks matchMedia; stub it so components reading prefers-reduced-motion
// or theme media queries don't crash in component smoke tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
