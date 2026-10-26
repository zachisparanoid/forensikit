'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';
import { base64ToBytes, bytesToUtf8 } from '@/lib/encoding';
import { isoUtc, relativeTime } from '@/lib/format';
import { verifyJwtHmac } from '@/lib/crypto/rsa';
import { useDebouncedValue } from '@/lib/hooks';

// jwt.io example token (HS256, secret "your-256-bit-secret").
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

interface DecodedSegment {
  pretty: string;
  json: Record<string, unknown> | null;
}

function decodeSegment(segment: string): DecodedSegment {
  const bytes = base64ToBytes(segment);
  const text = bytesToUtf8(bytes, false);
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        pretty: JSON.stringify(parsed, null, 2),
        json: parsed as Record<string, unknown>,
      };
    }
    return { pretty: JSON.stringify(parsed, null, 2), json: null };
  } catch {
    // Not JSON — show the raw decoded text so the user still sees something.
    return { pretty: text, json: null };
  }
}

const TIME_CLAIMS: { key: string; label: string }[] = [
  { key: 'iat', label: 'Issued at (iat)' },
  { key: 'nbf', label: 'Not before (nbf)' },
  { key: 'exp', label: 'Expires (exp)' },
];

export default function JwtDecoder() {
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const debounced = useDebouncedValue(token, 150);

  const parsed = useMemo(() => {
    const trimmed = debounced.trim();
    if (!trimmed) return null;
    const segments = trimmed.split('.');
    if (segments.length < 2) {
      return {
        error: 'Not a JWT (expected 3 dot-separated segments).',
      } as const;
    }
    try {
      const header = decodeSegment(segments[0]);
      const payload = decodeSegment(segments[1]);
      const signature = segments[2] ?? '';
      const alg =
        header.json && typeof header.json.alg === 'string'
          ? header.json.alg
          : null;
      const typ =
        header.json && typeof header.json.typ === 'string'
          ? header.json.typ
          : null;
      return {
        error: null,
        header,
        payload,
        signature,
        signingInput: `${segments[0]}.${segments[1]}`,
        alg,
        typ,
      } as const;
    } catch {
      return {
        error: 'Could not decode the Base64URL segments of this token.',
      } as const;
    }
  }, [debounced]);

  const ok = parsed && parsed.error === null ? parsed : null;
  const alg = ok?.alg ?? null;
  const hmacBits = alg
    ? alg === 'HS256'
      ? 256
      : alg === 'HS384'
        ? 384
        : alg === 'HS512'
          ? 512
          : null
    : null;
  const isNone = alg?.toLowerCase() === 'none';
  const isAsymmetric =
    !!alg &&
    (alg.startsWith('RS') || alg.startsWith('PS') || alg.startsWith('ES'));

  async function handleVerify() {
    if (!ok || hmacBits == null) return;
    setVerifyError(null);
    setVerified(null);
    setVerifyBusy(true);
    try {
      const result = await verifyJwtHmac(
        ok.signingInput,
        ok.signature,
        secret,
        hmacBits,
      );
      setVerified(result);
    } catch (e) {
      setVerifyError(
        e instanceof Error ? e.message : 'HMAC verification failed.',
      );
    } finally {
      setVerifyBusy(false);
    }
  }

  function loadSample() {
    setToken(SAMPLE);
    setSecret('your-256-bit-secret');
    setVerified(null);
    setVerifyError(null);
  }

  function clearAll() {
    setToken('');
    setSecret('');
    setVerified(null);
    setVerifyError(null);
  }

  const payloadJson = ok?.payload.json ?? null;

  return (
    <div className="space-y-4">
      <Panel
        title="Encoded JWT"
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={loadSample}>
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAll}
              disabled={!token}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <Field label="Paste a JSON Web Token" htmlFor="jwt-input">
          <TextArea
            id="jwt-input"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setVerified(null);
              setVerifyError(null);
            }}
            placeholder="eyJhbGciOiJIUzI1Ni…"
          />
        </Field>
        {parsed?.error && <InlineError>{parsed.error}</InlineError>}
        {!token && (
          <p className="mt-2 text-xs text-muted">
            Decoding happens entirely in your browser — nothing is uploaded.
          </p>
        )}
      </Panel>

      {ok && (
        <>
          <Panel title="Header">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {alg && <Badge tone="accent">alg: {alg}</Badge>}
              {ok.typ && <Badge tone="info">typ: {ok.typ}</Badge>}
              {isNone && <Badge tone="danger">unsigned (alg: none)</Badge>}
            </div>
            <div className="relative">
              <div className="absolute right-2 top-2 z-10">
                <CopyButton value={ok.header.pretty} />
              </div>
              <pre className="overflow-auto rounded-input border border-border bg-surface p-3 font-mono text-13 text-text">
                {ok.header.pretty}
              </pre>
            </div>
          </Panel>

          <Panel title="Payload">
            <div className="relative">
              <div className="absolute right-2 top-2 z-10">
                <CopyButton value={ok.payload.pretty} />
              </div>
              <pre className="overflow-auto rounded-input border border-border bg-surface p-3 font-mono text-13 text-text">
                {ok.payload.pretty}
              </pre>
            </div>

            {payloadJson && (
              <div className="mt-3 space-y-2">
                {TIME_CLAIMS.filter(
                  ({ key }) => typeof payloadJson[key] === 'number',
                ).map(({ key, label }) => {
                  const seconds = payloadJson[key] as number;
                  const ms = seconds * 1000;
                  const expired = key === 'exp' && ms < Date.now();
                  const future = key === 'nbf' && ms > Date.now();
                  return (
                    <div
                      key={key}
                      className="flex flex-wrap items-center gap-2 rounded-input border border-border bg-surface px-3 py-2 text-13"
                    >
                      <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
                        {label}
                      </span>
                      <span className="font-mono text-text">
                        {isoUtc(new Date(ms))}
                      </span>
                      <span className="text-muted">({relativeTime(ms)})</span>
                      {expired && (
                        <Badge tone="danger">
                          <AlertTriangle className="h-3 w-3" /> expired
                        </Badge>
                      )}
                      {future && (
                        <Badge tone="warning">
                          <AlertTriangle className="h-3 w-3" /> not yet valid
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Signature">
            {isNone ? (
              <div className="flex items-start gap-2 rounded-input border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This token uses <code className="font-mono">alg: none</code> —
                  it is <strong>unsigned</strong>. Anyone can forge it; never
                  trust an unsigned token.
                </span>
              </div>
            ) : isAsymmetric ? (
              <div className="space-y-2 text-sm text-secondary">
                <p>
                  <strong>{alg}</strong> is an asymmetric signature. HMAC
                  (shared secret) verification does not apply — you need the
                  issuer&apos;s public key.
                </p>
                <p className="text-muted">
                  Use the{' '}
                  <a
                    href="/tools/rsa-tool"
                    className="text-accent hover:underline"
                  >
                    RSA / ECDSA tool
                  </a>{' '}
                  with the public key, the signing input{' '}
                  <code className="font-mono">header.payload</code>, and the
                  signature to verify it.
                </p>
              </div>
            ) : hmacBits != null ? (
              <div className="space-y-3">
                <p className="text-sm text-secondary">
                  Verify the HMAC signature ({alg}) with the shared secret. This
                  only confirms the signature — it does not validate{' '}
                  <code className="font-mono">exp</code>/
                  <code className="font-mono">nbf</code> or any claim.
                </p>
                <Field label="Shared secret" htmlFor="jwt-secret">
                  <Input
                    id="jwt-secret"
                    value={secret}
                    onChange={(e) => {
                      setSecret(e.target.value);
                      setVerified(null);
                    }}
                    placeholder="The HMAC secret…"
                  />
                </Field>
                <Button
                  variant="primary"
                  onClick={handleVerify}
                  disabled={verifyBusy}
                >
                  {verifyBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Verify
                </Button>
                {verifyError && <InlineError>{verifyError}</InlineError>}
                {verified != null && (
                  <div
                    className={`flex items-center gap-2 rounded-input border px-3 py-2 text-sm ${
                      verified
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-danger/30 bg-danger/10 text-danger'
                    }`}
                  >
                    {verified ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Signature VERIFIED
                        — the secret matches this token&apos;s signature.
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" /> Signature NOT verified —
                        wrong secret or the token was altered.
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Unrecognized algorithm{alg ? ` "${alg}"` : ''}. This tool can
                only verify HS256/384/512 (HMAC) signatures.
              </p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
