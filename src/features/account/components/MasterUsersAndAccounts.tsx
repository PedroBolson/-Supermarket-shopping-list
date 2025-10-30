import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Avatar } from '../../../components/ui/Avatar'
import { Users, Building2, Plus, UserPlus, Trash2 } from 'lucide-react'
import type { UserProfile, Account } from '../../../types'
import { usePlans } from '../../../hooks/use-plans'
import * as masterService from '../../../services/master'

export function MasterUsersAndAccounts() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'users' | 'accounts'>('users')

    const [createAccountModal, setCreateAccountModal] = useState(false)
    const [addUserModal, setAddUserModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

    const [newAccountName, setNewAccountName] = useState('')
    const [newAccountPlanId, setNewAccountPlanId] = useState('free')

    const { plans } = usePlans()

    useEffect(() => {
        const usersRef = collection(db, 'users')
        const usersQuery = query(usersRef, orderBy('createdAt', 'desc'))

        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersList: UserProfile[] = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    uid: doc.id,
                    email: data.email || '',
                    name: data.name || '',
                    photoURL: data.photoURL || null,
                    bio: data.bio || '',
                    defaultAccountId: data.defaultAccountId || null,
                    isActive: data.isActive !== false,
                    isMaster: data.isMaster || false,
                    consents: data.consents || {},
                    createdAt: data.createdAt?.toDate() || null,
                    updatedAt: data.updatedAt?.toDate() || null,
                    supportFlags: data.supportFlags || {},
                }
            })
            setUsers(usersList)
            setLoading(false)
        })

        const accountsRef = collection(db, 'accounts')
        const accountsQuery = query(accountsRef, orderBy('createdAt', 'desc'))

        const unsubAccounts = onSnapshot(accountsQuery, (snapshot) => {
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
        })

        return () => {
            unsubUsers()
            unsubAccounts()
        }
    }, [])

    const handleCreateAccount = async () => {
        if (!selectedUser) return

        setActionLoading(true)
        try {
            await masterService.createAccountManually({
                userId: selectedUser.uid,
                accountName: newAccountName || `Conta de ${selectedUser.name}`,
                planId: newAccountPlanId,
            })
            setCreateAccountModal(false)
            setSelectedUser(null)
            setNewAccountName('')
            alert('Conta criada com sucesso!')
        } catch (error: any) {
            console.error('Erro ao criar conta:', error)
            alert(`Erro: ${error.message}`)
        } finally {
            setActionLoading(false)
        }
    }

    const handleAddUserToAccount = async () => {
        if (!selectedUser || !selectedAccount) return

        setActionLoading(true)
        try {
            await masterService.addUserToAccountManually({
                userId: selectedUser.uid,
                accountId: selectedAccount.id,
                role: 'convidado',
            })
            setAddUserModal(false)
            setSelectedUser(null)
            setSelectedAccount(null)
            alert('Usuário adicionado à conta!')
        } catch (error: any) {
            console.error('Erro ao adicionar usuário:', error)
            alert(`Erro: ${error.message}`)
        } finally {
            setActionLoading(false)
        }
    }

    const openCreateAccountFor = (user: UserProfile) => {
        setSelectedUser(user)
        setNewAccountName(`Conta de ${user.name}`)
        setCreateAccountModal(true)
    }

    const openAddUserTo = (user: UserProfile) => {
        setSelectedUser(user)
        setAddUserModal(true)
    }

    if (loading) {
        return <div className="text-center">Carregando dados...</div>
    }

    const usersWithoutAccount = users.filter((u) => !u.defaultAccountId)
    const usersWithAccount = users.filter((u) => u.defaultAccountId)

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Gerenciar Sistema</h2>
                    <div className="flex gap-2">
                        <Badge variant="info">
                            {users.length} usuário(s)
                        </Badge>
                        <Badge variant="success">
                            {accounts.length} conta(s)
                        </Badge>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'users'
                                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                            }`}
                    >
                        <Users className="mr-2 inline h-4 w-4" />
                        Usuários ({users.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('accounts')}
                        className={`border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'accounts'
                                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                            }`}
                    >
                        <Building2 className="mr-2 inline h-4 w-4" />
                        Contas ({accounts.length})
                    </button>
                </div>

                {activeTab === 'users' && (
                    <div className="space-y-4">
                        {usersWithoutAccount.length > 0 && (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-red-600">
                                    ⚠️ Usuários SEM conta ({usersWithoutAccount.length})
                                </h3>
                                <div className="space-y-2">
                                    {usersWithoutAccount.map((user) => (
                                        <Card key={user.uid} className="p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={user.photoURL} alt={user.name} size="sm" />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold">{user.name}</p>
                                                            {user.isMaster && <Badge variant="error">Master</Badge>}
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openCreateAccountFor(user)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Criar Conta
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openAddUserTo(user)}
                                                    >
                                                        <UserPlus className="h-3 w-3" />
                                                        Adicionar em Conta
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {usersWithAccount.length > 0 && (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-green-600">
                                    ✅ Usuários COM conta ({usersWithAccount.length})
                                </h3>
                                <div className="space-y-2">
                                    {usersWithAccount.map((user) => {
                                        const userAccount = accounts.find((a) => a.id === user.defaultAccountId)
                                        return (
                                            <Card key={user.uid} className="p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={user.photoURL} alt={user.name} size="sm" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold">{user.name}</p>
                                                                {user.isMaster && <Badge variant="error">Master</Badge>}
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                                            {userAccount && (
                                                                <p className="text-xs text-gray-500">
                                                                    Conta: {userAccount.name} ({userAccount.planId})
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openAddUserTo(user)}
                                                    >
                                                        <UserPlus className="h-3 w-3" />
                                                        Adicionar em Outra Conta
                                                    </Button>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'accounts' && (
                    <div className="space-y-2">
                        {accounts.map((account) => {
                            const titular = users.find((u) => u.uid === account.titularId)
                            return (
                                <Card key={account.id} className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{account.name}</h3>
                                                    <Badge variant={account.status === 'active' ? 'success' : 'error'}>
                                                        {account.status}
                                                    </Badge>
                                                    {account.isLifetime && <Badge variant="success">Vitalício</Badge>}
                                                </div>
                                                {titular && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Titular: {titular.name} ({titular.email})
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="info">{account.planId}</Badge>
                                        </div>

                                        <div className="grid gap-2 text-sm md:grid-cols-2">
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
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}

                        {accounts.length === 0 && (
                            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
                                Nenhuma conta criada ainda
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal: Criar Conta */}
            <Modal
                open={createAccountModal}
                onClose={() => setCreateAccountModal(false)}
                title="Criar Conta para Usuário"
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                            <p className="text-sm">
                                <span className="font-semibold">Usuário:</span> {selectedUser.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                        </div>

                        <Input
                            label="Nome da Conta"
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            placeholder="Ex: Conta Familiar"
                        />

                        <div>
                            <label className="mb-2 block text-sm font-medium">Plano</label>
                            <select
                                value={newAccountPlanId}
                                onChange={(e) => setNewAccountPlanId(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                            >
                                {plans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} - R$ {plan.price.toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2 border-t pt-4">
                            <Button
                                variant="secondary"
                                onClick={() => setCreateAccountModal(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleCreateAccount} disabled={actionLoading} className="flex-1">
                                {actionLoading ? 'Criando...' : 'Criar Conta'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Adicionar Usuário em Conta */}
            <Modal
                open={addUserModal}
                onClose={() => setAddUserModal(false)}
                title="Adicionar Usuário em Conta"
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                            <p className="text-sm">
                                <span className="font-semibold">Usuário:</span> {selectedUser.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">Selecione a Conta</label>
                            <select
                                value={selectedAccount?.id || ''}
                                onChange={(e) => {
                                    const account = accounts.find((a) => a.id === e.target.value)
                                    setSelectedAccount(account || null)
                                }}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="">Selecione uma conta</option>
                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} ({account.planId}) - {account.metrics.currentMembers}/{account.limits.maxMembers} membros
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2 border-t pt-4">
                            <Button
                                variant="secondary"
                                onClick={() => setAddUserModal(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleAddUserToAccount}
                                disabled={actionLoading || !selectedAccount}
                                className="flex-1"
                            >
                                {actionLoading ? 'Adicionando...' : 'Adicionar'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    )
}

