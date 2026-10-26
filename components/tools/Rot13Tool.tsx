'use client';

import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field, Panel } from '@/components/ui/ToolShell';
import { rot13 } from '@/lib/crypto/classical';
import { useDebouncedValue } from '@/lib/hooks';

const SAMPLE = 'The quick brown fox jumps over the lazy dog.';

export default function Rot13Tool() {
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 150);

  const output = useMemo(() => rot13(debounced), [debounced]);

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
        <Field label="Text" htmlFor="rot13-input">
          <TextArea
            id="rot13-input"
            mono={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text…"
          />
        </Field>
      </Panel>

      <Panel
        title="ROT13 output"
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
            Enter text to see the ROT13 transform.
          </p>
        )}
        <p className="mt-3 text-xs text-muted">
          ROT13 shifts each letter by 13 places. Because 13 is half of 26, it is
          its own inverse — applying ROT13 again returns the original text.
        </p>
      </Panel>
    </div>
  );
}
