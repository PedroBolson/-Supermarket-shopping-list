import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

type CheckboxProps = {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Checkbox({ checked, onChange, disabled = false, className }: CheckboxProps) {
  return (
    <button
      type="button"
      className={cn(
        'relative inline-flex h-5 w-5 items-center justify-center rounded-lg border border-border/40 bg-card transition focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-surface/70',
        checked && 'border-primary-400/80 bg-primary-500/20 text-primary-600 dark:bg-primary-500/30 dark:text-primary-50',
        className,
      )}
      onClick={() => (disabled ? undefined : onChange?.(!checked))}
      aria-pressed={checked}
      disabled={disabled}
    >
      <motion.span
        initial={false}
        animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="inline-flex h-5 w-5 items-center justify-center"
      >
        <Check className="h-3 w-3" />
      </motion.span>
    </button>
  )
}
