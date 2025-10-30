import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { AccountMember } from '../types'
import { useAuthContext } from '../contexts/auth-context'

export function useMembers(accountId: string | undefined) {
    const [members, setMembers] = useState<AccountMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        if (!accountId) {
            setMembers([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        const membersRef = collection(db, 'accountMembers', accountId, 'members')
        const q = query(membersRef, orderBy('joinedAt', 'desc'))

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const membersList: AccountMember[] = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        uid: doc.id,
                        accountId,
                        role: data.role,
                        status: data.status,
                        invitedBy: data.invitedBy,
                        invitedAt: data.invitedAt?.toDate?.() ?? new Date(),
                        joinedAt: data.joinedAt?.toDate?.() ?? null,
                        suspendedAt: data.suspendedAt?.toDate?.() ?? null,
                        suspendedBy: data.suspendedBy ?? null,
                    }
                })
                setMembers(membersList)
                setLoading(false)
            },
            (err) => {
                console.error('Erro ao carregar membros:', err)
                setError(err as Error)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [accountId])

    return { members, loading, error }
}

export type UseMembersReturn = ReturnType<typeof useMembers>


