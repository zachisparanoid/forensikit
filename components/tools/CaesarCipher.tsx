'use client';

import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Slider } from '@/components/ui/Slider';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field, Panel } from '@/components/ui/ToolShell';
import { caesarAllShifts, caesarShift } from '@/lib/crypto/classical';
import { useDebouncedValue } from '@/lib/hooks';

const SAMPLE = 'Wkh txlfn eurzq ira mxpsv ryhu wkh odcb grj';

export default function CaesarCipher() {
  const [text, setText] = useState('');
  const [shift, setShift] = useState(3);
  const debounced = useDebouncedValue(text, 120);

  const output = useMemo(
    () => caesarShift(debounced, shift),
    [debounced, shift],
  );
  const allShifts = useMemo(() => caesarAllShifts(debounced), [debounced]);

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
          <Field label="Text" htmlFor="caesar-input">
            <TextArea
              id="caesar-input"
              mono={false}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text…"
            />
          </Field>
          <Slider
            id="caesar-shift"
            label="Shift"
            valueLabel={`+${shift}`}
            min={0}
            max={25}
            value={shift}
            onChange={setShift}
          />
        </div>
      </Panel>

      <Panel
        title={`Result (shift +${shift})`}
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
            Enter text to see the shifted output.
          </p>
        )}
      </Panel>

      <Panel title="Brute force — all 26 shifts">
        {debounced ? (
          <div className="space-y-1">
            {allShifts.map(({ shift: s, text: t }) => (
              <button
                key={s}
                type="button"
                onClick={() => setShift(s)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-1 text-left font-mono text-13 transition hover:bg-surface ${
                  s === shift ? 'bg-accent/10' : ''
                }`}
              >
                <span className="w-12 shrink-0 text-muted">+{s}</span>
                <span className="min-w-0 flex-1 truncate text-secondary">
                  {t}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Enter ciphertext to reveal every possible shift at a glance.
          </p>
        )}
      </Panel>
    </div>
  );
}
