'use client';

import { ShieldCheck } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

export function PrivacyBadge({ compact = false }: { compact?: boolean }) {
  return (
    <Tooltip
      content="All tools run in your browser. Files and text are never uploaded."
      side="bottom"
    >
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-2xs font-medium text-success"
        aria-label="Local-only: all processing happens in your browser; nothing is uploaded"
      >
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        {compact ? (
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        ) : (
          'Local-only'
        )}
      </span>
    </Tooltip>
  );
}
