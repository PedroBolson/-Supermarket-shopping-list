import { Suspense, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ListChecks,
  LogOut,
  Menu,
  Moon,
  ShoppingCart,
  Sun,
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
        <motion.aside
          className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col border-r border-border/60 bg-surface/70 p-6 backdrop-blur-xl lg:flex"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <SidebarHeader />
          <nav className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.to}
                initial={{ x: -30, opacity: 0 }}
                animate={{
                  x: 0,
                  opacity: 1,
                  transition: {
                    delay: 0.2 + (index * 0.1),
                    type: 'spring',
                    stiffness: 300,
                    damping: 25
                  }
                }}
              >
                <NavLink to={item.to} end={item.exact} className="relative">
                  {({ isActive }) => (
                    <motion.div
                      className="group flex cursor-pointer items-center gap-3 rounded-3xl px-5 py-4 text-sm font-medium text-muted transition-all duration-200"
                      whileHover={{
                        scale: 1.02,
                        x: 4,
                        transition: { type: 'spring', stiffness: 400, damping: 25 }
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative flex flex-1 items-center gap-3">
                        <motion.span
                          className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-primary-500/35 via-primary-500/15 to-transparent shadow-lg"
                          animate={{
                            scale: isActive ? 1 : 0.9,
                            opacity: isActive ? 1 : 0
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                            duration: 0.3
                          }}
                        />
                        <motion.div
                          animate={{
                            rotate: isActive ? -5 : 0,
                            scale: isActive ? 1.05 : 1
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                            duration: 0.3
                          }}
                        >
                          <item.icon className={cn('h-5 w-5 transition-colors duration-200', isActive ? 'text-primary-100' : 'text-muted')} />
                        </motion.div>
                        <span className={cn('transition-colors duration-200', isActive ? 'text-primary-50' : 'text-muted')}>{item.label}</span>
                      </div>
                      <motion.span
                        className="h-2 w-2 rounded-full bg-primary-400/60"
                        animate={{
                          opacity: isActive ? 1 : 0,
                          scale: isActive ? 1 : 0.6
                        }}
                        transition={{
                          duration: 0.2,
                          ease: 'easeOut'
                        }}
                      />
                    </motion.div>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          <motion.div
            className="mt-6 flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ x: 2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.3 }}
              >
                <Avatar src={profile?.photoURL ?? null} alt={profile?.name} size="sm" />
              </motion.div>
              <div className="flex flex-col">
                <motion.span
                  className="text-sm font-semibold text-primary-50"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {profile?.name}
                </motion.span>
                <span className="text-xs text-muted">{profile?.email}</span>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center justify-between gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <Button variant="ghost" size="sm" className="w-full justify-center text-sm" onClick={handleSignOut}>
                  <motion.div
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <LogOut className="h-4 w-4" />
                  </motion.div>
                  Sair
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.aside>

        <div className="flex min-h-screen flex-1 flex-col px-4 py-6 lg:px-10">
          <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
              Menu
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
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60"
              initial={{ backdropFilter: 'blur(0px)' }}
              animate={{ backdropFilter: 'blur(12px)' }}
              exit={{ backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 mx-4 mb-6 rounded-3xl border border-border/60 bg-surface/95 p-6 backdrop-blur-xl lg:hidden shadow-2xl"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: 'spring',
                stiffness: 300,
                damping: 25,
                mass: 0.8
              }
            }}
            exit={{
              opacity: 0,
              y: 100,
              scale: 0.95,
              transition: {
                duration: 0.2,
                ease: 'easeInOut'
              }
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">Navegação</span>
              <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: {
                      delay: index * 0.05,
                      duration: 0.3,
                      ease: 'easeOut'
                    }
                  }}
                >
                  <NavLink to={item.to} end={item.exact} onClick={() => setMobileOpen(false)}>
                    {({ isActive }) => (
                      <motion.div
                        className={cn(
                          'flex cursor-pointer items-center justify-between rounded-3xl border border-transparent px-4 py-4 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'border-primary-400/40 bg-primary-500/15 text-primary-600 dark:text-primary-50'
                            : 'border-border/50 bg-card/70 text-muted hover:border-primary-400/30 hover:bg-primary-500/10 hover:text-primary-700 dark:text-muted dark:hover:text-primary-100',
                        )}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <span className="flex items-center gap-3">
                          <motion.div
                            animate={{
                              rotate: isActive ? -5 : 0,
                              scale: isActive ? 1.05 : 1
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              damping: 25,
                              duration: 0.3
                            }}
                          >
                            <item.icon className="h-5 w-5" />
                          </motion.div>
                          {item.label}
                        </span>
                        <motion.span
                          className="h-2 w-2 rounded-full bg-primary-400"
                          animate={{
                            scale: isActive ? 1 : 0,
                            opacity: isActive ? 1 : 0
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                            duration: 0.2
                          }}
                        />
                      </motion.div>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            <div className="mt-6 flex items-center justify-between gap-3">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              <Button variant="outline" onClick={handleSignOut} className="flex-1 justify-center">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function SidebarHeader() {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <motion.span
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white shadow-lg"
        initial={{ rotate: -15, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        whileHover={{
          scale: 1.1,
          rotate: [0, -5, 5, 0],
          transition: { duration: 0.3 }
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
      >
        <ShoppingCart className="h-6 w-6" />
      </motion.span>
      <motion.div
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <motion.p
          className="text-xs uppercase tracking-[0.4em] text-muted"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          App
        </motion.p>
        <h1 className="text-lg font-semibold text-foreground">Listas Inteligentes</h1>
      </motion.div>
    </motion.div>
  )
}

type ThemeToggleProps = {
  theme: string
  toggleTheme: () => void
}

function ThemeToggle({ theme, toggleTheme }: ThemeToggleProps) {
  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-8 w-16 items-center rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-surface',
        isDark
          ? 'border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700'
          : 'border-border/40 bg-gradient-to-r from-white via-card to-primary-100/40',
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.span
        className="absolute top-1 h-6 w-6 rounded-full flex items-center justify-center"
        style={{ left: 4 }}
        initial={false}
        animate={{
          x: isDark ? 32 : 0,
          color: isDark ? 'rgb(226,232,240)' : 'rgb(245,158,11)',
          rotate: isDark ? 180 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 250,
          damping: 20,
          rotate: { duration: 0.3 }
        }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="h-3.5 w-3.5" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="h-3.5 w-3.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.span>

      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: isDark
            ? '0 0 20px rgba(59, 130, 246, 0.3)'
            : '0 0 20px rgba(245, 158, 11, 0.3)'
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
}
