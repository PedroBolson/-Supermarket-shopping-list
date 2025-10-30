import { useState } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { useEffect } from 'react'
import { db } from '../../../config/firebase'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import type { Account } from '../../../types'
import * as planService from '../../../services/plans'
import * as adminService from '../../../services/admin'
import { usePlans } from '../../../hooks/use-plans'

export function MasterAccountManager() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
    const [actionModal, setActionModal] = useState<'plan' | 'lifetime' | 'limits' | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const { plans } = usePlans()

    const [selectedPlan, setSelectedPlan] = useState('')
    const [customLimits, setCustomLimits] = useState({
        maxMembers: 0,
        maxLists: 0,
        maxItemsPerList: 0,
        maxStorageMB: 0,
    })

    useEffect(() => {
        setLoading(true)
        const accountsRef = collection(db, 'accounts')
        const q = query(accountsRef, orderBy('createdAt', 'desc'), limit(50))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const accountsList: Account[] = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    name: data.name,
                    titularId: data.titularId,
                    planId: data.planId,
                    status: data.status,
                    expiresAt: data.expiresAt?.toDate() || null,
                    limits: data.limits,
                    metrics: data.metrics,
                    isLifetime: data.isLifetime,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                }
            })
            setAccounts(accountsList)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const handleSwitchPlan = async () => {
        if (!selectedAccount || !selectedPlan) return

        setActionLoading(true)
        try {
            await planService.switchPlan({
                accountId: selectedAccount.id,
                newPlanId: selectedPlan,
            })
            setActionModal(null)
            setSelectedAccount(null)
        } catch (error) {
            console.error('Erro ao trocar plano:', error)
            alert('Erro ao trocar plano')
        } finally {
            setActionLoading(false)
        }
    }

    const handleGrantLifetime = async () => {
        if (!selectedAccount) return

        if (!confirm('Tem certeza que deseja conceder acesso vitalício?')) return

        setActionLoading(true)
        try {
            await adminService.grantLifetimeAccess({
                accountId: selectedAccount.id,
            })
            setActionModal(null)
            setSelectedAccount(null)
        } catch (error) {
            console.error('Erro ao conceder acesso vitalício:', error)
            alert('Erro ao conceder acesso vitalício')
        } finally {
            setActionLoading(false)
        }
    }

    const handleUpdateLimits = async () => {
        if (!selectedAccount) return

        setActionLoading(true)
        try {
            await adminService.updateAccountLimits({
                accountId: selectedAccount.id,
                limits: customLimits,
            })
            setActionModal(null)
            setSelectedAccount(null)
        } catch (error) {
            console.error('Erro ao atualizar limites:', error)
            alert('Erro ao atualizar limites')
        } finally {
            setActionLoading(false)
        }
    }

    const handleSuspendAccount = async (account: Account, suspend: boolean) => {
        if (!confirm(`Tem certeza que deseja ${suspend ? 'suspender' : 'reativar'} esta conta?`)) {
            return
        }

        try {
            await adminService.suspendAccount({
                accountId: account.id,
                suspend,
            })
        } catch (error) {
            console.error('Erro ao suspender/reativar conta:', error)
            alert('Erro ao realizar operação')
        }
    }

    const openPlanModal = (account: Account) => {
        setSelectedAccount(account)
        setSelectedPlan(account.planId)
        setActionModal('plan')
    }

    const openLifetimeModal = (account: Account) => {
        setSelectedAccount(account)
        setActionModal('lifetime')
    }

    const openLimitsModal = (account: Account) => {
        setSelectedAccount(account)
        setCustomLimits(account.limits)
        setActionModal('limits')
    }

    if (loading) {
        return <div className="text-center">Carregando contas...</div>
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Gerenciar Contas</h2>
                    <Badge variant="info">{accounts.length} conta(s)</Badge>
                </div>

                <div className="space-y-3">
                    {accounts.map((account) => (
                        <Card key={account.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{account.name}</h3>
                                        <Badge
                                            variant={
                                                account.status === 'active'
                                                    ? 'success'
                                                    : account.status === 'suspended'
                                                        ? 'error'
                                                        : 'warning'
                                            }
                                        >
                                            {account.status}
                                        </Badge>
                                        {account.isLifetime && (
                                            <Badge variant="success">Vitalício</Badge>
                                        )}
                                    </div>

                                    <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Plano:</span>{' '}
                                            <span className="font-medium">{account.planId}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Membros:</span>{' '}
                                            <span className="font-medium">
                                                {account.metrics.currentMembers} / {account.limits.maxMembers}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Listas:</span>{' '}
                                            <span className="font-medium">
                                                {account.metrics.currentLists} / {account.limits.maxLists}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Storage:</span>{' '}
                                            <span className="font-medium">
                                                {account.metrics.currentStorageMB.toFixed(1)} / {account.limits.maxStorageMB} MB
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openPlanModal(account)}
                                    >
                                        Trocar Plano
                                    </Button>
                                    {!account.isLifetime && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openLifetimeModal(account)}
                                        >
                                            Dar Vitalício
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openLimitsModal(account)}
                                    >
                                        Ajustar Limites
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleSuspendAccount(account, account.status !== 'suspended')}
                                        className={account.status === 'suspended' ? 'text-green-600' : 'text-red-600'}
                                    >
                                        {account.status === 'suspended' ? 'Reativar' : 'Suspender'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Modal: Trocar Plano */}
            <Modal
                open={actionModal === 'plan'}
                onClose={() => setActionModal(null)}
                title="Trocar Plano"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Selecione o novo plano para <strong>{selectedAccount?.name}</strong>
                    </p>

                    <div className="space-y-2">
                        {plans.map((plan) => (
                            <label
                                key={plan.id}
                                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                                <input
                                    type="radio"
                                    name="plan"
                                    value={plan.id}
                                    checked={selectedPlan === plan.id}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                    className="h-4 w-4"
                                />
                                <div className="flex-1">
                                    <div className="font-medium">{plan.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {plan.description}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setActionModal(null)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSwitchPlan}
                            disabled={actionLoading || !selectedPlan}
                            className="flex-1"
                        >
                            {actionLoading ? 'Trocando...' : 'Confirmar'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Acesso Vitalício */}
            <Modal
                open={actionModal === 'lifetime'}
                onClose={() => setActionModal(null)}
                title="Conceder Acesso Vitalício"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Você está prestes a conceder acesso vitalício para{' '}
                        <strong>{selectedAccount?.name}</strong>. Esta ação:
                    </p>

                    <ul className="list-inside list-disc space-y-1 text-sm">
                        <li>Remove qualquer data de expiração</li>
                        <li>Impede que a conta expire automaticamente</li>
                        <li>Não pode ser revertida facilmente</li>
                    </ul>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setActionModal(null)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleGrantLifetime}
                            disabled={actionLoading}
                            className="flex-1"
                        >
                            {actionLoading ? 'Processando...' : 'Confirmar'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Ajustar Limites */}
            <Modal
                open={actionModal === 'limits'}
                onClose={() => setActionModal(null)}
                title="Ajustar Limites Customizados"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Defina limites customizados para <strong>{selectedAccount?.name}</strong>
                    </p>

                    <div className="space-y-3">
                        <Input
                            label="Máximo de Membros"
                            type="number"
                            value={customLimits.maxMembers}
                            onChange={(e) =>
                                setCustomLimits((prev) => ({
                                    ...prev,
                                    maxMembers: parseInt(e.target.value) || 0,
                                }))
                            }
                        />
                        <Input
                            label="Máximo de Listas"
                            type="number"
                            value={customLimits.maxLists}
                            onChange={(e) =>
                                setCustomLimits((prev) => ({
                                    ...prev,
                                    maxLists: parseInt(e.target.value) || 0,
                                }))
                            }
                        />
                        <Input
                            label="Itens por Lista"
                            type="number"
                            value={customLimits.maxItemsPerList}
                            onChange={(e) =>
                                setCustomLimits((prev) => ({
                                    ...prev,
                                    maxItemsPerList: parseInt(e.target.value) || 0,
                                }))
                            }
                        />
                        <Input
                            label="Armazenamento (MB)"
                            type="number"
                            value={customLimits.maxStorageMB}
                            onChange={(e) =>
                                setCustomLimits((prev) => ({
                                    ...prev,
                                    maxStorageMB: parseInt(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setActionModal(null)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpdateLimits}
                            disabled={actionLoading}
                            className="flex-1"
                        >
                            {actionLoading ? 'Atualizando...' : 'Salvar'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

