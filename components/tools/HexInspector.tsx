'use client';

import { useMemo, useState } from 'react';
import { Loader2, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { FileDrop } from '@/components/ui/FileDrop';
import { HexView, type HexHighlight } from '@/components/ui/HexView';
import {
  Field,
  InlineError,
  Panel,
  PrivacyNote,
} from '@/components/ui/ToolShell';
import { DecodeError, hexToBytes, utf8ToBytes } from '@/lib/encoding';
import { readFileSlice } from '@/lib/file';
import { bytesToHuman } from '@/lib/format';

const MAX_FILE_BYTES = 16 * 1024 * 1024; // 16 MB

type Source = 'file' | 'paste';
type PasteMode = 'hex' | 'utf8';
type SearchMode = 'hex' | 'ascii';

const SAMPLE = 'ForensiKit hex inspector — drop a file or paste bytes.';

/** Find every (possibly overlapping) occurrence of `needle` in `hay`. */
function findAll(hay: Uint8Array, needle: Uint8Array): HexHighlight[] {
  const out: HexHighlight[] = [];
  if (needle.length === 0 || needle.length > hay.length) return out;
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) continue outer;
    }
    out.push({ start: i, end: i + needle.length });
  }
  return out;
}

export default function HexInspector() {
  const [source, setSource] = useState<Source>('file');

  // File state
  const [fileBytes, setFileBytes] = useState<Uint8Array>(new Uint8Array());
  const [fileTruncated, setFileTruncated] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Paste state
  const [pasteText, setPasteText] = useState('');
  const [pasteMode, setPasteMode] = useState<PasteMode>('hex');

  // Controls
  const [jumpInput, setJumpInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('ascii');
  const [scrollToOffset, setScrollToOffset] = useState<number | null>(null);

  const { bytes, pasteError } = useMemo(() => {
    if (source === 'file')
      return { bytes: fileBytes, pasteError: null as string | null };
    if (!pasteText) return { bytes: new Uint8Array(), pasteError: null };
    try {
      const b =
        pasteMode === 'hex' ? hexToBytes(pasteText) : utf8ToBytes(pasteText);
      return { bytes: b, pasteError: null };
    } catch (e) {
      const msg =
        e instanceof DecodeError ? e.message : 'Could not parse the input.';
      return { bytes: new Uint8Array(), pasteError: msg };
    }
  }, [source, fileBytes, pasteText, pasteMode]);

  const { highlights, searchError } = useMemo(() => {
    if (!searchInput || bytes.length === 0)
      return {
        highlights: [] as HexHighlight[],
        searchError: null as string | null,
      };
    try {
      const needle =
        searchMode === 'hex'
          ? hexToBytes(searchInput)
          : utf8ToBytes(searchInput);
      if (needle.length === 0)
        return { highlights: [] as HexHighlight[], searchError: null };
      return { highlights: findAll(bytes, needle), searchError: null };
    } catch (e) {
      const msg =
        e instanceof DecodeError ? e.message : 'Invalid search pattern.';
      return { highlights: [] as HexHighlight[], searchError: msg };
    }
  }, [searchInput, searchMode, bytes]);

  async function loadFile(file: File) {
    setFileError(null);
    setBusy(true);
    setScrollToOffset(null);
    try {
      const end = Math.min(file.size, MAX_FILE_BYTES);
      const b = await readFileSlice(file, 0, end);
      setFileBytes(b);
      setFileTruncated(file.size > MAX_FILE_BYTES);
      setFileName(file.name);
    } catch {
      setFileError('Failed to read the file.');
      setFileBytes(new Uint8Array());
      setFileName(null);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setFileBytes(new Uint8Array());
    setFileTruncated(false);
    setFileName(null);
    setFileError(null);
    setPasteText('');
    setJumpInput('');
    setSearchInput('');
    setScrollToOffset(null);
  }

  function doJump() {
    const raw = jumpInput.trim();
    if (!raw) return;
    const n = /^0x/i.test(raw) ? parseInt(raw, 16) : parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return;
    setScrollToOffset(Math.min(n, Math.max(0, bytes.length - 1)));
  }

  function jumpToFirstMatch() {
    if (highlights.length > 0) setScrollToOffset(highlights[0].start);
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Source"
        actions={
          <>
            <Tabs
              tabs={[
                { value: 'file', label: 'File' },
                { value: 'paste', label: 'Paste' },
              ]}
              value={source}
              onChange={(v) => setSource(v)}
            />
            <Button size="sm" variant="ghost" onClick={clearAll}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        {source === 'file' ? (
          <div className="space-y-3">
            <FileDrop
              onFile={loadFile}
              onClear={clearAll}
              busy={busy}
              hint={`Up to the first ${bytesToHuman(MAX_FILE_BYTES)} are loaded for viewing.`}
            />
            {busy && (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
              </p>
            )}
            {fileTruncated && (
              <p className="rounded-input border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                Large file — only the first {bytesToHuman(MAX_FILE_BYTES)} of{' '}
                {fileName ?? 'the file'} are shown.
              </p>
            )}
            {fileError && <p className="text-xs text-danger">{fileError}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Interpret pasted text as" htmlFor="hex-paste-mode">
              <Select
                id="hex-paste-mode"
                value={pasteMode}
                onChange={(e) => setPasteMode(e.target.value as PasteMode)}
                options={[
                  { value: 'hex', label: 'Hex' },
                  { value: 'utf8', label: 'UTF-8 text' },
                ]}
              />
            </Field>
            <Field label="Bytes" htmlFor="hex-paste-input">
              <TextArea
                id="hex-paste-input"
                mono
                invalid={!!pasteError}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={
                  pasteMode === 'hex'
                    ? 'e.g. 48 65 6c 6c 6f'
                    : 'Type or paste text…'
                }
              />
            </Field>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPasteText(SAMPLE)}
              disabled={!!pasteText}
            >
              Load sample
            </Button>
            {pasteError && <InlineError>{pasteError}</InlineError>}
          </div>
        )}
      </Panel>

      <Panel title="Inspector">
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Jump to offset" htmlFor="hex-jump" className="w-40">
              <div className="flex gap-2">
                <Input
                  id="hex-jump"
                  mono
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') doJump();
                  }}
                  placeholder="0x100 or 256"
                />
                <Button size="md" variant="secondary" onClick={doJump}>
                  Go
                </Button>
              </div>
            </Field>
            <Field
              label="Search"
              htmlFor="hex-search"
              className="min-w-[12rem] flex-1"
            >
              <div className="flex gap-2">
                <Input
                  id="hex-search"
                  mono={searchMode === 'hex'}
                  value={searchInput}
                  invalid={!!searchError}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') jumpToFirstMatch();
                  }}
                  placeholder={
                    searchMode === 'hex' ? 'e.g. 89 50 4e 47' : 'e.g. PNG'
                  }
                />
                <Button
                  size="md"
                  variant="secondary"
                  onClick={jumpToFirstMatch}
                >
                  <Search className="h-4 w-4" /> Find
                </Button>
              </div>
            </Field>
            <Field label="Pattern" htmlFor="hex-search-mode" className="w-32">
              <Select
                id="hex-search-mode"
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value as SearchMode)}
                options={[
                  { value: 'ascii', label: 'ASCII' },
                  { value: 'hex', label: 'Hex' },
                ]}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Badge tone="default">{bytes.length.toLocaleString()} bytes</Badge>
            {searchInput && !searchError && (
              <Badge tone={highlights.length ? 'success' : 'warning'}>
                {highlights.length
                  ? `✓ ${highlights.length} match${highlights.length === 1 ? '' : 'es'}`
                  : '✗ no matches'}
              </Badge>
            )}
            {searchError && <InlineError>{searchError}</InlineError>}
          </div>

          {bytes.length > 0 ? (
            <HexView
              bytes={bytes}
              height={460}
              highlights={highlights}
              scrollToOffset={scrollToOffset}
            />
          ) : (
            <p className="rounded-input border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-muted">
              Drop a file or paste bytes to view them in hex.
            </p>
          )}
        </div>
      </Panel>

      <PrivacyNote>
        Bytes are read and rendered entirely in your browser; nothing is
        uploaded. For files, only the first {bytesToHuman(MAX_FILE_BYTES)} are
        loaded into memory for the hex view so large files stay responsive.
      </PrivacyNote>
    </div>
  );
}
