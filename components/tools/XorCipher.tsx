'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { FileDrop } from '@/components/ui/FileDrop';
import {
  Field,
  InlineError,
  Panel,
  PrivacyNote,
} from '@/components/ui/ToolShell';
import { xorBytes } from '@/lib/crypto/classical';
import {
  DecodeError,
  bytesToBase64,
  bytesToHex,
  bytesToUtf8,
  hexToBytes,
  utf8ToBytes,
} from '@/lib/encoding';
import { downloadBytes, readFileAsBytes } from '@/lib/file';
import { useDebouncedValue } from '@/lib/hooks';

type Tab = 'text' | 'file';
type Encoding = 'utf8' | 'hex';
type OutputFormat = 'hex' | 'base64' | 'text';

const SAMPLE_INPUT = 'Hello';
const SAMPLE_KEY = '0f';

function decodeBytes(value: string, enc: Encoding): Uint8Array {
  return enc === 'hex' ? hexToBytes(value) : utf8ToBytes(value);
}

function formatOutput(bytes: Uint8Array, format: OutputFormat): string {
  if (format === 'hex') return bytesToHex(bytes, ' ');
  if (format === 'base64') return bytesToBase64(bytes);
  return bytesToUtf8(bytes);
}

export default function XorCipher() {
  const [tab, setTab] = useState<Tab>('text');

  // Text mode
  const [input, setInput] = useState('');
  const [inputEnc, setInputEnc] = useState<Encoding>('utf8');
  const [keyText, setKeyText] = useState('');
  const [keyEnc, setKeyEnc] = useState<Encoding>('utf8');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('hex');
  const debouncedInput = useDebouncedValue(input, 150);
  const debouncedKey = useDebouncedValue(keyText, 150);

  // File mode
  const [fileKey, setFileKey] = useState('');
  const [fileKeyEnc, setFileKeyEnc] = useState<Encoding>('utf8');
  const [fileName, setFileName] = useState('');
  const [fileResult, setFileResult] = useState<Uint8Array | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState(false);

  const textOutput = useMemo(() => {
    if (!debouncedInput && !debouncedKey) {
      return { value: '', error: null as string | null };
    }
    try {
      const dataBytes = decodeBytes(debouncedInput, inputEnc);
      const keyBytes = decodeBytes(debouncedKey, keyEnc);
      if (keyBytes.length === 0) {
        return { value: '', error: 'Enter a key to XOR against the input.' };
      }
      const xored = xorBytes(dataBytes, keyBytes);
      return { value: formatOutput(xored, outputFormat), error: null };
    } catch (e) {
      const msg =
        e instanceof DecodeError
          ? `${e.message}${e.position >= 0 ? ` (position ${e.position})` : ''}`
          : 'Could not process the input.';
      return { value: '', error: msg };
    }
  }, [debouncedInput, debouncedKey, inputEnc, keyEnc, outputFormat]);

  function loadTextSample() {
    setInput(SAMPLE_INPUT);
    setInputEnc('utf8');
    setKeyText(SAMPLE_KEY);
    setKeyEnc('hex');
    setOutputFormat('hex');
  }

  function clearText() {
    setInput('');
    setKeyText('');
  }

  async function handleFile(file: File) {
    setFileError(null);
    setFileResult(null);
    setFileName(file.name);
    let keyBytes: Uint8Array;
    try {
      keyBytes = decodeBytes(fileKey, fileKeyEnc);
    } catch (e) {
      setFileError(
        e instanceof DecodeError ? e.message : 'The key could not be decoded.',
      );
      return;
    }
    if (keyBytes.length === 0) {
      setFileError('Enter a key before selecting a file.');
      return;
    }
    setFileBusy(true);
    try {
      const bytes = await readFileAsBytes(file);
      setFileResult(xorBytes(bytes, keyBytes));
    } catch {
      setFileError('Failed to read the file.');
    } finally {
      setFileBusy(false);
    }
  }

  function downloadResult() {
    if (!fileResult) return;
    downloadBytes(fileResult, `${fileName || 'output'}.xor`);
  }

  const encodingOptions = [
    { value: 'utf8', label: 'UTF-8 text' },
    { value: 'hex', label: 'Hex' },
  ];

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { value: 'text', label: 'Text' },
          { value: 'file', label: 'File' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'text' ? (
        <>
          <Panel
            title="Input"
            actions={
              <>
                <Button size="sm" variant="ghost" onClick={loadTextSample}>
                  <FileText className="h-3.5 w-3.5" /> Load sample
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearText}
                  disabled={!input && !keyText}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </Button>
              </>
            }
          >
            <div className="space-y-3">
              <Field label="Input encoding" htmlFor="xor-input-enc">
                <Select
                  id="xor-input-enc"
                  value={inputEnc}
                  onChange={(e) => setInputEnc(e.target.value as Encoding)}
                  options={encodingOptions}
                />
              </Field>
              <Field label="Data" htmlFor="xor-input">
                <TextArea
                  id="xor-input"
                  mono={inputEnc === 'hex'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    inputEnc === 'hex'
                      ? 'e.g. 48 65 6c 6c 6f'
                      : 'Type or paste text…'
                  }
                />
              </Field>
              <Field label="Key encoding" htmlFor="xor-key-enc">
                <Select
                  id="xor-key-enc"
                  value={keyEnc}
                  onChange={(e) => setKeyEnc(e.target.value as Encoding)}
                  options={encodingOptions}
                />
              </Field>
              <Field label="Key" htmlFor="xor-key">
                <Input
                  id="xor-key"
                  mono={keyEnc === 'hex'}
                  value={keyText}
                  onChange={(e) => setKeyText(e.target.value)}
                  placeholder={keyEnc === 'hex' ? 'e.g. 0f' : 'secret'}
                />
              </Field>
              <Field label="Output format" htmlFor="xor-output-format">
                <Select
                  id="xor-output-format"
                  value={outputFormat}
                  onChange={(e) =>
                    setOutputFormat(e.target.value as OutputFormat)
                  }
                  options={[
                    { value: 'hex', label: 'Hex' },
                    { value: 'base64', label: 'Base64' },
                    { value: 'text', label: 'Text (UTF-8)' },
                  ]}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Output">
            {textOutput.error ? (
              <InlineError>{textOutput.error}</InlineError>
            ) : textOutput.value ? (
              <ResultBlock label="XOR result" value={textOutput.value} copy />
            ) : (
              <p className="text-sm text-muted">
                Enter data and a key to compute the XOR.
              </p>
            )}
            <p className="mt-3 text-xs text-muted">
              Repeating-key XOR: the output is always the same length as the
              input. If the key is shorter than the data it repeats; XOR is
              symmetric, so the same key reverses the operation.
            </p>
          </Panel>
        </>
      ) : (
        <>
          <Panel title="File">
            <div className="space-y-3">
              <Field label="Key encoding" htmlFor="xor-file-key-enc">
                <Select
                  id="xor-file-key-enc"
                  value={fileKeyEnc}
                  onChange={(e) => setFileKeyEnc(e.target.value as Encoding)}
                  options={encodingOptions}
                />
              </Field>
              <Field label="Key" htmlFor="xor-file-key">
                <Input
                  id="xor-file-key"
                  mono={fileKeyEnc === 'hex'}
                  value={fileKey}
                  onChange={(e) => setFileKey(e.target.value)}
                  placeholder={fileKeyEnc === 'hex' ? 'e.g. 0f' : 'secret'}
                />
              </Field>
              <FileDrop
                onFile={handleFile}
                onClear={() => {
                  setFileResult(null);
                  setFileError(null);
                  setFileName('');
                }}
                busy={fileBusy}
                hint="The file is XORed in memory with the key above."
              />
              {fileError && <InlineError>{fileError}</InlineError>}
            </div>
          </Panel>

          {fileResult && (
            <Panel
              title="Result"
              actions={
                <Button size="sm" variant="primary" onClick={downloadResult}>
                  <Download className="h-3.5 w-3.5" /> Download result
                </Button>
              }
            >
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  {fileResult.length.toLocaleString()} bytes · first 64 bytes:
                </p>
                <code className="block break-all font-mono text-13 text-text">
                  {bytesToHex(fileResult.slice(0, 64), ' ')}
                  {fileResult.length > 64 ? ' …' : ''}
                </code>
              </div>
            </Panel>
          )}

          <PrivacyNote>
            Your file is read into memory in the browser via the File API, XORed
            locally, and offered back as a download. Nothing is ever uploaded.
          </PrivacyNote>
        </>
      )}
    </div>
  );
}
