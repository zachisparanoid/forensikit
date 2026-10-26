'use client';

import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useMounted } from '@/lib/hooks';

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const mounted = useMounted();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-border text-secondary transition hover:bg-surface hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      {/* Avoid hydration mismatch: render a stable icon until mounted. */}
      {!mounted ? (
        <Moon className="h-4 w-4" />
      ) : theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
