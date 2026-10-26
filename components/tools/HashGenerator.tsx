'use client';

import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';
import { hashAll } from '@/lib/crypto/hashing';
import {
  DecodeError,
  hexToBytes,
  latin1ToBytes,
  utf8ToBytes,
} from '@/lib/encoding';
import { useDebouncedValue } from '@/lib/hooks';

type InputMode = 'utf8' | 'latin1' | 'hex';

const SAMPLE = 'The quick brown fox jumps over the lazy dog';

export default function HashGenerator() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<InputMode>('utf8');
  const debounced = useDebouncedValue(text, 150);

  const { results, error } = useMemo(() => {
    try {
      let bytes: Uint8Array;
      if (mode === 'hex') bytes = hexToBytes(debounced);
      else if (mode === 'latin1') bytes = latin1ToBytes(debounced);
      else bytes = utf8ToBytes(debounced);
      return { results: hashAll(bytes), error: null as string | null };
    } catch (e) {
      const msg =
        e instanceof DecodeError ? e.message : 'Could not parse the input.';
      return { results: hashAll(new Uint8Array()), error: msg };
    }
  }, [debounced, mode]);

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
        <div className="space-y-3">
          <Field label="Interpret input as" htmlFor="hash-mode">
            <Select
              id="hash-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as InputMode)}
              options={[
                { value: 'utf8', label: 'UTF-8 text' },
                { value: 'latin1', label: 'Latin-1 (ISO-8859-1)' },
                { value: 'hex', label: 'Hex bytes' },
              ]}
            />
          </Field>
          <Field label="Text" htmlFor="hash-input">
            <TextArea
              id="hash-input"
              mono={mode === 'hex'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === 'hex' ? 'e.g. 48 65 6c 6c 6f' : 'Type or paste text…'
              }
            />
          </Field>
          {error && <InlineError>{error}</InlineError>}
          {!text && !error && (
            <p className="text-xs text-muted">
              Showing the digests of the empty string — a handy reference.
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Digests">
        <div className="space-y-2">
          {results.map((r) => (
            <div
              key={r.algo}
              className="rounded-input border border-border bg-surface px-3 py-2"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-accent">
                  {r.algo}
                </span>
                <Badge tone="default">{r.bits}-bit</Badge>
              </div>
              <div className="flex items-start justify-between gap-2">
                <code className="break-all font-mono text-13 text-text">
                  {r.hex}
                </code>
                <CopyButton value={r.hex} />
              </div>
              <div className="mt-1 flex items-start justify-between gap-2 border-t border-border pt-1">
                <code className="break-all font-mono text-2xs text-muted">
                  base64: {r.base64}
                </code>
                <CopyButton value={r.base64 ?? ''} label="" />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
