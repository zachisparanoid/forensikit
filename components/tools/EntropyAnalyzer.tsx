'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileDrop } from '@/components/ui/FileDrop';
import { ByteHistogram, EntropyChart } from '@/components/ui/ByteHistogram';
import { EmptyState, Panel, PrivacyNote } from '@/components/ui/ToolShell';
import { readFileSlice } from '@/lib/file';
import { bytesToHuman } from '@/lib/format';
import { analyzeEntropy } from '@/lib/forensics/entropy';
import type { EntropyResult, EntropyVerdict } from '@/lib/types';

const MAX_BYTES = 64 * 1024 * 1024; // ~64 MB

function verdictBadge(v: EntropyVerdict): {
  tone: 'success' | 'warning' | 'danger';
  label: string;
} {
  switch (v) {
    case 'low':
      return { tone: 'success', label: 'low (likely text)' };
    case 'medium':
      return { tone: 'warning', label: 'medium' };
    case 'high (likely encrypted/compressed)':
      return { tone: 'danger', label: 'high (likely encrypted/compressed)' };
  }
}

export default function EntropyAnalyzer() {
  const [result, setResult] = useState<EntropyResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const end = Math.min(file.size, MAX_BYTES);
      const bytes = await readFileSlice(file, 0, end);
      setResult(analyzeEntropy(bytes));
      setTruncated(file.size > MAX_BYTES);
      setFileName(file.name);
    } catch {
      setError('Failed to read the file.');
      setResult(null);
      setFileName(null);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setResult(null);
    setFileName(null);
    setTruncated(false);
    setError(null);
  }

  const badge = result ? verdictBadge(result.verdict) : null;

  return (
    <div className="space-y-4">
      <Panel
        title="File"
        actions={
          fileName ? (
            <Button size="sm" variant="ghost" onClick={clearAll}>
              Clear
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-3">
          <FileDrop
            onFile={loadFile}
            onClear={clearAll}
            busy={busy}
            hint={`Shannon entropy is computed over the first ${bytesToHuman(MAX_BYTES)}.`}
          />
          {busy && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…
            </p>
          )}
          {truncated && (
            <p className="rounded-input border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Large file — only the first {bytesToHuman(MAX_BYTES)} were
              analyzed.
            </p>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </Panel>

      {!result && !busy && (
        <Panel title="Entropy">
          <EmptyState message="Choose a file to measure its randomness. High Shannon entropy (near 8 bits/byte) suggests encrypted or compressed data; low entropy suggests text or structured content." />
        </Panel>
      )}

      {result && badge && (
        <>
          <Panel title="Overall entropy">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="font-mono text-2xl font-semibold text-text">
                  {result.shannon.toFixed(2)}{' '}
                  <span className="text-base text-muted">/ 8.0 bits/byte</span>
                </p>
                {fileName && (
                  <p className="mt-0.5 text-xs text-muted">{fileName}</p>
                )}
              </div>
              <Badge tone={badge.tone}>{badge.label}</Badge>
            </div>
          </Panel>

          <Panel title="Byte distribution">
            <p className="mb-3 text-xs text-muted">
              Count of each byte value 0x00–0xFF. A flat distribution is typical
              of compressed or encrypted data; spikes reveal structure.
            </p>
            <ByteHistogram histogram={result.histogram} />
          </Panel>

          <Panel title="Entropy over the file">
            <p className="mb-3 text-xs text-muted">
              Sliding-window entropy across the file. Sustained values above the
              dashed 7.5 line (right axis 0–8) indicate packed or embedded
              high-entropy regions.
            </p>
            <EntropyChart samples={result.perByte} />
          </Panel>
        </>
      )}

      <PrivacyNote>
        Entropy is computed in your browser over the file&apos;s bytes; nothing
        is uploaded. Only the first {bytesToHuman(MAX_BYTES)} are read into
        memory so large files stay responsive.
      </PrivacyNote>
    </div>
  );
}
