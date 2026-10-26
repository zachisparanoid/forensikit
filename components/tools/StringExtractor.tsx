'use client';

import { useMemo, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FileDrop } from '@/components/ui/FileDrop';
import {
  EmptyState,
  Field,
  Panel,
  PrivacyNote,
} from '@/components/ui/ToolShell';
import { downloadText, readFileSlice } from '@/lib/file';
import { bytesToHuman } from '@/lib/format';
import { extractStrings, type ExtractedString } from '@/lib/forensics/strings';

const MAX_BYTES = 32 * 1024 * 1024; // ~32 MB
const MAX_ROWS = 5000;

type Mode = 'ascii' | 'utf16le' | 'both';

export default function StringExtractor() {
  const [bytes, setBytes] = useState<Uint8Array>(new Uint8Array());
  const [fileName, setFileName] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [minLen, setMinLen] = useState(4);
  const [mode, setMode] = useState<Mode>('both');
  const [filter, setFilter] = useState('');

  const all = useMemo<ExtractedString[]>(() => {
    if (bytes.length === 0) return [];
    return extractStrings(bytes, Math.max(1, minLen), mode);
  }, [bytes, minLen, mode]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return all;
    return all.filter((s) => s.value.toLowerCase().includes(f));
  }, [all, filter]);

  const shown =
    filtered.length > MAX_ROWS ? filtered.slice(0, MAX_ROWS) : filtered;
  const hasFile = fileName !== null;

  async function loadFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const end = Math.min(file.size, MAX_BYTES);
      const b = await readFileSlice(file, 0, end);
      setBytes(b);
      setTruncated(file.size > MAX_BYTES);
      setFileName(file.name);
    } catch {
      setError('Failed to read the file.');
      setBytes(new Uint8Array());
      setFileName(null);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setBytes(new Uint8Array());
    setFileName(null);
    setTruncated(false);
    setError(null);
    setFilter('');
  }

  function exportTxt() {
    const text = filtered
      .map(
        (s) =>
          `${s.offset.toString(16).padStart(8, '0')}\t${s.encoding}\t${s.value}`,
      )
      .join('\n');
    const base = (fileName ?? 'strings').replace(/\.[^.]+$/, '');
    downloadText(text, `${base}.strings.txt`);
  }

  return (
    <div className="space-y-4">
      <Panel
        title="File"
        actions={
          hasFile ? (
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
            hint={`GNU strings-style extraction over the first ${bytesToHuman(MAX_BYTES)}.`}
          />
          {busy && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading…
            </p>
          )}
          {truncated && (
            <p className="rounded-input border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Large file — only the first {bytesToHuman(MAX_BYTES)} were
              scanned.
            </p>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </Panel>

      <Panel title="Options">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Min length" htmlFor="str-minlen">
            <Input
              id="str-minlen"
              type="number"
              min={1}
              max={64}
              value={minLen}
              onChange={(e) =>
                setMinLen(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </Field>
          <Field label="Encoding" htmlFor="str-mode">
            <Select
              id="str-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              options={[
                { value: 'ascii', label: 'ASCII' },
                { value: 'utf16le', label: 'UTF-16LE' },
                { value: 'both', label: 'Both' },
              ]}
            />
          </Field>
          <Field label="Filter" htmlFor="str-filter">
            <Input
              id="str-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Substring to match…"
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Strings"
        actions={
          hasFile ? (
            <>
              <Badge tone="default">
                {filtered.length.toLocaleString()} found
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                onClick={exportTxt}
                disabled={filtered.length === 0}
              >
                <Download className="h-3.5 w-3.5" /> Export .txt
              </Button>
            </>
          ) : undefined
        }
      >
        {!hasFile ? (
          <EmptyState message="Choose a file to extract printable ASCII and UTF-16LE strings — useful for spotting URLs, paths, keys, and other artifacts inside binaries." />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted">
            No strings matched the current options
            {filter ? ' and filter' : ''}.
          </p>
        ) : (
          <div className="space-y-2">
            {shown.length < filtered.length && (
              <p className="text-xs text-warning">
                Showing the first {MAX_ROWS.toLocaleString()} of{' '}
                {filtered.length.toLocaleString()} matches. Refine the filter or
                export to see them all.
              </p>
            )}
            <div className="max-h-[460px] overflow-auto rounded-input border border-border bg-surface">
              {shown.map((s, i) => (
                <div
                  key={`${s.offset}-${s.encoding}-${i}`}
                  className="flex items-start gap-3 border-b border-border/60 px-3 py-1.5 last:border-b-0"
                >
                  <span className="w-[72px] shrink-0 select-none font-mono text-2xs text-muted">
                    {s.offset.toString(16).padStart(8, '0')}
                  </span>
                  <span className="shrink-0">
                    <Badge tone={s.encoding === 'ascii' ? 'default' : 'info'}>
                      {s.encoding}
                    </Badge>
                  </span>
                  <code className="min-w-0 flex-1 break-all font-mono text-13 text-text">
                    {s.value}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <PrivacyNote>
        The file is read locally and scanned in your browser for runs of
        printable characters; nothing is uploaded. Only the first{' '}
        {bytesToHuman(MAX_BYTES)} are scanned and at most{' '}
        {MAX_ROWS.toLocaleString()} rows are rendered (use Export to capture the
        full result).
      </PrivacyNote>
    </div>
  );
}
