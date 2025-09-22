import { UserRound } from 'lucide-react'
import { cn } from '../../utils/cn'

type AvatarProps = {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-16 w-16 text-lg',
}

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500/30 via-primary-500/15 to-accent-500/30 text-primary-600 dark:text-primary-50 shadow-[var(--shadow-lg)]',
        sizeMap[size],
        className,
      )}
    >
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : <UserRound className="h-1/2 w-1/2 opacity-70" />}
      <span className="pointer-events-none absolute inset-0 rounded-full border border-border/40" />
    </div>
  )
}
