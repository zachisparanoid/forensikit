import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean;
  invalid?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, mono = true, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      spellCheck={false}
      className={cn(
        'min-h-[120px] w-full resize-y rounded-input bg-surface p-3 text-sm text-text',
        'border border-border leading-relaxed placeholder:text-muted',
        'transition focus:border-accent focus:shadow-glow focus:outline-none',
        invalid && 'border-danger focus:border-danger focus:shadow-none',
        mono && 'font-mono',
        className,
      )}
      {...props}
    />
  ),
);
TextArea.displayName = 'TextArea';
