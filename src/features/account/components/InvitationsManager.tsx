import { useState } from 'react'
import { Mail, X, Plus } from 'lucide-react'
import { useAccount } from '../../../hooks/use-account'
import { useInvitations } from '../../../hooks/use-invitations'
import { usePlanLimits } from '../../../hooks/use-plan-limits'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import * as invitationService from '../../../services/invitations'

export function InvitationsManager() {
    const { account } = useAccount()
    const { invitations, loading } = useInvitations(account?.id)
    const { canAddMember } = usePlanLimits()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [sendingInvite, setSendingInvite] = useState(false)

    const handleSendInvitation = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!account || !email) return

        setSendingInvite(true)
        try {
            await invitationService.sendInvitation({
                accountId: account.id,
                email,
                role: 'convidado',
            })
            setEmail('')
            setIsModalOpen(false)
        } catch (error) {
            console.error('Erro ao enviar convite:', error)
            alert('Erro ao enviar convite')
        } finally {
            setSendingInvite(false)
        }
    }

    const handleRevokeInvitation = async (token: string) => {
        if (!confirm('Tem certeza que deseja revogar este convite?')) return

        try {
            await invitationService.revokeInvitation({ token })
        } catch (error) {
            console.error('Erro ao revogar convite:', error)
            alert('Erro ao revogar convite')
        }
    }

    const pendingInvitations = invitations.filter((inv) => inv.status === 'pending')

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pendingInvitations.length} convite(s) pendente(s)
                    </p>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        disabled={!canAddMember}
                        size="sm"
                    >
                        <Plus className="h-4 w-4" />
                        Enviar Convite
                    </Button>
                </div>

                {!canAddMember && (
                    <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                        Você atingiu o limite de membros do seu plano. Faça upgrade para
                        convidar mais pessoas.
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-gray-600">Carregando convites...</div>
                ) : invitations.length === 0 ? (
                    <div className="text-center text-gray-600">Nenhum convite enviado</div>
                ) : (
                    <div className="space-y-3">
                        {invitations.map((invitation) => (
                            <div
                                key={invitation.token}
                                className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-500" />
                                        <span className="font-medium">{invitation.email}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Badge
                                            variant={
                                                invitation.status === 'pending'
                                                    ? 'warning'
                                                    : invitation.status === 'accepted'
                                                        ? 'success'
                                                        : 'error'
                                            }
                                        >
                                            {invitation.status === 'pending'
                                                ? 'Pendente'
                                                : invitation.status === 'accepted'
                                                    ? 'Aceito'
                                                    : invitation.status === 'expired'
                                                        ? 'Expirado'
                                                        : 'Revogado'}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        Enviado por {invitation.invitedByName} em{' '}
                                        {invitation.createdAt.toLocaleDateString()}
                                        {invitation.status === 'pending' &&
                                            ` • Expira em ${invitation.expiresAt.toLocaleDateString()}`}
                                    </p>
                                </div>

                                {invitation.status === 'pending' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRevokeInvitation(invitation.token)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                        Revogar
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Enviar Convite"
            >
                <form onSubmit={handleSendInvitation} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Email do convidado
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="exemplo@email.com"
                            required
                        />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            O convite será enviado para este email e expirará em 7 dias.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={sendingInvite} className="flex-1">
                            {sendingInvite ? 'Enviando...' : 'Enviar Convite'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    )
}


