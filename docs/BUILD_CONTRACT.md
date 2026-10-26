# ForensiKit tool component build contract

Read this fully, then read the three reference components for patterns:

- `components/tools/HashGenerator.tsx` (text tool pattern)
- `components/tools/CaesarCipher.tsx` (classical / slider / brute-force pattern)
- `components/tools/FileHasher.tsx` (file / streaming / progress pattern)

## Hard rules

1. Every file starts with `'use client';` and has a **default export** React component named exactly like the file (e.g. `export default function Base64Tool()`).
2. **No new npm dependencies.** Only use what is already installed (listed below).
3. Must compile under **TypeScript strict**. No `any` unless unavoidable (prefer `unknown` + narrowing). **No unused imports or variables.**
4. Every tool provides: a **"Load sample"** button, a **"Clear"** button, **copy buttons on every output**, and a friendly **empty state** (never a blank pane, never an uncaught throw).
5. Text tools recompute **live** with `useDebouncedValue(value, 150)` from `@/lib/hooks`. Tools above heavy cost use an explicit compute button.
6. Decoding/parse failures show an inline, specific error via `<InlineError>` — never crash. Catch `DecodeError` (has `.position` and `.message`) from `@/lib/encoding`.
7. Accessibility: label every input. Use `<Field label htmlFor>` and matching `id`. Status must not be color-only (add ✓/✗ icons + text).
8. File tools: use `<FileDrop>`, read bytes with helpers from `@/lib/file`, and include a `<PrivacyNote>` reminding the user nothing is uploaded. Never upload anything.
9. Respect the design system — use the provided primitives, not raw styled divs, for inputs/buttons/panels. Tailwind tokens: `bg-bg surface card border text secondary muted accent indigo success warning danger info`, fonts `font-mono font-display`, radii `rounded-card rounded-input rounded-btn`.
10. Match the look of the three reference components: wrap the body in `<div className="space-y-4">`, group sections in `<Panel title actions>`.

## Installed libraries (import only these)

- React 18, `lucide-react` (icons)
- `crypto-js`, `js-sha3`, `bcryptjs`, `exifr`, `fflate`, `jsqr`, `qrcode`, `recharts`
- Native `crypto.subtle`, `TextEncoder/Decoder`, `Blob`, `URL`, `canvas`

## UI primitives (props)

```ts
// @/components/ui/Button
<Button variant="primary"|"secondary"|"ghost"|"danger" size="sm"|"md" onClick disabled>…</Button>
// @/components/ui/Input  (extends input attrs)
<Input mono invalid value onChange placeholder id />
// @/components/ui/TextArea (extends textarea attrs; mono defaults true)
<TextArea mono invalid value onChange placeholder id />
// @/components/ui/Select
<Select id value onChange options={[{value,label}]} />   // or children <option>
// @/components/ui/Toggle
<Toggle checked onChange={(b)=>…} label id />
// @/components/ui/Slider
<Slider id label valueLabel min max step value onChange={(n)=>…} />
// @/components/ui/Tabs
<Tabs tabs={[{value,label}]} value onChange={(v)=>…} />
// @/components/ui/Badge
<Badge tone="default"|"accent"|"success"|"warning"|"danger"|"info"|"indigo">…</Badge>
// @/components/ui/CopyButton
<CopyButton value="…" label?="Copy" />
// @/components/ui/ResultBlock
<ResultBlock label="SHA-256" value="…" meta={<Badge/>} mono copy />
// @/components/ui/FileDrop
<FileDrop onFile={(f:File)=>…} onClear?={()=>…} accept? maxSizeMB? hint? busy? />
// @/components/ui/HexView
<HexView bytes={Uint8Array} height? highlights={[{start,end}]} scrollToOffset? />
// @/components/ui/ByteHistogram
import { ByteHistogram, EntropyChart } from '@/components/ui/ByteHistogram'
<ByteHistogram histogram={number[256]} height? />
<EntropyChart samples={number[]} height? />
// @/components/ui/Card -> Card, CardHeader
// @/components/ui/Tooltip -> <Tooltip content side="top"|"bottom">child</Tooltip>
// @/components/ui/ToolShell helpers:
import { Panel, ToolGrid, ToolActions, Field, InlineError, EmptyState, PrivacyNote } from '@/components/ui/ToolShell'
<Panel title="Input" actions={…}>…</Panel>
<ToolGrid> two responsive columns </ToolGrid>
<Field label htmlFor hint>…</Field>
<InlineError>{message}</InlineError>
<EmptyState message action={<Button/>} />
<PrivacyNote>…</PrivacyNote>
```

## Toasts & helpers

```ts
import { toast } from '@/lib/toast'; // toast.success/error/info/warning
import { useDebouncedValue, useReducedMotion, useMounted } from '@/lib/hooks';
import {
  readFileAsBytes,
  readFileSlice,
  streamFile,
  downloadBytes,
  downloadBlob,
  downloadText,
} from '@/lib/file';
import { cn } from '@/lib/cn';
```

