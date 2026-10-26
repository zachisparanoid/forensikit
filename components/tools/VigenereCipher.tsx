'use client';

import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Tabs } from '@/components/ui/Tabs';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field, Panel } from '@/components/ui/ToolShell';
import { vigenere } from '@/lib/crypto/classical';
import { useDebouncedValue } from '@/lib/hooks';

type Mode = 'encrypt' | 'decrypt';

const SAMPLE_TEXT = 'Attack at dawn';
const SAMPLE_KEY = 'LEMON';

export default function VigenereCipher() {
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [mode, setMode] = useState<Mode>('encrypt');
  const debouncedText = useDebouncedValue(text, 150);
  const debouncedKey = useDebouncedValue(key, 150);

  const cleanKey = useMemo(
    () => debouncedKey.replace(/[^a-zA-Z]/g, ''),
    [debouncedKey],
  );

  const output = useMemo(
    () => vigenere(debouncedText, debouncedKey, mode),
    [debouncedText, debouncedKey, mode],
  );

  function loadSample() {
    setText(SAMPLE_TEXT);
    setKey(SAMPLE_KEY);
  }

  function clearAll() {
    setText('');
    setKey('');
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Input"
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={loadSample}>
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAll}
              disabled={!text && !key}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Tabs
            tabs={[
              { value: 'encrypt', label: 'Encrypt' },
              { value: 'decrypt', label: 'Decrypt' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Field label="Text" htmlFor="vigenere-input">
            <TextArea
              id="vigenere-input"
              mono={false}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text…"
            />
          </Field>
          <Field
            label="Key"
            htmlFor="vigenere-key"
            hint="letters only — other characters are ignored"
          >
            <Input
              id="vigenere-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. LEMON"
            />
          </Field>
          {key && !cleanKey && (
            <p className="text-xs text-warning">
              The key has no letters, so the text passes through unchanged.
            </p>
          )}
        </div>
      </Panel>

      <Panel
        title={mode === 'encrypt' ? 'Ciphertext' : 'Plaintext'}
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
            Enter text and a key to see the result.
          </p>
        )}
        <p className="mt-3 text-xs text-muted">
          Case and non-alphabetic characters (spaces, punctuation, digits) are
          preserved. Only letters from the key are used, repeating across the
          message.
        </p>
      </Panel>
    </div>
  );
}
