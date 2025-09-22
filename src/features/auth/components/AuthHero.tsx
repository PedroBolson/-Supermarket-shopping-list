import { motion } from 'framer-motion'
import { Check, ListChecks, Users } from 'lucide-react'

export function AuthHero() {
  return (
    <motion.div
      className="relative overflow-hidden rounded-[36px] border border-border/60 bg-surface/70 p-10 shadow-[var(--shadow-lg)] backdrop-blur-2xl"
      style={{ height: '620px' }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.1 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-10 -top-10 h-60 w-60 rounded-full bg-primary-500/40 blur-3xl"
          animate={{ x: [0, 20, -20, 0], y: [0, -30, 10, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-accent-500/35 blur-3xl"
          animate={{ x: [0, -20, 20, 0], y: [0, 25, -15, 0] }}
          transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative flex h-full flex-col justify-between gap-8">
        <div className="space-y-5">
          <motion.h1
            className="text-4xl font-semibold text-foreground md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Nosso cantinho inteligente para organizar as compras sem stress.
          </motion.h1>

          <motion.p
            className="text-base text-muted md:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            É aqui que a gente combina o que falta, vê quem adicionou cada item e garante que a geladeira nunca fique vazia.
          </motion.p>
        </div>

        <motion.ul
          className="grid gap-3 text-sm text-muted"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.1, delayChildren: 0.45 },
            },
          }}
        >
          {[
            { icon: ListChecks, text: 'Listas atualizadas em tempo real para nós dois' },
            { icon: Users, text: 'Cada item mostra quem adicionou ou finalizou' },
            { icon: Check, text: 'Marque o que já compramos e mantenha tudo sincronizado' },
          ].map(({ icon: Icon, text }) => (
            <motion.li
              key={text}
              className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card px-4 py-2.5 text-muted backdrop-blur transition-colors hover:border-primary-300/60 hover:text-primary-700 dark:text-slate-200 dark:hover:text-primary-50"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500/15 text-primary-600 dark:text-primary-100">
                <Icon className="h-4 w-4" />
              </span>
              <span>{text}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.div>
  )
}
