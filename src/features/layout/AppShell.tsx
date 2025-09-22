import { Suspense, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ListChecks,
  LogOut,
  Menu,
  Settings,
  Users,
  UserRound,
  X,
} from 'lucide-react'
import { Avatar, Button } from '../../components/ui'
import { useAuth } from '../../hooks/use-auth'
import { cn } from '../../utils/cn'
import { useTheme } from '../../contexts/theme-context'

const navItems = [
  { label: 'Listas', icon: ListChecks, to: '/app', exact: true },
  { label: 'Usuários', icon: Users, to: '/app/users' },
  { label: 'Perfil', icon: UserRound, to: '/app/profile' },
]

export function AppShell() {
  const { profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="relative min-h-screen bg-transparent">
      <div className="flex min-h-screen w-full">
        <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col border-r border-border/60 bg-surface/70 p-6 backdrop-blur-xl lg:flex">
          <SidebarHeader />
          <div className="mt-4 mb-6">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center rounded-2xl px-4 py-3 text-xs uppercase tracking-[0.3em]"
              onClick={toggleTheme}
            >
              Tema: {theme === 'dark' ? 'Escuro' : 'Claro'}
            </Button>
          </div>
          <nav className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.exact} className="relative">
                {({ isActive }) => (
                  <motion.div
                    className="group flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-4 text-sm font-medium text-muted transition"
                    initial={false}
                  >
                    <div className="relative flex flex-1 items-center gap-3">
                      <AnimatePresence>
                        {isActive ? (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-primary-500/35 via-primary-500/15 to-transparent"
                            transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                          />
                        ) : null}
                      </AnimatePresence>
                      <item.icon className={cn('h-5 w-5 transition', isActive ? 'text-primary-100' : 'text-muted')} />
                      <span className={cn('transition', isActive ? 'text-primary-50' : 'text-muted')}>{item.label}</span>
                    </div>
                    <motion.span
                      className="h-2 w-2 rounded-full bg-primary-400/60 opacity-0"
                      animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.6 }}
                    />
                  </motion.div>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="flex items-center gap-3">
            <Avatar src={profile?.photoURL ?? null} alt={profile?.name} size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-primary-50">{profile?.name}</span>
              <span className="text-xs text-muted">{profile?.email}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full justify-center text-sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col px-4 py-6 lg:px-10">
          <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
              Menu
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-2xl px-4 py-2 text-xs uppercase tracking-[0.2em]"
              onClick={toggleTheme}
            >
              Tema: {theme === 'dark' ? 'Escuro' : 'Claro'}
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            <Suspense
              fallback={
                <motion.div
                  className="grid h-full place-items-center rounded-3xl border border-border/50 bg-card/70 p-10 text-sm text-muted"
                  initial={{ opacity: 0.4, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Carregando conteúdo...
                </motion.div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-40 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 mx-4 mb-6 rounded-3xl border border-border/60 bg-surface/95 p-6 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">Navegação</span>
              <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.exact} onClick={() => setMobileOpen(false)}>
                  {({ isActive }) => (
                    <div
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-medium transition',
                        isActive
                          ? 'border-primary-400/40 bg-primary-500/15 text-primary-600 dark:text-primary-50'
                          : 'border-border/50 bg-card/70 text-muted hover:border-primary-400/30 hover:bg-primary-500/10 hover:text-primary-700 dark:text-muted dark:hover:text-primary-100',
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </span>
                      <AnimatePresence>
                        {isActive ? (
                          <motion.span
                            layoutId="mobile-active"
                            className="h-2 w-2 rounded-full bg-primary-400"
                            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                          />
                        ) : null}
                      </AnimatePresence>
                    </div>
                  )}
                </NavLink>
              ))}
            </nav>
            <Button
              variant="outline"
              className="mt-6 w-full justify-center"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function SidebarHeader() {
  return (
    <div className="flex items-center gap-3">
      <motion.span
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white"
        initial={{ rotate: -10, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 15 }}
      >
        <Settings className="h-6 w-6" />
      </motion.span>
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Lista</p>
        <h1 className="text-lg font-semibold text-foreground">Mercado Inteligente</h1>
      </div>
    </div>
  )
}
