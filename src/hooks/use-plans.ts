import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Plan } from '../types'

export function usePlans() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        setLoading(true)
        setError(null)

        const plansRef = collection(db, 'plans')
        const q = query(plansRef, where('isActive', '==', true), orderBy('order', 'asc'))

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const plansList: Plan[] = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        name: data.name,
                        description: data.description ?? undefined,
                        price: data.price ?? 0,
                        interval: data.interval ?? 'monthly',
                        limits: {
                            maxMembers: data.limits?.maxMembers ?? 5,
                            maxLists: data.limits?.maxLists ?? 10,
                            maxItemsPerList: data.limits?.maxItemsPerList ?? 50,
                            maxStorageMB: data.limits?.maxStorageMB ?? 100,
                        },
                        features: data.features ?? [],
                        isActive: Boolean(data.isActive),
                        order: data.order ?? 0,
                        createdAt: data.createdAt?.toDate?.() ?? new Date(),
                        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
                    }
                })
                setPlans(plansList)
                setLoading(false)
            },
            (err) => {
                console.error('Erro ao carregar planos:', err)
                setError(err as Error)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    return { plans, loading, error }
}

export type UsePlansReturn = ReturnType<typeof usePlans>


