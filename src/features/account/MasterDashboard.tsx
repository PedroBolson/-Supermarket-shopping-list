import { Shield, Users, Database, FileText, Settings } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { MasterAccountManager } from './components/MasterAccountManager'
import { MasterPlansManager } from './components/MasterPlansManager'
import { MasterUsersAndAccounts } from './components/MasterUsersAndAccounts'
import { useState, useEffect } from 'react'
import { collection, query, where, getCountFromServer } from 'firebase/firestore'
import { db } from '../../config/firebase'

export function MasterDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'plans'>('overview')
    const [stats, setStats] = useState({
        activeAccounts: 0,
        totalUsers: 0,
        activePlans: 0,
        auditLogs: 0,
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
                    auditLogs: 0,
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900">
                            <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Logs de Auditoria</p>
                            <p className="text-2xl font-bold">
                                {loadingStats ? '...' : stats.auditLogs || '-'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'overview'
                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    Usuários & Contas
                </button>
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'accounts'
                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                >
                    <Settings className="h-4 w-4" />
                    Gerenciar Contas
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

            <Card>
                {activeTab === 'overview' && <MasterUsersAndAccounts />}
                {activeTab === 'accounts' && <MasterAccountManager />}
                {activeTab === 'plans' && <MasterPlansManager />}
            </Card>

            <Card>
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Recursos Master</h2>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                            Trocar planos de qualquer conta
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                            Conceder acesso vitalício
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                            Ajustar limites customizados
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                            Suspender/reativar contas
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                            Visualizar logs de auditoria
                        </li>
                    </ul>
                </div>
            </Card>
        </div>
    )
}


