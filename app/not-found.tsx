import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-5xl font-bold text-accent">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-text">
        That page isn&apos;t here
      </h1>
      <p className="mt-2 text-sm text-secondary">
        The tool or guide you&apos;re looking for doesn&apos;t exist. Try the
        command palette (press ⌘K / Ctrl+K) or jump back in below.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:bg-accent-strong"
        >
          <Home className="h-4 w-4" /> Home
        </Link>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 rounded-btn border border-border px-4 py-2 text-sm text-text transition hover:bg-surface"
        >
          <Compass className="h-4 w-4" /> Browse tools
        </Link>
      </div>
    </div>
  );
}
