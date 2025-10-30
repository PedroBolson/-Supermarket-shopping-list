import { useState } from 'react'
import { Save } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAccount } from '../../../hooks/use-account'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'

export function AccountSettings() {
    const { account } = useAccount()
    const [name, setName] = useState(account?.name || '')
    const [saving, setSaving] = useState(false)

    if (!account) {
        return null
    }

    const handleSave = async () => {
        if (!name.trim()) return

        setSaving(true)
        try {
            await updateDoc(doc(db, 'accounts', account.id), {
                name: name.trim(),
                updatedAt: new Date(),
            })
        } catch (error) {
            console.error('Erro ao atualizar conta:', error)
            alert('Erro ao atualizar configurações')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="mb-4 text-lg font-semibold">Informações da Conta</h3>
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Nome da Conta
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome da conta"
                        />
                    </div>
                    <Button onClick={handleSave} disabled={saving || name === account.name}>
                        <Save className="h-4 w-4" />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-lg font-semibold">Status e Plano</h3>
                <div className="space-y-3 rounded-lg border p-4 dark:border-gray-700">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                        <Badge
                            variant={
                                account.status === 'active'
                                    ? 'success'
                                    : account.status === 'suspended'
                                        ? 'error'
                                        : 'warning'
                            }
                        >
                            {account.status === 'active'
                                ? 'Ativa'
                                : account.status === 'suspended'
                                    ? 'Suspensa'
                                    : account.status === 'expired'
                                        ? 'Expirada'
                                        : 'Pendente'}
                        </Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Plano:</span>
                        <span className="font-medium">{account.planId}</span>
                    </div>
                    {account.isLifetime ? (
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Acesso:</span>
                            <Badge variant="success">Vitalício</Badge>
                        </div>
                    ) : account.expiresAt ? (
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Expira em:</span>
                            <span className="font-medium">
                                {account.expiresAt.toLocaleDateString()}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-lg font-semibold">Limites do Plano</h3>
                <div className="space-y-2 rounded-lg border p-4 dark:border-gray-700">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Máximo de membros:</span>
                        <span className="font-medium">{account.limits.maxMembers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Máximo de listas:</span>
                        <span className="font-medium">{account.limits.maxLists}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            Itens por lista:
                        </span>
                        <span className="font-medium">{account.limits.maxItemsPerList}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            Armazenamento:
                        </span>
                        <span className="font-medium">{account.limits.maxStorageMB} MB</span>
                    </div>
                </div>
            </div>
        </div>
    )
}


