'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Download,
  KeyRound,
  Loader2,
  Lock,
  Trash2,
  Unlock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResultBlock } from '@/components/ui/ResultBlock';
import {
  Field,
  InlineError,
  Panel,
  PrivacyNote,
} from '@/components/ui/ToolShell';
import {
  ecdsaSign,
  ecdsaVerify,
  generateEcdsaKeyPair,
  generateRsaKeyPair,
  rsaDecrypt,
  rsaEncrypt,
  rsaSign,
  rsaVerify,
  type RsaModulus,
} from '@/lib/crypto/rsa';
import { downloadText } from '@/lib/file';

type TopTab = 'keygen' | 'crypt' | 'sign';
type KeygenAlgo = 'rsa-oaep' | 'rsa-pss' | 'ecdsa';
type SignAlgo = 'rsa-pss' | 'ecdsa';

export default function RsaTool() {
  const [tab, setTab] = useState<TopTab>('keygen');

  // keygen
  const [keygenAlgo, setKeygenAlgo] = useState<KeygenAlgo>('rsa-oaep');
  const [modulus, setModulus] = useState<RsaModulus>(2048);
  const [genBusy, setGenBusy] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [publicPem, setPublicPem] = useState('');
  const [privatePem, setPrivatePem] = useState('');

  // encrypt/decrypt
  const [encPubPem, setEncPubPem] = useState('');
  const [encMsg, setEncMsg] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [decPrivPem, setDecPrivPem] = useState('');
  const [decIn, setDecIn] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [cryptBusy, setCryptBusy] = useState(false);
  const [encError, setEncError] = useState<string | null>(null);
  const [decError, setDecError] = useState<string | null>(null);

  // sign/verify
  const [signAlgo, setSignAlgo] = useState<SignAlgo>('rsa-pss');
  const [signPrivPem, setSignPrivPem] = useState('');
  const [signMsg, setSignMsg] = useState('');
  const [signature, setSignature] = useState('');
  const [verPubPem, setVerPubPem] = useState('');
  const [verMsg, setVerMsg] = useState('');
  const [verSig, setVerSig] = useState('');
  const [signBusy, setSignBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [verError, setVerError] = useState<string | null>(null);
  const [verResult, setVerResult] = useState<boolean | null>(null);

  async function handleGenerate() {
    setGenError(null);
    setPublicPem('');
    setPrivatePem('');
    setGenBusy(true);
    try {
      const pair =
        keygenAlgo === 'ecdsa'
          ? await generateEcdsaKeyPair()
          : await generateRsaKeyPair(
              modulus,
              keygenAlgo === 'rsa-oaep' ? 'encrypt' : 'sign',
            );
      setPublicPem(pair.publicPem);
      setPrivatePem(pair.privatePem);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Key generation failed.');
    } finally {
      setGenBusy(false);
    }
  }

  async function handleEncrypt() {
    setEncError(null);
    setCiphertext('');
    setCryptBusy(true);
    try {
      setCiphertext(await rsaEncrypt(encPubPem, encMsg));
    } catch (e) {
      setEncError(e instanceof Error ? e.message : 'Encryption failed.');
    } finally {
      setCryptBusy(false);
    }
  }

  async function handleDecrypt() {
    setDecError(null);
    setPlaintext('');
    setCryptBusy(true);
    try {
      setPlaintext(await rsaDecrypt(decPrivPem, decIn));
    } catch (e) {
      setDecError(e instanceof Error ? e.message : 'Decryption failed.');
    } finally {
      setCryptBusy(false);
    }
  }

  async function handleSign() {
    setSignError(null);
    setSignature('');
    setSignBusy(true);
    try {
      const sig =
        signAlgo === 'ecdsa'
          ? await ecdsaSign(signPrivPem, signMsg)
          : await rsaSign(signPrivPem, signMsg);
      setSignature(sig);
    } catch (e) {
      setSignError(e instanceof Error ? e.message : 'Signing failed.');
    } finally {
      setSignBusy(false);
    }
  }

  async function handleVerify() {
    setVerError(null);
    setVerResult(null);
    setVerifyBusy(true);
    try {
      const ok =
        signAlgo === 'ecdsa'
          ? await ecdsaVerify(verPubPem, verMsg, verSig)
          : await rsaVerify(verPubPem, verMsg, verSig);
      setVerResult(ok);
    } catch (e) {
      setVerError(e instanceof Error ? e.message : 'Verification failed.');
    } finally {
      setVerifyBusy(false);
    }
  }

  function clearKeygen() {
    setPublicPem('');
    setPrivatePem('');
    setGenError(null);
  }

  const isRsa = keygenAlgo !== 'ecdsa';

  return (
    <div className="space-y-4">
      <Panel title="RSA / ECDSA toolkit">
        <Tabs
          tabs={[
            { value: 'keygen', label: 'Keygen' },
            { value: 'crypt', label: 'Encrypt/Decrypt' },
            { value: 'sign', label: 'Sign/Verify' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </Panel>

      {tab === 'keygen' && (
        <>
          <Panel
            title="Generate keypair"
            actions={
              <Button
                size="sm"
                variant="ghost"
                onClick={clearKeygen}
                disabled={!publicPem && !privatePem}
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Algorithm" htmlFor="rsa-algo">
                  <Select
                    id="rsa-algo"
                    value={keygenAlgo}
                    onChange={(e) =>
                      setKeygenAlgo(e.target.value as KeygenAlgo)
                    }
                    options={[
                      { value: 'rsa-oaep', label: 'RSA-OAEP (encryption)' },
                      { value: 'rsa-pss', label: 'RSA-PSS (signing)' },
                      { value: 'ecdsa', label: 'ECDSA P-256 (signing)' },
                    ]}
                  />
                </Field>
                {isRsa && (
                  <Field label="Modulus length" htmlFor="rsa-modulus">
                    <Select
                      id="rsa-modulus"
                      value={String(modulus)}
                      onChange={(e) =>
                        setModulus(Number(e.target.value) as RsaModulus)
                      }
                      options={[
                        { value: '2048', label: '2048-bit (fast)' },
                        { value: '4096', label: '4096-bit (slow)' },
                      ]}
                    />
                  </Field>
                )}
              </div>
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={genBusy}
              >
                {genBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {genBusy ? 'Generating…' : 'Generate keypair'}
              </Button>
              {isRsa && modulus === 4096 && (
                <p className="text-xs text-muted">
                  RSA-4096 keygen can take several seconds — the button stays
                  busy until it finishes.
                </p>
              )}
              {genError && <InlineError>{genError}</InlineError>}
            </div>
          </Panel>

          {(publicPem || privatePem) && (
            <Panel title="Generated keys">
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
                      Public key (PEM)
                    </span>
                    <div className="flex items-center gap-1">
                      <CopyButton value={publicPem} label="Copy" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          downloadText(publicPem, 'public_key.pem')
                        }
                      >
                        <Download className="h-3.5 w-3.5" /> Download .pem
                      </Button>
                    </div>
                  </div>
                  <TextArea
                    readOnly
                    value={publicPem}
                    className="min-h-[140px]"
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
                      Private key (PEM) — keep secret
                    </span>
                    <div className="flex items-center gap-1">
                      <CopyButton value={privatePem} label="Copy" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          downloadText(privatePem, 'private_key.pem')
                        }
                      >
                        <Download className="h-3.5 w-3.5" /> Download .pem
                      </Button>
                    </div>
                  </div>
                  <TextArea
                    readOnly
                    value={privatePem}
                    className="min-h-[140px]"
                  />
                </div>
              </div>
            </Panel>
          )}
        </>
      )}

      {tab === 'crypt' && (
        <>
          <Panel title="Encrypt (RSA-OAEP, public key)">
            <div className="space-y-3">
              <Field label="Public key (PEM)" htmlFor="rsa-enc-pub">
                <TextArea
                  id="rsa-enc-pub"
                  value={encPubPem}
                  onChange={(e) => setEncPubPem(e.target.value)}
                  placeholder="-----BEGIN PUBLIC KEY-----…"
                  className="min-h-[110px]"
                />
              </Field>
              <Field label="Message" htmlFor="rsa-enc-msg">
                <TextArea
                  id="rsa-enc-msg"
                  mono={false}
                  value={encMsg}
                  onChange={(e) => setEncMsg(e.target.value)}
                  placeholder="Short message (RSA-OAEP has a size limit)…"
                />
              </Field>
              <Button
                variant="primary"
                onClick={handleEncrypt}
                disabled={cryptBusy || !encPubPem || !encMsg}
              >
                {cryptBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Encrypt
              </Button>
              {encError && <InlineError>{encError}</InlineError>}
              {ciphertext && (
                <ResultBlock
                  label="Ciphertext (Base64)"
                  value={ciphertext}
                  valueClassName="max-h-40 overflow-auto"
                />
              )}
            </div>
          </Panel>

          <Panel title="Decrypt (RSA-OAEP, private key)">
            <div className="space-y-3">
              <Field label="Private key (PEM)" htmlFor="rsa-dec-priv">
                <TextArea
                  id="rsa-dec-priv"
                  value={decPrivPem}
                  onChange={(e) => setDecPrivPem(e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----…"
                  className="min-h-[110px]"
                />
              </Field>
              <Field label="Ciphertext (Base64)" htmlFor="rsa-dec-in">
                <TextArea
                  id="rsa-dec-in"
                  value={decIn}
                  onChange={(e) => setDecIn(e.target.value)}
                  placeholder="Paste Base64 ciphertext…"
                />
              </Field>
              <Button
                variant="primary"
                onClick={handleDecrypt}
                disabled={cryptBusy || !decPrivPem || !decIn}
              >
                {cryptBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
                Decrypt
              </Button>
              {decError && <InlineError>{decError}</InlineError>}
              {plaintext && (
                <ResultBlock
                  label="Plaintext"
                  value={plaintext}
                  mono={false}
                  valueClassName="whitespace-pre-wrap"
                />
              )}
            </div>
          </Panel>
        </>
      )}

      {tab === 'sign' && (
        <>
          <Panel title="Algorithm">
            <Field label="Signature scheme" htmlFor="rsa-sign-algo">
              <Select
                id="rsa-sign-algo"
                value={signAlgo}
                onChange={(e) => {
                  setSignAlgo(e.target.value as SignAlgo);
                  setVerResult(null);
                }}
                options={[
                  { value: 'rsa-pss', label: 'RSA-PSS (SHA-256)' },
                  { value: 'ecdsa', label: 'ECDSA P-256 (SHA-256)' },
                ]}
              />
            </Field>
          </Panel>

          <Panel title="Sign (private key)">
            <div className="space-y-3">
              <Field label="Private key (PEM)" htmlFor="rsa-sign-priv">
                <TextArea
                  id="rsa-sign-priv"
                  value={signPrivPem}
                  onChange={(e) => setSignPrivPem(e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----…"
                  className="min-h-[110px]"
                />
              </Field>
              <Field label="Message" htmlFor="rsa-sign-msg">
                <TextArea
                  id="rsa-sign-msg"
                  mono={false}
                  value={signMsg}
                  onChange={(e) => setSignMsg(e.target.value)}
                  placeholder="Message to sign…"
                />
              </Field>
              <Button
                variant="primary"
                onClick={handleSign}
                disabled={signBusy || !signPrivPem || !signMsg}
              >
                {signBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Sign
              </Button>
              {signError && <InlineError>{signError}</InlineError>}
              {signature && (
                <ResultBlock
                  label="Signature (Base64)"
                  value={signature}
                  valueClassName="max-h-40 overflow-auto"
                />
              )}
            </div>
          </Panel>

          <Panel title="Verify (public key)">
            <div className="space-y-3">
              <Field label="Public key (PEM)" htmlFor="rsa-ver-pub">
                <TextArea
                  id="rsa-ver-pub"
                  value={verPubPem}
                  onChange={(e) => setVerPubPem(e.target.value)}
                  placeholder="-----BEGIN PUBLIC KEY-----…"
                  className="min-h-[110px]"
                />
              </Field>
              <Field label="Message" htmlFor="rsa-ver-msg">
                <TextArea
                  id="rsa-ver-msg"
                  mono={false}
                  value={verMsg}
                  onChange={(e) => {
                    setVerMsg(e.target.value);
                    setVerResult(null);
                  }}
                  placeholder="The original message…"
                />
              </Field>
              <Field label="Signature (Base64)" htmlFor="rsa-ver-sig">
                <TextArea
                  id="rsa-ver-sig"
                  value={verSig}
                  onChange={(e) => {
                    setVerSig(e.target.value);
                    setVerResult(null);
                  }}
                  placeholder="Paste the Base64 signature…"
                />
              </Field>
              <Button
                variant="primary"
                onClick={handleVerify}
                disabled={verifyBusy || !verPubPem || !verMsg || !verSig}
              >
                {verifyBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Verify
              </Button>
              {verError && <InlineError>{verError}</InlineError>}
              {verResult != null && (
                <div
                  className={`flex items-center gap-2 rounded-input border px-3 py-2 text-sm ${
                    verResult
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-danger/30 bg-danger/10 text-danger'
                  }`}
                >
                  {verResult ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Signature valid — the
                      message matches this signature and public key.
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" /> Signature invalid — wrong
                      key, altered message, or bad signature.
                    </>
                  )}
                </div>
              )}
            </div>
          </Panel>
        </>
      )}

      <PrivacyNote>
        All keys are generated locally with the Web Crypto API. Private keys
        never leave your browser and are not stored anywhere. RSA-OAEP and
        RSA-PSS use SHA-256; ECDSA uses curve P-256 with SHA-256.
      </PrivacyNote>
    </div>
  );
}
