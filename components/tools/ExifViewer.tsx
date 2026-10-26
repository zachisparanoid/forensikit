'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Download,
  Loader2,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { FileDrop } from '@/components/ui/FileDrop';
import { cn } from '@/lib/cn';
import { EmptyState, Panel, PrivacyNote } from '@/components/ui/ToolShell';
import { downloadBlob } from '@/lib/file';
import { formatGps, osmLink, parseExif } from '@/lib/forensics/exif';
import type { ExifResult } from '@/lib/types';

interface FieldRow {
  label: string;
  value: string | number | undefined;
}

export default function ExifViewer() {
  const [result, setResult] = useState<ExifResult | null>(null);
  const [parsed, setParsed] = useState(false);
  const [fileRef, setFileRef] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawOpen, setRawOpen] = useState(false);
  const [stripNote, setStripNote] = useState<string | null>(null);

  async function loadFile(file: File) {
    setError(null);
    setStripNote(null);
    setParsed(false);
    setBusy(true);
    setFileRef(file);
    try {
      const r = await parseExif(file);
      setResult(r);
      setParsed(true);
    } catch {
      setError('Failed to read the image.');
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setResult(null);
    setParsed(false);
    setFileRef(null);
    setError(null);
    setRawOpen(false);
    setStripNote(null);
  }

  async function stripMetadata() {
    if (!fileRef) return;
    setStripNote(null);
    const isJpeg =
      /jpe?g/i.test(fileRef.type) || /\.jpe?g$/i.test(fileRef.name);
    const url = URL.createObjectURL(fileRef);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('decode failed'));
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(img, 0, 0);
      const mime = isJpeg ? 'image/jpeg' : 'image/png';
      const ext = isJpeg ? 'jpg' : 'png';
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('toBlob failed'));
              return;
            }
            const base = fileRef.name.replace(/\.[^.]+$/, '');
            downloadBlob(blob, `${base}.clean.${ext}`);
            resolve();
          },
          mime,
          isJpeg ? 0.95 : undefined,
        );
      });
      setStripNote('Clean copy downloaded — re-encoded without metadata.');
    } catch {
      setStripNote(
        'Could not redraw this image to a canvas (some formats like HEIC are not drawable in-browser). Try a JPEG or PNG.',
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const fields: FieldRow[] = result
    ? [
        { label: 'Make', value: result.make },
        { label: 'Model', value: result.model },
        { label: 'Lens', value: result.lensModel },
        { label: 'Software', value: result.software },
        { label: 'Orientation', value: result.orientation },
        { label: 'Date taken', value: result.dateTimeOriginal },
      ]
    : [];
  const shownFields = fields.filter(
    (f) => f.value !== undefined && f.value !== '',
  );

  return (
    <div className="space-y-4">
      <Panel
        title="Image"
        actions={
          fileRef ? (
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
            accept="image/*"
            hint="JPEG, PNG, TIFF, HEIC and more — metadata is read locally."
          />
          {busy && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading metadata…
            </p>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </Panel>

      <div
        className="flex items-start gap-2 rounded-card border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning"
        role="note"
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Photos can leak your location</p>
          <p className="mt-0.5 text-secondary">
            Many phones embed GPS coordinates and timestamps in photos. Strip
            metadata before sharing images publicly to avoid revealing where and
            when they were taken.
          </p>
        </div>
      </div>

      {!parsed && !busy && (
        <Panel title="Metadata">
          <EmptyState message="Choose an image to inspect its EXIF/metadata — camera make and model, lens, software, capture date, and any embedded GPS coordinates." />
        </Panel>
      )}

      {parsed && !result && (
        <Panel title="Metadata">
          <p className="text-sm text-muted">
            No EXIF/metadata found in this image.
          </p>
        </Panel>
      )}

      {result && (
        <>
          <Panel
            title="Fields"
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={stripMetadata}
                disabled={!fileRef}
              >
                <Download className="h-3.5 w-3.5" /> Strip metadata &amp;
                download clean copy
              </Button>
            }
          >
            {shownFields.length === 0 ? (
              <p className="text-sm text-muted">
                Metadata was present but none of the common fields were set.
              </p>
            ) : (
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {shownFields.map((f) => (
                  <div key={f.label} className="flex flex-col">
                    <dt className="text-2xs font-semibold uppercase tracking-wider text-muted">
                      {f.label}
                    </dt>
                    <dd className="break-words text-sm text-text">
                      {String(f.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {result.gps && (
              <div className="mt-4 rounded-input border border-danger/30 bg-danger/10 px-3 py-2.5">
                <p className="mb-1 inline-flex items-center gap-1.5 text-sm font-semibold text-danger">
                  <MapPin className="h-4 w-4" /> GPS location embedded
                </p>
                <p className="font-mono text-13 text-text">
                  {formatGps(result.gps.lat, result.gps.lng)}
                </p>
                <a
                  href={osmLink(result.gps.lat, result.gps.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-accent underline hover:text-accent-strong"
                >
                  View on OpenStreetMap
                </a>
              </div>
            )}

            {stripNote && (
              <p className="mt-3 text-xs text-muted">{stripNote}</p>
            )}
          </Panel>

          <Panel title="Raw metadata">
            <button
              type="button"
              onClick={() => setRawOpen((o) => !o)}
              aria-expanded={rawOpen}
              className="flex w-full items-center justify-between gap-2 text-left text-sm text-secondary hover:text-text"
            >
              <span>
                {rawOpen ? 'Hide' : 'Show'} all parsed metadata (JSON)
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  rawOpen && 'rotate-180',
                )}
              />
            </button>
            {rawOpen && (
              <div className="mt-3">
                <div className="mb-2 flex justify-end">
                  <CopyButton
                    value={JSON.stringify(result.raw, null, 2)}
                    label="Copy JSON"
                  />
                </div>
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-all rounded-input border border-border bg-surface p-3 font-mono text-13 text-text">
                  {JSON.stringify(result.raw, null, 2)}
                </pre>
              </div>
            )}
          </Panel>
        </>
      )}

      <PrivacyNote>
        Image metadata is parsed entirely in your browser; the image is never
        uploaded. The &quot;Strip metadata&quot; action re-draws the image onto
        a canvas and re-encodes it (PNG, or JPEG for JPEGs), which discards
        EXIF, GPS, and other embedded tags.
      </PrivacyNote>
    </div>
  );
}
