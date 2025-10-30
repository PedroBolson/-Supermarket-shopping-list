"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAccountLimits = exports.grantLifetimeAccess = exports.switchPlan = void 0;
const v2_1 = require("firebase-functions/v2");
const config_1 = require("../config");
const audit_1 = require("../utils/audit");
const validation_1 = require("../utils/validation");
const firestore_1 = require("firebase-admin/firestore");
exports.switchPlan = v2_1.https.onCall(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { accountId, newPlanId } = request.data;
    if (!accountId || !newPlanId) {
        throw new v2_1.https.HttpsError("invalid-argument", "Dados incompletos");
    }
    await (0, validation_1.validateAuth)(uid);
    await (0, validation_1.validateAccountPermission)(uid, accountId);
    const accountDoc = await config_1.db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Conta não encontrada");
    }
    const planDoc = await config_1.db.collection("plans").doc(newPlanId).get();
    if (!planDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Plano não encontrado");
    }
    const planData = planDoc.data();
    if (!planData.isActive) {
        throw new v2_1.https.HttpsError("failed-precondition", "Este plano não está disponível");
    }
    const accountData = accountDoc.data();
    if (accountData.isLifetime) {
        throw new v2_1.https.HttpsError("failed-precondition", "Contas com acesso vitalício não podem trocar de plano");
    }
    let expiresAt = null;
    if (planData.interval === "monthly") {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        expiresAt = expiry;
    }
    else if (planData.interval === "yearly") {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        expiresAt = expiry;
    }
    await accountDoc.ref.update({
        planId: newPlanId,
        limits: planData.limits,
        expiresAt: expiresAt ? firestore_1.FieldValue.serverTimestamp() : null,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    const userDoc = await config_1.db.collection("users").doc(uid).get();
    const userName = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Usuário";
    await (0, audit_1.logAudit)("plan_switched", uid, userName, "plan", newPlanId, { accountId, oldPlanId: accountData.planId, newPlanId }, accountId);
    return { success: true };
});
exports.grantLifetimeAccess = v2_1.https.onCall(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { accountId } = request.data;
    if (!accountId) {
        throw new v2_1.https.HttpsError("invalid-argument", "ID da conta não fornecido");
    }
    await (0, validation_1.validateAuth)(uid);
    const isMaster = await (0, validation_1.isMasterAdmin)(uid);
    if (!isMaster) {
        throw new v2_1.https.HttpsError("permission-denied", "Apenas administradores master podem conceder acesso vitalício");
    }
    const accountDoc = await config_1.db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Conta não encontrada");
    }
    await accountDoc.ref.update({
        isLifetime: true,
        expiresAt: null,
        status: "active",
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    const userDoc = await config_1.db.collection("users").doc(uid).get();
    const userName = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Administrador";
    await (0, audit_1.logAudit)("lifetime_access_granted", uid, userName, "account", accountId, { accountId }, accountId);
    return { success: true };
});
exports.updateAccountLimits = v2_1.https.onCall(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { accountId, limits } = request.data;
    if (!accountId || !limits) {
        throw new v2_1.https.HttpsError("invalid-argument", "Dados incompletos");
    }
    await (0, validation_1.validateAuth)(uid);
    const isMaster = await (0, validation_1.isMasterAdmin)(uid);
    if (!isMaster) {
        throw new v2_1.https.HttpsError("permission-denied", "Apenas administradores master podem atualizar limites");
    }
    const accountDoc = await config_1.db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Conta não encontrada");
    }
    const accountData = accountDoc.data();
    const updatedLimits = Object.assign(Object.assign({}, accountData.limits), limits);
    await accountDoc.ref.update({
        limits: updatedLimits,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    const userDoc = await config_1.db.collection("users").doc(uid).get();
    const userName = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Administrador";
    await (0, audit_1.logAudit)("account_limits_updated", uid, userName, "account", accountId, { accountId, oldLimits: accountData.limits, newLimits: updatedLimits }, accountId);
    return { success: true };
});
//# sourceMappingURL=plans.js.map