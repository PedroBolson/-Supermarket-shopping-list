import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { auth, db } from '../config'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { logAudit } from '../utils/audit'
import { validateMasterPermission } from '../utils/validation'
import { FREE_PLAN_ID, DEFAULT_PLAN_LIMITS } from '../config'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export const createAccountManually = onCall(async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }

    await validateMasterPermission(uid)

    const { userId, accountName, planId } = request.data as {
        userId: string
        accountName?: string
        planId?: string
    }

    if (!userId) {
        throw new HttpsError('invalid-argument', 'userId é obrigatório')
    }

    try {
        const userDoc = await db.collection('users').doc(userId).get()
        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'Usuário não encontrado')
        }

        const userData = userDoc.data()!
        const finalPlanId = planId || FREE_PLAN_ID

        const planDoc = await db.collection('plans').doc(finalPlanId).get()
        if (!planDoc.exists) {
            throw new HttpsError('not-found', 'Plano não encontrado')
        }

        const planData = planDoc.data()!

        const accountRef = db.collection('accounts').doc()
        await accountRef.set({
            name: accountName || `Conta de ${userData.name}`,
            titularId: userId,
            planId: finalPlanId,
            status: 'active',
            isLifetime: false,
            expiresAt: null,
            limits: planData.limits || DEFAULT_PLAN_LIMITS,
            metrics: {
                currentMembers: 1,
                currentLists: 0,
                currentStorageMB: 0,
            },
            createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
            updatedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
        })

        await db
            .collection('accounts')
            .doc(accountRef.id)
            .collection('members')
            .doc(userId)
            .set({
                userId,
                role: 'titular',
                status: 'active',
                joinedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
            })

        await db.collection('users').doc(userId).update({
            defaultAccountId: accountRef.id,
            updatedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
        })

        const claims = await auth.getUser(userId).then((u) => u.customClaims || {})
        await auth.setCustomUserClaims(userId, {
            ...claims,
            role: 'titular',
            accountIds: [accountRef.id],
            defaultAccountId: accountRef.id,
        })

        await logAudit(
            'master_create_account',
            uid,
            'Master Admin',
            'account',
            accountRef.id,
            {
                userId,
                accountName: accountName || `Conta de ${userData.name}`,
                planId: finalPlanId,
                success: true,
            },
            accountRef.id,
        )

        return {
            success: true,
            accountId: accountRef.id,
            message: 'Conta criada com sucesso',
        }
    } catch (error) {
        await logAudit(
            'master_create_account_error',
            uid,
            'Master Admin',
            'account',
            userId,
            { userId, error: getErrorMessage(error), success: false },
            null,
        )
        throw error
    }
})

export const addUserToAccountManually = onCall(async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }

    await validateMasterPermission(uid)

    const { userId, accountId, role } = request.data as {
        userId: string
        accountId: string
        role?: 'titular' | 'convidado'
    }

    if (!userId || !accountId) {
        throw new HttpsError('invalid-argument', 'userId e accountId são obrigatórios')
    }

    try {
        const userDoc = await db.collection('users').doc(userId).get()
        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'Usuário não encontrado')
        }

        const accountDoc = await db.collection('accounts').doc(accountId).get()
        if (!accountDoc.exists) {
            throw new HttpsError('not-found', 'Conta não encontrada')
        }

        const memberDoc = await db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .doc(userId)
            .get()

        if (memberDoc.exists) {
            throw new HttpsError('already-exists', 'Usuário já é membro desta conta')
        }

        const finalRole = role || 'convidado'

        await db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .doc(userId)
            .set({
                userId,
                role: finalRole,
                status: 'active',
                joinedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
            })

        await db
            .collection('accounts')
            .doc(accountId)
            .update({
                'metrics.currentMembers': FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
            })

        const userClaims = await auth.getUser(userId).then((u) => u.customClaims || {})
        const currentAccountIds = userClaims.accountIds || []

        if (!currentAccountIds.includes(accountId)) {
            await auth.setCustomUserClaims(userId, {
                ...userClaims,
                role: finalRole,
                accountIds: [...currentAccountIds, accountId],
                defaultAccountId: userClaims.defaultAccountId || accountId,
            })
        }

        const userData = userDoc.data()!
        if (!userData.defaultAccountId) {
            await db.collection('users').doc(userId).update({
                defaultAccountId: accountId,
                updatedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
            })
        }

        await logAudit(
            'master_add_user_to_account',
            uid,
            'Master Admin',
            'account',
            accountId,
            {
                userId,
                accountId,
                role: finalRole,
                success: true,
            },
            accountId,
        )

        return {
            success: true,
            message: 'Usuário adicionado à conta com sucesso',
        }
    } catch (error) {
        await logAudit(
            'master_add_user_to_account_error',
            uid,
            'Master Admin',
            'account',
            accountId,
            { userId, accountId, error: getErrorMessage(error), success: false },
            accountId,
        )
        throw error
    }
})

export const removeUserFromAccountManually = onCall(async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }

    await validateMasterPermission(uid)

    const { userId, accountId } = request.data as {
        userId: string
        accountId: string
    }

    if (!userId || !accountId) {
        throw new HttpsError('invalid-argument', 'userId e accountId são obrigatórios')
    }

    try {
        const accountDoc = await db.collection('accounts').doc(accountId).get()
        if (!accountDoc.exists) {
            throw new HttpsError('not-found', 'Conta não encontrada')
        }

        const accountData = accountDoc.data()!
        if (accountData.titularId === userId) {
            throw new HttpsError(
                'failed-precondition',
                'Não é possível remover o titular. Transfira a propriedade primeiro.',
            )
        }

        const memberDoc = await db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .doc(userId)
            .get()

        if (!memberDoc.exists) {
            throw new HttpsError('not-found', 'Usuário não é membro desta conta')
        }

        await db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .doc(userId)
            .delete()

        await db
            .collection('accounts')
            .doc(accountId)
            .update({
                'metrics.currentMembers': FieldValue.increment(-1),
                updatedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
            })

        const userClaims = await auth.getUser(userId).then((u) => u.customClaims || {})
        const currentAccountIds = (userClaims.accountIds || []).filter(
            (id: string) => id !== accountId,
        )

        await auth.setCustomUserClaims(userId, {
            ...userClaims,
            accountIds: currentAccountIds,
            defaultAccountId:
                userClaims.defaultAccountId === accountId
                    ? currentAccountIds[0] || null
                    : userClaims.defaultAccountId,
        })

        await logAudit(
            'master_remove_user_from_account',
            uid,
            'Master Admin',
            'account',
            accountId,
            {
                userId,
                accountId,
                success: true,
            },
            accountId,
        )

        return {
            success: true,
            message: 'Usuário removido da conta com sucesso',
        }
    } catch (error) {
        await logAudit(
            'master_remove_user_from_account_error',
            uid,
            'Master Admin',
            'account',
            accountId,
            { userId, accountId, error: getErrorMessage(error), success: false },
            accountId,
        )
        throw error
    }
})

