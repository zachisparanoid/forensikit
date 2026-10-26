'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Badge } from '@/components/ui/Badge';
import { Field, EmptyState, Panel } from '@/components/ui/ToolShell';
import { useDebouncedValue } from '@/lib/hooks';

const SAMPLE =
  'The quick brown fox jumps over the lazy dog. Pack my box with five dozen ' +
  'liquor jugs. How vexingly quick daft zebras jump! The five boxing wizards ' +
  'jump quickly, and the lazy dog watches from the porch.';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Analysis {
  counts: Record<string, number>;
  total: number;
  ic: number;
  most: string[];
  least: string[];
  max: number;
}

function analyze(text: string): Analysis {
  const counts: Record<string, number> = {};
  for (const l of ALPHABET) counts[l] = 0;
  let total = 0;
  for (const ch of text.toUpperCase()) {
    if (ch >= 'A' && ch <= 'Z') {
      counts[ch]++;
      total++;
    }
  }
  let sum = 0;
  for (const l of ALPHABET) sum += counts[l] * (counts[l] - 1);
  const ic = total > 1 ? sum / (total * (total - 1)) : 0;

  const present = ALPHABET.filter((l) => counts[l] > 0);
  const max = Math.max(0, ...ALPHABET.map((l) => counts[l]));
  const min = present.length ? Math.min(...present.map((l) => counts[l])) : 0;
  const most = present.filter((l) => counts[l] === max);
  const least = present.filter((l) => counts[l] === min);

  return { counts, total, ic, most, least, max };
}

function interpretIc(ic: number): {
  tone: 'success' | 'warning' | 'info';
  text: string;
} {
  if (ic >= 0.06) {
    return {
      tone: 'success',
      text: 'IC ≈ 0.066 territory — letter frequencies look English-like. This points to a monoalphabetic substitution or transposition cipher (or plaintext), where the underlying letter distribution is preserved.',
    };
  }
  if (ic >= 0.038 && ic <= 0.045) {
    return {
      tone: 'warning',
      text: 'IC ≈ 0.038–0.045 — the distribution looks flattened. This suggests a polyalphabetic cipher (e.g. Vigenère) or random data, where multiple alphabets smooth out the frequencies.',
    };
  }
  return {
    tone: 'info',
    text: 'IC falls between the typical English (≈0.066) and polyalphabetic/random (≈0.038) values — the sample may be short, or a mix. More ciphertext gives a more reliable reading.',
  };
}

export default function FrequencyAnalyzer() {
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 150);

  const result = useMemo(() => analyze(debounced), [debounced]);
  const interpretation = useMemo(() => interpretIc(result.ic), [result.ic]);

  return (
    <div className="space-y-4">
      <Panel
        title="Ciphertext"
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
        <Field label="Text" htmlFor="freq-input">
          <TextArea
            id="freq-input"
            mono={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste ciphertext to analyze its letter frequencies…"
          />
        </Field>
      </Panel>

      {result.total === 0 ? (
        <Panel title="Analysis">
          <EmptyState
            message="Enter or paste some text containing letters to see its A–Z frequency distribution and Index of Coincidence."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setText(SAMPLE)}
              >
                <FileText className="h-3.5 w-3.5" /> Load sample
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <Panel title="Summary">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Letters" value={result.total.toLocaleString()} />
              <Stat label="Index of Coincidence" value={result.ic.toFixed(4)} />
              <Stat
                label="Most frequent"
                value={result.most.join(', ') || '—'}
              />
              <Stat
                label="Least frequent"
                value={result.least.join(', ') || '—'}
              />
            </div>
            <div
              className={`mt-3 flex items-start gap-2 rounded-input border px-3 py-2 text-xs leading-relaxed ${
                interpretation.tone === 'success'
                  ? 'border-success/30 bg-success/10 text-success'
                  : interpretation.tone === 'warning'
                    ? 'border-warning/30 bg-warning/10 text-warning'
                    : 'border-info/30 bg-info/10 text-info'
              }`}
              role="note"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">
                  IC = {result.ic.toFixed(4)}.
                </span>{' '}
                {interpretation.text}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">
              IC = Σ n<sub>i</sub>(n<sub>i</sub>−1) / (N(N−1)), where n
              <sub>i</sub> is the count of each letter and N is the total letter
              count.
            </p>
          </Panel>

          <Panel title="Letter frequencies (A–Z)">
            <div className="space-y-1">
              {ALPHABET.map((l) => {
                const count = result.counts[l];
                const pct = result.total ? (count / result.total) * 100 : 0;
                const barPct = result.max ? (count / result.max) * 100 : 0;
                const isMost = count > 0 && result.most.includes(l);
                return (
                  <div key={l} className="flex items-center gap-3">
                    <span className="w-4 shrink-0 font-mono text-xs font-semibold text-secondary">
                      {l}
                    </span>
                    <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-sm bg-surface">
                      <div
                        className={`h-full rounded-sm transition-all ${
                          isMost ? 'bg-accent' : 'bg-accent/50'
                        }`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right font-mono text-2xs text-muted">
                      {count}
                    </span>
                    <span className="w-12 shrink-0 text-right font-mono text-2xs text-muted">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Next steps">
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-secondary">
              <Badge tone="accent">Tip</Badge>
              If the frequencies look English-like, try the{' '}
              <Link
                href="/tools/caesar-cipher"
                className="font-medium text-accent hover:underline"
              >
                Caesar cipher
              </Link>{' '}
              brute-forcer; if they look flattened, the{' '}
              <Link
                href="/tools/vigenere-cipher"
                className="font-medium text-accent hover:underline"
              >
                Vigenère cipher
              </Link>{' '}
              tool can help test polyalphabetic keys.
            </p>
          </Panel>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-input border border-border bg-surface px-3 py-2">
      <div className="text-2xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-0.5 break-words font-mono text-sm text-text">
        {value}
      </div>
    </div>
  );
}
