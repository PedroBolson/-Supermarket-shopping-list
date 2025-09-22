import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  leftAddon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leftAddon, id, ...props }, ref) => {
    const inputId = id ?? props.name

    return (
      <label className="flex w-full flex-col gap-2" htmlFor={inputId}>
        {label ? <span className="text-sm font-medium text-muted">{label}</span> : null}
        <div
          className={cn(
            'group/input relative flex items-center gap-3 rounded-2xl border border-border/40 bg-white/90 px-5 py-4 text-foreground shadow-sm shadow-[rgba(15,23,42,0.04)] transition-all focus-within:border-primary-400 focus-within:shadow-[0_12px_32px_rgba(99,102,241,0.18)] hover:border-border/60 dark:border-border/30 dark:bg-surface/80 dark:shadow-black/40 dark:hover:border-border/50',
            error && 'border-danger-500/70 focus-within:border-danger-500 focus-within:shadow-danger-800/30',
          )}
        >
          {leftAddon ? <span className="text-muted">{leftAddon}</span> : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-transparent text-base outline-none placeholder:text-muted/60 autofill:shadow-[0_0_0px_1000px_rgba(255,255,255,0.7)_inset] autofill:text-foreground dark:autofill:shadow-[0_0_0px_1000px_rgba(17,24,39,0.8)_inset]',
              className,
            )}
            {...props}
          />
        </div>
        {hint && !error ? <span className="text-xs text-muted">{hint}</span> : null}
        {error ? <span className="text-xs text-danger-500">{error}</span> : null}
      </label>
    )
  },
)

Input.displayName = 'Input'
