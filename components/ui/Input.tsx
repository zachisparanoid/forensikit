import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, mono, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-input bg-surface px-3 text-sm text-text',
        'border border-border placeholder:text-muted',
        'transition focus:border-accent focus:shadow-glow focus:outline-none',
        invalid && 'border-danger focus:border-danger focus:shadow-none',
        mono && 'font-mono',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
