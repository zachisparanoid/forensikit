'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { FileDrop } from '@/components/ui/FileDrop';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field, Panel, PrivacyNote } from '@/components/ui/ToolShell';
import {
  createIncrementalHasher,
  hashesMatch,
  type StreamHashAlgo,
} from '@/lib/crypto/hashing';
import { streamFile } from '@/lib/file';

type Results = Partial<Record<StreamHashAlgo, string>>;

export default function FileHasher() {
  const [results, setResults] = useState<Results>({});
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [includeSha512, setIncludeSha512] = useState(false);
  const [expected, setExpected] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function hashFile(file: File) {
    setError(null);
    setResults({});
    setProgress(0);
    setBusy(true);
    const algos: StreamHashAlgo[] = ['MD5', 'SHA-1', 'SHA-256'];
    if (includeSha512) algos.push('SHA-512');
    const hashers = algos.map((a) => ({ a, h: createIncrementalHasher(a) }));
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamFile(
        file,
        (chunk) => {
          for (const { h } of hashers) h.update(chunk);
        },
        { onProgress: (f) => setProgress(f), signal: ac.signal },
      );
      const out: Results = {};
      for (const { a, h } of hashers) out[a] = h.finalizeHex();
      setResults(out);
    } catch (e) {
      if ((e as Error).name === 'AbortError') setError('Cancelled.');
      else setError('Failed to read the file.');
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const matchedAlgo = expected
    ? Object.entries(results).find(([, hex]) => hashesMatch(expected, hex))?.[0]
    : undefined;
  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="space-y-4">
      <Panel title="File">
        <div className="space-y-3">
          <Toggle
            checked={includeSha512}
            onChange={setIncludeSha512}
            label="Also compute SHA-512 (slower)"
            id="sha512-toggle"
          />
          <FileDrop
            onFile={hashFile}
            onClear={() => {
              setResults({});
              setExpected('');
              setError(null);
            }}
            busy={busy}
            hint="Hashes are computed in 8 MB chunks so the page stays responsive."
          />
          {busy && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Hashing… {Math.round(progress * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  className="text-danger hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </Panel>

      {hasResults && (
        <Panel title="Checksums">
          <div className="space-y-2">
            {Object.entries(results).map(([algo, hex]) => (
              <div
                key={algo}
                className="rounded-input border border-border bg-surface px-3 py-2"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-accent">
                    {algo}
                  </span>
                  <CopyButton value={hex} />
                </div>
                <code className="break-all font-mono text-13 text-text">
                  {hex}
                </code>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Field
              label="Compare with expected hash"
              htmlFor="expected-hash"
              hint="case-insensitive"
            >
              <Input
                id="expected-hash"
                mono
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="Paste a hash to verify integrity…"
              />
            </Field>
            {expected && (
              <div
                className={`mt-2 flex items-center gap-2 rounded-input border px-3 py-2 text-sm ${
                  matchedAlgo
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-danger/30 bg-danger/10 text-danger'
                }`}
              >
                {matchedAlgo ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Match — equals the {matchedAlgo} checksum.
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    No match against any computed checksum.
                  </>
                )}
              </div>
            )}
          </div>
        </Panel>
      )}

      <PrivacyNote>
        Your file is read directly in the browser via the File API and processed
        in chunks. It is never uploaded. MD5, SHA-1, and SHA-256 are computed
        incrementally so even multi-gigabyte files won&apos;t freeze the tab.
      </PrivacyNote>
    </div>
  );
}
