import { useMemo, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Shield, ShieldAlert, ShieldCheck, Users } from 'lucide-react'
import { Button, Card, Input, Avatar } from '../../components/ui'
import type { UserProfile } from '../../types'
import { listenUsers, setUserActive } from './services'
import { cn } from '../../utils/cn'

export function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const unsubscribe = listenUsers((list) => {
      setUsers(list)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) =>
      [user.name, user.email].some((value) => value?.toLowerCase().includes(query)),
    )
  }, [users, searchTerm])

  const pendingUsers = users.filter((user) => !user.isActive)

  const handleToggleActive = async (user: UserProfile) => {
    setUpdatingUser(user.uid)
    try {
      await setUserActive(user.uid, !user.isActive)
    } finally {
      setUpdatingUser(null)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <motion.h1
            className="text-3xl font-semibold text-foreground md:text-4xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Controle de usuários
          </motion.h1>
          <p className="text-sm text-muted">
            Aprove ou suspenda acessos rapidamente para manter o espaço colaborativo seguro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card px-4 py-2 text-sm text-muted dark:border-border/60 dark:bg-card/70">
            <ShieldCheck className="h-4 w-4 text-success-500" /> Ativos: {users.length - pendingUsers.length}
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card px-4 py-2 text-sm text-muted dark:border-border/60 dark:bg-card/70">
            <ShieldAlert className="h-4 w-4 text-warning-500" /> Pendentes: {pendingUsers.length}
          </div>
        </div>
      </header>

      <Card className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Input
            label="Buscar"
            placeholder="Filtrar por nome ou email"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="md:w-80"
          />
          <div className="flex items-center gap-3 text-sm text-muted">
            <Users className="h-4 w-4" />
            <span>{filteredUsers.length} usuários encontrados</span>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {filteredUsers.map((user) => {
              const badgeColor = user.isActive ? 'text-success-500' : 'text-warning-500'
              const BadgeIcon = user.isActive ? CheckCircle2 : Shield

              return (
                <motion.div
                  key={user.uid}
                  className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card p-5 sm:flex-row sm:items-center sm:justify-between dark:border-border/60 dark:bg-card/70"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-start gap-4">
                    <Avatar src={user.photoURL ?? null} alt={user.name} size="lg" />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-foreground">{user.name}</p>
                        <span className={cn('flex items-center gap-1 text-xs font-semibold', badgeColor)}>
                          <BadgeIcon className="h-4 w-4" />
                          {user.isActive ? 'Ativo' : 'Aguardando aprovação'}
                        </span>
                      </div>
                      <p className="text-sm text-muted">{user.email}</p>
                      <p className="text-xs text-muted/70">
                        Criado em{' '}
                        {user.createdAt
                          ? user.createdAt.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant={user.isActive ? 'ghost' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleActive(user)}
                      loading={updatingUser === user.uid}
                    >
                      {user.isActive ? 'Suspender acesso' : 'Aprovar acesso'}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {!filteredUsers.length && !loading ? (
            <div className="rounded-2xl border border-dashed border-border/40 p-10 text-center text-sm text-muted">
              {searchTerm
                ? 'Nenhum usuário encontrado com esse termo.'
                : 'Nenhum usuário cadastrado até o momento.'}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border/40 bg-card p-6 text-center text-sm text-muted dark:bg-card/70">
            Carregando usuários...
          </div>
        ) : null}
      </Card>
    </div>
  )
}
