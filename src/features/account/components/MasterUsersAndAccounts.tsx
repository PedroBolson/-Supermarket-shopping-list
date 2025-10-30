import { useState, useEffect, useMemo } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Avatar } from '../../../components/ui/Avatar'
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog'
import { Users, Building2, Plus, UserPlus, Search, Eye, Trash2, UserMinus } from 'lucide-react'
import type { UserProfile, Account } from '../../../types'
import { usePlans } from '../../../hooks/use-plans'
import { formatDate } from '../../../utils/date'
import * as masterService from '../../../services/master'
import * as accountsService from '../../../services/accounts'
import * as plansService from '../../../services/plans'
import * as adminService from '../../../services/admin'

export function MasterUsersAndAccounts() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'users' | 'accounts'>('users')
    const [searchTerm, setSearchTerm] = useState('')

    const [createAccountModal, setCreateAccountModal] = useState(false)
    const [addUserModal, setAddUserModal] = useState(false)
    const [userDetailsModal, setUserDetailsModal] = useState(false)
    const [accountDetailsModal, setAccountDetailsModal] = useState(false)
    const [changePlanModal, setChangePlanModal] = useState(false)
    const [adjustLimitsModal, setAdjustLimitsModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

    const [newAccountName, setNewAccountName] = useState('')
    const [newAccountPlanId, setNewAccountPlanId] = useState('free')

    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [newLimits, setNewLimits] = useState({
        maxMembers: 0,
        maxLists: 0,
        maxStorageMB: 0,
    })

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean
        title: string
        description: string
        onConfirm: () => void
    }>({
        open: false,
        title: '',
        description: '',
        onConfirm: () => { },
    })

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

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users
        const term = searchTerm.toLowerCase()
        return users.filter(
            (user) =>
                user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                user.uid.toLowerCase().includes(term)
        )
    }, [users, searchTerm])

    const filteredAccounts = useMemo(() => {
        if (!searchTerm) return accounts
        const term = searchTerm.toLowerCase()
        return accounts.filter(
            (account) =>
                account.name.toLowerCase().includes(term) ||
                account.id.toLowerCase().includes(term) ||
                users.find((u) => u.uid === account.titularId)?.name.toLowerCase().includes(term)
        )
    }, [accounts, searchTerm, users])

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
        } catch (error) {
            console.error('Erro ao criar conta:', error)
            alert(`Erro: ${error instanceof Error ? error.message : String(error)}`)
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
        } catch (error) {
            console.error('Erro ao adicionar usuário:', error)
            alert(`Erro: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteAccount = async (account: Account) => {
        setConfirmDialog({
            open: true,
            title: 'Excluir Conta',
            description: `Tem certeza que deseja excluir a conta "${account.name}"? Esta ação irá deletar todos os membros, convites e listas associados. Esta ação não pode ser desfeita.`,
            onConfirm: async () => {
                try {
                    await accountsService.deleteAccount(account.id)
                    alert('Conta excluída com sucesso!')
                } catch (error) {
                    console.error('Erro ao excluir conta:', error)
                    alert(`Erro: ${error instanceof Error ? error.message : String(error)}`)
                } finally {
                    setConfirmDialog({ ...confirmDialog, open: false })
                }
            },
        })
    }

    const openUserDetails = (user: UserProfile) => {
        setSelectedUser(user)
        setUserDetailsModal(true)
    }

    const openAccountDetails = (account: Account) => {
        setSelectedAccount(account)
        setAccountDetailsModal(true)
    }

    const usersWithoutAccount = filteredUsers.filter((user) => !user.defaultAccountId)
    const usersWithAccount = filteredUsers.filter((user) => user.defaultAccountId)

    if (loading) {
        return <div className="py-8 text-center text-gray-500">Carregando...</div>
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => {
                        setActiveTab('users')
                        setSearchTerm('')
                    }}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'users'
                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    Usuários ({users.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('accounts')
                        setSearchTerm('')
                    }}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'accounts'
                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                >
                    <Building2 className="h-4 w-4" />
                    Contas ({accounts.length})
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                        activeTab === 'users'
                            ? 'Pesquisar usuários por nome, email ou ID...'
                            : 'Pesquisar contas por nome, ID ou titular...'
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    {/* Users Without Account */}
                    {usersWithoutAccount.length > 0 && (
                        <Card>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Usuários Sem Conta ({usersWithoutAccount.length})</h3>
                            </div>
                            <div className="space-y-2">
                                {usersWithoutAccount.map((user) => (
                                    <div
                                        key={user.uid}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar src={user.photoURL} alt={user.name} size="sm" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{user.name}</p>
                                                    {user.isMaster && <Badge variant="info">Master</Badge>}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openUserDetails(user)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setCreateAccountModal(true)
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Criar Conta
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Users With Account */}
                    {usersWithAccount.length > 0 && (
                        <Card>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Usuários Com Conta ({usersWithAccount.length})</h3>
                            </div>
                            <div className="space-y-2">
                                {usersWithAccount.map((user) => (
                                    <div
                                        key={user.uid}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar src={user.photoURL} alt={user.name} size="sm" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{user.name}</p>
                                                    {user.isMaster && <Badge variant="info">Master</Badge>}
                                                    <Badge variant="success">Com Conta</Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openUserDetails(user)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setAddUserModal(true)
                                                }}
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                Adicionar em Conta
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {filteredUsers.length === 0 && (
                        <Card>
                            <p className="py-8 text-center text-gray-500">Nenhum usuário encontrado.</p>
                        </Card>
                    )}
                </div>
            )}

            {/* Accounts Tab */}
            {activeTab === 'accounts' && (
                <Card>
                    {filteredAccounts.length === 0 ? (
                        <p className="py-8 text-center text-gray-500">Nenhuma conta encontrada.</p>
                    ) : (
                        <div className="space-y-2">
                            {filteredAccounts.map((account) => {
                                const titular = users.find((u) => u.uid === account.titularId)
                                const plan = plans.find((p) => p.id === account.planId)
                                return (
                                    <div
                                        key={account.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{account.name}</h4>
                                                <Badge variant={account.status === 'active' ? 'success' : 'error'}>
                                                    {account.status === 'active' ? 'Ativa' : 'Inativa'}
                                                </Badge>
                                                {account.isLifetime && <Badge variant="warning">Lifetime</Badge>}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Titular: {titular?.name || 'Desconhecido'} • Plano: {plan?.name || 'Free'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {account.metrics.currentMembers}/{account.limits.maxMembers} membros •{' '}
                                                {account.metrics.currentLists}/{account.limits.maxLists} listas
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openAccountDetails(account)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleDeleteAccount(account)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </Card>
            )}

            {/* Modal: Create Account */}
            <Modal
                open={createAccountModal}
                onClose={() => setCreateAccountModal(false)}
                title="Criar Conta Para Usuário"
            >
                <div className="space-y-4">
                    <div>
                        <p className="mb-2 text-sm font-medium">Usuário Selecionado:</p>
                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                            <Avatar src={selectedUser?.photoURL} alt={selectedUser?.name || ''} size="sm" />
                            <div>
                                <p className="font-medium">{selectedUser?.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser?.email}</p>
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Nome da Conta (opcional)"
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        placeholder={`Conta de ${selectedUser?.name}`}
                    />

                    <div>
                        <label className="mb-2 block text-sm font-medium">Plano</label>
                        <select
                            value={newAccountPlanId}
                            onChange={(e) => setNewAccountPlanId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800"
                        >
                            {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} - R$ {plan.price}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setCreateAccountModal(false)} disabled={actionLoading}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleCreateAccount} loading={actionLoading}>
                            Criar Conta
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Add User to Account */}
            <Modal
                open={addUserModal}
                onClose={() => setAddUserModal(false)}
                title="Adicionar Usuário em Conta"
            >
                <div className="space-y-4">
                    <div>
                        <p className="mb-2 text-sm font-medium">Usuário Selecionado:</p>
                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                            <Avatar src={selectedUser?.photoURL} alt={selectedUser?.name || ''} size="sm" />
                            <div>
                                <p className="font-medium">{selectedUser?.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser?.email}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Selecione uma Conta</label>
                        <select
                            value={selectedAccount?.id || ''}
                            onChange={(e) => {
                                const account = accounts.find((a) => a.id === e.target.value)
                                setSelectedAccount(account || null)
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800"
                        >
                            <option value="">Selecione...</option>
                            {accounts.map((account) => {
                                const titular = users.find((u) => u.uid === account.titularId)
                                return (
                                    <option key={account.id} value={account.id}>
                                        {account.name} (Titular: {titular?.name})
                                    </option>
                                )
                            })}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setAddUserModal(false)} disabled={actionLoading}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleAddUserToAccount} loading={actionLoading}>
                            Adicionar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: User Details */}
            <Modal
                open={userDetailsModal}
                onClose={() => setUserDetailsModal(false)}
                title="Detalhes do Usuário"
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar src={selectedUser.photoURL} alt={selectedUser.name} size="lg" />
                            <div>
                                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Status:</p>
                                <Badge variant={selectedUser.isActive ? 'success' : 'error'}>
                                    {selectedUser.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Papel:</p>
                                <Badge variant="info">
                                    {selectedUser.isMaster ? 'Master' : 'Usuário'}
                                </Badge>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Conta Padrão:</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {selectedUser.defaultAccountId
                                        ? accounts.find((a) => a.id === selectedUser.defaultAccountId)?.name || 'N/A'
                                        : 'Sem conta'}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Cadastrado em:</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {formatDate(selectedUser.createdAt)}
                                </p>
                            </div>
                        </div>

                        {/* Ações do Master */}
                        {!selectedUser.isMaster && (
                            <div className="mt-6 flex gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                {selectedUser.defaultAccountId && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setConfirmDialog({
                                                open: true,
                                                title: 'Remover de Todas as Contas',
                                                description: `Tem certeza que deseja remover ${selectedUser.name} de todas as contas? O usuário perderá acesso mas não será deletado.`,
                                                onConfirm: async () => {
                                                    try {
                                                        if (selectedUser.defaultAccountId) {
                                                            await masterService.removeUserFromAccountManually({
                                                                userId: selectedUser.uid,
                                                                accountId: selectedUser.defaultAccountId,
                                                            })
                                                            alert('Usuário removido da conta!')
                                                            setUserDetailsModal(false)
                                                        }
                                                    } catch (error) {
                                                        console.error('Erro ao remover usuário:', error)
                                                        alert(
                                                            `Erro: ${error instanceof Error ? error.message : String(error)}`
                                                        )
                                                    } finally {
                                                        setConfirmDialog({ ...confirmDialog, open: false })
                                                    }
                                                },
                                            })
                                        }}
                                    >
                                        <UserMinus className="h-4 w-4" />
                                        Remover de Conta
                                    </Button>
                                )}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setConfirmDialog({
                                            open: true,
                                            title: 'Deletar Usuário Permanentemente',
                                            description: `ATENÇÃO: Esta ação irá deletar completamente o usuário ${selectedUser.name} do sistema (Auth + Firestore), remover de todas as contas, deletar convites e listas criadas. Esta ação NÃO pode ser desfeita!`,
                                            onConfirm: async () => {
                                                try {
                                                    await accountsService.deleteUser(selectedUser.uid)
                                                    alert('Usuário deletado com sucesso!')
                                                    setUserDetailsModal(false)
                                                } catch (error) {
                                                    console.error('Erro ao deletar usuário:', error)
                                                    alert(
                                                        `Erro: ${error instanceof Error ? error.message : String(error)}`
                                                    )
                                                } finally {
                                                    setConfirmDialog({ ...confirmDialog, open: false })
                                                }
                                            },
                                        })
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Deletar Usuário
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal: Account Details */}
            <Modal
                open={accountDetailsModal}
                onClose={() => setAccountDetailsModal(false)}
                title="Detalhes da Conta"
            >
                {selectedAccount && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">{selectedAccount.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">ID: {selectedAccount.id}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Status:</p>
                                <Badge variant={selectedAccount.status === 'active' ? 'success' : 'error'}>
                                    {selectedAccount.status === 'active' ? 'Ativa' : 'Inativa'}
                                </Badge>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Plano:</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {plans.find((p) => p.id === selectedAccount.planId)?.name || 'Free'}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Titular:</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {users.find((u) => u.uid === selectedAccount.titularId)?.name || 'Desconhecido'}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Lifetime:</p>
                                <Badge variant={selectedAccount.isLifetime ? 'warning' : 'default'}>
                                    {selectedAccount.isLifetime ? 'Sim' : 'Não'}
                                </Badge>
                            </div>
                            <div className="col-span-2">
                                <p className="mb-2 font-medium text-gray-700 dark:text-gray-300">Limites:</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <p>
                                        Membros: {selectedAccount.metrics.currentMembers}/
                                        {selectedAccount.limits.maxMembers}
                                    </p>
                                    <p>
                                        Listas: {selectedAccount.metrics.currentLists}/{selectedAccount.limits.maxLists}
                                    </p>
                                    <p className="col-span-2">
                                        Storage: {selectedAccount.metrics.currentStorageMB.toFixed(2)}MB/
                                        {selectedAccount.limits.maxStorageMB}MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Ações do Master */}
                        <div className="mt-6 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Ações Master</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedPlanId(selectedAccount.planId)
                                        setChangePlanModal(true)
                                    }}
                                >
                                    Trocar Plano
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setConfirmDialog({
                                            open: true,
                                            title: selectedAccount.isLifetime ? 'Remover Acesso Vitalício' : 'Conceder Acesso Vitalício',
                                            description: selectedAccount.isLifetime
                                                ? `Remover acesso vitalício da conta "${selectedAccount.name}"?`
                                                : `Conceder acesso vitalício para a conta "${selectedAccount.name}"? A conta nunca expirará.`,
                                            onConfirm: async () => {
                                                try {
                                                    if (!selectedAccount.isLifetime) {
                                                        await plansService.grantLifetimeAccess({ accountId: selectedAccount.id })
                                                    }
                                                    alert(selectedAccount.isLifetime ? 'Acesso vitalício removido!' : 'Acesso vitalício concedido!')
                                                } catch (error) {
                                                    console.error('Erro:', error)
                                                    alert(`Erro: ${error instanceof Error ? error.message : String(error)}`)
                                                } finally {
                                                    setConfirmDialog({ ...confirmDialog, open: false })
                                                }
                                            },
                                        })
                                    }}
                                >
                                    {selectedAccount.isLifetime ? 'Remover' : 'Dar'} Vitalício
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setNewLimits({
                                            maxMembers: selectedAccount.limits.maxMembers,
                                            maxLists: selectedAccount.limits.maxLists,
                                            maxStorageMB: selectedAccount.limits.maxStorageMB,
                                        })
                                        setAdjustLimitsModal(true)
                                    }}
                                >
                                    Ajustar Limites
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setConfirmDialog({
                                            open: true,
                                            title: selectedAccount.status === 'active' ? 'Suspender Conta' : 'Reativar Conta',
                                            description: selectedAccount.status === 'active'
                                                ? `Suspender a conta "${selectedAccount.name}"? Os membros não poderão acessar.`
                                                : `Reativar a conta "${selectedAccount.name}"?`,
                                            onConfirm: async () => {
                                                try {
                                                    await adminService.suspendAccount({
                                                        accountId: selectedAccount.id,
                                                        suspend: selectedAccount.status === 'active',
                                                    })
                                                    alert(selectedAccount.status === 'active' ? 'Conta suspensa!' : 'Conta reativada!')
                                                } catch (error) {
                                                    console.error('Erro:', error)
                                                    alert(`Erro: ${error instanceof Error ? error.message : String(error)}`)
                                                } finally {
                                                    setConfirmDialog({ ...confirmDialog, open: false })
                                                }
                                            },
                                        })
                                    }}
                                >
                                    {selectedAccount.status === 'active' ? 'Suspender' : 'Reativar'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setAccountDetailsModal(false)
                                        handleDeleteAccount(selectedAccount)
                                    }}
                                    className="col-span-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Deletar Conta
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Trocar Plano */}
            <Modal
                open={changePlanModal}
                onClose={() => setChangePlanModal(false)}
                title="Trocar Plano da Conta"
            >
                {selectedAccount && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Alterar o plano da conta <strong>{selectedAccount.name}</strong>
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Selecione o novo plano:
                            </label>
                            <select
                                className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800"
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                            >
                                {plans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} - R$ {plan.price}/mês
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {plans.find(p => p.id === selectedPlanId) && (
                                <div className="mt-2 rounded bg-gray-100 p-3 dark:bg-gray-800">
                                    <p className="font-medium">Limites do plano selecionado:</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• Membros: {plans.find(p => p.id === selectedPlanId)?.limits.maxMembers}</li>
                                        <li>• Listas: {plans.find(p => p.id === selectedPlanId)?.limits.maxLists}</li>
                                        <li>• Storage: {plans.find(p => p.id === selectedPlanId)?.limits.maxStorageMB}MB</li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={async () => {
                                    setActionLoading(true)
                                    try {
                                        await plansService.switchPlan({
                                            accountId: selectedAccount.id,
                                            newPlanId: selectedPlanId,
                                        })
                                        setChangePlanModal(false)
                                        setConfirmDialog({
                                            open: true,
                                            title: 'Sucesso!',
                                            description: 'Plano alterado com sucesso!',
                                            onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false }),
                                        })
                                    } catch (error) {
                                        console.error('Erro ao trocar plano:', error)
                                        setConfirmDialog({
                                            open: true,
                                            title: 'Erro',
                                            description: `Erro: ${error instanceof Error ? error.message : String(error)}`,
                                            onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false }),
                                        })
                                    } finally {
                                        setActionLoading(false)
                                    }
                                }}
                                loading={actionLoading}
                                className="flex-1"
                            >
                                Confirmar Troca
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setChangePlanModal(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Ajustar Limites */}
            <Modal
                open={adjustLimitsModal}
                onClose={() => setAdjustLimitsModal(false)}
                title="Ajustar Limites Personalizados"
            >
                {selectedAccount && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ajustar limites personalizados para <strong>{selectedAccount.name}</strong>
                        </p>

                        <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            ⚠️ Estes limites substituem os limites do plano atual.
                        </div>

                        <Input
                            type="number"
                            label="Máximo de Membros"
                            value={newLimits.maxMembers}
                            onChange={(e) => setNewLimits({ ...newLimits, maxMembers: parseInt(e.target.value) || 0 })}
                            min="1"
                        />

                        <Input
                            type="number"
                            label="Máximo de Listas"
                            value={newLimits.maxLists}
                            onChange={(e) => setNewLimits({ ...newLimits, maxLists: parseInt(e.target.value) || 0 })}
                            min="1"
                        />

                        <Input
                            type="number"
                            label="Storage Máximo (MB)"
                            value={newLimits.maxStorageMB}
                            onChange={(e) => setNewLimits({ ...newLimits, maxStorageMB: parseInt(e.target.value) || 0 })}
                            min="1"
                        />

                        <div className="flex gap-2">
                            <Button
                                onClick={async () => {
                                    setActionLoading(true)
                                    try {
                                        await plansService.updateAccountLimits({
                                            accountId: selectedAccount.id,
                                            limits: newLimits,
                                        })
                                        setAdjustLimitsModal(false)
                                        setConfirmDialog({
                                            open: true,
                                            title: 'Sucesso!',
                                            description: 'Limites ajustados com sucesso!',
                                            onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false }),
                                        })
                                    } catch (error) {
                                        console.error('Erro ao ajustar limites:', error)
                                        setConfirmDialog({
                                            open: true,
                                            title: 'Erro',
                                            description: `Erro: ${error instanceof Error ? error.message : String(error)}`,
                                            onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false }),
                                        })
                                    } finally {
                                        setActionLoading(false)
                                    }
                                }}
                                loading={actionLoading}
                                className="flex-1"
                            >
                                Salvar Limites
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setAdjustLimitsModal(false)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                description={confirmDialog.description}
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
            />
        </div>
    )
}
