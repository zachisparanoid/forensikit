'use client';

import { useRef, useState, type DragEvent } from 'react';
import { FileUp, Lock, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { bytesToHuman } from '@/lib/format';

interface FileDropProps {
  onFile: (file: File) => void;
  onClear?: () => void;
  accept?: string;
  /** Soft ceiling — shows a "may be slow" note above this size. */
  maxSizeMB?: number;
  hint?: string;
  busy?: boolean;
  className?: string;
}

export function FileDrop({
  onFile,
  onClear,
  accept,
  maxSizeMB = 2048,
  hint,
  busy,
  className,
}: FileDropProps) {
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setSelected(file);
    onFile(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function clear() {
    setSelected(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  }

  const tooBig = selected ? selected.size > maxSizeMB * 1024 * 1024 : false;

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop a file or click to choose. Processing is local only; nothing is uploaded."
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed p-8 text-center transition-all',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          dragging
            ? 'scale-[1.01] border-accent bg-accent/[0.08]'
            : 'border-border bg-surface hover:border-muted',
        )}
      >
        <FileUp
          className={cn('h-7 w-7', dragging ? 'text-accent' : 'text-muted')}
        />
        <p className="text-sm text-text">
          <span className="font-medium text-accent">Click to choose</span> or
          drag a file here
        </p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
        <p className="mt-1 inline-flex items-center gap-1 text-2xs font-medium text-success">
          <Lock className="h-3 w-3" />
          Local only — this file is never uploaded
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {selected && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-input border border-border bg-card px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{selected.name}</p>
            <p className="text-xs text-muted">
              {bytesToHuman(selected.size)} · {selected.size.toLocaleString()}{' '}
              bytes
              {selected.type ? ` · ${selected.type}` : ''}
            </p>
            {tooBig && (
              <p className="mt-0.5 text-xs text-warning">
                Large file — processing may be slow; a desktop tool may be
                faster.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={clear}
            disabled={busy}
            aria-label="Remove file"
            className="shrink-0 rounded-md p-1 text-muted transition hover:bg-surface hover:text-text disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
