/** Browser File helpers. Files are read into memory locally — never uploaded. */

export async function readFileAsBytes(file: File | Blob): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

export async function readFileSlice(
  file: File | Blob,
  start: number,
  end: number,
): Promise<Uint8Array> {
  const buf = await file.slice(start, end).arrayBuffer();
  return new Uint8Array(buf);
}

export const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB

/**
 * Stream a file in chunks, yielding each to `onChunk` and reporting progress.
 * Keeps the main thread responsive for large files and supports cancellation
 * via the returned `cancel()` (checked between chunks).
 */
export async function streamFile(
  file: File | Blob,
  onChunk: (chunk: Uint8Array, bytesRead: number) => void | Promise<void>,
  opts: {
    chunkSize?: number;
    onProgress?: (fraction: number, bytesRead: number) => void;
    signal?: AbortSignal;
  } = {},
): Promise<void> {
  const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_SIZE;
  let offset = 0;
  while (offset < file.size) {
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const end = Math.min(offset + chunkSize, file.size);
    const chunk = await readFileSlice(file, offset, end);
    await onChunk(chunk, end);
    offset = end;
    opts.onProgress?.(file.size === 0 ? 1 : offset / file.size, offset);
    // Yield to the event loop so the UI can paint progress.
    await new Promise((r) => setTimeout(r, 0));
  }
}

export function downloadBytes(
  bytes: Uint8Array | ArrayBuffer,
  filename: string,
  mime = 'application/octet-stream',
): void {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the download starts.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(
  text: string,
  filename: string,
  mime = 'text/plain',
): void {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}
