import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useAuthContext } from '../../contexts/auth-context'
import * as invitationService from '../../services/invitations'

export function AcceptInvitePage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { authUser, loading: authLoading } = useAuthContext()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')
    const token = searchParams.get('token')

    useEffect(() => {
        if (authLoading) return

        if (!token) {
            setStatus('error')
            setMessage('Token de convite inválido')
            return
        }

        if (!authUser) {
            sessionStorage.setItem('inviteToken', token)
            navigate('/auth?redirect=/invite')
            return
        }

        const acceptInvite = async () => {
            try {
                await invitationService.acceptInvitation({ token })
                setStatus('success')
                setMessage('Convite aceito com sucesso! Você agora é membro da conta.')
                setTimeout(() => {
                    navigate('/')
                }, 2000)
            } catch (error) {
                console.error('Erro ao aceitar convite:', error)
                setStatus('error')
                setMessage(error instanceof Error ? error.message : 'Erro ao aceitar convite')
            }
        }

        acceptInvite()
    }, [token, authUser, authLoading, navigate])

    if (authLoading || status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <div className="flex flex-col items-center gap-4 p-8">
                        <Mail className="h-16 w-16 animate-pulse text-blue-500" />
                        <h2 className="text-2xl font-bold">Processando Convite</h2>
                        <p className="text-center text-gray-600 dark:text-gray-400">
                            Aguarde enquanto processamos seu convite...
                        </p>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-md">
                <div className="flex flex-col items-center gap-4 p-8">
                    {status === 'success' ? (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <h2 className="text-2xl font-bold">Convite Aceito!</h2>
                            <p className="text-center text-gray-600 dark:text-gray-400">
                                {message}
                            </p>
                        </>
                    ) : (
                        <>
                            <XCircle className="h-16 w-16 text-red-500" />
                            <h2 className="text-2xl font-bold">Erro ao Aceitar Convite</h2>
                            <p className="text-center text-gray-600 dark:text-gray-400">
                                {message}
                            </p>
                            <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}


