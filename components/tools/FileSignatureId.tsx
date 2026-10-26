'use client';

import { useState } from 'react';
import { AlertTriangle, FileSearch, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { FileDrop } from '@/components/ui/FileDrop';
import { EmptyState, Panel, PrivacyNote } from '@/components/ui/ToolShell';
import { readFileSlice } from '@/lib/file';
import {
  MAX_SIGNATURE_SCAN,
  checkExtension,
  leadingHex,
  matchSignatures,
  type ExtensionCheck,
} from '@/lib/forensics/signatures';
import type { SignatureMatch } from '@/lib/types';

interface Analysis {
  fileName: string;
  matches: SignatureMatch[];
  check: ExtensionCheck;
  hex: string;
}

export default function FileSignatureId() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(file: File) {
    setError(null);
    setBusy(true);
    try {
      const bytes = await readFileSlice(
        file,
        0,
        Math.min(file.size, MAX_SIGNATURE_SCAN),
      );
      const matches = matchSignatures(bytes);
      const check = checkExtension(file.name, matches);
      setAnalysis({
        fileName: file.name,
        matches,
        check,
        hex: leadingHex(bytes, 64),
      });
    } catch {
      setError('Failed to read the file.');
      setAnalysis(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel title="File">
        <div className="space-y-3">
          <FileDrop
            onFile={analyze}
            onClear={() => {
              setAnalysis(null);
              setError(null);
            }}
            busy={busy}
            hint={`Only the first ${MAX_SIGNATURE_SCAN} bytes are read to match magic numbers.`}
          />
          {busy && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading header
              bytes…
            </p>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </Panel>

      {!analysis && !busy && (
        <Panel title="Detected type">
          <EmptyState message="Choose a file to identify its true type from its magic-number signature and check it against the declared extension." />
        </Panel>
      )}

      {analysis && (
        <>
          {analysis.check.mismatch && (
            <div
              className="flex items-start gap-2 rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">
                  Possible disguised or renamed file
                </p>
                <p className="mt-0.5 text-secondary">
                  {analysis.check.message}
                </p>
              </div>
            </div>
          )}

          <Panel title="Detected type">
            {analysis.matches.length === 0 ? (
              <p className="text-sm text-muted">
                No known signature matched the header bytes. This may be plain
                text, an unknown format, or a fragment. The leading bytes are
                shown below for manual inspection.
              </p>
            ) : (
              <div className="space-y-2">
                {analysis.matches.map((m, i) => (
                  <div
                    key={`${m.ext}-${m.offset}-${i}`}
                    className="rounded-input border border-border bg-surface px-3 py-2"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-text">
                        {m.description}
                      </span>
                      <Badge
                        tone={m.confidence === 'exact' ? 'success' : 'warning'}
                      >
                        {m.confidence === 'exact'
                          ? '✓ exact match'
                          : 'likely match'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
                      <span>
                        ext: <span className="text-secondary">.{m.ext}</span>
                      </span>
                      <span>
                        MIME: <span className="text-secondary">{m.mime}</span>
                      </span>
                      <span>
                        offset:{' '}
                        <span className="text-secondary">{m.offset}</span>
                      </span>
                    </div>
                  </div>
                ))}
                {!analysis.check.mismatch && (
                  <p className="text-xs text-muted">{analysis.check.message}</p>
                )}
              </div>
            )}
          </Panel>

          <Panel
            title="Leading bytes (first 64)"
            actions={<CopyButton value={analysis.hex} label="Copy hex" />}
          >
            <code className="block break-all font-mono text-13 leading-relaxed text-text">
              {analysis.hex || '(empty file)'}
            </code>
          </Panel>
        </>
      )}

      <PrivacyNote>
        Files are inspected entirely in your browser. Only the first{' '}
        {MAX_SIGNATURE_SCAN} bytes are read to compare against a table of known
        magic numbers (file signatures). Nothing is ever uploaded.{' '}
        <FileSearch className="inline h-3 w-3" /> A mismatch between content and
        extension is a classic malware-triage and CTF signal.
      </PrivacyNote>
    </div>
  );
}
