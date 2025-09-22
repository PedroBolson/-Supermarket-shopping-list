import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import type { UserProfile } from '../types'

export type AuthContextValue = {
  authUser: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
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
    isActive: Boolean(data.isActive),
    bio: data.bio ?? '',
    createdAt: data.createdAt?.toDate?.() ?? undefined,
    updatedAt: data.updatedAt?.toDate?.() ?? undefined,
  }
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true)

      profileUnsubscribe?.()
      profileUnsubscribe = undefined

      if (!firebaseUser) {
        setAuthUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setAuthUser(firebaseUser)

      const userDocRef = doc(db, 'users', firebaseUser.uid)

      profileUnsubscribe = onSnapshot(
        userDocRef,
        (snapshot) => {
          const userData = snapshot.exists() ? snapshot.data() : undefined
          const mappedProfile = mapUserProfile(firebaseUser.uid, userData)

          if (!mappedProfile?.isActive) {
            setProfile(null)
            setAuthUser(null)
            setLoading(false)
            void signOut(auth)
            return
          }

          setProfile(mappedProfile)
          setLoading(false)
        },
        () => {
          setProfile(null)
          setLoading(false)
        },
      )
    })

    return () => {
      profileUnsubscribe?.()
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      profile,
      loading,
      signOut: () => signOut(auth),
    }),
    [authUser, profile, loading],
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
