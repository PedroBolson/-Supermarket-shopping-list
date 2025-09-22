import { motion } from 'framer-motion'

type FullScreenLoaderProps = {
  message?: string
}

export function FullScreenLoader({ message = 'Carregando interface...' }: FullScreenLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-lg">
      <motion.div
        className="flex flex-col items-center gap-6 rounded-3xl bg-surface/80 p-10 shadow-xl shadow-black/40 backdrop-blur"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      >
        <motion.span
          className="relative inline-flex h-16 w-16 items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary-500 via-accent-500 to-primary-300 opacity-70 blur" />
          <span className="relative h-12 w-12 rounded-full border-2 border-primary-400/60 border-t-transparent" />
        </motion.span>
        <p className="text-center text-lg font-medium text-muted">{message}</p>
      </motion.div>
    </div>
  )
}
