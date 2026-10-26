'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Field, Panel } from '@/components/ui/ToolShell';
import wordlist from '@/data/wordlist.json';

const WORDS = wordlist as string[];

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?/';
const AMBIGUOUS = new Set('O0Il1|`'.split(''));

type Mode = 'random' | 'passphrase';
type Sep = '-' | '.' | ' ' | '_';

/** Uniform integer in [0, max) using rejection sampling to avoid modulo bias. */
function randomInt(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

function strengthHint(bits: number): {
  label: string;
  tone: 'danger' | 'warning' | 'info' | 'success';
} {
  if (bits < 40) return { label: 'Weak', tone: 'danger' };
  if (bits < 60) return { label: 'Fair', tone: 'warning' };
  if (bits < 80) return { label: 'Strong', tone: 'info' };
  return { label: 'Very strong', tone: 'success' };
}

export default function PasswordGenerator() {
  const [mode, setMode] = useState<Mode>('random');

  // Random options
  const [length, setLength] = useState(20);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState('');

  // Passphrase options
  const [wordCount, setWordCount] = useState(5);
  const [separator, setSeparator] = useState<Sep>('-');
  const [capitalize, setCapitalize] = useState(true);
  const [appendNumber, setAppendNumber] = useState(true);
  const [passphrase, setPassphrase] = useState('');

  const pool = useMemo(() => {
    let chars = '';
    if (useUpper) chars += UPPER;
    if (useLower) chars += LOWER;
    if (useDigits) chars += DIGITS;
    if (useSymbols) chars += SYMBOLS;
    if (excludeAmbiguous) {
      chars = chars
        .split('')
        .filter((c) => !AMBIGUOUS.has(c))
        .join('');
    }
    return chars;
  }, [useUpper, useLower, useDigits, useSymbols, excludeAmbiguous]);

  const hasClass = pool.length > 0;

  const generateRandom = useCallback(() => {
    if (pool.length === 0) {
      setPassword('');
      return;
    }
    let out = '';
    for (let i = 0; i < length; i++) out += pool[randomInt(pool.length)];
    setPassword(out);
  }, [pool, length]);

  const generatePassphrase = useCallback(() => {
    const parts: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      let w = WORDS[randomInt(WORDS.length)];
      if (capitalize) w = w.charAt(0).toUpperCase() + w.slice(1);
      parts.push(w);
    }
    let phrase = parts.join(separator);
    if (appendNumber)
      phrase += separator + randomInt(100).toString().padStart(2, '0');
    setPassphrase(phrase);
  }, [wordCount, capitalize, separator, appendNumber]);

  // Regenerate on control change (live).
  useEffect(() => {
    generateRandom();
  }, [generateRandom]);

  useEffect(() => {
    generatePassphrase();
  }, [generatePassphrase]);

  const randomEntropy = hasClass ? length * Math.log2(pool.length) : 0;
  const passphraseExtra = appendNumber ? Math.log2(100) : 0;
  const passphraseEntropy =
    wordCount * Math.log2(WORDS.length) + passphraseExtra;

  const tabs = [
    { value: 'random' as const, label: 'Random' },
    { value: 'passphrase' as const, label: 'Passphrase' },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={tabs} value={mode} onChange={setMode} />

      {mode === 'random' ? (
        <>
          <Panel title="Options">
            <div className="space-y-4">
              <Slider
                id="pg-length"
                label="Length"
                valueLabel={`${length}`}
                min={4}
                max={64}
                value={length}
                onChange={setLength}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  id="pg-upper"
                  checked={useUpper}
                  onChange={setUseUpper}
                  label="Uppercase (A–Z)"
                />
                <Toggle
                  id="pg-lower"
                  checked={useLower}
                  onChange={setUseLower}
                  label="Lowercase (a–z)"
                />
                <Toggle
                  id="pg-digits"
                  checked={useDigits}
                  onChange={setUseDigits}
                  label="Digits (0–9)"
                />
                <Toggle
                  id="pg-symbols"
                  checked={useSymbols}
                  onChange={setUseSymbols}
                  label="Symbols (!@#…)"
                />
                <Toggle
                  id="pg-ambiguous"
                  checked={excludeAmbiguous}
                  onChange={setExcludeAmbiguous}
                  label="Exclude ambiguous (O0Il1|`)"
                />
              </div>
              {!hasClass && (
                <p
                  className="flex items-center gap-2 text-sm text-danger"
                  role="alert"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Select at least one character class to generate a password.
                </p>
              )}
            </div>
          </Panel>

          <Panel
            title="Generated password"
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={generateRandom}
                disabled={!hasClass}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
            }
          >
            {hasClass ? (
              <div className="space-y-2">
                <ResultBlock
                  label="Password"
                  value={password}
                  valueClassName="text-base"
                />
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Badge tone={strengthHint(randomEntropy).tone}>
                    {strengthHint(randomEntropy).label}
                  </Badge>
                  <span className="font-mono">
                    {randomEntropy.toFixed(1)} bits of entropy
                  </span>
                  <span>· pool of {pool.length} characters</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">
                Enable a character class above to generate a password.
              </p>
            )}
          </Panel>
        </>
      ) : (
        <>
          <Panel title="Options">
            <div className="space-y-4">
              <Slider
                id="pp-words"
                label="Word count"
                valueLabel={`${wordCount}`}
                min={3}
                max={8}
                value={wordCount}
                onChange={setWordCount}
              />
              <Field label="Separator" htmlFor="pp-sep">
                <Select
                  id="pp-sep"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value as Sep)}
                  options={[
                    { value: '-', label: 'Hyphen ( - )' },
                    { value: '.', label: 'Dot ( . )' },
                    { value: ' ', label: 'Space (   )' },
                    { value: '_', label: 'Underscore ( _ )' },
                  ]}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  id="pp-cap"
                  checked={capitalize}
                  onChange={setCapitalize}
                  label="Capitalize each word"
                />
                <Toggle
                  id="pp-num"
                  checked={appendNumber}
                  onChange={setAppendNumber}
                  label="Append a number"
                />
              </div>
            </div>
          </Panel>

          <Panel
            title="Generated passphrase"
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={generatePassphrase}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
            }
          >
            <div className="space-y-2">
              <ResultBlock
                label="Passphrase"
                value={passphrase}
                valueClassName="text-base"
              />
              <div className="flex items-center gap-2 text-xs text-muted">
                <Badge tone={strengthHint(passphraseEntropy).tone}>
                  {strengthHint(passphraseEntropy).label}
                </Badge>
                <span className="font-mono">
                  {passphraseEntropy.toFixed(1)} bits of entropy
                </span>
                <span>· {WORDS.length}-word list</span>
              </div>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
