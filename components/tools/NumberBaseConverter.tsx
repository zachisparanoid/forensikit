'use client';

import { useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';
import { bytesToBase64 } from '@/lib/encoding';

type Base = 'bin' | 'oct' | 'dec' | 'hex' | 'b64';

interface State {
  bin: string;
  oct: string;
  dec: string;
  hex: string;
  b64: string;
  error: string | null;
  errorField: Base | null;
}

const EMPTY: State = {
  bin: '',
  oct: '',
  dec: '',
  hex: '',
  b64: '',
  error: null,
  errorField: null,
};

/** Big-endian minimal bytes of a non-negative BigInt (0 -> single 0 byte). */
function bigIntToBytes(n: bigint): Uint8Array {
  if (n === 0n) return new Uint8Array([0]);
  const out: number[] = [];
  let v = n;
  while (v > 0n) {
    out.unshift(Number(v & 0xffn));
    v >>= 8n;
  }
  return Uint8Array.from(out);
}

function fromValue(n: bigint): State {
  return {
    bin: n.toString(2),
    oct: n.toString(8),
    dec: n.toString(10),
    hex: n.toString(16),
    b64: bytesToBase64(bigIntToBytes(n)),
    error: null,
    errorField: null,
  };
}

function parseField(field: Base, raw: string): bigint {
  const clean = raw.trim().replace(/^[+]/, '');
  if (clean === '') throw new Error('Enter a value.');
  if (clean.startsWith('-'))
    throw new Error('Only non-negative integers are supported.');
  switch (field) {
    case 'bin':
      if (!/^[01]+$/.test(clean))
        throw new Error('Binary digits must be 0 or 1.');
      return BigInt('0b' + clean);
    case 'oct':
      if (!/^[0-7]+$/.test(clean)) throw new Error('Octal digits must be 0–7.');
      return BigInt('0o' + clean);
    case 'dec':
      if (!/^\d+$/.test(clean)) throw new Error('Decimal digits must be 0–9.');
      return BigInt(clean);
    case 'hex':
      if (!/^[0-9a-fA-F]+$/.test(clean.replace(/^0x/i, '')))
        throw new Error('Hex digits must be 0–9, a–f.');
      return BigInt('0x' + clean.replace(/^0x/i, ''));
    default:
      throw new Error('Unsupported field.');
  }
}

export default function NumberBaseConverter() {
  const [state, setState] = useState<State>(EMPTY);

  function update(field: Base, raw: string) {
    if (field === 'b64') return; // Base64 is output-only.
    if (raw.trim() === '') {
      setState(EMPTY);
      return;
    }
    try {
      const value = parseField(field, raw);
      const next = fromValue(value);
      // Preserve the user's exact keystrokes in the edited field.
      setState({ ...next, [field]: raw });
    } catch (e) {
      // Mark only the edited field invalid; keep the other fields intact.
      setState((prev) => ({
        ...prev,
        [field]: raw,
        error: e instanceof Error ? e.message : 'Invalid value.',
        errorField: field,
      }));
    }
  }

  const fields: {
    key: Exclude<Base, 'b64'>;
    label: string;
    placeholder: string;
  }[] = [
    { key: 'bin', label: 'Binary (base 2)', placeholder: '11111111' },
    { key: 'oct', label: 'Octal (base 8)', placeholder: '377' },
    { key: 'dec', label: 'Decimal (base 10)', placeholder: '255' },
    { key: 'hex', label: 'Hexadecimal (base 16)', placeholder: 'ff' },
  ];

  return (
    <div className="space-y-4">
      <Panel
        title="Number bases"
        actions={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setState(fromValue(255n))}
            >
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setState(EMPTY)}
              disabled={
                !state.bin &&
                !state.oct &&
                !state.dec &&
                !state.hex &&
                !state.error
              }
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} htmlFor={`nb-${f.key}`}>
              <div className="flex items-center gap-2">
                <Input
                  id={`nb-${f.key}`}
                  mono
                  invalid={state.errorField === f.key}
                  value={state[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  inputMode={f.key === 'dec' ? 'numeric' : 'text'}
                />
                <CopyButton value={state[f.key]} />
              </div>
              {state.errorField === f.key && state.error && (
                <InlineError>{state.error}</InlineError>
              )}
            </Field>
          ))}

          <Field
            label="Base64 (of big-endian bytes)"
            htmlFor="nb-b64"
            hint="read-only"
          >
            <div className="flex items-center gap-2">
              <Input
                id="nb-b64"
                mono
                readOnly
                value={state.b64}
                placeholder="/w=="
                className="bg-card"
              />
              <CopyButton value={state.b64} />
            </div>
          </Field>
        </div>
      </Panel>

      {!state.dec && !state.error && (
        <p className="text-sm text-muted">
          Type a value in any field to convert between bases live. BigInt is
          used so arbitrarily large values are supported.
        </p>
      )}
    </div>
  );
}
