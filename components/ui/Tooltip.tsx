'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

/** CSS-driven hover/focus tooltip — no portal, no positioning library. */
export function Tooltip({
  content,
  children,
  side = 'bottom',
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 w-max max-w-xs rounded-md border border-border bg-card px-2.5 py-1.5',
            'animate-fade-in text-xs text-secondary shadow-raised',
            side === 'bottom'
              ? 'left-1/2 top-full mt-2 -translate-x-1/2'
              : 'bottom-full left-1/2 mb-2 -translate-x-1/2',
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
