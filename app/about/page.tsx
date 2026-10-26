import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Cpu,
  FileWarning,
  Github,
  Lock,
  Scale,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { Footer } from '@/components/shell/Footer';
import { TOOLS } from '@/lib/tool-registry';

export const metadata: Metadata = {
  title: 'About & Privacy',
  description:
    'How ForensiKit guarantees privacy by architecture: all processing is local, nothing is uploaded.',
};

const PRINCIPLES = [
  {
    icon: WifiOff,
    title: 'No uploads, ever',
    body: 'Files and text you drop in are read directly by your browser. There are no API routes, no servers, and no third-party endpoints that receive your data.',
  },
  {
    icon: Cpu,
    title: 'Computed in your browser',
    body: 'Hashing, AES, RSA, and PBKDF2 use the native Web Crypto API. Everything else runs in pure JavaScript bundled with the page.',
  },
  {
    icon: Lock,
    title: 'Nothing is persisted but preferences',
    body: 'Only your favorites, recent tools, theme, and optional text history live in localStorage — never file contents. Clear them anytime.',
  },
  {
    icon: ShieldCheck,
    title: 'Static by design',
    body: 'ForensiKit is a static site. You can even save it and run it fully offline; the privacy guarantee holds because there is no backend to call.',
  },
];

export default function AboutPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-text">
          Privacy by architecture
        </h1>
        <p className="mt-3 text-secondary">
          ForensiKit is a digital forensics &amp; cryptography workbench with{' '}
          {TOOLS.length} tools that run entirely client-side. The core promise
          is simple: your data never leaves your device. This isn&apos;t a
          policy you have to trust — it&apos;s how the app is built.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="rounded-card border border-border bg-card p-4"
            >
              <p.icon className="h-5 w-5 text-accent" />
              <h2 className="mt-2 font-medium text-text">{p.title}</h2>
              <p className="mt-1 text-13 text-muted">{p.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-text">
            <Scale className="h-5 w-5 text-warning" /> Legal &amp; ethical use
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              These tools are provided for{' '}
              <strong className="text-text">
                lawful, educational, and authorized investigative use only
              </strong>
              . Use them on data you own or are explicitly permitted to analyze.
            </p>
            <p>
              ForensiKit makes no claim of court-grade forensic certification.
              For evidence intended for legal proceedings, follow your
              jurisdiction&apos;s accepted procedures and validated tooling, and
              preserve a documented chain of custody.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-text">
            <FileWarning className="h-5 w-5 text-info" /> Browser requirements
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-secondary">
            The strongest cryptographic features rely on the Web Crypto API,
            which browsers only expose in secure contexts (HTTPS or{' '}
            <code className="rounded bg-surface px-1 py-0.5 font-mono text-xs text-accent">
              localhost
            </code>
            ). Where Web Crypto is unavailable, ForensiKit falls back to pure-JS
            implementations for hashing and classical ciphers and notes any
            reduced functionality.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-text">
            <Github className="h-5 w-5 text-secondary" /> Credits
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-secondary">
            Built with Next.js, the Web Crypto API, and excellent open-source
            libraries including crypto-js, js-sha3, exifr, fflate, bcryptjs,
            jsQR, qrcode, recharts, and lucide-react. Fonts: Inter, JetBrains
            Mono, and Space Grotesk.
          </p>
        </section>

        <div className="mt-10 flex gap-3">
          <Link
            href="/tools"
            className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:bg-accent-strong"
          >
            Explore the tools
          </Link>
          <Link
            href="/learn"
            className="rounded-btn border border-border px-4 py-2 text-sm text-text transition hover:bg-surface"
          >
            Read the guides
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
