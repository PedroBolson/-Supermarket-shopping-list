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


