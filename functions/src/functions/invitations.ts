import { https } from "firebase-functions/v2";
import { db } from "../config";
import type { Invitation, AccountMember } from "../types";
import { FieldValue } from "firebase-admin/firestore";
import { logAudit } from "../utils/audit";
import {
    validateAuth,
    validateAccountPermission,
    validateEmail,
    validatePlanLimits,
} from "../utils/validation";
import { INVITATION_EXPIRY_DAYS } from "../config";

interface SendInvitationRequest {
    accountId: string;
    email: string;
    role: "convidado";
}

export const sendInvitation = https.onCall<SendInvitationRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { accountId, email, role } = request.data;

        if (!accountId || !email || !role) {
            throw new https.HttpsError("invalid-argument", "Dados incompletos");
        }

        if (!validateEmail(email)) {
            throw new https.HttpsError("invalid-argument", "Email inválido");
        }

        if (role !== "convidado") {
            throw new https.HttpsError(
                "invalid-argument",
                "Apenas o papel 'convidado' pode ser atribuído via convite"
            );
        }

        await validateAuth(uid);
        await validateAccountPermission(uid, accountId);

        const accountDoc = await db.collection("accounts").doc(accountId).get();
        if (!accountDoc.exists) {
            throw new https.HttpsError("not-found", "Conta não encontrada");
        }

        const accountData = accountDoc.data()!;
        validatePlanLimits(
            accountData.metrics.currentMembers,
            accountData.limits.maxMembers,
            "membros"
        );

        const existingMemberQuery = await db
            .collection("accountMembers")
            .doc(accountId)
            .collection("members")
            .where("__name__", "==", email)
            .limit(1)
            .get();

        if (!existingMemberQuery.empty) {
            throw new https.HttpsError("already-exists", "Este usuário já é membro da conta");
        }

        const existingInvitationQuery = await db
            .collection("invitations")
            .where("accountId", "==", accountId)
            .where("email", "==", email)
            .where("status", "==", "pending")
            .limit(1)
            .get();

        if (!existingInvitationQuery.empty) {
            throw new https.HttpsError("already-exists", "Já existe um convite pendente para este email");
        }

        const userDoc = await db.collection("users").doc(uid).get();
        const userName = userDoc.data()?.name || "Usuário";

        const token = db.collection("invitations").doc().id;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

        const invitation: Invitation = {
            token,
            accountId,
            email,
            role,
            status: "pending",
            invitedBy: uid,
            invitedByName: userName,
            accountName: accountData.name,
            createdAt: FieldValue.serverTimestamp() as any,
            expiresAt: FieldValue.serverTimestamp() as any,
            acceptedAt: null,
            acceptedBy: null,
        };

        await db.collection("invitations").doc(token).set(invitation);

        await logAudit(
            "invitation_sent",
            uid,
            userName,
            "invitation",
            token,
            { accountId, email, role },
            accountId
        );

        return { success: true, invitationToken: token };
    }
);

interface AcceptInvitationRequest {
    token: string;
}

export const acceptInvitation = https.onCall<AcceptInvitationRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { token } = request.data;

        if (!token) {
            throw new https.HttpsError("invalid-argument", "Token de convite não fornecido");
        }

        await validateAuth(uid);

        const invitationDoc = await db.collection("invitations").doc(token).get();
        if (!invitationDoc.exists) {
            throw new https.HttpsError("not-found", "Convite não encontrado");
        }

        const invitation = invitationDoc.data() as Invitation;

        if (invitation.status !== "pending") {
            throw new https.HttpsError("failed-precondition", "Este convite não está mais disponível");
        }

        const now = new Date();
        const expiresAt = invitation.expiresAt.toDate();
        if (now > expiresAt) {
            await invitationDoc.ref.update({ status: "expired" });
            throw new https.HttpsError("failed-precondition", "Este convite expirou");
        }

        const userDoc = await db.collection("users").doc(uid).get();
        const userEmail = userDoc.data()?.email || "";

        if (userEmail !== invitation.email) {
            throw new https.HttpsError(
                "permission-denied",
                "Este convite não foi enviado para o seu email"
            );
        }

        const existingMemberDoc = await db
            .collection("accountMembers")
            .doc(invitation.accountId)
            .collection("members")
            .doc(uid)
            .get();

        if (existingMemberDoc.exists) {
            throw new https.HttpsError("already-exists", "Você já é membro desta conta");
        }

        const memberDoc: AccountMember = {
            uid,
            accountId: invitation.accountId,
            role: invitation.role,
            status: "active",
            invitedBy: invitation.invitedBy,
            invitedAt: invitation.createdAt,
            joinedAt: FieldValue.serverTimestamp() as any,
            suspendedAt: null,
            suspendedBy: null,
        };

        await db
            .collection("accountMembers")
            .doc(invitation.accountId)
            .collection("members")
            .doc(uid)
            .set(memberDoc);

        await invitationDoc.ref.update({
            status: "accepted",
            acceptedAt: FieldValue.serverTimestamp(),
            acceptedBy: uid,
        });

        await db
            .collection("accounts")
            .doc(invitation.accountId)
            .update({
                "metrics.currentMembers": FieldValue.increment(1),
            });

        const userName = userDoc.data()?.name || "Usuário";
        await logAudit(
            "invitation_accepted",
            uid,
            userName,
            "invitation",
            token,
            { accountId: invitation.accountId },
            invitation.accountId
        );

        return { success: true, accountId: invitation.accountId };
    }
);

interface RevokeInvitationRequest {
    token: string;
}

export const revokeInvitation = https.onCall<RevokeInvitationRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { token } = request.data;

        if (!token) {
            throw new https.HttpsError("invalid-argument", "Token de convite não fornecido");
        }

        await validateAuth(uid);

        const invitationDoc = await db.collection("invitations").doc(token).get();
        if (!invitationDoc.exists) {
            throw new https.HttpsError("not-found", "Convite não encontrado");
        }

        const invitation = invitationDoc.data() as Invitation;
        await validateAccountPermission(uid, invitation.accountId);

        if (invitation.status !== "pending") {
            throw new https.HttpsError("failed-precondition", "Este convite não pode ser revogado");
        }

        await invitationDoc.ref.update({
            status: "revoked",
        });

        const userDoc = await db.collection("users").doc(uid).get();
        const userName = userDoc.data()?.name || "Usuário";

        await logAudit(
            "invitation_revoked",
            uid,
            userName,
            "invitation",
            token,
            { accountId: invitation.accountId },
            invitation.accountId
        );

        return { success: true };
    }
);


