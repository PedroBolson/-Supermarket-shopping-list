import { useState } from 'react'
import { Users, Mail, Settings, Crown } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { LimitsCard } from '../../components/account/LimitsCard'
import { MembersManager } from './components/MembersManager'
import { InvitationsManager } from './components/InvitationsManager'
import { AccountSettings } from './components/AccountSettings'
import { useAccount } from '../../hooks/use-account'

type TabType = 'members' | 'invitations' | 'settings'

export function TitularDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('members')
    const { account } = useAccount()

    if (!account) {
        return <div>Carregando...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Crown className="h-6 w-6 text-yellow-500" />
                        <h1 className="text-3xl font-bold">Painel do Titular</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gerencie sua conta e membros
                    </p>
                </div>
            </div>

            <LimitsCard />

            <Card>
                <div className="space-y-4">
                    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'members'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            Membros
                        </button>
                        <button
                            onClick={() => setActiveTab('invitations')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'invitations'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                                }`}
                        >
                            <Mail className="h-4 w-4" />
                            Convites
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors ${activeTab === 'settings'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                                }`}
                        >
                            <Settings className="h-4 w-4" />
                            Configurações
                        </button>
                    </div>

                    <div className="pt-4">
                        {activeTab === 'members' && <MembersManager />}
                        {activeTab === 'invitations' && <InvitationsManager />}
                        {activeTab === 'settings' && <AccountSettings />}
                    </div>
                </div>
            </Card>
        </div>
    )
}


