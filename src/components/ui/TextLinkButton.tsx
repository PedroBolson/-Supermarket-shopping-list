import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type TextLinkButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function TextLinkButton({ className, ...props }: TextLinkButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-700 transition hover:bg-primary-200 dark:bg-primary-500/15 dark:text-primary-100 dark:hover:bg-primary-500/25 dark:hover:text-primary-50',
        className,
      )}
      {...props}
    />
  )
}
