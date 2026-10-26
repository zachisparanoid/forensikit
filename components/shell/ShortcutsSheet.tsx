'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUiStore } from '@/lib/ui-store';

const SHORTCUTS: [string, string][] = [
  ['⌘K / Ctrl+K', 'Open command palette'],
  ['?', 'Show this shortcuts sheet'],
  ['Esc', 'Close palette / dialogs'],
  ['Tab', 'Move between controls'],
  ['Enter', 'Open the highlighted result'],
];

export function ShortcutsSheet() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable ||
          el.tagName === 'SELECT');
      if (e.key === '?' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex animate-fade-in items-center justify-center bg-black/50 px-4"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-sm animate-scale-in rounded-card border border-border bg-card p-5 shadow-raised"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="text-muted hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <dl className="space-y-2">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <dt className="text-sm text-secondary">{desc}</dt>
              <dd>
                <kbd className="rounded border border-border bg-surface px-2 py-1 font-mono text-2xs text-text">
                  {key}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
