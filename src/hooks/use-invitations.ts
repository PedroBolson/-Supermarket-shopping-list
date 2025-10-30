import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Invitation } from '../types'

export function useInvitations(accountId: string | undefined) {
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        if (!accountId) {
            setInvitations([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        const invitationsRef = collection(db, 'invitations')
        const q = query(
            invitationsRef,
            where('accountId', '==', accountId),
            orderBy('createdAt', 'desc')
        )

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const invitationsList: Invitation[] = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        token: doc.id,
                        accountId: data.accountId,
                        email: data.email,
                        role: data.role,
                        status: data.status,
                        invitedBy: data.invitedBy,
                        invitedByName: data.invitedByName,
                        accountName: data.accountName,
                        createdAt: data.createdAt?.toDate?.() ?? new Date(),
                        expiresAt: data.expiresAt?.toDate?.() ?? new Date(),
                        acceptedAt: data.acceptedAt?.toDate?.() ?? null,
                        acceptedBy: data.acceptedBy ?? null,
                    }
                })
                setInvitations(invitationsList)
                setLoading(false)
            },
            (err) => {
                console.error('Erro ao carregar convites:', err)
                setError(err as Error)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [accountId])

    return { invitations, loading, error }
}

export type UseInvitationsReturn = ReturnType<typeof useInvitations>


