'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/lib/ui-store';
import { PrivacyBadge } from './PrivacyBadge';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '/tools', label: 'Tools' },
  { href: '/learn', label: 'Learn' },
  { href: '/about', label: 'About' },
];

export function TopBar() {
  const pathname = usePathname();
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const onToolsRoute = pathname?.startsWith('/tools');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="flex h-14 items-center gap-3 px-4">
        {onToolsRoute && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-border text-secondary hover:text-text lg:hidden"
            aria-label="Open tool navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <Link href="/" className="flex items-center gap-2 font-display">
          <span className="flex h-8 w-8 items-center justify-center rounded-btn bg-accent/15 text-accent">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight text-text">
            Forensi<span className="text-accent">Kit</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition',
                pathname?.startsWith(n.href)
                  ? 'text-text'
                  : 'text-secondary hover:text-text',
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="ml-auto flex h-9 max-w-xs flex-1 items-center gap-2 rounded-btn border border-border bg-surface px-3 text-sm text-muted transition hover:border-muted md:ml-2"
          aria-label="Search tools and guides"
        >
          <Search className="h-4 w-4" />
          <span className="hidden flex-1 text-left sm:inline">
            Search tools &amp; guides
          </span>
          <kbd className="hidden rounded border border-border bg-card px-1.5 py-0.5 font-mono text-2xs text-muted sm:inline">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <span className="hidden sm:inline">
            <PrivacyBadge />
          </span>
          <span className="sm:hidden">
            <PrivacyBadge compact />
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
