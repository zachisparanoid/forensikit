'use client';

import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Badge } from '@/components/ui/Badge';
import { Field, EmptyState, Panel } from '@/components/ui/ToolShell';
import { identifyHash, type HashGuess } from '@/lib/crypto/identify-hash';
import { useDebouncedValue } from '@/lib/hooks';

const SAMPLE = '900150983cd24fb0d6963f7d28e17f72';

type Tone = 'success' | 'warning' | 'default';

const CONFIDENCE_TONE: Record<HashGuess['confidence'], Tone> = {
  high: 'success',
  medium: 'warning',
  low: 'default',
};

function describeCharset(s: string): string {
  if (!s) return '';
  if (/^[0-9a-fA-F]+$/.test(s)) return 'hexadecimal';
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return 'Base64';
  if (/^[A-Za-z0-9_-]+$/.test(s)) return 'Base64URL / alphanumeric';
  return 'mixed characters';
}

export default function HashIdentifier() {
  const [input, setInput] = useState('');
  const debounced = useDebouncedValue(input, 150);

  const trimmed = debounced.trim();
  const guesses = useMemo(() => identifyHash(debounced), [debounced]);
  const charset = useMemo(() => describeCharset(trimmed), [trimmed]);

  return (
    <div className="space-y-4">
      <Panel
        title="Hash"
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={() => setInput(SAMPLE)}>
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setInput('')}
              disabled={!input}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Paste a hash digest" htmlFor="hashid-input">
            <TextArea
              id="hashid-input"
              mono
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 900150983cd24fb0d6963f7d28e17f72"
            />
          </Field>
          {trimmed && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <Badge tone="default">{trimmed.length} chars</Badge>
              <Badge tone="default">{trimmed.length * 4} bits if hex</Badge>
              <Badge tone="default">{charset}</Badge>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Candidates">
        {!trimmed ? (
          <EmptyState
            message="Paste a hash above and ForensiKit will rank the algorithms it most likely came from. Identification is heuristic — same-length digests cannot be told apart with certainty."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setInput(SAMPLE)}
              >
                <FileText className="h-3.5 w-3.5" /> Load sample
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {guesses.map((g, i) => (
              <div
                key={`${g.algorithm}-${i}`}
                className="rounded-input border border-border bg-surface px-3 py-2"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-13 font-semibold text-text">
                    {g.algorithm}
                  </span>
                  <Badge tone={CONFIDENCE_TONE[g.confidence]}>
                    {g.confidence} confidence
                  </Badge>
                </div>
                <p className="text-xs text-muted">{g.note}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
