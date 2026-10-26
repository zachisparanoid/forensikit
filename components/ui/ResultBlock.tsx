import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { CopyButton } from './CopyButton';

interface ResultBlockProps {
  label: string;
  value: string;
  /** Extra trailing content shown after the label (e.g. a bit-length badge). */
  meta?: ReactNode;
  mono?: boolean;
  copy?: boolean;
  className?: string;
  valueClassName?: string;
}

/** Labeled output row: uppercase tracked label + mono value + copy button. */
export function ResultBlock({
  label,
  value,
  meta,
  mono = true,
  copy = true,
  className,
  valueClassName,
}: ResultBlockProps) {
  return (
    <div
      className={cn(
        'rounded-input border border-border bg-surface px-3 py-2',
        className,
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
            {label}
          </span>
          {meta}
        </div>
        {copy && value && <CopyButton value={value} />}
      </div>
      <div
        className={cn(
          'break-all text-13 text-text',
          mono && 'font-mono',
          valueClassName,
        )}
      >
        {value || <span className="text-muted">—</span>}
      </div>
    </div>
  );
}
