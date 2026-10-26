'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { FileDrop } from '@/components/ui/FileDrop';
import {
  EmptyState,
  Field,
  Panel,
  PrivacyNote,
} from '@/components/ui/ToolShell';
import { bytesToHex, bytesToUtf8 } from '@/lib/encoding';
import { formatNumber } from '@/lib/format';

const MAX_PIXELS = 4_000_000;
const LSB_BYTE_CAP = 2048; // ~2 KB of extracted bytes

type Channel = 'r' | 'g' | 'b' | 'a';
const CHANNEL_OFFSET: Record<Channel, number> = { r: 0, g: 1, b: 2, a: 3 };

export default function StegoLsbHelper() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tooBig, setTooBig] = useState(false);

  // Bit-plane preview controls
  const [channels, setChannels] = useState<Record<Channel, boolean>>({
    r: true,
    g: false,
    b: false,
    a: false,
  });
  const [bit, setBit] = useState(0);

  // LSB stream extraction controls
  const [streamChannel, setStreamChannel] = useState<Channel>('r');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function loadFile(file: File) {
    setError(null);
    setBusy(true);
    setImageData(null);
    setDims(null);
    setTooBig(false);
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('decode failed'));
        img.src = url;
      });
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w * h > MAX_PIXELS) {
        setTooBig(true);
        setDims({ w, h });
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(img, 0, 0);
      setImageData(ctx.getImageData(0, 0, w, h));
      setDims({ w, h });
    } catch {
      setError(
        'Could not load this image. Try a PNG or BMP — lossy/unsupported formats may not decode here.',
      );
      setFileName(null);
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
    }
  }

  function clearAll() {
    setImageData(null);
    setDims(null);
    setFileName(null);
    setError(null);
    setTooBig(false);
  }

  // Render selected bit-plane(s) to the preview canvas.
  useEffect(() => {
    if (!imageData || !canvasRef.current) return;
    const { width, height, data } = imageData;
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const out = ctx.createImageData(width, height);
    const active = (['r', 'g', 'b', 'a'] as Channel[]).filter(
      (c) => channels[c],
    );
    const offsets = active.map((c) => CHANNEL_OFFSET[c]);
    for (let i = 0; i < data.length; i += 4) {
      let on = false;
      for (const off of offsets) {
        if ((data[i + off] >> bit) & 1) {
          on = true;
          break;
        }
      }
      const v = on ? 255 : 0;
      out.data[i] = v;
      out.data[i + 1] = v;
      out.data[i + 2] = v;
      out.data[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }, [imageData, channels, bit]);

  // Extract LSB byte stream from the chosen channel, bit 0, MSB-first.
  const lsbStream = useMemo(() => {
    if (!imageData) return null;
    const { data } = imageData;
    const off = CHANNEL_OFFSET[streamChannel];
    const totalBytes = Math.min(LSB_BYTE_CAP, Math.floor(data.length / 4 / 8));
    const bytes = new Uint8Array(totalBytes);
    let bitsCollected = 0;
    let cur = 0;
    let byteIndex = 0;
    for (let i = off; i < data.length && byteIndex < totalBytes; i += 4) {
      cur = (cur << 1) | (data[i] & 1);
      bitsCollected++;
      if (bitsCollected === 8) {
        bytes[byteIndex++] = cur;
        cur = 0;
        bitsCollected = 0;
      }
    }
    let printable = 0;
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if ((b >= 0x20 && b <= 0x7e) || b === 0x09 || b === 0x0a || b === 0x0d)
        printable++;
    }
    return {
      text: bytesToUtf8(bytes),
      hex: bytesToHex(bytes, ' '),
      length: bytes.length,
      mostlyPrintable: bytes.length > 0 && printable / bytes.length > 0.85,
    };
  }, [imageData, streamChannel]);

  function toggleChannel(c: Channel) {
    setChannels((prev) => ({ ...prev, [c]: !prev[c] }));
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Image"
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
            accept="image/png,image/bmp,image/*"
            hint="Lossless formats (PNG, BMP) work best — JPEG re-compression destroys LSB data."
          />
          {busy && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Decoding image…
            </p>
          )}
          {tooBig && dims && (
            <p className="rounded-input border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Image is {formatNumber(dims.w)}×{formatNumber(dims.h)} ={' '}
              {formatNumber(dims.w * dims.h)} px, above the{' '}
              {formatNumber(MAX_PIXELS)} px cap. Skipped to keep the tab
              responsive — try a smaller image.
            </p>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </Panel>

      {!imageData && !busy && (
        <Panel title="Bit-plane preview">
          <EmptyState message="Choose a PNG or BMP to visualize its bit-planes and extract an LSB byte stream. This is an inspection aid for spotting hidden data, not a universal stego solver." />
        </Panel>
      )}

      {imageData && dims && (
        <>
          <Panel title="Bit-plane preview">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
                    Channels
                  </span>
                  {(['r', 'g', 'b', 'a'] as Channel[]).map((c) => (
                    <Toggle
                      key={c}
                      id={`stego-ch-${c}`}
                      checked={channels[c]}
                      onChange={() => toggleChannel(c)}
                      label={c.toUpperCase()}
                    />
                  ))}
                </div>
                <div className="min-w-[14rem] flex-1">
                  <Slider
                    id="stego-bit"
                    label="Bit plane"
                    valueLabel={bit === 0 ? 'bit 0 (LSB)' : `bit ${bit}`}
                    min={0}
                    max={7}
                    value={bit}
                    onChange={setBit}
                  />
                </div>
              </div>
              <div className="overflow-auto rounded-input border border-border bg-surface p-2">
                <canvas
                  ref={canvasRef}
                  className="max-w-full"
                  style={{ imageRendering: 'pixelated' }}
                  aria-label={`Bit-plane ${bit} preview`}
                />
              </div>
              <p className="text-xs text-muted">
                White pixels have a 1 in the selected bit of the active
                channel(s). Structure or readable shapes in the LSB plane often
                indicate hidden data; pure noise is typical of clean images.
              </p>
            </div>
          </Panel>

          <Panel title="LSB byte stream">
            <div className="space-y-3">
              <Field
                label="Source channel"
                htmlFor="stego-stream-ch"
                className="max-w-[12rem]"
              >
                <Select
                  id="stego-stream-ch"
                  value={streamChannel}
                  onChange={(e) => setStreamChannel(e.target.value as Channel)}
                  options={[
                    { value: 'r', label: 'Red' },
                    { value: 'g', label: 'Green' },
                    { value: 'b', label: 'Blue' },
                    { value: 'a', label: 'Alpha' },
                  ]}
                />
              </Field>
              <p className="text-xs text-muted">
                Bit 0 of each pixel&apos;s {streamChannel.toUpperCase()}{' '}
                channel, MSB-first, in row order. Showing the first{' '}
                {lsbStream?.length ?? 0} bytes.
              </p>

              {lsbStream && (
                <>
                  <div className="rounded-input border border-border bg-surface">
                    <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                      <Badge
                        tone={lsbStream.mostlyPrintable ? 'success' : 'default'}
                      >
                        {lsbStream.mostlyPrintable
                          ? '✓ mostly printable'
                          : 'as text'}
                      </Badge>
                      <CopyButton value={lsbStream.text} label="Copy text" />
                    </div>
                    <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap break-all p-3 font-mono text-13 text-text">
                      {lsbStream.text || '(empty)'}
                    </pre>
                  </div>
                  <div className="rounded-input border border-border bg-surface">
                    <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                      <Badge tone="info">hex</Badge>
                      <CopyButton value={lsbStream.hex} label="Copy hex" />
                    </div>
                    <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap break-all p-3 font-mono text-13 text-text">
                      {lsbStream.hex || '(empty)'}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </Panel>
        </>
      )}

      <p className="text-xs text-muted">
        This is an inspection aid, not a universal stego solver — real-world
        steganography uses many channels, bit orders, and encodings.{' '}
        <Link
          href="/learn/steganography"
          className="text-accent underline hover:text-accent-strong"
        >
          Learn how steganography works →
        </Link>
      </p>

      <PrivacyNote>
        The image is decoded to a canvas and analyzed entirely in your browser;
        nothing is uploaded. Images larger than {formatNumber(MAX_PIXELS)}{' '}
        pixels are skipped to keep the page responsive.
      </PrivacyNote>
    </div>
  );
}