## lib API (import from these — DO NOT reimplement)

```ts
// @/lib/encoding
DecodeError(message, position)
utf8ToBytes(s) bytesToUtf8(bytes, fatal?) latin1ToBytes bytesToLatin1
bytesToHex(bytes, sep?) hexToBytes(hex)
bytesToBase64 base64ToBytes toBase64Url bytesToBase64Url
bytesToBase32 base32ToBytes bytesToBinary binaryToBytes
bytesToDecimal decimalToBytes urlEncode urlDecode htmlEncode htmlDecode
textToCodePoints codePointsToText

// @/lib/crypto/hashing
HASH_ALGOS hashHex(algo,bytes) hashHexText(algo,text) hashAll(bytes) hashAllText(text)
createIncrementalHasher('MD5'|'SHA-1'|'SHA-256'|'SHA-512') hashesMatch(a,b) hashBits(algo)
// @/lib/crypto/hmac
HMAC_ALGOS hmacHex(algo,msgBytes,keyBytes) hmacResult(algo,msg,key)=>{hex,base64}
// @/lib/crypto/identify-hash
identifyHash(s) => {algorithm,confidence:'high'|'medium'|'low',note}[]
// @/lib/crypto/classical
caesarShift(text,shift) caesarAllShifts(text) rot13(text) atbash(text)
vigenere(text,key,'encrypt'|'decrypt') xorBytes(data,key) textToMorse(text) morseToText(m) morseTimingUnits(m)
// @/lib/crypto/aes  (async)
encryptAes({mode:'GCM'|'CBC',data:Uint8Array,passphrase?,rawKeyHex?,keyBits?,iterations?,hash?}) => {bundleB64,saltHex?,ivHex,iterations?,keyBits,mode}
decryptAes({mode,bundleB64,passphrase?,rawKeyHex?,keyBits?,iterations?,hash?}) => Uint8Array
DEFAULT_PBKDF2_ITERATIONS
// @/lib/crypto/pbkdf2 (async)
pbkdf2Derive({password,salt:Uint8Array,iterations,hash:'SHA-1'|'SHA-256'|'SHA-384'|'SHA-512',dkLenBits}) => Uint8Array
pbkdf2Result(...) => {hex,base64}   PBKDF2_RECOMMENDATION
// @/lib/crypto/rsa (async)
generateRsaKeyPair(2048|4096,'encrypt'|'sign')=>{publicPem,privatePem}
generateEcdsaKeyPair()=>{publicPem,privatePem}
rsaEncrypt(pubPem,msg) rsaDecrypt(privPem,b64) rsaSign(privPem,msg) rsaVerify(pubPem,msg,sigB64)
ecdsaSign(privPem,msg) ecdsaVerify(pubPem,msg,sigB64) verifyJwtHmac(signingInput,sigB64Url,secret,256|384|512)
// @/lib/forensics/signatures
matchSignatures(bytes)=>SignatureMatch[] leadingHex(bytes,count?) checkExtension(filename,matches)=>{declaredExt,matched,mismatch,message} MAX_SIGNATURE_SCAN
// @/lib/forensics/entropy
shannonEntropy(bytes) byteHistogram(bytes) slidingWindowEntropy(bytes,win?,samples?) analyzeEntropy(bytes,win?)=>{shannon,perByte,histogram,verdict} entropyVerdict(n)
// @/lib/forensics/strings
extractStrings(bytes,minLen?,'ascii'|'utf16le'|'both')=>{offset,value,encoding}[]
// @/lib/forensics/exif
parseExif(File|ArrayBuffer|Uint8Array)=>ExifResult|null  osmLink(lat,lng) formatGps(lat,lng)
// @/lib/password
analyzePassword(pw)=>PasswordReport  crackTimes(guesses) isCommonPassword(pw) SCORE_LABELS
// @/lib/format
bytesToHuman(n) formatNumber(n) groupHex(hex,group?,sep?) relativeTime(target,now?) humanizeSeconds(s)
unixSecondsToDate unixMillisToDate filetimeToDate webkitToDate macAbsoluteToDate hfsToDate dateToUnixSeconds isoUtc
```

Data files: `import wordlist from '@/data/wordlist.json'` (string[]), `@/data/common-passwords.json` (string[]), `@/data/signatures.json`.

## Types

`import type { PasswordReport, ExifResult, SignatureMatch, EntropyResult } from '@/lib/types'`

## Layout idiom

```tsx
'use client';
import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel, Field } from '@/components/ui/ToolShell';
// …
export default function MyTool() {
  const [input, setInput] = useState('');
  // load sample / clear buttons in <Panel actions>, live output in a second <Panel>
}
```

Use a `ToolGrid` (input panel + result panel) for side-by-side tools when it reads better; stack with `space-y-4` otherwise.
