import { useAuthContext } from '../contexts/auth-context'
import type { UserRole } from '../types'

export function useAccount() {
    const { currentAccount, profile, claims } = useAuthContext()

    const isTitular = currentAccount?.titularId === profile?.uid
    const isMaster = claims?.master === true
    const role: UserRole | null = isMaster ? 'master' : claims?.role ?? null

    const canManageMembers = isTitular || isMaster
    const canManageAccount = isTitular || isMaster
    const canInviteMembers = isTitular || isMaster
    const canViewAudits = isMaster || profile?.supportFlags.canViewAudits === true
    const canModifyPlans = isMaster || profile?.supportFlags.canModifyPlans === true

    const isAccountActive = currentAccount?.status === 'active'
    const isAccountExpired = currentAccount?.status === 'expired'
    const isAccountSuspended = currentAccount?.status === 'suspended'

    return {
        account: currentAccount,
        role,
        isTitular,
        isMaster,
        canManageMembers,
        canManageAccount,
        canInviteMembers,
        canViewAudits,
        canModifyPlans,
        isAccountActive,
        isAccountExpired,
        isAccountSuspended,
    }
}

export type UseAccountReturn = ReturnType<typeof useAccount>


