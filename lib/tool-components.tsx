import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import ToolLoading from '@/components/ui/ToolLoading';

/**
 * Slug -> lazy tool component. Kept SEPARATE from lib/tool-registry.ts (which is
 * metadata only) so that server components importing tool metadata never pull
 * the heavy client tool code (recharts, crypto-js, exifr, …) into their bundle.
 * This module is only ever imported behind a client boundary (ToolWorkbench),
 * so each tool is code-split and loaded on demand.
 */
const COMPONENTS: Record<string, ComponentType> = {
  'hash-generator': dynamic(() => import('@/components/tools/HashGenerator'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'file-hasher': dynamic(() => import('@/components/tools/FileHasher'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'hmac-generator': dynamic(() => import('@/components/tools/HmacGenerator'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'hash-identifier': dynamic(
    () => import('@/components/tools/HashIdentifier'),
    { ssr: false, loading: ToolLoading },
  ),
  'encoding-multitool': dynamic(
    () => import('@/components/tools/EncodingMultitool'),
    { ssr: false, loading: ToolLoading },
  ),
  'base64-tool': dynamic(() => import('@/components/tools/Base64Tool'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'url-encoder': dynamic(() => import('@/components/tools/UrlEncoder'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'html-entity-tool': dynamic(
    () => import('@/components/tools/HtmlEntityTool'),
    { ssr: false, loading: ToolLoading },
  ),
  'caesar-cipher': dynamic(() => import('@/components/tools/CaesarCipher'), {
    ssr: false,
    loading: ToolLoading,
  }),
  rot13: dynamic(() => import('@/components/tools/Rot13Tool'), {
    ssr: false,
    loading: ToolLoading,
  }),
  atbash: dynamic(() => import('@/components/tools/Atbash'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'vigenere-cipher': dynamic(
    () => import('@/components/tools/VigenereCipher'),
    { ssr: false, loading: ToolLoading },
  ),
  'xor-cipher': dynamic(() => import('@/components/tools/XorCipher'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'morse-code': dynamic(() => import('@/components/tools/MorseCode'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'aes-tool': dynamic(() => import('@/components/tools/AesTool'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'rsa-tool': dynamic(() => import('@/components/tools/RsaTool'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'pbkdf2-tool': dynamic(() => import('@/components/tools/PbkdfTool'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'bcrypt-tool': dynamic(() => import('@/components/tools/BcryptTool'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'jwt-decoder': dynamic(() => import('@/components/tools/JwtDecoder'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'file-signature-id': dynamic(
    () => import('@/components/tools/FileSignatureId'),
    { ssr: false, loading: ToolLoading },
  ),
  'hex-inspector': dynamic(() => import('@/components/tools/HexInspector'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'string-extractor': dynamic(
    () => import('@/components/tools/StringExtractor'),
    { ssr: false, loading: ToolLoading },
  ),
  'entropy-analyzer': dynamic(
    () => import('@/components/tools/EntropyAnalyzer'),
    { ssr: false, loading: ToolLoading },
  ),
  'zip-inspector': dynamic(() => import('@/components/tools/ZipInspector'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'exif-viewer': dynamic(() => import('@/components/tools/ExifViewer'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'stego-lsb': dynamic(() => import('@/components/tools/StegoLsbHelper'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'password-analyzer': dynamic(
    () => import('@/components/tools/PasswordAnalyzer'),
    { ssr: false, loading: ToolLoading },
  ),
  'character-inspector': dynamic(
    () => import('@/components/tools/CharacterInspector'),
    { ssr: false, loading: ToolLoading },
  ),
  'regex-tester': dynamic(() => import('@/components/tools/RegexTester'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'frequency-analyzer': dynamic(
    () => import('@/components/tools/FrequencyAnalyzer'),
    { ssr: false, loading: ToolLoading },
  ),
  'password-generator': dynamic(
    () => import('@/components/tools/PasswordGenerator'),
    { ssr: false, loading: ToolLoading },
  ),
  'uuid-tool': dynamic(() => import('@/components/tools/UuidTool'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'qr-tool': dynamic(() => import('@/components/tools/QrTool'), {
    ssr: false,
    loading: ToolLoading,
  }),
  'number-base-converter': dynamic(
    () => import('@/components/tools/NumberBaseConverter'),
    { ssr: false, loading: ToolLoading },
  ),
  'timestamp-converter': dynamic(
    () => import('@/components/tools/TimestampConverter'),
    { ssr: false, loading: ToolLoading },
  ),
};

export function getToolComponent(slug: string): ComponentType | undefined {
  return COMPONENTS[slug];
}
