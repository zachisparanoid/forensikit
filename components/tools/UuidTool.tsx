'use client';

import { useMemo, useState } from 'react';
import { FileText, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';
import { bytesToHex } from '@/lib/encoding';
import { isoUtc, relativeTime } from '@/lib/format';

type Tab = 'generate' | 'decode';
type Version = 'v4' | 'v7';

const SAMPLE_UUID = '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatUuid(bytes: Uint8Array): string {
  const h = bytesToHex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function generateV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  return formatUuid(b);
}

function generateV7(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  const ms = Date.now();
  // 48-bit big-endian timestamp in the first 6 bytes.
  b[0] = (ms / 2 ** 40) & 0xff;
  b[1] = (ms / 2 ** 32) & 0xff;
  b[2] = (ms / 2 ** 24) & 0xff;
  b[3] = (ms / 2 ** 16) & 0xff;
  b[4] = (ms / 2 ** 8) & 0xff;
  b[5] = ms & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70; // version 7
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  return formatUuid(b);
}

function variantName(uuid: string): string {
  const n = parseInt(uuid.replace(/-/g, '').charAt(16), 16);
  if ((n & 0x8) === 0) return 'NCS (reserved, legacy)';
  if ((n & 0xc) === 0x8) return 'RFC 4122 / 9562 (10xx)';
  if ((n & 0xe) === 0xc) return 'Microsoft (110x)';
  return 'Reserved (future)';
}

function decodeV7Timestamp(uuid: string): number {
  const hex = uuid.replace(/-/g, '').slice(0, 12);
  return parseInt(hex, 16); // 48-bit ms, safe within Number.MAX_SAFE_INTEGER
}

export default function UuidTool() {
  const [tab, setTab] = useState<Tab>('generate');

  // Generate
  const [version, setVersion] = useState<Version>('v4');
  const [count, setCount] = useState(5);
  const [list, setList] = useState<string[]>([]);

  // Decode
  const [input, setInput] = useState('');

  function regenerate(n = count, v = version) {
    const safe = Math.max(1, Math.min(50, Math.floor(n) || 1));
    const out: string[] = [];
    for (let i = 0; i < safe; i++) {
      out.push(v === 'v4' ? generateV4() : generateV7());
    }
    setList(out);
  }

  const decoded = useMemo<
    | { kind: 'error'; msg: string }
    | {
        kind: 'ok';
        result: {
          version: number;
          variant: string;
          timestamp?: { iso: string; relative: string; ms: number } | 'invalid';
        };
      }
    | null
  >(() => {
    const value = input.trim();
    if (!value) return null;
    if (!UUID_RE.test(value)) {
      return {
        kind: 'error',
        msg: 'Not a valid UUID (expected 8-4-4-4-12 hex format).',
      };
    }
    const verNibble = value.replace(/-/g, '').charAt(12);
    const ver = parseInt(verNibble, 16);
    const result: {
      version: number;
      variant: string;
      timestamp?: { iso: string; relative: string; ms: number } | 'invalid';
    } = { version: ver, variant: variantName(value) };
    if (ver === 7) {
      const ms = decodeV7Timestamp(value);
      if (Number.isFinite(ms) && Math.abs(ms) <= 8.64e15) {
        const d = new Date(ms);
        result.timestamp = {
          iso: isoUtc(d),
          relative: relativeTime(ms),
          ms,
        };
      } else {
        result.timestamp = 'invalid';
      }
    }
    return { kind: 'ok', result };
  }, [input]);

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { value: 'generate', label: 'Generate' },
          { value: 'decode', label: 'Decode' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'generate' ? (
        <>
          <Panel
            title="Options"
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => regenerate()}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Generate
              </Button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Version" htmlFor="uuid-version">
                <Select
                  id="uuid-version"
                  value={version}
                  onChange={(e) => {
                    const v = e.target.value as Version;
                    setVersion(v);
                    regenerate(count, v);
                  }}
                  options={[
                    { value: 'v4', label: 'v4 — random' },
                    { value: 'v7', label: 'v7 — time-ordered (RFC 9562)' },
                  ]}
                />
              </Field>
              <Field label="How many (1–50)" htmlFor="uuid-count">
                <Input
                  id="uuid-count"
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setCount(n);
                    if (n >= 1 && n <= 50) regenerate(n, version);
                  }}
                />
              </Field>
            </div>
          </Panel>

          <Panel
            title="Generated UUIDs"
            actions={
              list.length > 0 ? (
                <CopyButton value={list.join('\n')} label="Copy all" />
              ) : undefined
            }
          >
            {list.length === 0 ? (
              <p className="text-sm text-muted">
                Press Generate to create UUIDs.
              </p>
            ) : (
              <div className="space-y-1.5">
                {list.map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-input border border-border bg-surface px-3 py-1.5"
                  >
                    <code className="break-all font-mono text-13 text-text">
                      {u}
                    </code>
                    <CopyButton value={u} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      ) : (
        <>
          <Panel
            title="Decode a UUID"
            actions={
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setInput(SAMPLE_UUID)}
                >
                  <FileText className="h-3.5 w-3.5" /> Load sample
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setInput('')}
                  disabled={!input}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </Button>
              </>
            }
          >
            <Field label="UUID" htmlFor="uuid-input">
              <Input
                id="uuid-input"
                mono
                invalid={decoded?.kind === 'error'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b"
              />
              {decoded?.kind === 'error' && (
                <InlineError>{decoded.msg}</InlineError>
              )}
            </Field>
          </Panel>

          {decoded?.kind === 'ok' && (
            <Panel title="Details">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">Version {decoded.result.version}</Badge>
                  <Badge tone="default">{decoded.result.variant}</Badge>
                </div>
                {decoded.result.timestamp === 'invalid' ? (
                  <p className="text-sm text-warning">
                    Out of range / invalid embedded timestamp.
                  </p>
                ) : decoded.result.timestamp ? (
                  <>
                    <ResultBlock
                      label="Embedded timestamp (ISO 8601 UTC)"
                      value={decoded.result.timestamp.iso}
                    />
                    <ResultBlock
                      label="Relative"
                      value={decoded.result.timestamp.relative}
                      copy={false}
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    This version does not embed a timestamp.
                  </p>
                )}
              </div>
            </Panel>
          )}

          {!input && (
            <p className="text-sm text-muted">
              Paste a UUID to inspect its version, variant, and (for v7) the
              embedded creation time.
            </p>
          )}
        </>
      )}
    </div>
  );
}
