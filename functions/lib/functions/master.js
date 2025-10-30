"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUserFromAccountManually = exports.addUserToAccountManually = exports.createAccountManually = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../config");
const firestore_1 = require("firebase-admin/firestore");
const audit_1 = require("../utils/audit");
const validation_1 = require("../utils/validation");
const config_2 = require("../config");
exports.createAccountManually = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Usuário não autenticado');
    }
    await (0, validation_1.validateMasterPermission)(uid);
    const { userId, accountName, planId } = request.data;
    if (!userId) {
        throw new https_1.HttpsError('invalid-argument', 'userId é obrigatório');
    }
    try {
        const userDoc = await config_1.db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Usuário não encontrado');
        }
        const userData = userDoc.data();
        const finalPlanId = planId || config_2.FREE_PLAN_ID;
        const planDoc = await config_1.db.collection('plans').doc(finalPlanId).get();
        if (!planDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Plano não encontrado');
        }
        const planData = planDoc.data();
        const accountRef = config_1.db.collection('accounts').doc();
        await accountRef.set({
            name: accountName || `Conta de ${userData.name}`,
            titularId: userId,
            planId: finalPlanId,
            status: 'active',
            isLifetime: false,
            expiresAt: null,
            limits: planData.limits || config_2.DEFAULT_PLAN_LIMITS,
            metrics: {
                currentMembers: 1,
                currentLists: 0,
                currentStorageMB: 0,
            },
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await config_1.db
            .collection('accounts')
            .doc(accountRef.id)
            .collection('members')
            .doc(userId)
            .set({
            userId,
            role: 'titular',
            status: 'active',
            joinedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await config_1.db.collection('users').doc(userId).update({
            defaultAccountId: accountRef.id,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        const claims = await config_1.auth.getUser(userId).then((u) => u.customClaims || {});
        await config_1.auth.setCustomUserClaims(userId, Object.assign(Object.assign({}, claims), { role: 'titular', accountIds: [accountRef.id], defaultAccountId: accountRef.id }));
        await (0, audit_1.logAudit)('master_create_account', uid, 'Master Admin', 'account', accountRef.id, {
            userId,
            accountName: accountName || `Conta de ${userData.name}`,
            planId: finalPlanId,
            success: true,
        }, accountRef.id);
        return {
            success: true,
            accountId: accountRef.id,
            message: 'Conta criada com sucesso',
        };
    }
    catch (error) {
        await (0, audit_1.logAudit)('master_create_account_error', uid, 'Master Admin', 'account', userId, { userId, error: error.message, success: false }, null);
        throw error;
    }
});
exports.addUserToAccountManually = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Usuário não autenticado');
    }
    await (0, validation_1.validateMasterPermission)(uid);
    const { userId, accountId, role } = request.data;
    if (!userId || !accountId) {
        throw new https_1.HttpsError('invalid-argument', 'userId e accountId são obrigatórios');
    }
    try {
        const userDoc = await config_1.db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Usuário não encontrado');
        }
        const accountDoc = await config_1.db.collection('accounts').doc(accountId).get();
        if (!accountDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Conta não encontrada');
        }
        const memberDoc = await config_1.db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .doc(userId)
            .get();
        if (memberDoc.exists) {
            throw new https_1.HttpsError('already-exists', 'Usuário já é membro desta conta');
        }
        const finalRole = role || 'convidado';
        await config_1.db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .doc(userId)
            .set({
            userId,
            role: finalRole,
            status: 'active',
            joinedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await config_1.db
            .collection('accounts')
            .doc(accountId)
            .update({
            'metrics.currentMembers': firestore_1.FieldValue.increment(1),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        const userClaims = await config_1.auth.getUser(userId).then((u) => u.customClaims || {});
        const currentAccountIds = userClaims.accountIds || [];
        if (!currentAccountIds.includes(accountId)) {
            await config_1.auth.setCustomUserClaims(userId, Object.assign(Object.assign({}, userClaims), { role: finalRole, accountIds: [...currentAccountIds, accountId], defaultAccountId: userClaims.defaultAccountId || accountId }));
        }
        const userData = userDoc.data();
        if (!userData.defaultAccountId) {
            await config_1.db.collection('users').doc(userId).update({
                defaultAccountId: accountId,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        await (0, audit_1.logAudit)('master_add_user_to_account', uid, 'Master Admin', 'account', accountId, {
            userId,
            accountId,
            role: finalRole,
            success: true,
        }, accountId);
        return {
            success: true,
            message: 'Usuário adicionado à conta com sucesso',
        };
    }
    catch (error) {
        await (0, audit_1.logAudit)('master_add_user_to_account_error', uid, 'Master Admin', 'account', accountId, { userId, accountId, error: error.message, success: false }, accountId);
        throw error;
    }
});
exports.removeUserFromAccountManually = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Usuário não autenticado');
    }
    await (0, validation_1.validateMasterPermission)(uid);
    const { userId, accountId } = request.data;
    if (!userId || !accountId) {
        throw new https_1.HttpsError('invalid-argument', 'userId e accountId são obrigatórios');
    }
    try {
        const accountDoc = await config_1.db.collection('accounts').doc(accountId).get();
        if (!accountDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Conta não encontrada');
        }
        const accountData = accountDoc.data();
        if (accountData.titularId === userId) {
            throw new https_1.HttpsError('failed-precondition', 'Não é possível remover o titular. Transfira a propriedade primeiro.');
        }
        const memberDoc = await config_1.db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .doc(userId)
            .get();
        if (!memberDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Usuário não é membro desta conta');
        }
        await config_1.db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .doc(userId)
            .delete();
        await config_1.db
            .collection('accounts')
            .doc(accountId)
            .update({
            'metrics.currentMembers': firestore_1.FieldValue.increment(-1),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        const userClaims = await config_1.auth.getUser(userId).then((u) => u.customClaims || {});
        const currentAccountIds = (userClaims.accountIds || []).filter((id) => id !== accountId);
        await config_1.auth.setCustomUserClaims(userId, Object.assign(Object.assign({}, userClaims), { accountIds: currentAccountIds, defaultAccountId: userClaims.defaultAccountId === accountId
                ? currentAccountIds[0] || null
                : userClaims.defaultAccountId }));
        await (0, audit_1.logAudit)('master_remove_user_from_account', uid, 'Master Admin', 'account', accountId, {
            userId,
            accountId,
            success: true,
        }, accountId);
        return {
            success: true,
            message: 'Usuário removido da conta com sucesso',
        };
    }
    catch (error) {
        await (0, audit_1.logAudit)('master_remove_user_from_account_error', uid, 'Master Admin', 'account', accountId, { userId, accountId, error: error.message, success: false }, accountId);
        throw error;
    }
});
//# sourceMappingURL=master.js.map