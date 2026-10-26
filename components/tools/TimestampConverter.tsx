'use client';

import { useMemo, useState } from 'react';
import { FileText, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';
import {
  dateToUnixSeconds,
  filetimeToDate,
  hfsToDate,
  isoUtc,
  macAbsoluteToDate,
  relativeTime,
  unixMillisToDate,
  unixSecondsToDate,
  webkitToDate,
} from '@/lib/format';

type TsType =
  | 'unixSeconds'
  | 'unixMillis'
  | 'filetime'
  | 'webkit'
  | 'macAbsolute'
  | 'hfs';

const TYPES: { value: TsType; label: string }[] = [
  { value: 'unixSeconds', label: 'Unix seconds (since 1970)' },
  { value: 'unixMillis', label: 'Unix milliseconds' },
  { value: 'filetime', label: 'Windows FILETIME (100-ns since 1601)' },
  { value: 'webkit', label: 'Chrome / WebKit (µs since 1601)' },
  { value: 'macAbsolute', label: 'Mac / Cocoa absolute (s since 2001)' },
  { value: 'hfs', label: 'HFS+ (s since 1904)' },
];

const CONVERTERS: Record<TsType, (n: number) => Date | null> = {
  unixSeconds: unixSecondsToDate,
  unixMillis: unixMillisToDate,
  filetime: filetimeToDate,
  webkit: webkitToDate,
  macAbsolute: macAbsoluteToDate,
  hfs: hfsToDate,
};

function toLocalInputValue(d: Date): string {
  // datetime-local expects YYYY-MM-DDTHH:mm in local time.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function TimestampConverter() {
  const [value, setValue] = useState('');
  const [type, setType] = useState<TsType>('unixSeconds');
  const [dateInput, setDateInput] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const decoded = useMemo<
    | { kind: 'error'; msg: string }
    | { kind: 'invalid' }
    | { kind: 'ok'; iso: string; local: string; relative: string }
    | null
  >(() => {
    const raw = value.trim();
    if (raw === '') return null;
    if (!/^-?\d+(\.\d+)?$/.test(raw)) {
      return { kind: 'error', msg: 'Enter a numeric timestamp.' };
    }
    const n = Number(raw);
    if (!Number.isFinite(n))
      return { kind: 'error', msg: 'Number is too large to parse.' };
    const d = CONVERTERS[type](n);
    if (!d) return { kind: 'invalid' };
    return {
      kind: 'ok',
      iso: isoUtc(d),
      local: d.toLocaleString(),
      relative: relativeTime(d.getTime()),
    };
  }, [value, type]);

  const encoded = useMemo<
    | { kind: 'error'; msg: string }
    | { kind: 'ok'; seconds: number; millis: number; iso: string }
    | null
  >(() => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime()))
      return { kind: 'error', msg: 'Pick a valid date & time.' };
    return {
      kind: 'ok',
      seconds: dateToUnixSeconds(d),
      millis: d.getTime(),
      iso: isoUtc(d),
    };
  }, [dateInput]);

  const nowDate = new Date(now);

  return (
    <div className="space-y-4">
      <Panel
        title="Decode a timestamp"
        actions={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setValue('1700000000');
                setType('unixSeconds');
              }}
            >
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setValue('')}
              disabled={!value}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Timestamp value" htmlFor="ts-value">
              <Input
                id="ts-value"
                mono
                invalid={decoded?.kind === 'error'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="1700000000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Interpret as" htmlFor="ts-type">
              <Select
                id="ts-type"
                value={type}
                onChange={(e) => setType(e.target.value as TsType)}
                options={TYPES}
              />
            </Field>
          </div>

          {decoded?.kind === 'error' && (
            <InlineError>{decoded.msg}</InlineError>
          )}
          {decoded?.kind === 'invalid' && (
            <p className="text-sm text-warning">Out of range / invalid.</p>
          )}
          {decoded?.kind === 'ok' && (
            <div className="space-y-2">
              <ResultBlock label="ISO 8601 (UTC)" value={decoded.iso} />
              <ResultBlock
                label="Local time"
                value={decoded.local}
                mono={false}
              />
              <ResultBlock
                label="Relative"
                value={decoded.relative}
                mono={false}
                copy={false}
              />
            </div>
          )}
          {!value && (
            <p className="text-sm text-muted">
              Enter a number and choose its epoch to convert it to a date.
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Encode from a date">
        <div className="space-y-3">
          <Field label="Date & time (local)" htmlFor="ts-date">
            <Input
              id="ts-date"
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </Field>
          {encoded?.kind === 'error' && (
            <InlineError>{encoded.msg}</InlineError>
          )}
          {encoded?.kind === 'ok' && (
            <div className="space-y-2">
              <ResultBlock
                label="Unix seconds"
                value={String(encoded.seconds)}
              />
              <ResultBlock
                label="Unix milliseconds"
                value={String(encoded.millis)}
              />
              <ResultBlock label="ISO 8601 (UTC)" value={encoded.iso} />
            </div>
          )}
          {!dateInput && (
            <p className="text-sm text-muted">
              Pick a date to get its Unix timestamp.
            </p>
          )}
        </div>
      </Panel>

      <Panel
        title="Now"
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setNow(Date.now())}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        }
      >
        <div className="space-y-2">
          <ResultBlock
            label="Unix seconds"
            value={String(Math.floor(now / 1000))}
          />
          <ResultBlock label="Unix milliseconds" value={String(now)} />
          <ResultBlock label="ISO 8601 (UTC)" value={isoUtc(nowDate)} />
          <p className="text-2xs text-muted">
            Local: {nowDate.toLocaleString()} ·{' '}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => {
                setDateInput(toLocalInputValue(nowDate));
              }}
            >
              use as date above
            </button>
          </p>
        </div>
      </Panel>
    </div>
  );
}
