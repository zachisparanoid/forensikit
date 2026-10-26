import Link from 'next/link';
import { Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-success" />
          All processing happens locally in your browser — nothing is uploaded.
        </p>
        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/tools" className="transition hover:text-text">
            Tools
          </Link>
          <Link href="/learn" className="transition hover:text-text">
            Learn
          </Link>
          <Link href="/about" className="transition hover:text-text">
            About &amp; Privacy
          </Link>
        </nav>
      </div>
      <p className="px-4 pb-5 text-center text-2xs text-muted">
        ForensiKit · For lawful, educational, and authorized investigative use
        only. Not court-certified forensic software.
      </p>
    </footer>
  );
}
