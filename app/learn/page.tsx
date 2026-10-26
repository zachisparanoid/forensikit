import type { Metadata } from 'next';
import { LearnIndex } from '@/components/learn/LearnIndex';
import { Footer } from '@/components/shell/Footer';

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description:
    'Substantive primers on digital forensics and cryptography: process, file systems, hashing, ciphers, steganography, EXIF, and a CTF cheat-sheet.',
};

export default function LearnPage() {
  return (
    <>
      <LearnIndex />
      <Footer />
    </>
  );
}
