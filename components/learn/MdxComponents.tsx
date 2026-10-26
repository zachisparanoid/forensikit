import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Info,
  Lightbulb,
  ListChecks,
  ShieldAlert,
} from 'lucide-react';
import { CodeBlock } from './CodeBlock';

type CalloutType = 'note' | 'tip' | 'warning' | 'danger';

const CALLOUT: Record<
  CalloutType,
  { icon: typeof Info; cls: string; label: string }
> = {
  note: {
    icon: Info,
    cls: 'border-info/40 bg-info/10 text-info',
    label: 'Note',
  },
  tip: {
    icon: Lightbulb,
    cls: 'border-success/40 bg-success/10 text-success',
    label: 'Tip',
  },
  warning: {
    icon: AlertTriangle,
    cls: 'border-warning/40 bg-warning/10 text-warning',
    label: 'Warning',
  },
  danger: {
    icon: ShieldAlert,
    cls: 'border-danger/40 bg-danger/10 text-danger',
    label: 'Caution',
  },
};

export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const { icon: Icon, cls, label } = CALLOUT[type];
  return (
    <div className={`my-4 rounded-card border px-4 py-3 ${cls}`}>
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" />
        {title ?? label}
      </p>
      <div className="text-sm leading-relaxed text-secondary [&_a]:text-current [&_a]:underline">
        {children}
      </div>
    </div>
  );
}

export function KeyTakeaways({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 rounded-card border border-accent/30 bg-accent/[0.06] px-4 py-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
        <ListChecks className="h-4 w-4" />
        Key takeaways
      </p>
      <div className="text-sm text-secondary [&_ul]:my-0">{children}</div>
    </div>
  );
}

export const mdxComponents = {
  Callout,
  KeyTakeaways,
  pre: CodeBlock,
  a: ({
    href = '#',
    children,
    ...props
  }: {
    href?: string;
    children?: ReactNode;
  }) =>
    href.startsWith('/') ? (
      <Link href={href} {...props}>
        {children}
      </Link>
    ) : (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
};
