'use client';

import { cn } from '@/lib/cn';

interface TabsProps<T extends string> {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-input border border-border bg-surface p-1',
        className,
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
            value === t.value
              ? 'bg-accent/15 text-accent'
              : 'text-secondary hover:text-text',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
