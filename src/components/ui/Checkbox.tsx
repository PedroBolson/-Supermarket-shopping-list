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
        'relative inline-flex h-5 w-5 items-center justify-center rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-60',
        !checked && 'border-border/60 bg-white/80 shadow-sm hover:border-primary-400/80 hover:bg-primary-50/50 dark:border-border/50 dark:bg-surface/90 dark:hover:border-primary-400/70 dark:hover:bg-primary-900/20',
        checked && '!border-success-500 !bg-success-500 !text-white !shadow-md !shadow-success-500/25 hover:!border-success-600 hover:!bg-success-600 dark:!border-success-400 dark:!bg-success-500',
        className,
      )}
      onClick={() => (disabled ? undefined : onChange?.(!checked))}
      aria-pressed={checked}
      disabled={disabled}
    >
      <motion.span
        initial={false}
        animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="inline-flex h-5 w-5 items-center justify-center"
      >
        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
      </motion.span>
    </button>
  )
}
