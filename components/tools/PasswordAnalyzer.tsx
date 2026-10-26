'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, FileText, Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Field, Panel, PrivacyNote } from '@/components/ui/ToolShell';
import { analyzePassword, crackTimes, SCORE_LABELS } from '@/lib/password';
import { useDebouncedValue } from '@/lib/hooks';
import { cn } from '@/lib/cn';

const SAMPLE = 'Tr0ub4dour&3';

const SCORE_TONE = ['danger', 'danger', 'warning', 'info', 'success'] as const;
const SEGMENT_BG = [
  'bg-danger',
  'bg-danger',
  'bg-warning',
  'bg-info',
  'bg-success',
] as const;

export default function PasswordAnalyzer() {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const debounced = useDebouncedValue(pw, 150);

  const report = useMemo(() => analyzePassword(debounced), [debounced]);
  const times = useMemo(
    () => crackTimes(Math.pow(2, report.entropyBits)),
    [report.entropyBits],
  );

  const score = report.score;
  const tone = SCORE_TONE[score];

  return (
    <div className="space-y-4">
      <Panel
        title="Password"
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={() => setPw(SAMPLE)}>
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPw('')}
              disabled={!pw}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Password to analyze" htmlFor="pw-input">
            <div className="flex items-center gap-2">
              <Input
                id="pw-input"
                mono
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Type a password to test its strength…"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="h-10 shrink-0"
              >
                {show ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {show ? 'Hide' : 'Show'}
              </Button>
            </div>
          </Field>

          <div className="flex items-center gap-2 rounded-input border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              100% local — your password is analyzed in your browser and is
              never sent, stored, or uploaded anywhere.
            </span>
          </div>
        </div>
      </Panel>

      <Panel title="Strength">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text">
                {SCORE_LABELS[score]}
              </span>
              <div className="flex items-center gap-2">
                <Badge tone={tone}>score {score} / 4</Badge>
                {report.inDictionary && (
                  <Badge tone="danger">In common-password list</Badge>
                )}
              </div>
            </div>
            <div
              className="grid grid-cols-5 gap-1.5"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={score}
              aria-label={`Password strength: ${SCORE_LABELS[score]}`}
            >
              {[0, 1, 2, 3, 4].map((seg) => (
                <div
                  key={seg}
                  className={cn(
                    'h-2 rounded-full transition-colors',
                    seg <= score && debounced ? SEGMENT_BG[score] : 'bg-border',
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric label="Entropy" value={`${report.entropyBits} bits`} />
            <Metric
              label="Guesses (log10)"
              value={`10^${report.guessesLog10}`}
            />
            <Metric
              label="Dictionary"
              value={report.inDictionary ? 'Found ✗' : 'Not found ✓'}
            />
          </div>

          {!debounced && (
            <p className="text-xs text-muted">
              Enter a password above to see a live strength estimate. This shows
              the analysis of an empty password as a reference.
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Estimated time to crack">
        <p className="mb-2 text-xs text-muted">
          Estimates assume the attacker must search the full entropy space at
          the given guess rate.
        </p>
        <div className="space-y-2">
          <CrackRow
            label="Online attack (throttled)"
            hint="100 guesses / sec"
            value={times.onlineThrottled}
          />
          <CrackRow
            label="Offline attack (slow hash, e.g. bcrypt)"
            hint="10,000 guesses / sec"
            value={times.offlineSlowHash}
          />
          <CrackRow
            label="Offline attack (fast GPU, unsalted)"
            hint="10 billion guesses / sec"
            value={times.offlineFastHash}
          />
        </div>
      </Panel>

      {report.warnings.length > 0 && (
        <Panel title="Warnings">
          <ul className="space-y-1.5">
            {report.warnings.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-warning"
              >
                <span aria-hidden>⚠</span>
                <span className="text-secondary">{w}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {report.suggestions.length > 0 && (
        <Panel title="Suggestions">
          <ul className="space-y-1.5">
            {report.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span aria-hidden className="text-accent">
                  →
                </span>
                <span className="text-secondary">{s}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <PrivacyNote>
        Strength estimation uses a charset-entropy heuristic combined with
        dictionary and pattern penalties, running entirely on your device. No
        password ever leaves the page — there is no network request involved.
      </PrivacyNote>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-input border border-border bg-surface px-3 py-2">
      <div className="text-2xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm text-text">{value}</div>
    </div>
  );
}

function CrackRow({
  label,
  hint,
  value,
}: {
  label: string;
  hint: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-input border border-border bg-surface px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm text-text">{label}</p>
        <p className="text-2xs text-muted">{hint}</p>
      </div>
      <span className="shrink-0 font-mono text-sm font-semibold text-accent">
        {value}
      </span>
    </div>
  );
}
