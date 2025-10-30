import { Shield, Users, Database, Crown } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { MasterPlansManager } from './components/MasterPlansManager'
import { MasterUsersAndAccounts } from './components/MasterUsersAndAccounts'
import { TitularDashboard } from './TitularDashboard'
import { useState, useEffect } from 'react'
import { collection, query, where, getCountFromServer } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuthContext } from '../../contexts/auth-context'

export function MasterDashboard() {
    const { currentAccount } = useAuthContext()
    const [activeTab, setActiveTab] = useState<'users' | 'myaccount' | 'plans'>('users')
    const [stats, setStats] = useState({
        activeAccounts: 0,
        totalUsers: 0,
        activePlans: 0,
    })
    const [loadingStats, setLoadingStats] = useState(true)

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [accountsCount, usersCount, plansCount] = await Promise.all([
                    getCountFromServer(query(collection(db, 'accounts'), where('status', '==', 'active'))),
                    getCountFromServer(collection(db, 'users')),
                    getCountFromServer(query(collection(db, 'plans'), where('isActive', '==', true))),
                ])

                setStats({
                    activeAccounts: accountsCount.data().count,
                    totalUsers: usersCount.data().count,
                    activePlans: plansCount.data().count,
                })
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error)
            } finally {
                setLoadingStats(false)
            }
        }

        loadStats()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-purple-500" />
                        <h1 className="text-3xl font-bold">Painel Administrativo Master</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Controle total do sistema
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Contas Ativas</p>
                            <p className="text-2xl font-bold">
                                {loadingStats ? '...' : stats.activeAccounts}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
                            <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Usuários Totais</p>
                            <p className="text-2xl font-bold">
                                {loadingStats ? '...' : stats.totalUsers}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
                            <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Planos Ativos</p>
                            <p className="text-2xl font-bold">
                                {loadingStats ? '...' : stats.activePlans}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'users'
                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    Usuários & Contas
                </button>
                <button
                    onClick={() => setActiveTab('myaccount')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'myaccount'
                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                >
                    <Crown className="h-4 w-4" />
                    Minha Conta
                </button>
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'plans'
                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                >
                    <Database className="h-4 w-4" />
                    Gerenciar Planos
                </button>
            </div>

            <div>
                {activeTab === 'users' && <MasterUsersAndAccounts />}
                {activeTab === 'myaccount' && (
                    currentAccount ? (
                        <TitularDashboard />
                    ) : (
                        <Card>
                            <div className="py-12 text-center">
                                <Crown className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                    Você não possui uma conta pessoal
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    Como Master, você tem acesso a todas as contas do sistema, mas não possui uma conta própria.
                                </p>
                            </div>
                        </Card>
                    )
                )}
                {activeTab === 'plans' && <MasterPlansManager />}
            </div>
        </div>
    )
}
