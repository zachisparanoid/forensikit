import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { TopBar } from '@/components/shell/TopBar';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { ShortcutsSheet } from '@/components/shell/ShortcutsSheet';
import { StoreHydrator } from '@/components/shell/StoreHydrator';
import { Toaster } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ForensiKit — Digital Forensics & Cryptography Workbench',
    template: '%s · ForensiKit',
  },
  description:
    'A complete digital forensics & cryptography workbench that runs entirely in your browser. Hashing, encoding, ciphers, EXIF, hex, entropy, and more — nothing is ever uploaded.',
  keywords: [
    'digital forensics',
    'cryptography',
    'hash',
    'EXIF',
    'hex editor',
    'CTF',
    'steganography',
    'entropy',
  ],
  applicationName: 'ForensiKit',
  authors: [{ name: 'ForensiKit' }],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0B0F14',
  width: 'device-width',
  initialScale: 1,
};

// Blocking script: apply the saved theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem('forensikit:theme'));if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <StoreHydrator />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        <TopBar />
        <div id="main">{children}</div>
        <CommandPalette />
        <ShortcutsSheet />
        <Toaster />
      </body>
    </html>
  );
}
