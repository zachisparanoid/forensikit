# ForensiKit

A complete **digital forensics & cryptography workbench** that runs **entirely in your
browser**. Zero sign-up, zero backend, zero uploads — every byte you drop in is
processed locally via the Web Crypto API, WebAssembly-free pure-JS libraries, and
canvas. Built for forensics students, CTF competitors, incident responders,
journalists verifying media, and curious hobbyists.

> **Privacy by architecture.** There are no API routes that touch your data, no
> database, and no analytics on your content. The app is a static export — you can
> even save it and run it fully offline.

## Features

**35 tools** across 8 categories, all deep-linkable at `/tools/[slug]`:

- **Hashing** — Hash Generator (MD5/SHA-1/2/3/RIPEMD-160), File Hasher (chunked +
  expected-hash compare), HMAC Generator, Hash Identifier.
- **Encoding** — Encoding Multitool (Base64/32, hex, binary, decimal, URL, HTML,
  Unicode), Base64 (text + files), URL, and HTML-entity tools.
- **Classical crypto** — Caesar (+ 26-shift brute force), ROT13, Atbash, Vigenère,
  XOR (text/file), Morse (audio + visual).
- **Modern crypto** — AES-GCM/CBC (PBKDF2 or raw key), RSA/ECDSA toolkit, PBKDF2,
  bcrypt, JWT decoder (honest verification semantics).
- **File analysis** — File Signature Identifier, virtualized Hex Inspector, String
  Extractor, Entropy Analyzer, ZIP Inspector, EXIF/Metadata Viewer (+ strip), Stego
  LSB Helper.
- **Text analysis** — Password Analyzer, Character Inspector (invisible/confusable
  detection), Regex Tester, Frequency Analyzer.
- **Generators** — Password/passphrase generator, UUID (v4/v7), QR encode/decode.
- **Converters** — Number Base Converter, Timestamp Converter (Unix/ISO + FILETIME,
  WebKit, Mac/HFS forensic epochs).

Plus a searchable **knowledge base** (`/learn`) of 14 substantive MDX guides, a
global **⌘K command palette**, favorites/recents, light/dark themes, and full
keyboard + screen-reader support.

## Tech stack

- **Next.js 14** (App Router) with **static export** (`output: 'export'`) — no server.
- **React 18 + TypeScript** (strict), **Tailwind CSS** with CSS-variable theme tokens.
- **zustand** for favorites/recents/theme persisted to `localStorage`.
- Crypto/forensics: native **Web Crypto**, `crypto-js`, `js-sha3`, `bcryptjs`,
  `exifr`, `fflate`, `jsqr`, `qrcode`, `recharts`.
- **Vitest** unit tests with published test vectors (RFC 4648/4231/6070, NIST).

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

```bash
npm run dev        # dev server
npm run build      # static export to ./out
npm run test       # vitest unit tests
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run format     # prettier --write
```

The production build emits a fully static site to `out/`; serve it from any static
host (or `npx serve out`). The strongest crypto features require a secure context
(HTTPS or `localhost`).

## Architecture notes

- **`lib/tool-registry.ts`** is the single source of truth for tool **metadata**
  (id, slug, name, category, icon, keywords). It is safe to import from server
  components.
- **`lib/tool-components.tsx`** maps each slug to a lazily-loaded component and is
  imported **only** behind the client boundary (`ToolWorkbench`). Keeping these
  separate ensures server pages never bundle heavy tool code — each tool's chunk
  loads on demand.
- Pure logic lives in `lib/` (crypto, forensics, encoding, password, format) and is
  fully unit-tested; UI components import from there and never reimplement it.

## Legal & ethical use

For **lawful, educational, and authorized investigative use only**. ForensiKit makes
no claim of court-grade forensic certification. Use it on data you own or are
explicitly permitted to analyze.
