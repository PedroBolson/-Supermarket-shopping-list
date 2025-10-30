import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useAuthContext } from '../../contexts/auth-context'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function AccountSwitcher() {
    const { claims, currentAccount, switchAccount } = useAuthContext()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const accountIds = claims?.accountIds ?? []

    if (accountIds.length <= 1) {
        return null
    }

    const handleSwitch = async (accountId: string) => {
        if (accountId === currentAccount?.id) {
            setIsOpen(false)
            return
        }

        setLoading(true)
        try {
            await switchAccount(accountId)
            setIsOpen(false)
        } catch (error) {
            console.error('Erro ao trocar de conta:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button
                variant="ghost"
                onClick={() => setIsOpen(true)}
                className="gap-2"
            >
                <span className="max-w-[150px] truncate">{currentAccount?.name || 'Selecionar Conta'}</span>
                <ChevronDown className="h-4 w-4" />
            </Button>

            <Modal
                open={isOpen}
                onClose={() => setIsOpen(false)}
                title="Selecionar Conta"
            >
                <div className="space-y-2">
                    {accountIds.map((accountId) => (
                        <button
                            key={accountId}
                            onClick={() => handleSwitch(accountId)}
                            disabled={loading}
                            className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 disabled:opacity-50"
                        >
                            <span className="font-medium">{accountId}</span>
                            {currentAccount?.id === accountId && (
                                <Check className="h-5 w-5 text-green-500" />
                            )}
                        </button>
                    ))}
                </div>
            </Modal>
        </>
    )
}


