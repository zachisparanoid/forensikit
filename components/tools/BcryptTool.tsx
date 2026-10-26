'use client';

import { useState } from 'react';
import bcrypt from 'bcryptjs';
import {
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { Tabs } from '@/components/ui/Tabs';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Field, InlineError, Panel } from '@/components/ui/ToolShell';

type TopTab = 'hash' | 'verify';

export default function BcryptTool() {
  const [tab, setTab] = useState<TopTab>('hash');

  // hash
  const [password, setPassword] = useState('');
  const [cost, setCost] = useState(10);
  const [hashBusy, setHashBusy] = useState(false);
  const [hashError, setHashError] = useState<string | null>(null);
  const [hash, setHash] = useState('');

  // verify
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [match, setMatch] = useState<boolean | null>(null);

  async function handleHash() {
    setHashError(null);
    setHash('');
    setHashBusy(true);
    try {
      const salt = await bcrypt.genSalt(cost);
      setHash(await bcrypt.hash(password, salt));
    } catch (e) {
      setHashError(e instanceof Error ? e.message : 'Hashing failed.');
    } finally {
      setHashBusy(false);
    }
  }

  async function handleVerify() {
    setVerifyError(null);
    setMatch(null);
    setVerifyBusy(true);
    try {
      const ok = await bcrypt.compare(verifyPassword, verifyHash.trim());
      setMatch(ok);
    } catch {
      setVerifyError(
        'That does not look like a valid bcrypt hash (expected $2a$ / $2b$ / $2y$ …).',
      );
    } finally {
      setVerifyBusy(false);
    }
  }

  function loadSample() {
    setTab('hash');
    setHashError(null);
    setHash('');
    setPassword('correct horse');
    setCost(10);
  }

  function clearAll() {
    if (tab === 'hash') {
      setPassword('');
      setHash('');
      setHashError(null);
    } else {
      setVerifyPassword('');
      setVerifyHash('');
      setMatch(null);
      setVerifyError(null);
    }
  }

  return (
    <div className="space-y-4">
      <Panel
        title="bcrypt"
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={loadSample}>
              <FileText className="h-3.5 w-3.5" /> Load sample
            </Button>
            <Button size="sm" variant="ghost" onClick={clearAll}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </>
        }
      >
        <Tabs
          tabs={[
            { value: 'hash', label: 'Hash' },
            { value: 'verify', label: 'Verify' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </Panel>

      {tab === 'hash' ? (
        <Panel title="Generate hash">
          <div className="space-y-3">
            <Field label="Password" htmlFor="bcrypt-password">
              <Input
                id="bcrypt-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="The password to hash…"
              />
            </Field>
            <Slider
              id="bcrypt-cost"
              label="Cost factor (work factor)"
              valueLabel={`${cost} — 2^${cost} rounds`}
              min={4}
              max={14}
              value={cost}
              onChange={setCost}
            />
            <p className="text-xs text-muted">
              Higher cost = exponentially slower = stronger against brute force.
              Each +1 doubles the work. Cost 12+ can take noticeable time in the
              browser.
            </p>
            <Button variant="primary" onClick={handleHash} disabled={hashBusy}>
              {hashBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {hashBusy ? 'Hashing…' : 'Generate'}
            </Button>
            {hashError && <InlineError>{hashError}</InlineError>}
            {hash && <ResultBlock label="bcrypt hash" value={hash} />}
          </div>
        </Panel>
      ) : (
        <Panel title="Verify password against hash">
          <div className="space-y-3">
            <Field label="Password" htmlFor="bcrypt-verify-password">
              <Input
                id="bcrypt-verify-password"
                value={verifyPassword}
                onChange={(e) => {
                  setVerifyPassword(e.target.value);
                  setMatch(null);
                }}
                placeholder="The candidate password…"
              />
            </Field>
            <Field label="Existing bcrypt hash" htmlFor="bcrypt-verify-hash">
              <Input
                id="bcrypt-verify-hash"
                mono
                value={verifyHash}
                onChange={(e) => {
                  setVerifyHash(e.target.value);
                  setMatch(null);
                }}
                placeholder="$2a$10$…"
              />
            </Field>
            <Button
              variant="primary"
              onClick={handleVerify}
              disabled={verifyBusy || !verifyPassword || !verifyHash}
            >
              {verifyBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {verifyBusy ? 'Verifying…' : 'Verify'}
            </Button>
            {verifyError && <InlineError>{verifyError}</InlineError>}
            {match != null && (
              <div
                className={`flex items-center gap-2 rounded-input border px-3 py-2 text-sm ${
                  match
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-danger/30 bg-danger/10 text-danger'
                }`}
              >
                {match ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Match — the password
                    produces this hash.
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" /> No match — password does not
                    match this hash.
                  </>
                )}
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
