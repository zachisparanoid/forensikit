'use client';

import { useState } from 'react';
import { FileText, KeyRound, Loader2, Shuffle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';
import {
  pbkdf2Result,
  PBKDF2_RECOMMENDATION,
  type Pbkdf2Hash,
} from '@/lib/crypto/pbkdf2';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@/lib/encoding';

type SaltEncoding = 'utf8' | 'hex';
const DEFAULT_ITERATIONS = 250_000;

export default function PbkdfTool() {
  const [password, setPassword] = useState('');
  const [salt, setSalt] = useState('');
  const [saltEncoding, setSaltEncoding] = useState<SaltEncoding>('utf8');
  const [iterations, setIterations] = useState(String(DEFAULT_ITERATIONS));
  const [hash, setHash] = useState<Pbkdf2Hash>('SHA-256');
  const [dkLenBits, setDkLenBits] = useState(256);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ hex: string; base64: string } | null>(
    null,
  );

  const iterNum = Number.parseInt(iterations, 10);
  const iterInvalid = !Number.isFinite(iterNum) || iterNum < 1;

  function randomSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    setSalt(bytesToHex(bytes));
    setSaltEncoding('hex');
  }

  async function handleDerive() {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const saltBytes =
        saltEncoding === 'hex' ? hexToBytes(salt) : utf8ToBytes(salt);
      const res = await pbkdf2Result({
        password,
        salt: saltBytes,
        iterations: iterNum,
        hash,
        dkLenBits,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Key derivation failed.');
    } finally {
      setBusy(false);
    }
  }

  function loadSample() {
    setError(null);
    setResult(null);
    setPassword('password');
    setSalt('salt');
    setSaltEncoding('utf8');
    setIterations(String(DEFAULT_ITERATIONS));
    setHash('SHA-256');
    setDkLenBits(256);
  }

  function clearAll() {
    setPassword('');
    setSalt('');
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-4">
      <Panel
        title="PBKDF2 key derivation"
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={loadSample}>
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button size="sm" variant="ghost" onClick={clearAll}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Password" htmlFor="pbkdf2-password">
            <Input
              id="pbkdf2-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="The password / passphrase to stretch…"
            />
          </Field>

          <Field
            label="Salt"
            htmlFor="pbkdf2-salt"
            hint={
              <button
                type="button"
                onClick={randomSalt}
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                <Shuffle className="h-3 w-3" /> Random salt
              </button>
            }
          >
            <div className="flex gap-2">
              <Input
                id="pbkdf2-salt"
                mono={saltEncoding === 'hex'}
                value={salt}
                onChange={(e) => setSalt(e.target.value)}
                placeholder={
                  saltEncoding === 'hex' ? 'hex bytes…' : 'salt text…'
                }
              />
              <div className="w-32 shrink-0">
                <Select
                  aria-label="Salt encoding"
                  value={saltEncoding}
                  onChange={(e) =>
                    setSaltEncoding(e.target.value as SaltEncoding)
                  }
                  options={[
                    { value: 'utf8', label: 'UTF-8' },
                    { value: 'hex', label: 'Hex' },
                  ]}
                />
              </div>
            </div>
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Iterations" htmlFor="pbkdf2-iters">
              <Input
                id="pbkdf2-iters"
                mono
                inputMode="numeric"
                value={iterations}
                invalid={iterInvalid}
                onChange={(e) => setIterations(e.target.value)}
              />
            </Field>
            <Field label="Hash (PRF)" htmlFor="pbkdf2-hash">
              <Select
                id="pbkdf2-hash"
                value={hash}
                onChange={(e) => setHash(e.target.value as Pbkdf2Hash)}
                options={[
                  { value: 'SHA-1', label: 'SHA-1' },
                  { value: 'SHA-256', label: 'SHA-256' },
                  { value: 'SHA-384', label: 'SHA-384' },
                  { value: 'SHA-512', label: 'SHA-512' },
                ]}
              />
            </Field>
            <Field label="Derived length" htmlFor="pbkdf2-dklen">
              <Select
                id="pbkdf2-dklen"
                value={String(dkLenBits)}
                onChange={(e) => setDkLenBits(Number(e.target.value))}
                options={[
                  { value: '128', label: '128 bits (16 B)' },
                  { value: '256', label: '256 bits (32 B)' },
                  { value: '512', label: '512 bits (64 B)' },
                ]}
              />
            </Field>
          </div>

          <Button
            variant="primary"
            onClick={handleDerive}
            disabled={busy || iterInvalid}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {busy ? 'Deriving…' : 'Derive'}
          </Button>

          {error && <InlineError>{error}</InlineError>}

          <p className="text-xs text-muted">{PBKDF2_RECOMMENDATION}</p>
        </div>
      </Panel>

      {result && (
        <Panel title="Derived key">
          <div className="space-y-2">
            <ResultBlock label="Hex" value={result.hex} />
            <ResultBlock label="Base64" value={result.base64} />
          </div>
        </Panel>
      )}
    </div>
  );
}
