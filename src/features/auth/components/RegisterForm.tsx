import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Input } from '../../../components/ui'

type RegisterFormProps = {
  loading: boolean
  onSubmit: (payload: { name: string; email: string; password: string; confirmPassword: string }) => Promise<void>
  onSwitchToLogin: () => void
  feedback?: { type: 'error' | 'success'; message: string } | null
  formKey: string
}

export function RegisterForm({ loading, onSubmit, onSwitchToLogin, feedback, formKey }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({ name, email, password, confirmPassword })
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
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Criar um acesso novo</h2>
        <p className="text-base text-muted leading-relaxed">
          Use esta parte só quando formos adicionar alguém da família. Depois é só aprovar no painel de usuários.
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
          label="Nome completo"
          placeholder="Como devemos te chamar?"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
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
          placeholder="Crie uma senha segura"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Input
          label="Confirmar senha"
          type="password"
          placeholder="Repita a senha"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>

      <Button type="submit" size="lg" loading={loading} className="py-4">
        Guardar cadastro
      </Button>

      <p className="text-sm text-muted">
        Já temos um acesso ativo?{' '}
        <button
          type="button"
          className="font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-200 dark:hover:text-primary-50"
          onClick={onSwitchToLogin}
        >
          Entrar direto
        </button>
      </p>
    </motion.form>
  )
}
