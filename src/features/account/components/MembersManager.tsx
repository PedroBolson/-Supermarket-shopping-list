import { useState } from 'react'
import { UserMinus, UserX, Crown } from 'lucide-react'
import { useAccount } from '../../../hooks/use-account'
import { useMembers } from '../../../hooks/use-members'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog'
import * as memberService from '../../../services/members'

export function MembersManager() {
    const { account } = useAccount()
    const { members, loading } = useMembers(account?.id)
    const [actionLoading, setActionLoading] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean
        title: string
        message: string
        onConfirm: () => void
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    })

    const handleSuspendMember = (memberId: string, suspend: boolean) => {
        setConfirmDialog({
            isOpen: true,
            title: suspend ? 'Suspender Membro' : 'Reativar Membro',
            message: suspend
                ? 'Tem certeza que deseja suspender este membro? Ele não poderá mais acessar a conta.'
                : 'Tem certeza que deseja reativar este membro?',
            onConfirm: async () => {
                if (!account) return
                setActionLoading(true)
                try {
                    await memberService.suspendMember({
                        accountId: account.id,
                        memberId,
                        suspend,
                    })
                } catch (error) {
                    console.error('Erro ao suspender/reativar membro:', error)
                    alert('Erro ao realizar operação')
                } finally {
                    setActionLoading(false)
                    setConfirmDialog({ ...confirmDialog, isOpen: false })
                }
            },
        })
    }

    const handleRemoveMember = (memberId: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Remover Membro',
            message:
                'Tem certeza que deseja remover este membro permanentemente da conta?',
            onConfirm: async () => {
                if (!account) return
                setActionLoading(true)
                try {
                    await memberService.removeMember({
                        accountId: account.id,
                        memberId,
                    })
                } catch (error) {
                    console.error('Erro ao remover membro:', error)
                    alert('Erro ao remover membro')
                } finally {
                    setActionLoading(false)
                    setConfirmDialog({ ...confirmDialog, isOpen: false })
                }
            },
        })
    }

    if (loading) {
        return <div className="text-center text-gray-600">Carregando membros...</div>
    }

    if (members.length === 0) {
        return (
            <div className="text-center text-gray-600">Nenhum membro encontrado</div>
        )
    }

    return (
        <>
            <div className="space-y-4">
                {members.map((member) => (
                    <div
                        key={member.uid}
                        className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{member.uid}</span>
                                {member.role === 'titular' && (
                                    <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge
                                    variant={
                                        member.status === 'active'
                                            ? 'success'
                                            : member.status === 'suspended'
                                                ? 'error'
                                                : 'warning'
                                    }
                                >
                                    {member.status === 'active'
                                        ? 'Ativo'
                                        : member.status === 'suspended'
                                            ? 'Suspenso'
                                            : 'Pendente'}
                                </Badge>
                                <Badge variant="info">{member.role}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Entrou em {member.joinedAt?.toLocaleDateString() ?? 'N/A'}
                            </p>
                        </div>

                        {member.role !== 'titular' && (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        handleSuspendMember(
                                            member.uid,
                                            member.status !== 'suspended'
                                        )
                                    }
                                    disabled={actionLoading}
                                >
                                    <UserMinus className="h-4 w-4" />
                                    {member.status === 'suspended' ? 'Reativar' : 'Suspender'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveMember(member.uid)}
                                    disabled={actionLoading}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <UserX className="h-4 w-4" />
                                    Remover
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />
        </>
    )
}


