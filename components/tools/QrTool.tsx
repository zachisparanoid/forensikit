'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Download, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { FileDrop } from '@/components/ui/FileDrop';
import {
  Field,
  InlineError,
  Panel,
  PrivacyNote,
} from '@/components/ui/ToolShell';
import { useDebouncedValue } from '@/lib/hooks';
import { downloadBlob } from '@/lib/file';

type Tab = 'encode' | 'decode';
type EcLevel = 'L' | 'M' | 'Q' | 'H';

const SAMPLE = 'https://forensikit.example/tools/qr';

export default function QrTool() {
  const [tab, setTab] = useState<Tab>('encode');

  // Encode
  const [text, setText] = useState('');
  const [level, setLevel] = useState<EcLevel>('M');
  const [encodeError, setEncodeError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debText = useDebouncedValue(text, 200);

  // Decode
  const [decoded, setDecoded] = useState<string | null>(null);
  const [decodeMsg, setDecodeMsg] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const decodeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!debText) {
      setEncodeError(null);
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    QRCode.toCanvas(
      canvas,
      debText,
      { errorCorrectionLevel: level, width: 280, margin: 2 },
      (err) => {
        if (err) {
          setEncodeError(
            'Could not encode — the text may be too long for a QR code. Try a shorter value or a lower error-correction level.',
          );
        } else {
          setEncodeError(null);
        }
      },
    );
  }, [debText, level]);

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'qrcode.png');
    }, 'image/png');
  }

  async function handleImage(file: File) {
    setBusy(true);
    setDecoded(null);
    setDecodeMsg(null);
    setDecodeError(null);
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('load'));
        img.src = url;
      });
      const canvas =
        decodeCanvasRef.current ?? document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(url);
      if (!ctx) {
        setDecodeError('Could not read the image.');
        return;
      }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(data.data, data.width, data.height);
      if (result && result.data) {
        setDecoded(result.data);
      } else {
        setDecodeMsg('No QR code found in this image.');
      }
    } catch {
      setDecodeError('Could not load that file as an image.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { value: 'encode', label: 'Encode' },
          { value: 'decode', label: 'Decode' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'encode' ? (
        <>
          <Panel
            title="Text to encode"
            actions={
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setText(SAMPLE)}
                >
                  <FileText className="h-3.5 w-3.5" /> Load sample
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setText('')}
                  disabled={!text}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </Button>
              </>
            }
          >
            <div className="space-y-3">
              <Field label="Content" htmlFor="qr-text">
                <TextArea
                  id="qr-text"
                  mono={false}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="A URL, Wi-Fi config, vCard, or any text…"
                />
              </Field>
              <Field label="Error correction" htmlFor="qr-level">
                <Select
                  id="qr-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as EcLevel)}
                  options={[
                    { value: 'L', label: 'L — ~7% recovery (most data)' },
                    { value: 'M', label: 'M — ~15% recovery (default)' },
                    { value: 'Q', label: 'Q — ~25% recovery' },
                    { value: 'H', label: 'H — ~30% recovery (most robust)' },
                  ]}
                />
              </Field>
              {encodeError && <InlineError>{encodeError}</InlineError>}
            </div>
          </Panel>

          <Panel
            title="QR code"
            actions={
              debText && !encodeError ? (
                <Button size="sm" variant="secondary" onClick={downloadPng}>
                  <Download className="h-3.5 w-3.5" /> Download PNG
                </Button>
              ) : undefined
            }
          >
            {!debText ? (
              <p className="text-sm text-muted">
                Type some text to generate a QR code.
              </p>
            ) : (
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="rounded-input bg-white p-2"
                  aria-label="Generated QR code"
                  style={{ display: encodeError ? 'none' : 'block' }}
                />
              </div>
            )}
          </Panel>
        </>
      ) : (
        <>
          <Panel title="Decode a QR image">
            <FileDrop
              onFile={handleImage}
              onClear={() => {
                setDecoded(null);
                setDecodeMsg(null);
                setDecodeError(null);
              }}
              accept="image/*"
              busy={busy}
              hint="Drop a screenshot or photo containing a QR code (PNG, JPG, …)."
            />
            <canvas ref={decodeCanvasRef} className="hidden" />
            {decodeError && <InlineError>{decodeError}</InlineError>}
          </Panel>

          {decoded !== null && (
            <Panel
              title="Decoded content"
              actions={<CopyButton value={decoded} label="Copy" />}
            >
              <ResultBlock label="Text" value={decoded} mono={false} />
            </Panel>
          )}

          {decodeMsg && <p className="text-sm text-muted">{decodeMsg}</p>}

          <PrivacyNote>
            The image is decoded entirely in your browser using the Canvas API —
            it is never uploaded anywhere.
          </PrivacyNote>
        </>
      )}
    </div>
  );
}
