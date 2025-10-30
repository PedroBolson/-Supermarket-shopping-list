"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suspendAccount = exports.demoteFromMaster = exports.promoteToMaster = void 0;
const v2_1 = require("firebase-functions/v2");
const config_1 = require("../config");
const audit_1 = require("../utils/audit");
const validation_1 = require("../utils/validation");
const firestore_1 = require("firebase-admin/firestore");
exports.promoteToMaster = v2_1.https.onCall(async (request) => {
    var _a, _b, _c;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { userId } = request.data;
    if (!userId) {
        throw new v2_1.https.HttpsError("invalid-argument", "ID do usuário não fornecido");
    }
    await (0, validation_1.validateAuth)(uid);
    const isMaster = await (0, validation_1.isMasterAdmin)(uid);
    if (!isMaster) {
        throw new v2_1.https.HttpsError("permission-denied", "Apenas administradores master podem promover usuários");
    }
    const userDoc = await config_1.db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Usuário não encontrado");
    }
    await userDoc.ref.update({
        isMaster: true,
        "supportFlags.canAccessAllAccounts": true,
        "supportFlags.canModifyPlans": true,
        "supportFlags.canViewAudits": true,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    const userRecord = await config_1.auth.getUser(userId);
    const currentClaims = (userRecord.customClaims || {});
    await config_1.auth.setCustomUserClaims(userId, Object.assign(Object.assign({}, currentClaims), { master: true }));
    const adminDoc = await config_1.db.collection("users").doc(uid).get();
    const adminName = ((_b = adminDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Administrador";
    const targetUserName = ((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.name) || "Usuário";
    await (0, audit_1.logAudit)("user_promoted_to_master", uid, adminName, "user", userId, { targetUserName }, null);
    return { success: true };
});
exports.demoteFromMaster = v2_1.https.onCall(async (request) => {
    var _a, _b, _c;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { userId } = request.data;
    if (!userId) {
        throw new v2_1.https.HttpsError("invalid-argument", "ID do usuário não fornecido");
    }
    if (uid === userId) {
        throw new v2_1.https.HttpsError("permission-denied", "Você não pode remover suas próprias permissões de master");
    }
    await (0, validation_1.validateAuth)(uid);
    const isMaster = await (0, validation_1.isMasterAdmin)(uid);
    if (!isMaster) {
        throw new v2_1.https.HttpsError("permission-denied", "Apenas administradores master podem rebaixar usuários");
    }
    const userDoc = await config_1.db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Usuário não encontrado");
    }
    await userDoc.ref.update({
        isMaster: false,
        "supportFlags.canAccessAllAccounts": false,
        "supportFlags.canModifyPlans": false,
        "supportFlags.canViewAudits": false,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    const userRecord = await config_1.auth.getUser(userId);
    const currentClaims = (userRecord.customClaims || {});
    await config_1.auth.setCustomUserClaims(userId, Object.assign(Object.assign({}, currentClaims), { master: false }));
    const adminDoc = await config_1.db.collection("users").doc(uid).get();
    const adminName = ((_b = adminDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Administrador";
    const targetUserName = ((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.name) || "Usuário";
    await (0, audit_1.logAudit)("user_demoted_from_master", uid, adminName, "user", userId, { targetUserName }, null);
    return { success: true };
});
exports.suspendAccount = v2_1.https.onCall(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { accountId, suspend } = request.data;
    if (!accountId || suspend === undefined) {
        throw new v2_1.https.HttpsError("invalid-argument", "Dados incompletos");
    }
    await (0, validation_1.validateAuth)(uid);
    const isMaster = await (0, validation_1.isMasterAdmin)(uid);
    if (!isMaster) {
        throw new v2_1.https.HttpsError("permission-denied", "Apenas administradores master podem suspender contas");
    }
    const accountDoc = await config_1.db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Conta não encontrada");
    }
    const newStatus = suspend ? "suspended" : "active";
    await accountDoc.ref.update({
        status: newStatus,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    const adminDoc = await config_1.db.collection("users").doc(uid).get();
    const adminName = ((_b = adminDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Administrador";
    await (0, audit_1.logAudit)(suspend ? "account_suspended" : "account_reactivated", uid, adminName, "account", accountId, { accountId }, accountId);
    return { success: true };
});
//# sourceMappingURL=admin.js.map