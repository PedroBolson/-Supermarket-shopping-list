import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, onSnapshot, type DocumentData, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import type { UserProfile, CustomClaims, Account, UserRole } from '../types'

export type AuthContextValue = {
  authUser: User | null
  profile: UserProfile | null
  claims: CustomClaims | null
  currentAccount: Account | null
  loading: boolean
  isMaster: boolean
  role: 'titular' | 'convidado' | 'master' | null
  signOut: () => Promise<void>
  refreshClaims: () => Promise<void>
  switchAccount: (accountId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function mapUserProfile(id: string, data: DocumentData | undefined): UserProfile | null {
  if (!data) {
    return null
  }

  return {
    uid: id,
    email: data.email ?? '',
    name: data.name ?? '',
    photoURL: data.photoURL ?? null,
    bio: data.bio ?? '',
    defaultAccountId: data.defaultAccountId ?? null,
    isActive: Boolean(data.isActive),
    isMaster: Boolean(data.isMaster),
    consents: {
      termsAccepted: Boolean(data.consents?.termsAccepted),
      privacyAccepted: Boolean(data.consents?.privacyAccepted),
      marketingAccepted: Boolean(data.consents?.marketingAccepted),
      acceptedAt: data.consents?.acceptedAt?.toDate?.() ?? null,
    },
    supportFlags: {
      canAccessAllAccounts: Boolean(data.supportFlags?.canAccessAllAccounts),
      canModifyPlans: Boolean(data.supportFlags?.canModifyPlans),
      canViewAudits: Boolean(data.supportFlags?.canViewAudits),
    },
    createdAt: data.createdAt?.toDate?.() ?? undefined,
    updatedAt: data.updatedAt?.toDate?.() ?? undefined,
  }
}

function mapAccount(id: string, data: DocumentData | undefined): Account | null {
  if (!data) {
    return null
  }

  return {
    id,
    name: data.name ?? '',
    titularId: data.titularId ?? '',
    planId: data.planId ?? '',
    status: data.status ?? 'pending',
    expiresAt: data.expiresAt?.toDate?.() ?? null,
    limits: {
      maxMembers: data.limits?.maxMembers ?? 5,
      maxLists: data.limits?.maxLists ?? 10,
      maxItemsPerList: data.limits?.maxItemsPerList ?? 50,
      maxStorageMB: data.limits?.maxStorageMB ?? 100,
    },
    metrics: {
      currentMembers: data.metrics?.currentMembers ?? 0,
      currentLists: data.metrics?.currentLists ?? 0,
      currentStorageMB: data.metrics?.currentStorageMB ?? 0,
    },
    isLifetime: Boolean(data.isLifetime),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  }
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [claims, setClaims] = useState<CustomClaims | null>(null)
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshClaims = useCallback(async () => {
    if (!authUser) return

    try {
      const idTokenResult = await authUser.getIdTokenResult(true)
      const customClaims: CustomClaims = {
        role: (idTokenResult.claims.role as UserRole) || null,
        accountIds: idTokenResult.claims.accountIds as string[],
        defaultAccountId: idTokenResult.claims.defaultAccountId as string,
        master: idTokenResult.claims.master as boolean,
      }
      setClaims(customClaims)
    } catch (error) {
      console.error('Erro ao atualizar claims:', error)
    }
  }, [authUser])

  const switchAccount = useCallback(
    async (accountId: string) => {
      if (!claims?.accountIds?.includes(accountId)) {
        throw new Error('Você não tem acesso a esta conta')
      }

      try {
        const accountDoc = await getDoc(doc(db, 'accounts', accountId))
        if (accountDoc.exists()) {
          const accountData = mapAccount(accountId, accountDoc.data())
          setCurrentAccount(accountData)

          if (profile?.uid) {
            await updateDoc(doc(db, 'users', profile.uid), {
              defaultAccountId: accountId,
            })
          }
        }
      } catch (error) {
        console.error('Erro ao trocar de conta:', error)
        throw error
      }
    },
    [claims, profile]
  )

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined
    let accountUnsubscribe: (() => void) | undefined

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)

      profileUnsubscribe?.()
      accountUnsubscribe?.()
      profileUnsubscribe = undefined
      accountUnsubscribe = undefined

      if (!firebaseUser) {
        setAuthUser(null)
        setProfile(null)
        setClaims(null)
        setCurrentAccount(null)
        setLoading(false)
        return
      }

      setAuthUser(firebaseUser)

      try {
        const idTokenResult = await firebaseUser.getIdTokenResult()
        const customClaims: CustomClaims = {
          role: (idTokenResult.claims.role as UserRole) || null,
          accountIds: idTokenResult.claims.accountIds as string[],
          defaultAccountId: idTokenResult.claims.defaultAccountId as string,
          master: idTokenResult.claims.master as boolean,
        }
        setClaims(customClaims)

        const userDocRef = doc(db, 'users', firebaseUser.uid)

        profileUnsubscribe = onSnapshot(
          userDocRef,
          async (snapshot) => {
            const userData = snapshot.exists() ? snapshot.data() : undefined
            const mappedProfile = mapUserProfile(firebaseUser.uid, userData)

            if (!mappedProfile?.isActive) {
              setProfile(null)
              setAuthUser(null)
              setClaims(null)
              setCurrentAccount(null)
              setLoading(false)
              void signOut(auth)
              return
            }

            setProfile(mappedProfile)

            const accountId = customClaims.defaultAccountId || customClaims.accountIds?.[0]
            if (accountId) {
              const accountDocRef = doc(db, 'accounts', accountId)
              accountUnsubscribe = onSnapshot(
                accountDocRef,
                (accountSnapshot) => {
                  if (accountSnapshot.exists()) {
                    const accountData = mapAccount(accountId, accountSnapshot.data())
                    setCurrentAccount(accountData)
                  } else {
                    setCurrentAccount(null)
                  }
                  setLoading(false)
                },
                (error) => {
                  console.error('Erro ao acessar dados da conta:', error)
                  setCurrentAccount(null)
                  setLoading(false)
                }
              )
            } else {
              setCurrentAccount(null)
              setLoading(false)
            }
          },
          (error) => {
            console.error('Erro ao acessar dados do usuário:', error)
            setProfile(null)
            setAuthUser(null)
            setClaims(null)
            setCurrentAccount(null)
            setLoading(false)
            void signOut(auth)
          }
        )
      } catch (error) {
        console.error('Erro ao processar autenticação:', error)
        setProfile(null)
        setAuthUser(null)
        setClaims(null)
        setCurrentAccount(null)
        setLoading(false)
        void signOut(auth)
      }
    })

    return () => {
      profileUnsubscribe?.()
      accountUnsubscribe?.()
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      profile,
      claims,
      currentAccount,
      loading,
      isMaster: profile?.isMaster || claims?.master || false,
      role: claims?.role || null,
      signOut: () => signOut(auth),
      refreshClaims,
      switchAccount,
    }),
    [authUser, profile, claims, currentAccount, loading, refreshClaims, switchAccount]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }

  return ctx
}
