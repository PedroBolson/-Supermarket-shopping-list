import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border/40 bg-card/90 p-8 shadow-[var(--shadow-lg)] backdrop-blur-xl transition hover:border-primary-300/60 dark:bg-surface/80',
        className,
      )}
    >
      {children}
    </div>
  )
}
