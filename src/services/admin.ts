import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

export interface PromoteToMasterParams {
    userId: string
}

export interface PromoteToMasterResponse {
    success: boolean
}

export async function promoteToMaster(params: PromoteToMasterParams): Promise<PromoteToMasterResponse> {
    const callable = httpsCallable<PromoteToMasterParams, PromoteToMasterResponse>(
        functions,
        'promoteToMaster'
    )
    const result = await callable(params)
    return result.data
}

export interface DemoteFromMasterParams {
    userId: string
}

export interface DemoteFromMasterResponse {
    success: boolean
}

export async function demoteFromMaster(params: DemoteFromMasterParams): Promise<DemoteFromMasterResponse> {
    const callable = httpsCallable<DemoteFromMasterParams, DemoteFromMasterResponse>(
        functions,
        'demoteFromMaster'
    )
    const result = await callable(params)
    return result.data
}

export interface SuspendAccountParams {
    accountId: string
    suspend: boolean
}

export interface SuspendAccountResponse {
    success: boolean
}

export async function suspendAccount(params: SuspendAccountParams): Promise<SuspendAccountResponse> {
    const callable = httpsCallable<SuspendAccountParams, SuspendAccountResponse>(
        functions,
        'suspendAccount'
    )
    const result = await callable(params)
    return result.data
}

export interface GrantLifetimeAccessParams {
    accountId: string
}

export interface GrantLifetimeAccessResponse {
    success: boolean
}

export async function grantLifetimeAccess(params: GrantLifetimeAccessParams): Promise<GrantLifetimeAccessResponse> {
    const callable = httpsCallable<GrantLifetimeAccessParams, GrantLifetimeAccessResponse>(
        functions,
        'grantLifetimeAccess'
    )
    const result = await callable(params)
    return result.data
}

export interface UpdateAccountLimitsParams {
    accountId: string
    limits: {
        maxMembers?: number
        maxLists?: number
        maxItemsPerList?: number
        maxStorageMB?: number
    }
}

export interface UpdateAccountLimitsResponse {
    success: boolean
}

export async function updateAccountLimits(params: UpdateAccountLimitsParams): Promise<UpdateAccountLimitsResponse> {
    const callable = httpsCallable<UpdateAccountLimitsParams, UpdateAccountLimitsResponse>(
        functions,
        'updateAccountLimits'
    )
    const result = await callable(params)
    return result.data
}


