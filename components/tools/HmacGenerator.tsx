'use client';

import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';
import { HMAC_ALGOS, hmacResult, type HmacAlgo } from '@/lib/crypto/hmac';
import { DecodeError, hexToBytes, utf8ToBytes } from '@/lib/encoding';
import { useDebouncedValue } from '@/lib/hooks';

type KeyEncoding = 'utf8' | 'hex';

const SAMPLE_MESSAGE = 'The quick brown fox jumps over the lazy dog';
const SAMPLE_KEY = 'secret';

export default function HmacGenerator() {
  const [message, setMessage] = useState('');
  const [key, setKey] = useState('');
  const [algo, setAlgo] = useState<HmacAlgo>('SHA-256');
  const [keyEncoding, setKeyEncoding] = useState<KeyEncoding>('utf8');

  const debouncedMessage = useDebouncedValue(message, 150);
  const debouncedKey = useDebouncedValue(key, 150);

  const { result, error } = useMemo(() => {
    try {
      const msgBytes = utf8ToBytes(debouncedMessage);
      const keyBytes =
        keyEncoding === 'hex'
          ? hexToBytes(debouncedKey)
          : utf8ToBytes(debouncedKey);
      return {
        result: hmacResult(algo, msgBytes, keyBytes),
        error: null as string | null,
      };
    } catch (e) {
      const msg =
        e instanceof DecodeError
          ? e.message
          : 'Could not compute the HMAC from the given input.';
      return { result: null, error: msg };
    }
  }, [debouncedMessage, debouncedKey, algo, keyEncoding]);

  const hasInput = Boolean(message || key);

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
                setMessage(SAMPLE_MESSAGE);
                setKey(SAMPLE_KEY);
                setKeyEncoding('utf8');
              }}
            >
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMessage('');
                setKey('');
              }}
              disabled={!hasInput}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Algorithm" htmlFor="hmac-algo">
              <Select
                id="hmac-algo"
                value={algo}
                onChange={(e) => setAlgo(e.target.value as HmacAlgo)}
                options={HMAC_ALGOS.map((a) => ({ value: a, label: a }))}
              />
            </Field>
            <Field label="Key encoding" htmlFor="hmac-key-encoding">
              <Select
                id="hmac-key-encoding"
                value={keyEncoding}
                onChange={(e) => setKeyEncoding(e.target.value as KeyEncoding)}
                options={[
                  { value: 'utf8', label: 'UTF-8 text' },
                  { value: 'hex', label: 'Hex' },
                ]}
              />
            </Field>
          </div>
          <Field label="Message" htmlFor="hmac-message">
            <TextArea
              id="hmac-message"
              mono={false}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type or paste the message to authenticate…"
            />
          </Field>
          <Field
            label="Key"
            htmlFor="hmac-key"
            hint={keyEncoding === 'hex' ? 'hex bytes' : 'UTF-8 text'}
          >
            <Input
              id="hmac-key"
              mono={keyEncoding === 'hex'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              invalid={Boolean(error)}
              placeholder={
                keyEncoding === 'hex'
                  ? 'e.g. 73 65 63 72 65 74'
                  : 'Shared secret key…'
              }
            />
          </Field>
          {error && <InlineError>{error}</InlineError>}
        </div>
      </Panel>

      <Panel title="HMAC" actions={<Badge tone="accent">{algo}</Badge>}>
        {result && !error ? (
          <div className="space-y-2">
            <ResultBlock label="Hex" value={result.hex} mono copy />
            <ResultBlock label="Base64" value={result.base64} mono copy />
          </div>
        ) : (
          <p className="text-sm text-muted">
            {error
              ? 'Fix the input above to see the HMAC.'
              : 'Enter a message and key to compute the HMAC live.'}
          </p>
        )}
      </Panel>
    </div>
  );
}
