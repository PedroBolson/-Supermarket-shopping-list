import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { auth, db } from '../config'
import { logAudit } from '../utils/audit'
import { validateMasterPermission } from '../utils/validation'

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    return String(error)
}

export const deleteAccount = onCall({ cors: true }, async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }

    await validateMasterPermission(uid)

    const { accountId } = request.data as { accountId: string }

    if (!accountId) {
        throw new HttpsError('invalid-argument', 'accountId é obrigatório')
    }

    try {
        // 1. Verificar se a conta existe
        const accountDoc = await db.collection('accounts').doc(accountId).get()
        if (!accountDoc.exists) {
            throw new HttpsError('not-found', 'Conta não encontrada')
        }

        const accountData = accountDoc.data()

        // 2. Deletar todos os membros da conta
        const membersSnapshot = await db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .get()

        const batch = db.batch()
        membersSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref)
        })

        // 3. Deletar convites pendentes relacionados à conta
        const invitationsSnapshot = await db
            .collection('invitations')
            .where('accountId', '==', accountId)
            .get()

        invitationsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref)
        })

        // 4. Deletar listas da conta
        const listsSnapshot = await db
            .collection('lists')
            .where('accountId', '==', accountId)
            .get()

        listsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref)
        })

        // 5. Deletar a conta
        batch.delete(accountDoc.ref)

        await batch.commit()

        // 6. Log de auditoria
        await logAudit(
            'master_delete_account',
            uid,
            'Master Admin',
            'account',
            accountId,
            {
                accountName: accountData?.name || 'Desconhecida',
                membersDeleted: membersSnapshot.size,
                invitationsDeleted: invitationsSnapshot.size,
                listsDeleted: listsSnapshot.size,
                success: true,
            },
            accountId,
        )

        return {
            success: true,
            message: 'Conta excluída com sucesso',
            deletedItems: {
                members: membersSnapshot.size,
                invitations: invitationsSnapshot.size,
                lists: listsSnapshot.size,
            },
        }
    } catch (error) {
        await logAudit(
            'master_delete_account_error',
            uid,
            'Master Admin',
            'account',
            accountId,
            { accountId, error: getErrorMessage(error), success: false },
            accountId,
        )
        throw error
    }
})

export const deleteUser = onCall({ cors: true }, async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }

    await validateMasterPermission(uid)

    const { userId } = request.data as { userId: string }

    if (!userId) {
        throw new HttpsError('invalid-argument', 'userId é obrigatório')
    }

    // Não permitir deletar a si mesmo
    if (userId === uid) {
        throw new HttpsError('failed-precondition', 'Você não pode deletar sua própria conta')
    }

    try {
        // 1. Verificar se o usuário existe
        const userDoc = await db.collection('users').doc(userId).get()
        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'Usuário não encontrado')
        }

        const userData = userDoc.data()

        // Não permitir deletar outro Master
        if (userData?.isMaster) {
            throw new HttpsError('failed-precondition', 'Não é possível deletar outro administrador Master')
        }

        const batch = db.batch()

        // 2. Remover de todas as contas onde é membro
        const membershipSnapshot = await db.collectionGroup('members')
            .where('uid', '==', userId)
            .get()

        membershipSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref)
        })

        // 3. Deletar convites enviados por este usuário
        const invitationsSnapshot = await db.collection('invitations')
            .where('invitedBy', '==', userId)
            .get()

        invitationsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref)
        })

        // 4. Deletar ou transferir listas criadas pelo usuário
        const listsSnapshot = await db.collection('lists')
            .where('createdBy', '==', userId)
            .get()

        listsSnapshot.docs.forEach((doc) => {
            // Pode escolher deletar ou marcar como "deletado"
            batch.delete(doc.ref)
        })

        // 5. Deletar documento do Firestore
        batch.delete(userDoc.ref)

        await batch.commit()

        // 6. Deletar do Firebase Auth
        await auth.deleteUser(userId)

        // 7. Log de auditoria
        await logAudit(
            'master_delete_user',
            uid,
            'Master Admin',
            'user',
            userId,
            {
                userName: userData?.name || 'Desconhecido',
                userEmail: userData?.email || 'Desconhecido',
                membershipsDeleted: membershipSnapshot.size,
                invitationsDeleted: invitationsSnapshot.size,
                listsDeleted: listsSnapshot.size,
                success: true,
            },
            null,
        )

        return {
            success: true,
            message: 'Usuário deletado com sucesso',
            deletedItems: {
                memberships: membershipSnapshot.size,
                invitations: invitationsSnapshot.size,
                lists: listsSnapshot.size,
            },
        }
    } catch (error) {
        await logAudit(
            'master_delete_user_error',
            uid,
            'Master Admin',
            'user',
            userId,
            { userId, error: getErrorMessage(error), success: false },
            null,
        )
        throw error
    }
})

