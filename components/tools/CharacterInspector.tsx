'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field, Panel } from '@/components/ui/ToolShell';
import { bytesToHex, utf8ToBytes } from '@/lib/encoding';
import { formatNumber } from '@/lib/format';
import { useDebouncedValue } from '@/lib/hooks';
import { cn } from '@/lib/cn';

// "pаypal​.com" — the 'а' is Cyrillic U+0430 and there is a zero-width space.
const SAMPLE = 'pаypal​.com';

const ZERO_WIDTH = new Set([0x200b, 0x200c, 0x200d, 0xfeff, 0x2060]);
const BIDI = new Set([
  0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069,
]);
const HOMOGLYPHS: Record<number, string> = {
  0x0430: 'Cyrillic а (looks like Latin a)',
  0x0435: 'Cyrillic е (looks like Latin e)',
  0x043e: 'Cyrillic о (looks like Latin o)',
  0x0440: 'Cyrillic р (looks like Latin p)',
  0x0441: 'Cyrillic с (looks like Latin c)',
  0x03bf: 'Greek ο (looks like Latin o)',
};

type Suspicion = 'zero-width' | 'bidi' | 'homoglyph' | null;

function classify(cp: number): Suspicion {
  if (ZERO_WIDTH.has(cp)) return 'zero-width';
  if (BIDI.has(cp)) return 'bidi';
  if (cp in HOMOGLYPHS) return 'homoglyph';
  return null;
}

function category(ch: string): string {
  const cp = ch.codePointAt(0)!;
  if (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f)) return 'Control';
  if (/\s/u.test(ch)) return 'Whitespace';
  if (/\p{L}/u.test(ch)) return 'Letter';
  if (/\p{N}/u.test(ch)) return 'Number';
  if (/\p{P}/u.test(ch)) return 'Punctuation';
  if (/\p{S}/u.test(ch)) return 'Symbol';
  return 'Other';
}

function codePointHex(cp: number): string {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}

function utf16Hex(ch: string): string {
  const units: string[] = [];
  for (let i = 0; i < ch.length; i++) {
    units.push(ch.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'));
  }
  return units.join(' ');
}

function glyph(
  ch: string,
  cp: number,
): { display: string; invisible: boolean } {
  if (ZERO_WIDTH.has(cp)) return { display: '(zero-width)', invisible: true };
  if (BIDI.has(cp)) return { display: '(bidi control)', invisible: true };
  if (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f))
    return { display: '(control)', invisible: true };
  if (ch === ' ') return { display: '␣', invisible: true };
  if (ch === '\t') return { display: '⇥', invisible: true };
  if (ch === '\n') return { display: '↵', invisible: true };
  return { display: ch, invisible: false };
}

export default function CharacterInspector() {
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 150);

  const rows = useMemo(() => {
    const chars = Array.from(debounced);
    return chars.map((ch, index) => {
      const cp = ch.codePointAt(0)!;
      const suspicion = classify(cp);
      const { display, invisible } = glyph(ch, cp);
      return {
        index,
        ch,
        cp,
        display,
        invisible,
        suspicion,
        cpHex: codePointHex(cp),
        cat: category(ch),
        utf8: bytesToHex(utf8ToBytes(ch), ' '),
        utf16: utf16Hex(ch),
        note: cp in HOMOGLYPHS ? HOMOGLYPHS[cp] : undefined,
      };
    });
  }, [debounced]);

  const suspicious = rows.filter((r) => r.suspicion !== null);
  const byteLen = useMemo(() => utf8ToBytes(debounced).length, [debounced]);

  const cleaned = useMemo(
    () =>
      Array.from(debounced)
        .filter((ch) => {
          const cp = ch.codePointAt(0)!;
          return !ZERO_WIDTH.has(cp) && !BIDI.has(cp);
        })
        .join(''),
    [debounced],
  );

  return (
    <div className="space-y-4">
      <Panel
        title="Input"
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={() => setText(SAMPLE)}>
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setText('')}
              disabled={!text}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <Field label="Text to inspect" htmlFor="char-input">
          <TextArea
            id="char-input"
            mono={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text to inspect every code point — useful for spotting hidden or look-alike characters…"
          />
        </Field>
      </Panel>

      {suspicious.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-input border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">
              {formatNumber(suspicious.length)} suspicious character
              {suspicious.length === 1 ? '' : 's'} found
            </p>
            <p className="mt-0.5 text-xs text-danger/90">
              Includes invisible (zero-width / bidi) or look-alike (homoglyph)
              characters often used in phishing and spoofing. Review the
              highlighted rows below.
            </p>
          </div>
        </div>
      )}

      <Panel title="Counts">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="UTF-16 length" value={formatNumber(debounced.length)} />
          <Stat label="Code points" value={formatNumber(rows.length)} />
          <Stat label="UTF-8 bytes" value={formatNumber(byteLen)} />
        </div>
      </Panel>

      <Panel
        title="Code points"
        actions={
          rows.length > 0 ? (
            <CopyButton value={cleaned} label="Copy cleaned" />
          ) : undefined
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted">
            Enter text above to break it down into individual Unicode code
            points.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-13">
              <thead>
                <tr className="border-b border-border text-2xs uppercase tracking-wider text-muted">
                  <th className="px-2 py-1.5">#</th>
                  <th className="px-2 py-1.5">Glyph</th>
                  <th className="px-2 py-1.5">Code point</th>
                  <th className="px-2 py-1.5">Category</th>
                  <th className="px-2 py-1.5">UTF-8</th>
                  <th className="px-2 py-1.5">UTF-16</th>
                  <th className="px-2 py-1.5">Flag</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.index}
                    className={cn(
                      'border-b border-border/60',
                      r.suspicion && 'bg-danger/[0.07]',
                    )}
                  >
                    <td className="px-2 py-1.5 font-mono text-muted">
                      {r.index}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 font-mono',
                        r.invisible ? 'italic text-muted' : 'text-text',
                      )}
                    >
                      {r.display}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-accent">
                      {r.cpHex}
                    </td>
                    <td className="px-2 py-1.5 text-secondary">{r.cat}</td>
                    <td className="px-2 py-1.5 font-mono text-secondary">
                      {r.utf8}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-secondary">
                      {r.utf16}
                    </td>
                    <td className="px-2 py-1.5">
                      {r.suspicion === 'zero-width' && (
                        <Badge tone="danger">zero-width</Badge>
                      )}
                      {r.suspicion === 'bidi' && (
                        <Badge tone="danger">bidi control</Badge>
                      )}
                      {r.suspicion === 'homoglyph' && (
                        <span title={r.note}>
                          <Badge tone="warning">homoglyph</Badge>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-input border border-border bg-surface px-3 py-2">
      <div className="text-2xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm text-text">{value}</div>
    </div>
  );
}
