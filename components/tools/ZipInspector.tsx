'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, FileArchive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { FileDrop } from '@/components/ui/FileDrop';
import { Panel, PrivacyNote } from '@/components/ui/ToolShell';
import { readFileAsBytes } from '@/lib/file';
import { bytesToHex, bytesToUtf8 } from '@/lib/encoding';
import { bytesToHuman } from '@/lib/format';

const EOCD_SIG = 0x06054b50;
const CDH_SIG = 0x02014b50;
const ZIP_BOMB_RATIO = 100;

const EXECUTABLE_EXTS = [
  '.exe',
  '.dll',
  '.scr',
  '.bat',
  '.js',
  '.vbs',
  '.sh',
  '.jar',
];

interface ZipEntry {
  name: string;
  method: number;
  compSize: number;
  uncompSize: number;
  crc32: number;
  modified: Date | null;
  flags: { traversal: boolean; executable: boolean; zeroByte: boolean };
}

interface ParsedZip {
  entries: ZipEntry[];
  totalComp: number;
  totalUncomp: number;
}

const utf8Decoder = new TextDecoder('utf-8');

function decodeDosDateTime(moddate: number, modtime: number): Date | null {
  const year = ((moddate >> 9) & 0x7f) + 1980;
  const month = (moddate >> 5) & 0x0f;
  const day = moddate & 0x1f;
  const hour = (modtime >> 11) & 0x1f;
  const min = (modtime >> 5) & 0x3f;
  const sec = (modtime & 0x1f) * 2;
  if (month < 1 || day < 1) return null;
  const d = new Date(year, month - 1, day, hour, min, sec);
  return Number.isNaN(d.getTime()) ? null : d;
}

function flagEntry(name: string, uncompSize: number) {
  const lower = name.toLowerCase();
  return {
    traversal: name.includes('../') || name.startsWith('/'),
    executable: EXECUTABLE_EXTS.some((ext) => lower.endsWith(ext)),
    zeroByte: uncompSize === 0 && !name.endsWith('/'),
  };
}

