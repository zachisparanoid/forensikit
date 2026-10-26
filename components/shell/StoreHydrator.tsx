'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

/** Loads persisted state from localStorage once, after mount. Renders nothing. */
export function StoreHydrator() {
  useEffect(() => {
    useAppStore.getState().hydrate();
  }, []);
  return null;
}
