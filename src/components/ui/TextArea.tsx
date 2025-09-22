import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const textAreaId = id ?? props.name

    return (
      <label className="flex w-full flex-col gap-2" htmlFor={textAreaId}>
        {label ? <span className="text-sm font-medium text-muted">{label}</span> : null}
        <textarea
          ref={ref}
          id={textAreaId}
          className={cn(
            'min-h-[120px] w-full rounded-xl border border-border/30 bg-card px-4 py-3 text-sm text-foreground shadow-inner shadow-black/10 transition-all placeholder:text-muted/70 focus:border-primary-300 focus:shadow-primary-200/50 focus:outline-none dark:bg-surface/80 dark:shadow-black/40',
            error && 'border-danger-500/70 focus:border-danger-500 focus:shadow-danger-800/30',
            className,
          )}
          {...props}
        />
        {hint && !error ? <span className="text-xs text-muted">{hint}</span> : null}
        {error ? <span className="text-xs text-danger-500">{error}</span> : null}
      </label>
    )
  },
)

TextArea.displayName = 'TextArea'
