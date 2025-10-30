"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeInvitation = exports.acceptInvitation = exports.sendInvitation = void 0;
const v2_1 = require("firebase-functions/v2");
const config_1 = require("../config");
const firestore_1 = require("firebase-admin/firestore");
const audit_1 = require("../utils/audit");
const validation_1 = require("../utils/validation");
const config_2 = require("../config");
exports.sendInvitation = v2_1.https.onCall(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { accountId, email, role } = request.data;
    if (!accountId || !email || !role) {
        throw new v2_1.https.HttpsError("invalid-argument", "Dados incompletos");
    }
    if (!(0, validation_1.validateEmail)(email)) {
        throw new v2_1.https.HttpsError("invalid-argument", "Email inválido");
    }
    if (role !== "convidado") {
        throw new v2_1.https.HttpsError("invalid-argument", "Apenas o papel 'convidado' pode ser atribuído via convite");
    }
    await (0, validation_1.validateAuth)(uid);
    await (0, validation_1.validateAccountPermission)(uid, accountId);
    const accountDoc = await config_1.db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Conta não encontrada");
    }
    const accountData = accountDoc.data();
    (0, validation_1.validatePlanLimits)(accountData.metrics.currentMembers, accountData.limits.maxMembers, "membros");
    const existingMemberQuery = await config_1.db
        .collection("accountMembers")
        .doc(accountId)
        .collection("members")
        .where("__name__", "==", email)
        .limit(1)
        .get();
    if (!existingMemberQuery.empty) {
        throw new v2_1.https.HttpsError("already-exists", "Este usuário já é membro da conta");
    }
    const existingInvitationQuery = await config_1.db
        .collection("invitations")
        .where("accountId", "==", accountId)
        .where("email", "==", email)
        .where("status", "==", "pending")
        .limit(1)
        .get();
    if (!existingInvitationQuery.empty) {
        throw new v2_1.https.HttpsError("already-exists", "Já existe um convite pendente para este email");
    }
    const userDoc = await config_1.db.collection("users").doc(uid).get();
    const userName = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Usuário";
    const token = config_1.db.collection("invitations").doc().id;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config_2.INVITATION_EXPIRY_DAYS);
    const invitation = {
        token,
        accountId,
        email,
        role,
        status: "pending",
        invitedBy: uid,
        invitedByName: userName,
        accountName: accountData.name,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        expiresAt: firestore_1.FieldValue.serverTimestamp(),
        acceptedAt: null,
        acceptedBy: null,
    };
    await config_1.db.collection("invitations").doc(token).set(invitation);
    await (0, audit_1.logAudit)("invitation_sent", uid, userName, "invitation", token, { accountId, email, role }, accountId);
    return { success: true, invitationToken: token };
});
exports.acceptInvitation = v2_1.https.onCall(async (request) => {
    var _a, _b, _c;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { token } = request.data;
    if (!token) {
        throw new v2_1.https.HttpsError("invalid-argument", "Token de convite não fornecido");
    }
    await (0, validation_1.validateAuth)(uid);
    const invitationDoc = await config_1.db.collection("invitations").doc(token).get();
    if (!invitationDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Convite não encontrado");
    }
    const invitation = invitationDoc.data();
    if (invitation.status !== "pending") {
        throw new v2_1.https.HttpsError("failed-precondition", "Este convite não está mais disponível");
    }
    const now = new Date();
    const expiresAt = invitation.expiresAt.toDate();
    if (now > expiresAt) {
        await invitationDoc.ref.update({ status: "expired" });
        throw new v2_1.https.HttpsError("failed-precondition", "Este convite expirou");
    }
    const userDoc = await config_1.db.collection("users").doc(uid).get();
    const userEmail = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.email) || "";
    if (userEmail !== invitation.email) {
        throw new v2_1.https.HttpsError("permission-denied", "Este convite não foi enviado para o seu email");
    }
    const existingMemberDoc = await config_1.db
        .collection("accountMembers")
        .doc(invitation.accountId)
        .collection("members")
        .doc(uid)
        .get();
    if (existingMemberDoc.exists) {
        throw new v2_1.https.HttpsError("already-exists", "Você já é membro desta conta");
    }
    const memberDoc = {
        uid,
        accountId: invitation.accountId,
        role: invitation.role,
        status: "active",
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.createdAt,
        joinedAt: firestore_1.FieldValue.serverTimestamp(),
        suspendedAt: null,
        suspendedBy: null,
    };
    await config_1.db
        .collection("accountMembers")
        .doc(invitation.accountId)
        .collection("members")
        .doc(uid)
        .set(memberDoc);
    await invitationDoc.ref.update({
        status: "accepted",
        acceptedAt: firestore_1.FieldValue.serverTimestamp(),
        acceptedBy: uid,
    });
    await config_1.db
        .collection("accounts")
        .doc(invitation.accountId)
        .update({
        "metrics.currentMembers": firestore_1.FieldValue.increment(1),
    });
    const userName = ((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.name) || "Usuário";
    await (0, audit_1.logAudit)("invitation_accepted", uid, userName, "invitation", token, { accountId: invitation.accountId }, invitation.accountId);
    return { success: true, accountId: invitation.accountId };
});
exports.revokeInvitation = v2_1.https.onCall(async (request) => {
    var _a, _b;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new v2_1.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
    const { token } = request.data;
    if (!token) {
        throw new v2_1.https.HttpsError("invalid-argument", "Token de convite não fornecido");
    }
    await (0, validation_1.validateAuth)(uid);
    const invitationDoc = await config_1.db.collection("invitations").doc(token).get();
    if (!invitationDoc.exists) {
        throw new v2_1.https.HttpsError("not-found", "Convite não encontrado");
    }
    const invitation = invitationDoc.data();
    await (0, validation_1.validateAccountPermission)(uid, invitation.accountId);
    if (invitation.status !== "pending") {
        throw new v2_1.https.HttpsError("failed-precondition", "Este convite não pode ser revogado");
    }
    await invitationDoc.ref.update({
        status: "revoked",
    });
    const userDoc = await config_1.db.collection("users").doc(uid).get();
    const userName = ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.name) || "Usuário";
    await (0, audit_1.logAudit)("invitation_revoked", uid, userName, "invitation", token, { accountId: invitation.accountId }, invitation.accountId);
    return { success: true };
});
//# sourceMappingURL=invitations.js.map