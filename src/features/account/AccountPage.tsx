import { useAccount } from '../../hooks/use-account'
import { TitularDashboard } from './TitularDashboard'
import { MasterDashboard } from './MasterDashboard'
import { ConvidadoDashboard } from './ConvidadoDashboard'

export function AccountPage() {
    const { role, isMaster } = useAccount()

    if (isMaster) {
        return <MasterDashboard />
    }

    if (role === 'titular') {
        return <TitularDashboard />
    }

    return <ConvidadoDashboard />
}


