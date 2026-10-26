'use client';

import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';
import {
  DecodeError,
  base32ToBytes,
  base64ToBytes,
  binaryToBytes,
  bytesToBase32,
  bytesToBase64,
  bytesToBase64Url,
  bytesToBinary,
  bytesToDecimal,
  bytesToHex,
  bytesToUtf8,
  decimalToBytes,
  hexToBytes,
  htmlDecode,
  htmlEncode,
  textToCodePoints,
  urlDecode,
  urlEncode,
  utf8ToBytes,
} from '@/lib/encoding';
import { useDebouncedValue } from '@/lib/hooks';

type Interpret =
  | 'text'
  | 'base64'
  | 'base64url'
  | 'base32'
  | 'hex'
  | 'binary'
  | 'decimal'
  | 'url'
  | 'html';

const OPTIONS: { value: Interpret; label: string }[] = [
  { value: 'text', label: 'Text (UTF-8)' },
  { value: 'base64', label: 'Base64' },
  { value: 'base64url', label: 'Base64URL' },
  { value: 'base32', label: 'Base32' },
  { value: 'hex', label: 'Hex' },
  { value: 'binary', label: 'Binary' },
  { value: 'decimal', label: 'Decimal bytes' },
  { value: 'url', label: 'URL-encoded' },
  { value: 'html', label: 'HTML entities' },
];

const SAMPLE = 'Hello, ForensiKit! 🔬';

/** Decode the raw input into bytes according to the chosen interpretation. */
function decodeToBytes(value: string, interpret: Interpret): Uint8Array {
  switch (interpret) {
    case 'text':
      return utf8ToBytes(value);
    case 'base64':
    case 'base64url':
      return base64ToBytes(value);
    case 'base32':
      return base32ToBytes(value);
    case 'hex':
      return hexToBytes(value);
    case 'binary':
      return binaryToBytes(value);
    case 'decimal':
      return decimalToBytes(value);
    case 'url':
      return utf8ToBytes(urlDecode(value));
    case 'html':
      return utf8ToBytes(htmlDecode(value));
  }
}

export default function EncodingMultitool() {
  const [input, setInput] = useState('');
  const [interpret, setInterpret] = useState<Interpret>('text');
  const debounced = useDebouncedValue(input, 150);

  const { bytes, error } = useMemo(() => {
    if (!debounced) {
      return { bytes: new Uint8Array(), error: null as string | null };
    }
    try {
      return { bytes: decodeToBytes(debounced, interpret), error: null };
    } catch (e) {
      const msg =
        e instanceof DecodeError
          ? e.message
          : 'Could not decode the input with the selected interpretation.';
      return { bytes: null, error: msg };
    }
  }, [debounced, interpret]);

  const reps = useMemo(() => {
    if (!bytes) return null;
    const text = bytesToUtf8(bytes, false);
    return [
      { key: 'text', label: 'Text (UTF-8)', value: text },
      { key: 'base64', label: 'Base64', value: bytesToBase64(bytes) },
      { key: 'base64url', label: 'Base64URL', value: bytesToBase64Url(bytes) },
      { key: 'base32', label: 'Base32', value: bytesToBase32(bytes) },
      { key: 'hex', label: 'Hex', value: bytesToHex(bytes) },
      { key: 'binary', label: 'Binary', value: bytesToBinary(bytes) },
      { key: 'decimal', label: 'Decimal bytes', value: bytesToDecimal(bytes) },
      { key: 'url', label: 'URL-encoded', value: urlEncode(text) },
      { key: 'html', label: 'HTML entities', value: htmlEncode(text) },
      {
        key: 'codepoints',
        label: 'Unicode code points',
        value: textToCodePoints(text),
      },
    ];
  }, [bytes]);

  const byteCount = bytes ? bytes.length : 0;

  return (
    <div className="space-y-4">
      <Panel
        title="Input"
        actions={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setInput(SAMPLE);
                setInterpret('text');
              }}
            >
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
          <Field label="Interpret input as" htmlFor="enc-interpret">
            <Select
              id="enc-interpret"
              value={interpret}
              onChange={(e) => setInterpret(e.target.value as Interpret)}
              options={OPTIONS}
            />
          </Field>
          <Field label="Input" htmlFor="enc-input">
            <TextArea
              id="enc-input"
              mono={interpret !== 'text'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              invalid={Boolean(error)}
              placeholder="Type or paste a value to convert between encodings…"
            />
          </Field>
          {error && <InlineError>{error}</InlineError>}
          {!error && input && (
            <p className="text-xs text-muted">
              Decoded {byteCount} byte{byteCount === 1 ? '' : 's'}.
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Representations">
        {!input ? (
          <p className="text-sm text-muted">
            Enter a value above to see it in every encoding at once.
          </p>
        ) : error ? (
          <p className="text-sm text-muted">
            Fix the input above to see the conversions.
          </p>
        ) : (
          reps && (
            <div className="space-y-2">
              {reps
                .filter((r) => r.key !== interpret)
                .map((r) => (
                  <ResultBlock
                    key={r.key}
                    label={r.label}
                    value={r.value}
                    mono
                    copy
                  />
                ))}
            </div>
          )
        )}
      </Panel>
    </div>
  );
}
