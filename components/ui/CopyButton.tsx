'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  size?: number;
}

export function CopyButton({
  value,
  label,
  className,
  size = 14,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for blocked Clipboard API / insecure context.
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success('Copied to clipboard');
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error('Copy failed — select the text and copy manually');
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label ?? 'Copy'}
      title={label ?? 'Copy'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted',
        'transition hover:bg-surface hover:text-text',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
        className,
      )}
    >
      {copied ? (
        <Check size={size} className="text-success" />
      ) : (
        <Copy size={size} />
      )}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}
