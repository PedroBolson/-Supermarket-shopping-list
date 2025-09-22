import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { FirebaseError } from 'firebase/app'
import { auth, db } from '../../config/firebase'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { AuthHero } from './components/AuthHero'

function normalizeErrorMessage(error: unknown): string {
  const fallback = 'Não foi possível completar a ação. Tente novamente.'

  if (!error) {
    return fallback
  }

  const firebaseError = error as FirebaseError

  switch (firebaseError.code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Credenciais inválidas. Verifique seu email e senha.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas falhas. Aguarde alguns instantes antes de tentar novamente.'
    case 'auth/operation-not-allowed':
      return 'O login por email e senha ainda não está habilitado no Firebase. Ative essa opção no console para continuarmos.'
    case 'auth/admin-restricted-operation':
      return 'O Firebase bloqueou esta operação. Verifique as permissões do projeto e tente novamente.'
    case 'permission-denied':
      return 'O Firestore recusou a gravação. Confirme se as regras de segurança foram atualizadas e tente novamente.'
    case 'auth/email-already-in-use':
      return 'Este email já está em uso. Utilize outro email ou faça login.'
    case 'auth/weak-password':
      return 'A senha deve ter no mínimo 6 caracteres.'
    default:
      return firebaseError.message ?? fallback
  }
}

type Feedback = { type: 'error' | 'success'; message: string }

type Mode = 'login' | 'register'

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as { from?: { pathname?: string } } | null
  const redirectPath = state?.from?.pathname ?? '/app'

  const [mode, setMode] = useState<Mode>('login')
  const [loginFeedback, setLoginFeedback] = useState<Feedback | null>(null)
  const [registerFeedback, setRegisterFeedback] = useState<Feedback | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [loginFormKey, setLoginFormKey] = useState(0)
  const [registerFormKey, setRegisterFormKey] = useState(0)

  const handleLogin = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      try {
        setLoginLoading(true)
        setLoginFeedback(null)

        const credential = await signInWithEmailAndPassword(auth, email, password)
        const userDoc = await getDoc(doc(db, 'users', credential.user.uid))

        if (!userDoc.exists()) {
          await signOut(auth)
          setLoginFeedback({
            type: 'error',
            message: 'Usuário autenticado, mas não encontrado no banco de dados. Contate um administrador.',
          })
          return
        }

        const userData = userDoc.data()

        if (!userData?.isActive) {
          await signOut(auth)
          setLoginFeedback({
            type: 'error',
            message: 'Sua conta ainda não foi aprovada. Aguarde a liberação por um membro da equipe.',
          })
          setLoginFormKey((value) => value + 1)
          return
        }

        setLoginFeedback(null)
        navigate(redirectPath, { replace: true })
      } catch (error) {
        setLoginFeedback({ type: 'error', message: normalizeErrorMessage(error) })
      } finally {
        setLoginLoading(false)
      }
    },
    [navigate, redirectPath],
  )

  const handleRegister = useCallback(
    async ({
      name,
      email,
      password,
      confirmPassword,
    }: {
      name: string
      email: string
      password: string
      confirmPassword: string
    }) => {
      if (password !== confirmPassword) {
        setRegisterFeedback({ type: 'error', message: 'As senhas não conferem.' })
        return
      }

      if (password.length < 6) {
        setRegisterFeedback({ type: 'error', message: 'A senha deve ter ao menos 6 caracteres.' })
        return
      }

      try {
        setRegisterLoading(true)
        setRegisterFeedback(null)

        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(credential.user, { displayName: name })

        const userRef = doc(db, 'users', credential.user.uid)
        await setDoc(userRef, {
          name,
          email,
          isActive: false,
          photoURL: credential.user.photoURL ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        await signOut(auth)

        setRegisterFeedback({
          type: 'success',
          message: 'Conta criada com sucesso! Aguarde a aprovação interna para liberar seu acesso.',
        })

        setMode('login')
        setLoginFeedback({
          type: 'success',
          message: 'Conta criada! Assim que liberarem seu acesso você poderá entrar normalmente.',
        })
        setLoginFormKey((value) => value + 1)
        setRegisterFormKey((value) => value + 1)
      } catch (error) {
        setRegisterFeedback({ type: 'error', message: normalizeErrorMessage(error) })
      } finally {
        setRegisterLoading(false)
      }
    },
    [],
  )

  const switchToRegister = () => {
    setMode('register')
    setLoginFeedback(null)
    setRegisterFeedback(null)
    setRegisterFormKey((value) => value + 1)
  }

  const switchToLogin = () => {
    setMode('login')
    setRegisterFeedback(null)
    setLoginFeedback(null)
    setLoginFormKey((value) => value + 1)
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          className="absolute -left-40 top-0 h-[580px] w-[580px] rounded-full bg-primary-500/30 blur-3xl"
          animate={{
            x: [-10, 25, -25, 10],
            y: [0, -30, 20, 0],
          }}
          transition={{ repeat: Infinity, duration: 16, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-accent-500/20 blur-3xl"
          animate={{
            x: [20, -20, 10, -10],
            y: [10, -25, 15, 0],
          }}
          transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12 lg:px-10">
        <motion.div
          className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <AuthHero />

          <motion.div
            className="overflow-hidden rounded-[32px] border border-border/40 bg-card/90 shadow-[var(--shadow-lg)] backdrop-blur-xl dark:border-border/60 dark:bg-surface/80"
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 130, damping: 20, layout: { type: 'spring', stiffness: 300, damping: 30 } }}
          >
            <motion.div className="p-10" layout>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Acesso seguro
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {mode === 'login' ? (
                  <LoginForm
                    key={`login-${loginFormKey}`}
                    formKey={`login-${loginFormKey}`}
                    loading={loginLoading}
                    onSubmit={handleLogin}
                    onSwitchToRegister={switchToRegister}
                    feedback={loginFeedback}
                  />
                ) : (
                  <RegisterForm
                    key={`register-${registerFormKey}`}
                    formKey={`register-${registerFormKey}`}
                    loading={registerLoading}
                    onSubmit={handleRegister}
                    onSwitchToLogin={switchToLogin}
                    feedback={registerFeedback}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
