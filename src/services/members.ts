import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

export interface SuspendMemberParams {
    accountId: string
    memberId: string
    suspend: boolean
}

export interface SuspendMemberResponse {
    success: boolean
}

export async function suspendMember(params: SuspendMemberParams): Promise<SuspendMemberResponse> {
    const callable = httpsCallable<SuspendMemberParams, SuspendMemberResponse>(
        functions,
        'suspendMember'
    )
    const result = await callable(params)
    return result.data
}

export interface RemoveMemberParams {
    accountId: string
    memberId: string
}

export interface RemoveMemberResponse {
    success: boolean
}

export async function removeMember(params: RemoveMemberParams): Promise<RemoveMemberResponse> {
    const callable = httpsCallable<RemoveMemberParams, RemoveMemberResponse>(
        functions,
        'removeMember'
    )
    const result = await callable(params)
    return result.data
}

export interface TransferOwnershipParams {
    accountId: string
    newTitularId: string
}

export interface TransferOwnershipResponse {
    success: boolean
}

export async function transferOwnership(params: TransferOwnershipParams): Promise<TransferOwnershipResponse> {
    const callable = httpsCallable<TransferOwnershipParams, TransferOwnershipResponse>(
        functions,
        'transferOwnership'
    )
    const result = await callable(params)
    return result.data
}


