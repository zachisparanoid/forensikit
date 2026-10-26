'use client';

import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field, Panel } from '@/components/ui/ToolShell';
import { atbash } from '@/lib/crypto/classical';
import { useDebouncedValue } from '@/lib/hooks';

const SAMPLE = 'The quick brown fox jumps over the lazy dog.';

export default function Atbash() {
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 150);

  const output = useMemo(() => atbash(debounced), [debounced]);

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
        <Field label="Text" htmlFor="atbash-input">
          <TextArea
            id="atbash-input"
            mono={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text…"
          />
        </Field>
      </Panel>

      <Panel
        title="Atbash output"
        actions={
          output ? <CopyButton value={output} label="Copy" /> : undefined
        }
      >
        {output ? (
          <code className="block break-all font-mono text-sm text-text">
            {output}
          </code>
        ) : (
          <p className="text-sm text-muted">
            Enter text to see the Atbash transform.
          </p>
        )}
        <p className="mt-3 text-xs text-muted">
          Atbash mirrors the alphabet (A↔Z, B↔Y, …). It is self-inverse —
          applying it twice returns the original text.
        </p>
      </Panel>
    </div>
  );
}
