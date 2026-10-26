'use client';

import { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ReactNode } from 'react';

/** MDX <pre> override: a copyable reference snippet (illustrative, not run). */
export function CodeBlock({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = ref.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy snippet"
        className="absolute right-2 top-2 z-10 rounded-md border border-border bg-card p-1.5 text-muted opacity-0 transition hover:text-text focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}
