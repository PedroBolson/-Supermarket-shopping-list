import { UserCheck } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useAccount } from '../../hooks/use-account'
import { Badge } from '../../components/ui/Badge'

export function ConvidadoDashboard() {
    const { account } = useAccount()

    if (!account) {
        return <div>Carregando...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-6 w-6 text-blue-500" />
                        <h1 className="text-3xl font-bold">Área do Membro</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Você é membro da conta {account.name}
                    </p>
                </div>
            </div>

            <Card>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Status da Conta</h2>
                        <Badge variant={account.status === 'active' ? 'success' : 'warning'}>
                            {account.status === 'active' ? 'Ativa' : account.status}
                        </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Nome da conta:</span>
                            <span className="font-medium">{account.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Plano:</span>
                            <span className="font-medium">{account.planId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Membros:</span>
                            <span className="font-medium">
                                {account.metrics.currentMembers} / {account.limits.maxMembers}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Listas:</span>
                            <span className="font-medium">
                                {account.metrics.currentLists} / {account.limits.maxLists}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Suas Permissões</h2>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Visualizar e gerenciar listas
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Adicionar e editar itens
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Colaborar com outros membros
                        </li>
                    </ul>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Para ações administrativas, entre em contato com o titular da conta.
                    </p>
                </div>
            </Card>
        </div>
    )
}


