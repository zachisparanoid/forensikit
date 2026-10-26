'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const ROW_HEIGHT = 22;
const BYTES_PER_ROW = 16;
const OVERSCAN = 6;

export interface HexHighlight {
  start: number;
  end: number; // exclusive
}

interface HexViewProps {
  bytes: Uint8Array;
  height?: number;
  highlights?: HexHighlight[];
  /** Scroll so this byte offset is visible (and briefly selected). */
  scrollToOffset?: number | null;
  className?: string;
}

function inHighlights(index: number, ranges: HexHighlight[]): boolean {
  for (const r of ranges) if (index >= r.start && index < r.end) return true;
  return false;
}

export function HexView({
  bytes,
  height = 420,
  highlights = [],
  scrollToOffset,
  className,
}: HexViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  const totalRows = Math.ceil(bytes.length / BYTES_PER_ROW);
  const viewportRows = Math.ceil(height / ROW_HEIGHT);
  const firstRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const lastRow = Math.min(totalRows, firstRow + viewportRows + OVERSCAN * 2);

  useEffect(() => {
    if (scrollToOffset == null || !scrollRef.current) return;
    const row = Math.floor(scrollToOffset / BYTES_PER_ROW);
    scrollRef.current.scrollTop = row * ROW_HEIGHT;
  }, [scrollToOffset]);

  const rows = useMemo(() => {
    const out: number[] = [];
    for (let r = firstRow; r < lastRow; r++) out.push(r);
    return out;
  }, [firstRow, lastRow]);

  const highlightIndex = scrollToOffset ?? hover;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-card border border-border bg-surface',
        className,
      )}
    >
      {/* Sticky header */}
      <div className="flex border-b border-border bg-card px-3 py-1.5 font-mono text-2xs text-muted">
        <span className="w-[80px] shrink-0">OFFSET</span>
        <span className="flex-1">HEX</span>
        <span className="w-[150px] shrink-0 pl-3">ASCII</span>
      </div>
      <div
        ref={scrollRef}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        className="overflow-auto font-mono text-13"
        style={{ height }}
      >
        <div style={{ height: totalRows * ROW_HEIGHT, position: 'relative' }}>
          {rows.map((row) => {
            const base = row * BYTES_PER_ROW;
            const slice = bytes.subarray(base, base + BYTES_PER_ROW);
            return (
              <div
                key={row}
                className={cn(
                  'absolute flex w-full items-center px-3',
                  row % 2 === 1 && 'bg-white/[0.02]',
                )}
                style={{ top: row * ROW_HEIGHT, height: ROW_HEIGHT }}
              >
                <span className="w-[80px] shrink-0 select-none text-muted">
                  {base.toString(16).padStart(8, '0')}
                </span>
                <span className="flex-1 whitespace-pre">
                  {Array.from(slice).map((b, i) => {
                    const idx = base + i;
                    return (
                      <span
                        key={i}
                        onMouseEnter={() => setHover(idx)}
                        onMouseLeave={() => setHover(null)}
                        className={cn(
                          'px-[1px]',
                          i === 8 && 'ml-2',
                          idx === highlightIndex && 'bg-accent/30',
                          inHighlights(idx, highlights) && 'match-highlight',
                        )}
                      >
                        {b.toString(16).padStart(2, '0')}{' '}
                      </span>
                    );
                  })}
                </span>
                <span className="w-[150px] shrink-0 whitespace-pre pl-3 text-secondary">
                  {Array.from(slice).map((b, i) => {
                    const idx = base + i;
                    const printable = b >= 0x20 && b <= 0x7e;
                    return (
                      <span
                        key={i}
                        onMouseEnter={() => setHover(idx)}
                        onMouseLeave={() => setHover(null)}
                        className={cn(
                          idx === highlightIndex && 'bg-accent/30',
                          inHighlights(idx, highlights) && 'match-highlight',
                          !printable && 'text-muted',
                        )}
                      >
                        {printable ? String.fromCharCode(b) : '·'}
                      </span>
                    );
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
