'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileText,
  Loader2,
  Lock,
  Trash2,
  Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { ResultBlock } from '@/components/ui/ResultBlock';
import {
  Field,
  InlineError,
  Panel,
  PrivacyNote,
} from '@/components/ui/ToolShell';
import { FileDrop } from '@/components/ui/FileDrop';
import {
  decryptAes,
  encryptAes,
  DEFAULT_PBKDF2_ITERATIONS,
  type AesEncryptResult,
  type AesKeyBits,
  type AesMode,
  type Pbkdf2Hash,
} from '@/lib/crypto/aes';
import { bytesToUtf8, utf8ToBytes } from '@/lib/encoding';
import { downloadBytes, downloadText, readFileAsBytes } from '@/lib/file';

type TopTab = 'encrypt' | 'decrypt';
type KeySource = 'passphrase' | 'rawkey';
type InputSource = 'text' | 'file';

export default function AesTool() {
  const [tab, setTab] = useState<TopTab>('encrypt');
  const [mode, setMode] = useState<AesMode>('GCM');
  const [keySource, setKeySource] = useState<KeySource>('passphrase');

  // passphrase key params
  const [passphrase, setPassphrase] = useState('');
  const [iterations, setIterations] = useState(
    String(DEFAULT_PBKDF2_ITERATIONS),
  );
  const [hash, setHash] = useState<Pbkdf2Hash>('SHA-256');

  // raw key params
  const [rawKeyHex, setRawKeyHex] = useState('');
  const [keyBits, setKeyBits] = useState<AesKeyBits>(256);

  // encrypt inputs
  const [encInputSource, setEncInputSource] = useState<InputSource>('text');
  const [plainText, setPlainText] = useState('');
  const [encFile, setEncFile] = useState<File | null>(null);

  // decrypt inputs
  const [decInputSource, setDecInputSource] = useState<InputSource>('text');
  const [bundleInput, setBundleInput] = useState('');
  const [decFileName, setDecFileName] = useState<string>('decrypted.bin');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encResult, setEncResult] = useState<AesEncryptResult | null>(null);
  const [encFileName, setEncFileName] = useState<string>('');
  const [decText, setDecText] = useState<string | null>(null);
  const [decBytes, setDecBytes] = useState<Uint8Array | null>(null);

  const iterNum = Number.parseInt(iterations, 10);
  const iterInvalid = !Number.isFinite(iterNum) || iterNum < 1;

  function clearOutputs() {
    setError(null);
    setEncResult(null);
    setEncFileName('');
    setDecText(null);
    setDecBytes(null);
  }

  function keyArgs() {
    return keySource === 'passphrase'
      ? { passphrase, iterations: iterNum, hash, keyBits }
      : { rawKeyHex, keyBits };
  }

  async function handleEncrypt() {
    clearOutputs();
    setBusy(true);
    try {
      let data: Uint8Array;
      let fileName = '';
      if (encInputSource === 'text') {
        data = utf8ToBytes(plainText);
      } else {
        if (!encFile) throw new Error('Choose a file to encrypt.');
        data = await readFileAsBytes(encFile);
        fileName = encFile.name;
      }
      const res = await encryptAes({ mode, data, ...keyArgs() });
      setEncResult(res);
      setEncFileName(fileName);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encryption failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDecrypt() {
    clearOutputs();
    setBusy(true);
    try {
      let bundleB64: string;
      if (decInputSource === 'text') {
        bundleB64 = bundleInput;
      } else {
        bundleB64 = bundleInput; // file already read into bundleInput via FileDrop
        if (!bundleB64.trim())
          throw new Error('Choose an .enc file to decrypt.');
      }
      if (!bundleB64.trim())
        throw new Error('Paste the Base64 ciphertext bundle.');
      const out = await decryptAes({ mode, bundleB64, ...keyArgs() });
      if (decInputSource === 'text') {
        setDecText(bytesToUtf8(out, false));
      } else {
        setDecBytes(out);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Decryption failed — wrong key/passphrase or corrupted data.',
      );
    } finally {
      setBusy(false);
    }
  }

  function loadSample() {
    clearOutputs();
    setTab('encrypt');
    setMode('GCM');
    setKeySource('passphrase');
    setEncInputSource('text');
    setPlainText('Secret message');
    setPassphrase('hunter2');
    setIterations(String(DEFAULT_PBKDF2_ITERATIONS));
    setHash('SHA-256');
  }

  function clearAll() {
    clearOutputs();
    setPlainText('');
    setBundleInput('');
    setEncFile(null);
    setPassphrase('');
    setRawKeyHex('');
  }

  async function onDecFile(file: File) {
    setDecFileName(`${file.name.replace(/\.enc$/i, '')}.dec`);
    const bytes = await readFileAsBytes(file);
    setBundleInput(bytesToUtf8(bytes, false).trim());
  }

  const keyControls = (
    <div className="space-y-3">
      <Field label="Cipher mode" htmlFor="aes-mode">
        <Select
          id="aes-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as AesMode)}
          options={[
            { value: 'GCM', label: 'AES-GCM (authenticated, recommended)' },
            { value: 'CBC', label: 'AES-CBC (no integrity)' },
          ]}
        />
      </Field>

      {mode === 'CBC' && (
        <div className="flex items-start gap-2 rounded-input border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            CBC provides confidentiality but <strong>NOT</strong> integrity — it
            cannot detect tampering. Prefer GCM.
          </span>
        </div>
      )}

      <Field label="Key source" htmlFor="aes-keysource">
        <Tabs
          tabs={[
            { value: 'passphrase', label: 'Passphrase' },
            { value: 'rawkey', label: 'Raw hex key' },
          ]}
          value={keySource}
          onChange={setKeySource}
        />
      </Field>

      {keySource === 'passphrase' ? (
        <>
          <Field label="Passphrase" htmlFor="aes-passphrase">
            <Input
              id="aes-passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="A strong passphrase…"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="PBKDF2 iterations" htmlFor="aes-iters">
              <Input
                id="aes-iters"
                mono
                inputMode="numeric"
                value={iterations}
                invalid={iterInvalid}
                onChange={(e) => setIterations(e.target.value)}
              />
            </Field>
            <Field label="PBKDF2 hash" htmlFor="aes-hash">
              <Select
                id="aes-hash"
                value={hash}
                onChange={(e) => setHash(e.target.value as Pbkdf2Hash)}
                options={[
                  { value: 'SHA-256', label: 'SHA-256' },
                  { value: 'SHA-512', label: 'SHA-512' },
                ]}
              />
            </Field>
            <Field label="Key size" htmlFor="aes-keybits-pp">
              <Select
                id="aes-keybits-pp"
                value={String(keyBits)}
                onChange={(e) =>
                  setKeyBits(Number(e.target.value) as AesKeyBits)
                }
                options={[
                  { value: '128', label: 'AES-128' },
                  { value: '192', label: 'AES-192' },
                  { value: '256', label: 'AES-256' },
                ]}
              />
            </Field>
          </div>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Raw key (hex)"
            htmlFor="aes-rawkey"
            className="sm:col-span-2"
          >
            <Input
              id="aes-rawkey"
              mono
              value={rawKeyHex}
              onChange={(e) => setRawKeyHex(e.target.value)}
              placeholder="e.g. 32-byte hex for AES-256…"
            />
          </Field>
          <Field label="Key size" htmlFor="aes-keybits-raw">
            <Select
              id="aes-keybits-raw"
              value={String(keyBits)}
              onChange={(e) => setKeyBits(Number(e.target.value) as AesKeyBits)}
              options={[
                { value: '128', label: 'AES-128 (16 B)' },
                { value: '192', label: 'AES-192 (24 B)' },
                { value: '256', label: 'AES-256 (32 B)' },
              ]}
            />
          </Field>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Panel
        title="AES encryption"
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
        <div className="space-y-4">
          <Tabs
            tabs={[
              { value: 'encrypt', label: 'Encrypt' },
              { value: 'decrypt', label: 'Decrypt' },
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v);
              clearOutputs();
            }}
          />

          {keyControls}

          {tab === 'encrypt' ? (
            <>
              <Field label="Input source" htmlFor="aes-enc-source">
                <Tabs
                  tabs={[
                    { value: 'text', label: 'Text' },
                    { value: 'file', label: 'File' },
                  ]}
                  value={encInputSource}
                  onChange={setEncInputSource}
                />
              </Field>
              {encInputSource === 'text' ? (
                <Field label="Plaintext" htmlFor="aes-plaintext">
                  <TextArea
                    id="aes-plaintext"
                    mono={false}
                    value={plainText}
                    onChange={(e) => setPlainText(e.target.value)}
                    placeholder="Type the message to encrypt…"
                  />
                </Field>
              ) : (
                <FileDrop
                  onFile={(f) => setEncFile(f)}
                  onClear={() => setEncFile(null)}
                  busy={busy}
                  hint="The file is read locally and encrypted in your browser."
                />
              )}
              <Button
                variant="primary"
                onClick={handleEncrypt}
                disabled={busy || iterInvalid}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Encrypt
              </Button>
            </>
          ) : (
            <>
              <Field label="Input source" htmlFor="aes-dec-source">
                <Tabs
                  tabs={[
                    { value: 'text', label: 'Text' },
                    { value: 'file', label: 'File' },
                  ]}
                  value={decInputSource}
                  onChange={(v) => {
                    setDecInputSource(v);
                    setBundleInput('');
                  }}
                />
              </Field>
              {decInputSource === 'text' ? (
                <Field label="Ciphertext bundle (Base64)" htmlFor="aes-bundle">
                  <TextArea
                    id="aes-bundle"
                    value={bundleInput}
                    onChange={(e) => setBundleInput(e.target.value)}
                    placeholder="Paste the Base64 bundle produced when encrypting…"
                  />
                </Field>
              ) : (
                <FileDrop
                  onFile={onDecFile}
                  onClear={() => setBundleInput('')}
                  accept=".enc,.txt"
                  busy={busy}
                  hint="Reads a .enc file containing the Base64 bundle."
                />
              )}
              <Button
                variant="primary"
                onClick={handleDecrypt}
                disabled={busy || iterInvalid}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
                Decrypt
              </Button>
            </>
          )}

          {error && <InlineError>{error}</InlineError>}
        </div>
      </Panel>

      {tab === 'encrypt' && encResult && (
        <Panel
          title="Encrypted output"
          actions={
            encFileName ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  downloadText(encResult.bundleB64, `${encFileName}.enc`)
                }
              >
                <Download className="h-3.5 w-3.5" /> Download .enc
              </Button>
            ) : undefined
          }
        >
          <div className="space-y-2">
            <ResultBlock
              label="Ciphertext bundle (Base64)"
              value={encResult.bundleB64}
              valueClassName="max-h-48 overflow-auto"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {encResult.saltHex && (
                <ResultBlock label="Salt (hex)" value={encResult.saltHex} />
              )}
              <ResultBlock label="IV (hex)" value={encResult.ivHex} />
              {encResult.iterations != null && (
                <ResultBlock
                  label="Iterations"
                  value={String(encResult.iterations)}
                  copy={false}
                />
              )}
              <ResultBlock
                label="Key size"
                value={`AES-${encResult.keyBits} / ${encResult.mode}`}
                copy={false}
              />
            </div>
          </div>
        </Panel>
      )}

      {tab === 'decrypt' && decText != null && (
        <Panel title="Decrypted plaintext">
          <ResultBlock
            label="Plaintext (UTF-8)"
            value={decText}
            mono={false}
            valueClassName="max-h-64 overflow-auto whitespace-pre-wrap"
          />
        </Panel>
      )}

      {tab === 'decrypt' && decBytes != null && (
        <Panel
          title="Decrypted file"
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadBytes(decBytes, decFileName)}
            >
              <Download className="h-3.5 w-3.5" /> Download decrypted
            </Button>
          }
        >
          <p className="text-sm text-secondary">
            Decryption succeeded — {decBytes.length.toLocaleString()} bytes
            recovered. Download to save the original file.
          </p>
        </Panel>
      )}

      <PrivacyNote>
        Everything runs in your browser via the Web Crypto API; no key, file, or
        ciphertext is ever uploaded. Bundle format (Base64):{' '}
        <code className="font-mono">[salt(16)][iv][ciphertext(+GCM tag)]</code>{' '}
        — the salt is omitted in raw-key mode. GCM appends a 16-byte
        authentication tag to the ciphertext.
      </PrivacyNote>
    </div>
  );
}
