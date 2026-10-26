'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Star, X } from 'lucide-react';
import { TOOLS, getToolById, toolsByCategory } from '@/lib/tool-registry';
import { useAppStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { cn } from '@/lib/cn';
import type { ToolDefinition } from '@/lib/types';

function ToolLink({ tool, active }: { tool: ToolDefinition; active: boolean }) {
  const Icon = tool.icon;
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      onClick={() => setSidebarOpen(false)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-13 transition',
        active
          ? 'bg-accent/15 font-medium text-accent'
          : 'text-secondary hover:bg-surface hover:text-text',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{tool.name}</span>
    </Link>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const favorites = useAppStore((s) => s.favorites);
  const recents = useAppStore((s) => s.recents);
  const hydrated = useAppStore((s) => s.hydrated);
  const categories = toolsByCategory();

  const favTools = favorites
    .map((id) => getToolById(id))
    .filter((t): t is ToolDefinition => Boolean(t));
  const recentTools = recents
    .map((r) => getToolById(r.id))
    .filter((t): t is ToolDefinition => Boolean(t));

  const isActive = (slug: string) => pathname === `/tools/${slug}`;

  return (
    <nav
      className="flex h-full flex-col gap-5 overflow-y-auto p-3"
      aria-label="Tools"
    >
      {hydrated && favTools.length > 0 && (
        <section>
          <p className="mb-1.5 flex items-center gap-1.5 px-2.5 text-2xs font-semibold uppercase tracking-wider text-muted">
            <Star className="h-3 w-3" /> Favorites
          </p>
          <div className="space-y-0.5">
            {favTools.map((t) => (
              <ToolLink key={t.id} tool={t} active={isActive(t.slug)} />
            ))}
          </div>
        </section>
      )}

      {hydrated && recentTools.length > 0 && (
        <section>
          <p className="mb-1.5 flex items-center gap-1.5 px-2.5 text-2xs font-semibold uppercase tracking-wider text-muted">
            <Clock className="h-3 w-3" /> Recent
          </p>
          <div className="space-y-0.5">
            {recentTools.slice(0, 5).map((t) => (
              <ToolLink key={t.id} tool={t} active={isActive(t.slug)} />
            ))}
          </div>
        </section>
      )}

      {categories.map(({ category, tools }) => (
        <section key={category}>
          <p className="mb-1.5 flex items-center justify-between px-2.5 text-2xs font-semibold uppercase tracking-wider text-muted">
            <span>{category}</span>
            <span className="text-muted/70">{tools.length}</span>
          </p>
          <div className="space-y-0.5">
            {tools.map((t) => (
              <ToolLink key={t.id} tool={t} active={isActive(t.slug)} />
            ))}
          </div>
        </section>
      ))}

      <p className="px-2.5 pt-2 text-2xs text-muted/70">
        {TOOLS.length} tools · all local
      </p>
    </nav>
  );
}

export function Sidebar() {
  const open = useUiStore((s) => s.sidebarOpen);
  const setOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden w-[260px] shrink-0 border-r border-border bg-bg lg:block">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile slide-over drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Tool navigation"
        >
          <div
            className="absolute inset-0 animate-fade-in bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[280px] animate-slide-up border-r border-border bg-bg shadow-raised">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-sm font-semibold text-text">Tools</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
