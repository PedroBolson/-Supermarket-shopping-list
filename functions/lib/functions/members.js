"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferOwnership = exports.removeMember = exports.suspendMember = void 0;
const v2_1 = require("firebase-functions/v2");
const config_1 = require("../config");
const audit_1 = require("../utils/audit");
const validation_1 = require("../utils/validation");
const firestore_1 = require("firebase-admin/firestore");
exports.suspendMember = v2_1.https.onCall(async (request) => {
    var _a, _b, _c;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { accountId, memberId, suspend } = request.data;
    if (!accountId || !memberId || suspend === undefined) {
        throw new v2_1.https.HttpsError("invalid-argument", "Dados incompletos");
    }
    await (0, validation_1.validateAuth)(uid);
    await (0, validation_1.validateAccountPermission)(uid, accountId);
    const accountDoc = await config_1.db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Conta não encontrada");
    }
    const accountData = accountDoc.data();
    if (accountData.titularId === memberId) {
        throw new v2_1.https.HttpsError("permission-denied", "Não é possível suspender o titular da conta");
    }
    const memberDoc = await config_1.db
        .collection("accountMembers")
        .doc(accountId)
        .collection("members")
        .doc(memberId)
        .get();
    if (!memberDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Membro não encontrado");
    }
    const updateData = suspend
        ? {
            status: "suspended",
            suspendedAt: firestore_1.FieldValue.serverTimestamp(),
            suspendedBy: uid,
        }
        : {
            status: "active",
            suspendedAt: null,
            suspendedBy: null,
        };
    await memberDoc.ref.update(updateData);
    const userDoc = await config_1.db.collection("users").doc(uid).get();
    const userName = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Usuário";
    const memberUserDoc = await config_1.db.collection("users").doc(memberId).get();
    const memberName = ((_c = memberUserDoc.data()) === null || _c === void 0 ? void 0 : _c.name) || "Usuário";
    await (0, audit_1.logAudit)(suspend ? "member_suspended" : "member_reactivated", uid, userName, "member", memberId, { accountId, memberName }, accountId);
    return { success: true };
});
exports.removeMember = v2_1.https.onCall(async (request) => {
    var _a, _b, _c;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { accountId, memberId } = request.data;
    if (!accountId || !memberId) {
        throw new v2_1.https.HttpsError("invalid-argument", "Dados incompletos");
    }
    await (0, validation_1.validateAuth)(uid);
    await (0, validation_1.validateAccountPermission)(uid, accountId);
    const accountDoc = await config_1.db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Conta não encontrada");
    }
    const accountData = accountDoc.data();
    if (accountData.titularId === memberId) {
        throw new v2_1.https.HttpsError("permission-denied", "Não é possível remover o titular da conta");
    }
    const memberDoc = await config_1.db
        .collection("accountMembers")
        .doc(accountId)
        .collection("members")
        .doc(memberId)
        .get();
    if (!memberDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Membro não encontrado");
    }
    await memberDoc.ref.delete();
    await config_1.db.collection("accounts").doc(accountId).update({
        "metrics.currentMembers": firestore_1.FieldValue.increment(-1),
    });
    const memberUserRecord = await config_1.auth.getUser(memberId);
    const currentClaims = (memberUserRecord.customClaims || {});
    const accountIds = (Array.isArray(currentClaims.accountIds) ? currentClaims.accountIds : []).filter((id) => id !== accountId);
    let newDefaultAccountId = currentClaims.defaultAccountId;
    if (newDefaultAccountId === accountId) {
        newDefaultAccountId = accountIds[0] || null;
    }
    await config_1.auth.setCustomUserClaims(memberId, Object.assign(Object.assign({}, currentClaims), { accountIds, defaultAccountId: newDefaultAccountId }));
    const userDoc = await config_1.db.collection("users").doc(uid).get();
    const userName = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Usuário";
    const memberUserDoc = await config_1.db.collection("users").doc(memberId).get();
    const memberName = ((_c = memberUserDoc.data()) === null || _c === void 0 ? void 0 : _c.name) || "Usuário";
    await (0, audit_1.logAudit)("member_removed", uid, userName, "member", memberId, { accountId, memberName }, accountId);
    return { success: true };
});
exports.transferOwnership = v2_1.https.onCall(async (request) => {
    var _a, _b, _c;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { accountId, newTitularId } = request.data;
    if (!accountId || !newTitularId) {
        throw new v2_1.https.HttpsError("invalid-argument", "Dados incompletos");
    }
    await (0, validation_1.validateAuth)(uid);
    const accountDoc = await config_1.db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Conta não encontrada");
    }
    const accountData = accountDoc.data();
    if (accountData.titularId !== uid) {
        throw new v2_1.https.HttpsError("permission-denied", "Apenas o titular atual pode transferir a propriedade");
    }
    const newTitularMemberDoc = await config_1.db
        .collection("accountMembers")
        .doc(accountId)
        .collection("members")
        .doc(newTitularId)
        .get();
    if (!newTitularMemberDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "O novo titular deve ser membro da conta");
    }
    await accountDoc.ref.update({
        titularId: newTitularId,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await config_1.db
        .collection("accountMembers")
        .doc(accountId)
        .collection("members")
        .doc(uid)
        .update({
        role: "convidado",
    });
    await config_1.db
        .collection("accountMembers")
        .doc(accountId)
        .collection("members")
        .doc(newTitularId)
        .update({
        role: "titular",
    });
    const oldTitularRecord = await config_1.auth.getUser(uid);
    const oldClaims = (oldTitularRecord.customClaims || {});
    await config_1.auth.setCustomUserClaims(uid, Object.assign(Object.assign({}, oldClaims), { role: "convidado" }));
    const newTitularRecord = await config_1.auth.getUser(newTitularId);
    const newClaims = (newTitularRecord.customClaims || {});
    await config_1.auth.setCustomUserClaims(newTitularId, Object.assign(Object.assign({}, newClaims), { role: "titular" }));
    const userDoc = await config_1.db.collection("users").doc(uid).get();
    const userName = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Usuário";
    const newTitularDoc = await config_1.db.collection("users").doc(newTitularId).get();
    const newTitularName = ((_c = newTitularDoc.data()) === null || _c === void 0 ? void 0 : _c.name) || "Usuário";
    await (0, audit_1.logAudit)("ownership_transferred", uid, userName, "account", accountId, { newTitularId, newTitularName }, accountId);
    return { success: true };
});
//# sourceMappingURL=members.js.map