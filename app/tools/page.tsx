import type { Metadata } from 'next';
import { ToolsIndex } from '@/components/tools/ToolsIndex';

export const metadata: Metadata = {
  title: 'All Tools',
  description:
    'Every ForensiKit tool, grouped by category. Hashing, encoding, ciphers, file analysis, and more — all running locally in your browser.',
};

export default function ToolsPage() {
  return <ToolsIndex />;
}