/** Parse the ZIP central directory by hand (no extraction). */
function parseCentralDirectory(bytes: Uint8Array): ParsedZip | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Scan backwards for the End Of Central Directory signature.
  let eocd = -1;
  const minStart = Math.max(0, bytes.length - 0xffff - 22);
  for (let i = bytes.length - 22; i >= minStart; i--) {
    if (view.getUint32(i, true) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const totalEntries = view.getUint16(eocd + 10, true);
  const cdSize = view.getUint32(eocd + 12, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  if (cdOffset + cdSize > bytes.length) return null;

  const entries: ZipEntry[] = [];
  let totalComp = 0;
  let totalUncomp = 0;
  let p = cdOffset;
  const cdEnd = cdOffset + cdSize;

  for (let n = 0; n < totalEntries && p + 46 <= cdEnd; n++) {
    if (view.getUint32(p, true) !== CDH_SIG) break;
    const method = view.getUint16(p + 10, true);
    const modtime = view.getUint16(p + 12, true);
    const moddate = view.getUint16(p + 14, true);
    const crc32 = view.getUint32(p + 16, true);
    const compSize = view.getUint32(p + 20, true);
    const uncompSize = view.getUint32(p + 24, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const nameBytes = bytes.subarray(p + 46, p + 46 + nameLen);
    const name = utf8Decoder.decode(nameBytes);

    entries.push({
      name,
      method,
      compSize,
      uncompSize,
      crc32,
      modified: decodeDosDateTime(moddate, modtime),
      flags: flagEntry(name, uncompSize),
    });
    totalComp += compSize;
    totalUncomp += uncompSize;
    p += 46 + nameLen + extraLen + commentLen;
  }

  return { entries, totalComp, totalUncomp };
}

interface Preview {
  name: string;
  text: string;
  isHex: boolean;
  truncated: boolean;
}

export default function ZipInspector() {
  const [parsed, setParsed] = useState<ParsedZip | null>(null);
  const [rawBytes, setRawBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [extractingName, setExtractingName] = useState<string | null>(null);

  const ratio = useMemo(() => {
    if (!parsed || parsed.totalComp === 0) return 0;
    return parsed.totalUncomp / parsed.totalComp;
  }, [parsed]);

  async function loadFile(file: File) {
    setError(null);
    setPreview(null);
    setBusy(true);
    try {
      const bytes = await readFileAsBytes(file);
      const result = parseCentralDirectory(bytes);
      if (!result) {
        setParsed(null);
        setRawBytes(null);
        setError(
          'No ZIP central directory was found. This may not be a ZIP archive, or it is corrupted/truncated.',
        );
        setFileName(null);
        return;
      }
      setParsed(result);
      setRawBytes(bytes);
      setFileName(file.name);
    } catch {
      setError('Failed to read the file.');
      setParsed(null);
      setRawBytes(null);
      setFileName(null);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setParsed(null);
    setRawBytes(null);
    setFileName(null);
    setError(null);
    setPreview(null);
    setExtractingName(null);
  }

  async function viewEntry(name: string) {
    if (!rawBytes) return;
    setExtractingName(name);
    setPreview(null);
    try {
      const { unzipSync } = await import('fflate');
      const all = unzipSync(rawBytes, { filter: (f) => f.name === name });
      const data = all[name];
      if (!data) {
        setError(`Could not extract "${name}".`);
        return;
      }
      const slice = data.subarray(0, 4096);
      let printable = 0;
      for (let i = 0; i < slice.length; i++) {
        const b = slice[i];
        if ((b >= 0x20 && b <= 0x7e) || b === 0x09 || b === 0x0a || b === 0x0d)
          printable++;
      }
      const mostlyPrintable =
        slice.length === 0 || printable / slice.length > 0.85;
      setPreview({
        name,
        text: mostlyPrintable ? bytesToUtf8(slice) : bytesToHex(slice, ' '),
        isHex: !mostlyPrintable,
        truncated: data.length > 4096,
      });
    } catch {
      setError(
        `Could not decompress "${name}" (unsupported method or corrupt data).`,
      );
    } finally {
      setExtractingName(null);
    }
  }

  const anyFlagged = parsed?.entries.some(
    (e) => e.flags.traversal || e.flags.executable || e.flags.zeroByte,
  );

  return (
    <div className="space-y-4">
      <Panel
        title="ZIP archive"
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
            accept=".zip,.jar,.apk,.docx,.xlsx,.pptx,.epub,.odt,application/zip"
            hint="The central directory is parsed locally. Entries are never auto-extracted."
          />
          {busy && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Parsing central
              directory…
            </p>
          )}
          {error && (
            <p className="rounded-input border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      </Panel>

      {parsed && (
        <>
          {ratio > ZIP_BOMB_RATIO && (
            <div
              className="flex items-start gap-2 rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">
                  Possible zip bomb — extreme compression ratio
                </p>
                <p className="mt-0.5 text-secondary">
                  Total uncompressed:compressed ratio is {ratio.toFixed(0)}:1.
                  Do not extract untrusted archives with ratios this high.
                </p>
              </div>
            </div>
          )}

          <Panel
            title={`Entries (${parsed.entries.length})`}
            actions={
              <div className="flex items-center gap-2 text-xs text-muted">
                <Badge tone={ratio > ZIP_BOMB_RATIO ? 'danger' : 'default'}>
                  ratio {ratio ? ratio.toFixed(1) : '0'}:1
                </Badge>
                {anyFlagged && (
                  <Badge tone="warning">
                    <AlertTriangle className="h-3 w-3" /> suspicious entries
                  </Badge>
                )}
              </div>
            }
          >
            <div className="overflow-auto rounded-input border border-border">
              <table className="w-full text-left text-13">
                <thead className="bg-card text-2xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Uncompressed</th>
                    <th className="px-3 py-2 font-semibold">Compressed</th>
                    <th className="px-3 py-2 font-semibold">CRC32</th>
                    <th className="px-3 py-2 font-semibold">Modified</th>
                    <th className="px-3 py-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.entries.map((e, i) => {
                    const flagged =
                      e.flags.traversal ||
                      e.flags.executable ||
                      e.flags.zeroByte;
                    const isDir = e.name.endsWith('/');
                    return (
                      <tr
                        key={`${e.name}-${i}`}
                        className="border-t border-border/60 align-top"
                      >
                        <td className="max-w-[24rem] px-3 py-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <code className="break-all font-mono text-text">
                              {e.name}
                            </code>
                            {e.flags.traversal && (
                              <Badge tone="danger">
                                <AlertTriangle className="h-3 w-3" /> path
                                traversal
                              </Badge>
                            )}
                            {e.flags.executable && (
                              <Badge tone="warning">executable</Badge>
                            )}
                            {e.flags.zeroByte && (
                              <Badge tone="warning">0 bytes</Badge>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-muted">
                          {bytesToHuman(e.uncompSize)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-muted">
                          {bytesToHuman(e.compSize)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-muted">
                          {(e.crc32 >>> 0).toString(16).padStart(8, '0')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted">
                          {e.modified ? e.modified.toLocaleString() : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {!isDir && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => viewEntry(e.name)}
                              disabled={extractingName !== null}
                            >
                              {extractingName === e.name ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                'View'
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {anyFlagged && (
              <p className="mt-2 text-xs text-muted">
                Flags: <strong>path traversal</strong> (writes outside the
                target dir), <strong>executable</strong> extension, and{' '}
                <strong>0-byte</strong> entries are common triage signals.
              </p>
            )}
          </Panel>

          {preview && (
            <Panel
              title={`Preview — ${preview.name}`}
              actions={<CopyButton value={preview.text} label="Copy" />}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <Badge tone={preview.isHex ? 'info' : 'default'}>
                  {preview.isHex ? 'hex (binary)' : 'text'}
                </Badge>
                {preview.truncated && (
                  <span>Showing the first 4 KB of the decompressed entry.</span>
                )}
              </div>
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-all rounded-input border border-border bg-surface p-3 font-mono text-13 text-text">
                {preview.text || '(empty)'}
              </pre>
            </Panel>
          )}
        </>
      )}

      <PrivacyNote>
        The archive is read into memory in your browser and its central
        directory is parsed by hand — entries are <strong>never</strong>{' '}
        auto-extracted, and nothing is uploaded. Choosing &quot;View&quot;
        decompresses only that single entry on demand (capped at 4 KB for
        display) <FileArchive className="inline h-3 w-3" />. Never extract
        untrusted archives, especially those with extreme compression ratios.
      </PrivacyNote>
    </div>
  );
}
