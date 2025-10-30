"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAuth = validateAuth;
exports.getUserClaims = getUserClaims;
exports.isMasterAdmin = isMasterAdmin;
exports.isAccountTitular = isAccountTitular;
exports.hasAccountAccess = hasAccountAccess;
exports.validateAccountPermission = validateAccountPermission;
exports.validateEmail = validateEmail;
exports.validatePlanLimits = validatePlanLimits;
exports.validateMasterPermission = validateMasterPermission;
const config_1 = require("../config");
const v2_1 = require("firebase-functions/v2");
async function validateAuth(uid) {
    const userRecord = await config_1.auth.getUser(uid);
    if (!userRecord) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
}
async function getUserClaims(uid) {
    const userRecord = await config_1.auth.getUser(uid);
    return userRecord.customClaims || {};
}
async function isMasterAdmin(uid) {
    const claims = await getUserClaims(uid);
    return claims.master === true;
}
async function isAccountTitular(uid, accountId) {
    var _a;
    const accountDoc = await config_1.db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        return false;
    }
    return ((_a = accountDoc.data()) === null || _a === void 0 ? void 0 : _a.titularId) === uid;
}
async function hasAccountAccess(uid, accountId) {
    const memberDoc = await config_1.db
        .collection("accounts")
        .doc(accountId)
        .collection("members")
        .doc(uid)
        .get();
    if (!memberDoc.exists) {
        return false;
    }
    const memberData = memberDoc.data();
    return (memberData === null || memberData === void 0 ? void 0 : memberData.status) === "active";
}
async function validateAccountPermission(uid, accountId, requiredRole) {
    const isMaster = await isMasterAdmin(uid);
    if (isMaster) {
        return;
    }
    const isTitular = await isAccountTitular(uid, accountId);
    if (isTitular) {
        return;
    }
    if (requiredRole) {
        const memberDoc = await config_1.db
            .collection("accounts")
            .doc(accountId)
            .collection("members")
            .doc(uid)
            .get();
        if (!memberDoc.exists) {
            throw new v2_1.https.HttpsError("permission-denied", "Você não tem permissão para acessar esta conta");
        }
        const memberData = memberDoc.data();
        if ((memberData === null || memberData === void 0 ? void 0 : memberData.status) !== "active") {
            throw new v2_1.https.HttpsError("permission-denied", "Sua conta está suspensa");
        }
        if ((memberData === null || memberData === void 0 ? void 0 : memberData.role) !== requiredRole && requiredRole !== "convidado") {
            throw new v2_1.https.HttpsError("permission-denied", "Você não tem o papel necessário para esta operação");
        }
    }
    else {
        const hasAccess = await hasAccountAccess(uid, accountId);
        if (!hasAccess) {
            throw new v2_1.https.HttpsError("permission-denied", "Você não tem acesso a esta conta");
        }
    }
}
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function validatePlanLimits(currentValue, maxValue, resourceName) {
    if (currentValue >= maxValue) {
        throw new v2_1.https.HttpsError("resource-exhausted", `Limite de ${resourceName} atingido. Faça upgrade do seu plano.`);
    }
}
async function validateMasterPermission(uid) {
    const isMaster = await isMasterAdmin(uid);
    if (!isMaster) {
        throw new v2_1.https.HttpsError("permission-denied", "Apenas administradores Master podem realizar esta operação");
    }
}
//# sourceMappingURL=validation.js.map