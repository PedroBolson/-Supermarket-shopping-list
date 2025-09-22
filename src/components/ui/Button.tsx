import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500 text-white shadow-lg shadow-primary-900/40 hover:shadow-xl hover:shadow-primary-900/50 focus:ring-2 focus:ring-primary-300',
  secondary:
    'bg-card text-foreground border border-border/40 hover:border-primary-400/40 hover:text-primary-600 shadow-sm hover:-translate-y-0.5 focus:ring-2 focus:ring-primary-200 dark:bg-surface/80 dark:hover:text-primary-100',
  ghost:
    'bg-transparent text-primary-600 hover:text-primary-700 hover:bg-primary-100/40 focus:ring-2 focus:ring-primary-200 dark:text-primary-200 dark:hover:text-primary-100 dark:hover:bg-primary-500/10',
  outline:
    'border border-primary-300 text-primary-600 bg-transparent hover:bg-primary-100/40 focus:ring-2 focus:ring-primary-200 dark:border-primary-500 dark:text-primary-100 dark:hover:bg-primary-500/10',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-sm md:text-base',
  lg: 'px-5 py-4 text-base md:text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl font-medium transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled ?? loading}
      {...props}
    >
      <span className={cn('transition-opacity', loading && 'opacity-0')}>{children}</span>
      {loading ? (
        <span className="absolute inset-y-0 inline-flex items-center justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-transparent" />
        </span>
      ) : null}
    </button>
  ),
)

Button.displayName = 'Button'
