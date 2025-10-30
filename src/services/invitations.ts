import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

export interface SendInvitationParams {
    accountId: string
    email: string
    role: 'convidado'
}

export interface SendInvitationResponse {
    success: boolean
    invitationToken: string
}

export async function sendInvitation(params: SendInvitationParams): Promise<SendInvitationResponse> {
    const callable = httpsCallable<SendInvitationParams, SendInvitationResponse>(
        functions,
        'sendInvitation'
    )
    const result = await callable(params)
    return result.data
}

export interface AcceptInvitationParams {
    token: string
}

export interface AcceptInvitationResponse {
    success: boolean
    accountId: string
}

export async function acceptInvitation(params: AcceptInvitationParams): Promise<AcceptInvitationResponse> {
    const callable = httpsCallable<AcceptInvitationParams, AcceptInvitationResponse>(
        functions,
        'acceptInvitation'
    )
    const result = await callable(params)
    return result.data
}

export interface RevokeInvitationParams {
    token: string
}

export interface RevokeInvitationResponse {
    success: boolean
}

export async function revokeInvitation(params: RevokeInvitationParams): Promise<RevokeInvitationResponse> {
    const callable = httpsCallable<RevokeInvitationParams, RevokeInvitationResponse>(
        functions,
        'revokeInvitation'
    )
    const result = await callable(params)
    return result.data
}


