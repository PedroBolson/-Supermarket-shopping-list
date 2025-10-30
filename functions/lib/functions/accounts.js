"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.deleteAccount = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../config");
const audit_1 = require("../utils/audit");
const validation_1 = require("../utils/validation");
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
exports.deleteAccount = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Usuário não autenticado');
    }
    await (0, validation_1.validateMasterPermission)(uid);
    const { accountId } = request.data;
    if (!accountId) {
        throw new https_1.HttpsError('invalid-argument', 'accountId é obrigatório');
    }
    try {
        // 1. Verificar se a conta existe
        const accountDoc = await config_1.db.collection('accounts').doc(accountId).get();
        if (!accountDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Conta não encontrada');
        }
        const accountData = accountDoc.data();
        // 2. Deletar todos os membros da conta
        const membersSnapshot = await config_1.db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .get();
        const batch = config_1.db.batch();
        membersSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // 3. Deletar convites pendentes relacionados à conta
        const invitationsSnapshot = await config_1.db
            .collection('invitations')
            .where('accountId', '==', accountId)
            .get();
        invitationsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // 4. Deletar listas da conta
        const listsSnapshot = await config_1.db
            .collection('lists')
            .where('accountId', '==', accountId)
            .get();
        listsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // 5. Deletar a conta
        batch.delete(accountDoc.ref);
        await batch.commit();
        // 6. Log de auditoria
        await (0, audit_1.logAudit)('master_delete_account', uid, 'Master Admin', 'account', accountId, {
            accountName: (accountData === null || accountData === void 0 ? void 0 : accountData.name) || 'Desconhecida',
            membersDeleted: membersSnapshot.size,
            invitationsDeleted: invitationsSnapshot.size,
            listsDeleted: listsSnapshot.size,
            success: true,
        }, accountId);
        return {
            success: true,
            message: 'Conta excluída com sucesso',
            deletedItems: {
                members: membersSnapshot.size,
                invitations: invitationsSnapshot.size,
                lists: listsSnapshot.size,
            },
        };
    }
    catch (error) {
        await (0, audit_1.logAudit)('master_delete_account_error', uid, 'Master Admin', 'account', accountId, { accountId, error: getErrorMessage(error), success: false }, accountId);
        throw error;
    }
});
exports.deleteUser = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Usuário não autenticado');
    }
    await (0, validation_1.validateMasterPermission)(uid);
    const { userId } = request.data;
    if (!userId) {
        throw new https_1.HttpsError('invalid-argument', 'userId é obrigatório');
    }
    // Não permitir deletar a si mesmo
    if (userId === uid) {
        throw new https_1.HttpsError('failed-precondition', 'Você não pode deletar sua própria conta');
    }
    try {
        // 1. Verificar se o usuário existe
        const userDoc = await config_1.db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Usuário não encontrado');
        }
        const userData = userDoc.data();
        // Não permitir deletar outro Master
        if (userData === null || userData === void 0 ? void 0 : userData.isMaster) {
            throw new https_1.HttpsError('failed-precondition', 'Não é possível deletar outro administrador Master');
        }
        const batch = config_1.db.batch();
        // 2. Remover de todas as contas onde é membro
        const membershipSnapshot = await config_1.db.collectionGroup('members')
            .where('uid', '==', userId)
            .get();
        membershipSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // 3. Deletar convites enviados por este usuário
        const invitationsSnapshot = await config_1.db.collection('invitations')
            .where('invitedBy', '==', userId)
            .get();
        invitationsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // 4. Deletar ou transferir listas criadas pelo usuário
        const listsSnapshot = await config_1.db.collection('lists')
            .where('createdBy', '==', userId)
            .get();
        listsSnapshot.docs.forEach((doc) => {
            // Pode escolher deletar ou marcar como "deletado"
            batch.delete(doc.ref);
        });
        // 5. Deletar documento do Firestore
        batch.delete(userDoc.ref);
        await batch.commit();
        // 6. Deletar do Firebase Auth
        await config_1.auth.deleteUser(userId);
        // 7. Log de auditoria
        await (0, audit_1.logAudit)('master_delete_user', uid, 'Master Admin', 'user', userId, {
            userName: (userData === null || userData === void 0 ? void 0 : userData.name) || 'Desconhecido',
            userEmail: (userData === null || userData === void 0 ? void 0 : userData.email) || 'Desconhecido',
            membershipsDeleted: membershipSnapshot.size,
            invitationsDeleted: invitationsSnapshot.size,
            listsDeleted: listsSnapshot.size,
            success: true,
        }, null);
        return {
            success: true,
            message: 'Usuário deletado com sucesso',
            deletedItems: {
                memberships: membershipSnapshot.size,
                invitations: invitationsSnapshot.size,
                lists: listsSnapshot.size,
            },
        };
    }
    catch (error) {
        await (0, audit_1.logAudit)('master_delete_user_error', uid, 'Master Admin', 'user', userId, { userId, error: getErrorMessage(error), success: false }, null);
        throw error;
    }
});
//# sourceMappingURL=accounts.js.map