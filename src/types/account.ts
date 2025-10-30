export type UserRole = 'titular' | 'convidado' | 'master'

export type AccountStatus = 'active' | 'suspended' | 'expired' | 'pending'

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export type MemberStatus = 'active' | 'suspended' | 'pending'

export interface Plan {
    id: string
    name: string
    description?: string
    price: number
    interval: 'monthly' | 'yearly' | 'lifetime'
    limits: {
        maxMembers: number
        maxLists: number
        maxItemsPerList: number
        maxStorageMB: number
    }
    features: string[]
    isActive: boolean
    order: number
    createdAt: Date
    updatedAt: Date
}

export interface Account {
    id: string
    name: string
    titularId: string
    planId: string
    status: AccountStatus
    expiresAt?: Date | null
    limits: {
        maxMembers: number
        maxLists: number
        maxItemsPerList: number
        maxStorageMB: number
    }
    metrics: {
        currentMembers: number
        currentLists: number
        currentStorageMB: number
    }
    isLifetime: boolean
    createdAt: Date
    updatedAt: Date
}

export interface AccountMember {
    uid: string
    accountId: string
    role: UserRole
    status: MemberStatus
    invitedBy: string
    invitedAt: Date
    joinedAt?: Date | null
    suspendedAt?: Date | null
    suspendedBy?: string | null
}

export interface Invitation {
    token: string
    accountId: string
    email: string
    role: UserRole
    status: InvitationStatus
    invitedBy: string
    invitedByName: string
    accountName: string
    createdAt: Date
    expiresAt: Date
    acceptedAt?: Date | null
    acceptedBy?: string | null
}

export interface CustomClaims {
    role?: UserRole
    accountIds?: string[]
    defaultAccountId?: string
    master?: boolean
}

export interface PlanLimits {
    maxMembers: number
    maxLists: number
    maxItemsPerList: number
    maxStorageMB: number
}

export interface AccountMetrics {
    currentMembers: number
    currentLists: number
    currentStorageMB: number
}


