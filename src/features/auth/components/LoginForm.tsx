import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input, Button } from '../../../components/ui'

type LoginFormProps = {
  loading: boolean
  onSubmit: (payload: { email: string; password: string }) => Promise<void>
  onSwitchToRegister: () => void
  feedback?: { type: 'error' | 'success'; message: string } | null
  formKey: string
}

export function LoginForm({ loading, onSubmit, onSwitchToRegister, feedback, formKey }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({ email, password })
  }

  return (
    <motion.form
      key={formKey}
      onSubmit={handleSubmit}
      className="flex flex-col gap-7"
      style={{ width: 'min(420px, 100%)' }}
      initial={{ opacity: 0, x: 40, height: 'auto' }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: -40, height: 'auto' }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
    >
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Entrar no app</h2>
        <p className="text-base text-muted leading-relaxed">
          Digite seu email e senha para acessar as listas de compras personalizadas.
        </p>
      </div>

      {feedback ? (
        <motion.div
          className="rounded-xl border border-border/50 bg-card/70 px-4 py-3 text-sm"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: feedback.type === 'error' ? '#fda4af' : '#bbf7d0' }}
        >
          {feedback.message}
        </motion.div>
      ) : null}

      <div className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="seuemail@exemplo.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          className="self-start text-sm font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-200 dark:hover:text-primary-50"
        >
          Esqueci minha senha
        </button>

        <Button type="submit" size="lg" loading={loading} className="py-4">
          Acessar nossas listas
        </Button>
      </div>

      <p className="text-sm text-muted">
        Precisamos de um novo acesso?{' '}
        <button
          type="button"
          className="font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-200 dark:hover:text-primary-50"
          onClick={onSwitchToRegister}
        >
          Criar cadastro
        </button>
      </p>
    </motion.form>
  )
}
