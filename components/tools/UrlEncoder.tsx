'use client';

import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Tabs } from '@/components/ui/Tabs';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';
import { DecodeError, urlDecode, urlEncode } from '@/lib/encoding';
import { useDebouncedValue } from '@/lib/hooks';

type Mode = 'encode' | 'decode';

const SAMPLE = 'https://example.com/search?q=hello world&x=a/b';

export default function UrlEncoder() {
  const [mode, setMode] = useState<Mode>('encode');
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 150);

  const { output, error } = useMemo(() => {
    if (!debounced) return { output: '', error: null as string | null };
    try {
      return {
        output: mode === 'encode' ? urlEncode(debounced) : urlDecode(debounced),
        error: null,
      };
    } catch (e) {
      const msg =
        e instanceof DecodeError
          ? e.message
          : 'Could not decode the percent-encoded input.';
      return { output: '', error: msg };
    }
  }, [debounced, mode]);

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
        <div className="space-y-3">
          <Field
            label={mode === 'encode' ? 'Plain text' : 'URL-encoded'}
            htmlFor="url-input"
          >
            <TextArea
              id="url-input"
              mono={mode === 'decode'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              invalid={Boolean(error)}
              placeholder={
                mode === 'encode'
                  ? 'Type or paste text to percent-encode…'
                  : 'Paste a percent-encoded string to decode…'
              }
            />
          </Field>
          {error && <InlineError>{error}</InlineError>}
        </div>
      </Panel>

      <Panel title={mode === 'encode' ? 'Encoded' : 'Decoded'}>
        {output ? (
          <ResultBlock
            label={mode === 'encode' ? 'URL-encoded' : 'Text'}
            value={output}
            mono={mode === 'encode'}
            copy
          />
        ) : (
          <p className="text-sm text-muted">
            {error
              ? 'Fix the input above to see the result.'
              : 'Enter text above to convert it.'}
          </p>
        )}
      </Panel>
    </div>
  );
}
