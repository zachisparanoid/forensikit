'use client';

import { cn } from '@/lib/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  id,
  disabled,
}: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-2 text-sm text-secondary',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          checked ? 'border-accent bg-accent/30' : 'border-border bg-surface',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all',
            checked ? 'left-[18px] bg-accent' : 'left-[2px] bg-muted',
          )}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}
