'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Tabs } from '@/components/ui/Tabs';
import { FileDrop } from '@/components/ui/FileDrop';
import { ResultBlock } from '@/components/ui/ResultBlock';
import {
  Field,
  InlineError,
  Panel,
  PrivacyNote,
} from '@/components/ui/ToolShell';
import {
  DecodeError,
  base64ToBytes,
  bytesToBase64,
  bytesToUtf8,
  utf8ToBytes,
} from '@/lib/encoding';
import { readFileAsBytes, downloadBytes, downloadText } from '@/lib/file';
import { useDebouncedValue } from '@/lib/hooks';
import { toast } from '@/lib/toast';

type MainTab = 'text' | 'file';
type TextMode = 'encode' | 'decode';

const SAMPLE_PLAIN = 'The quick brown fox jumps over the lazy dog';

interface FileResult {
  name: string;
  type: string;
  base64: string;
  dataUri: string;
}

export default function Base64Tool() {
  const [tab, setTab] = useState<MainTab>('text');

  // --- Text tab state ---
  const [textMode, setTextMode] = useState<TextMode>('encode');
  const [text, setText] = useState('');
  const debouncedText = useDebouncedValue(text, 150);

  const { output, error } = useMemo(() => {
    if (!debouncedText) return { output: '', error: null as string | null };
    try {
      if (textMode === 'encode') {
        return {
          output: bytesToBase64(utf8ToBytes(debouncedText)),
          error: null,
        };
      }
      return { output: bytesToUtf8(base64ToBytes(debouncedText)), error: null };
    } catch (e) {
      const msg =
        e instanceof DecodeError
          ? e.message
          : 'Could not decode the Base64 input.';
      return { output: '', error: msg };
    }
  }, [debouncedText, textMode]);

  // --- File tab (encode) state ---
  const [fileResult, setFileResult] = useState<FileResult | null>(null);
  const [fileBusy, setFileBusy] = useState(false);

  async function encodeFile(file: File) {
    setFileBusy(true);
    try {
      const bytes = await readFileAsBytes(file);
      const type = file.type || 'application/octet-stream';
      const base64 = bytesToBase64(bytes);
      setFileResult({
        name: file.name,
        type,
        base64,
        dataUri: `data:${type};base64,${base64}`,
      });
    } catch {
      toast.error('Could not read the file.');
      setFileResult(null);
    } finally {
      setFileBusy(false);
    }
  }

  // --- File tab (decode) state ---
  const [decodeInput, setDecodeInput] = useState('');
  const [decodeError, setDecodeError] = useState<string | null>(null);

  function downloadDecodedFile() {
    try {
      const bytes = base64ToBytes(decodeInput);
      setDecodeError(null);
      downloadBytes(bytes, 'decoded.bin', 'application/octet-stream');
      toast.success('Decoded file downloaded');
    } catch (e) {
      const msg =
        e instanceof DecodeError
          ? e.message
          : 'Could not decode the Base64 input.';
      setDecodeError(msg);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { value: 'text' as MainTab, label: 'Text' },
          { value: 'file' as MainTab, label: 'File' },
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
                <Tabs
                  tabs={[
                    { value: 'encode' as TextMode, label: 'Encode' },
                    { value: 'decode' as TextMode, label: 'Decode' },
                  ]}
                  value={textMode}
                  onChange={setTextMode}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTextMode('encode');
                    setText(SAMPLE_PLAIN);
                  }}
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
            <Field
              label={textMode === 'encode' ? 'Plain text' : 'Base64'}
              htmlFor="b64-text-input"
            >
              <TextArea
                id="b64-text-input"
                mono={textMode === 'decode'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                invalid={Boolean(error)}
                placeholder={
                  textMode === 'encode'
                    ? 'Type or paste text to Base64-encode…'
                    : 'Paste Base64 to decode…'
                }
              />
            </Field>
            {error && <InlineError>{error}</InlineError>}
          </Panel>

          <Panel title={textMode === 'encode' ? 'Base64' : 'Decoded text'}>
            {output ? (
              <ResultBlock
                label={textMode === 'encode' ? 'Base64' : 'Text'}
                value={output}
                mono={textMode === 'encode'}
                copy
              />
            ) : (
              <p className="text-sm text-muted">
                {error
                  ? 'Fix the input above to see the result.'
                  : 'Enter text above to convert it.'}
              </p>
            )}
          </Panel>
        </>
      ) : (
        <>
          <Panel title="Encode a file to Base64">
            <div className="space-y-3">
              <FileDrop
                onFile={encodeFile}
                onClear={() => setFileResult(null)}
                busy={fileBusy}
                hint="The file is read locally and encoded to a Base64 string and a data URI."
              />
              {fileResult && (
                <div className="space-y-2">
                  <ResultBlock
                    label="Base64"
                    value={fileResult.base64}
                    mono
                    copy
                  />
                  <ResultBlock
                    label="Data URI"
                    value={fileResult.dataUri}
                    mono
                    copy
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      downloadText(
                        fileResult.base64,
                        `${fileResult.name}.base64.txt`,
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" /> Download .txt
                  </Button>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Decode Base64 to a file">
            <div className="space-y-3">
              <Field label="Base64" htmlFor="b64-decode-file">
                <TextArea
                  id="b64-decode-file"
                  mono
                  value={decodeInput}
                  onChange={(e) => {
                    setDecodeInput(e.target.value);
                    setDecodeError(null);
                  }}
                  invalid={Boolean(decodeError)}
                  placeholder="Paste Base64 to turn back into a downloadable file…"
                />
              </Field>
              {decodeError && <InlineError>{decodeError}</InlineError>}
              <Button
                size="sm"
                variant="secondary"
                onClick={downloadDecodedFile}
                disabled={!decodeInput}
              >
                <Download className="h-3.5 w-3.5" /> Download decoded file
              </Button>
            </div>
          </Panel>

          <PrivacyNote>
            Files are read with the browser File API and encoded entirely in
            this tab. Nothing is uploaded to any server — the Base64 and data
            URI are produced locally and the decoded download is generated in
            memory.
          </PrivacyNote>
        </>
      )}
    </div>
  );
}
