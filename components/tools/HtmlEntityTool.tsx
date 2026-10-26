'use client';

import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Tabs } from '@/components/ui/Tabs';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Field, Panel } from '@/components/ui/ToolShell';
import { htmlDecode, htmlEncode } from '@/lib/encoding';
import { useDebouncedValue } from '@/lib/hooks';

type Mode = 'encode' | 'decode';

const SAMPLE = '<script>alert("xss & \'inject\'")</script>';

export default function HtmlEntityTool() {
  const [mode, setMode] = useState<Mode>('encode');
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 150);

  const output = useMemo(
    () => (mode === 'encode' ? htmlEncode(debounced) : htmlDecode(debounced)),
    [debounced, mode],
  );

  return (
    <div className="space-y-4">
      <Panel
        title="Input"
        actions={
          <>
            <Tabs
              tabs={[
                { value: 'encode' as Mode, label: 'Encode' },
                { value: 'decode' as Mode, label: 'Decode' },
              ]}
              value={mode}
              onChange={setMode}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMode('encode');
                setText(SAMPLE);
              }}
            >
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
        <Field
          label={mode === 'encode' ? 'Plain text' : 'HTML with entities'}
          htmlFor="html-input"
        >
          <TextArea
            id="html-input"
            mono={mode === 'decode'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === 'encode'
                ? 'Type or paste text to escape into HTML entities…'
                : 'Paste HTML with entities to decode…'
            }
          />
        </Field>
      </Panel>

      <Panel title={mode === 'encode' ? 'Encoded' : 'Decoded'}>
        {output ? (
          <ResultBlock
            label={mode === 'encode' ? 'HTML entities' : 'Text'}
            value={output}
            mono={mode === 'encode'}
            copy
          />
        ) : (
          <p className="text-sm text-muted">Enter text above to convert it.</p>
        )}
      </Panel>
    </div>
  );
}
