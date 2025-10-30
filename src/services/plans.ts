import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

export interface SwitchPlanParams {
    accountId: string
    newPlanId: string
}

export interface SwitchPlanResponse {
    success: boolean
}

export async function switchPlan(params: SwitchPlanParams): Promise<SwitchPlanResponse> {
    const callable = httpsCallable<SwitchPlanParams, SwitchPlanResponse>(
        functions,
        'switchPlan'
    )
    const result = await callable(params)
    return result.data
}

export interface GrantLifetimeParams {
    accountId: string
}

export async function grantLifetimeAccess(params: GrantLifetimeParams) {
    const callable = httpsCallable(functions, 'grantLifetimeAccess')
    return callable(params)
}

export interface UpdateAccountLimitsParams {
    accountId: string
    limits: {
        maxMembers: number
        maxLists: number
        maxStorageMB: number
    }
}

export async function updateAccountLimits(params: UpdateAccountLimitsParams) {
    const callable = httpsCallable(functions, 'updateAccountLimits')
    return callable(params)
}

