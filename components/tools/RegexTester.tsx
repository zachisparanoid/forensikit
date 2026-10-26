'use client';

import { Fragment, useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';
import { useDebouncedValue } from '@/lib/hooks';

const SAMPLE_PATTERN = '(\\w+)@(\\w+\\.\\w+)';
const SAMPLE_TEXT =
  'Contact alice@example.com or bob@mail.co for details. Spam: noreply@nowhere.net';

const FLAGS = [
  { key: 'g', label: 'g · global' },
  { key: 'i', label: 'i · ignore case' },
  { key: 'm', label: 'm · multiline' },
  { key: 's', label: 's · dotAll' },
  { key: 'u', label: 'u · unicode' },
  { key: 'y', label: 'y · sticky' },
] as const;

type FlagKey = (typeof FLAGS)[number]['key'];

const TOKEN_DOCS: { test: RegExp; token: string; desc: string }[] = [
  { test: /\\d/, token: '\\d', desc: 'Any digit (0–9).' },
  { test: /\\D/, token: '\\D', desc: 'Any non-digit.' },
  {
    test: /\\w/,
    token: '\\w',
    desc: 'Word character: letter, digit or underscore.',
  },
  { test: /\\W/, token: '\\W', desc: 'Any non-word character.' },
  { test: /\\s/, token: '\\s', desc: 'Any whitespace character.' },
  { test: /\\S/, token: '\\S', desc: 'Any non-whitespace character.' },
  { test: /\\b/, token: '\\b', desc: 'Word boundary (zero-width).' },
  { test: /\\B/, token: '\\B', desc: 'Non-word-boundary.' },
  {
    test: /(?:^|[^\\])\^/,
    token: '^',
    desc: 'Start of string (or line with m).',
  },
  {
    test: /(?:^|[^\\])\$/,
    token: '$',
    desc: 'End of string (or line with m).',
  },
  {
    test: /(?:^|[^\\])\./,
    token: '.',
    desc: 'Any character except newline (all with s).',
  },
  {
    test: /(?:^|[^\\])\*/,
    token: '*',
    desc: 'Zero or more of the preceding token.',
  },
  {
    test: /(?:^|[^\\])\+/,
    token: '+',
    desc: 'One or more of the preceding token.',
  },
  {
    test: /(?:^|[^\\])\?/,
    token: '?',
    desc: 'Zero or one (optional); also makes quantifiers lazy.',
  },
  {
    test: /(?:^|[^\\])\[/,
    token: '[…]',
    desc: 'Character class — matches any one listed character.',
  },
  { test: /\(\?<[^=!]/, token: '(?<name>…)', desc: 'Named capture group.' },
  { test: /\(\?:/, token: '(?:…)', desc: 'Non-capturing group.' },
  { test: /\(\?=/, token: '(?=…)', desc: 'Positive lookahead.' },
  { test: /\(\?!/, token: '(?!…)', desc: 'Negative lookahead.' },
  { test: /(?:^|[^\\?])\(/, token: '(…)', desc: 'Capturing group.' },
  {
    test: /(?:^|[^\\])\|/,
    token: '|',
    desc: 'Alternation — match the expression before or after.',
  },
  {
    test: /(?:^|[^\\])\{\d/,
    token: '{n,m}',
    desc: 'Quantifier — between n and m repetitions.',
  },
];

interface MatchRow {
  index: number;
  full: string;
  offset: number;
  groups: (string | undefined)[];
  named: Record<string, string | undefined>;
}

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flagSet, setFlagSet] = useState<Set<FlagKey>>(new Set(['g']));
  const [testText, setTestText] = useState('');

  const debPattern = useDebouncedValue(pattern, 150);
  const debText = useDebouncedValue(testText, 150);

  const flags = useMemo(
    () =>
      FLAGS.map((f) => f.key)
        .filter((k) => flagSet.has(k))
        .join(''),
    [flagSet],
  );

  const { regex, error } = useMemo(() => {
    if (!debPattern) return { regex: null, error: null as string | null };
    try {
      return { regex: new RegExp(debPattern, flags), error: null };
    } catch (e) {
      return {
        regex: null,
        error: e instanceof Error ? e.message : 'Invalid regular expression.',
      };
    }
  }, [debPattern, flags]);

  const matches = useMemo<MatchRow[]>(() => {
    if (!regex || !debText) return [];
    const out: MatchRow[] = [];
    if (regex.global || regex.sticky) {
      const re = new RegExp(regex.source, regex.flags);
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(debText)) !== null && guard < 100000) {
        guard++;
        out.push({
          index: out.length,
          full: m[0],
          offset: m.index,
          groups: m.slice(1),
          named: { ...(m.groups ?? {}) },
        });
        if (m.index === re.lastIndex) re.lastIndex++; // avoid zero-width loop
      }
    } else {
      const m = regex.exec(debText);
      if (m) {
        out.push({
          index: 0,
          full: m[0],
          offset: m.index,
          groups: m.slice(1),
          named: { ...(m.groups ?? {}) },
        });
      }
    }
    return out;
  }, [regex, debText]);

  const highlighted = useMemo(() => {
    if (!regex || !debText || matches.length === 0) return null;
    const segs: { text: string; match: boolean }[] = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.offset > cursor) {
        segs.push({ text: debText.slice(cursor, m.offset), match: false });
      }
      // Guard against empty matches producing no visible span.
      const end = m.offset + m.full.length;
      segs.push({ text: m.full || '∅', match: true });
      cursor = Math.max(end, m.offset);
    }
    if (cursor < debText.length) {
      segs.push({ text: debText.slice(cursor), match: false });
    }
    return segs;
  }, [regex, debText, matches]);

  const relevantTokens = useMemo(
    () => TOKEN_DOCS.filter((t) => t.test.test(debPattern)),
    [debPattern],
  );

  const hasNamed = matches.some((m) => Object.keys(m.named).length > 0);
  const maxGroups = matches.reduce((n, m) => Math.max(n, m.groups.length), 0);

  function toggleFlag(key: FlagKey) {
    setFlagSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Pattern"
        actions={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPattern(SAMPLE_PATTERN);
                setTestText(SAMPLE_TEXT);
                setFlagSet(new Set(['g']));
              }}
            >
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPattern('');
                setTestText('');
              }}
              disabled={!pattern && !testText}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Regular expression" htmlFor="re-pattern">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-muted">/</span>
              <Input
                id="re-pattern"
                mono
                invalid={!!error}
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="(\w+)@(\w+\.\w+)"
              />
              <span className="text-muted">/{flags}</span>
            </div>
            {error && <InlineError>{error}</InlineError>}
          </Field>

          <Field label="Flags" htmlFor="re-flag-g">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {FLAGS.map((f, i) => (
                <Toggle
                  key={f.key}
                  id={i === 0 ? 're-flag-g' : `re-flag-${f.key}`}
                  checked={flagSet.has(f.key)}
                  onChange={() => toggleFlag(f.key)}
                  label={f.label}
                />
              ))}
            </div>
          </Field>

          <Field label="Test text" htmlFor="re-text">
            <TextArea
              id="re-text"
              mono={false}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Paste the text to run the pattern against…"
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Matches"
        actions={
          <Badge tone={matches.length > 0 ? 'success' : 'default'}>
            {matches.length} match{matches.length === 1 ? '' : 'es'}
          </Badge>
        }
      >
        {!debPattern ? (
          <p className="text-sm text-muted">
            Enter a pattern and some test text to see matches highlighted live.
          </p>
        ) : error ? (
          <p className="text-sm text-muted">
            Fix the pattern above to evaluate matches.
          </p>
        ) : !debText ? (
          <p className="text-sm text-muted">Add test text to search.</p>
        ) : highlighted ? (
          <pre className="whitespace-pre-wrap break-words rounded-input border border-border bg-surface p-3 font-mono text-13 leading-relaxed text-text">
            {highlighted.map((seg, i) =>
              seg.match ? (
                <mark key={i} className="match-highlight">
                  {seg.text}
                </mark>
              ) : (
                <Fragment key={i}>{seg.text}</Fragment>
              ),
            )}
          </pre>
        ) : (
          <p className="text-sm text-muted">
            No matches found in the test text.
          </p>
        )}
      </Panel>

      {matches.length > 0 && (
        <Panel title="Capture groups">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-13">
              <thead>
                <tr className="border-b border-border text-2xs uppercase tracking-wider text-muted">
                  <th className="px-2 py-1.5">#</th>
                  <th className="px-2 py-1.5">At</th>
                  <th className="px-2 py-1.5">Full match</th>
                  {Array.from({ length: maxGroups }).map((_, i) => (
                    <th key={i} className="px-2 py-1.5">
                      ${i + 1}
                    </th>
                  ))}
                  {hasNamed && <th className="px-2 py-1.5">Named</th>}
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.index} className="border-b border-border/60">
                    <td className="px-2 py-1.5 font-mono text-muted">
                      {m.index}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-muted">
                      {m.offset}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-accent">
                      {m.full || '∅'}
                    </td>
                    {Array.from({ length: maxGroups }).map((_, i) => (
                      <td
                        key={i}
                        className="px-2 py-1.5 font-mono text-secondary"
                      >
                        {m.groups[i] === undefined ? (
                          <span className="text-muted">—</span>
                        ) : (
                          m.groups[i]
                        )}
                      </td>
                    ))}
                    {hasNamed && (
                      <td className="px-2 py-1.5 font-mono text-secondary">
                        {Object.entries(m.named).length === 0 ? (
                          <span className="text-muted">—</span>
                        ) : (
                          Object.entries(m.named)
                            .map(([k, v]) => `${k}=${v ?? '—'}`)
                            .join(', ')
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {relevantTokens.length > 0 && (
        <Panel title="Token reference">
          <table className="w-full border-collapse text-left text-13">
            <tbody>
              {relevantTokens.map((t) => (
                <tr key={t.token} className="border-b border-border/60">
                  <td className="w-24 px-2 py-1.5 font-mono text-accent">
                    {t.token}
                  </td>
                  <td className="px-2 py-1.5 text-secondary">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
