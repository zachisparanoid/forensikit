'use client';

import { useState, type ReactNode } from 'react';
import { AlertCircle, ChevronDown, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Responsive two-pane body: side-by-side ≥1024px, stacked below. */
export function ToolGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4 lg:grid-cols-2', className)}>{children}</div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn('rounded-card border border-border bg-card', className)}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          {typeof title === 'string' ? (
            <h2 className="text-sm font-semibold text-text">{title}</h2>
          ) : (
            title
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export function ToolActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-2xs font-semibold uppercase tracking-wider text-muted"
        >
          {label}
        </label>
        {hint && <span className="text-2xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function InlineError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      className="mt-1.5 flex items-start gap-1.5 text-xs text-danger"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-input border border-dashed border-border bg-surface px-4 py-10 text-center">
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {action}
    </div>
  );
}

/** Collapsible "How this works / privacy" disclosure for file-touching tools. */
export function PrivacyNote({
  children,
  title = 'How this works & privacy',
}: {
  children: ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-input border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-secondary hover:text-text"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-success" />
          {title}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2.5 text-xs leading-relaxed text-muted">
          {children}
        </div>
      )}
    </div>
  );
}
