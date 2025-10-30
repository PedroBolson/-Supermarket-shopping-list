import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

export async function createAccountManually(data: {
    userId: string
    accountName?: string
    planId?: string
}): Promise<{ success: boolean; accountId: string; message: string }> {
    const callable = httpsCallable(functions, 'createAccountManually')
    const result = await callable(data)
    return result.data as { success: boolean; accountId: string; message: string }
}

export async function addUserToAccountManually(data: {
    userId: string
    accountId: string
    role?: 'titular' | 'convidado'
}): Promise<{ success: boolean; message: string }> {
    const callable = httpsCallable(functions, 'addUserToAccountManually')
    const result = await callable(data)
    return result.data as { success: boolean; message: string }
}

export async function removeUserFromAccountManually(data: {
    userId: string
    accountId: string
}): Promise<{ success: boolean; message: string }> {
    const callable = httpsCallable(functions, 'removeUserFromAccountManually')
    const result = await callable(data)
    return result.data as { success: boolean; message: string }
}

