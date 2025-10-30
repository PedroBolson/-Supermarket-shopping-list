import { https } from "firebase-functions/v2";
import { db, auth } from "../config";
import { logAudit } from "../utils/audit";
import { validateAuth, validateAccountPermission } from "../utils/validation";
import { FieldValue } from "firebase-admin/firestore";

interface SuspendMemberRequest {
    accountId: string;
    memberId: string;
    suspend: boolean;
}

export const suspendMember = https.onCall<SuspendMemberRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { accountId, memberId, suspend } = request.data;

        if (!accountId || !memberId || suspend === undefined) {
            throw new https.HttpsError("invalid-argument", "Dados incompletos");
        }

        await validateAuth(uid);
        await validateAccountPermission(uid, accountId);

        const accountDoc = await db.collection("accounts").doc(accountId).get();
        if (!accountDoc.exists) {
            throw new https.HttpsError("not-found", "Conta não encontrada");
        }

        const accountData = accountDoc.data()!;
        if (accountData.titularId === memberId) {
            throw new https.HttpsError(
                "permission-denied",
                "Não é possível suspender o titular da conta"
            );
        }

        const memberDoc = await db
            .collection("accountMembers")
            .doc(accountId)
            .collection("members")
            .doc(memberId)
            .get();

        if (!memberDoc.exists) {
            throw new https.HttpsError("not-found", "Membro não encontrado");
        }

        const updateData = suspend
            ? {
                status: "suspended",
                suspendedAt: FieldValue.serverTimestamp(),
                suspendedBy: uid,
            }
            : {
                status: "active",
                suspendedAt: null,
                suspendedBy: null,
            };

        await memberDoc.ref.update(updateData);

        const userDoc = await db.collection("users").doc(uid).get();
        const userName = userDoc.data()?.name || "Usuário";

        const memberUserDoc = await db.collection("users").doc(memberId).get();
        const memberName = memberUserDoc.data()?.name || "Usuário";

        await logAudit(
            suspend ? "member_suspended" : "member_reactivated",
            uid,
            userName,
            "member",
            memberId,
            { accountId, memberName },
            accountId
        );

        return { success: true };
    }
);

interface RemoveMemberRequest {
    accountId: string;
    memberId: string;
}

export const removeMember = https.onCall<RemoveMemberRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { accountId, memberId } = request.data;

        if (!accountId || !memberId) {
            throw new https.HttpsError("invalid-argument", "Dados incompletos");
        }

        await validateAuth(uid);
        await validateAccountPermission(uid, accountId);

        const accountDoc = await db.collection("accounts").doc(accountId).get();
        if (!accountDoc.exists) {
            throw new https.HttpsError("not-found", "Conta não encontrada");
        }

        const accountData = accountDoc.data()!;
        if (accountData.titularId === memberId) {
            throw new https.HttpsError(
                "permission-denied",
                "Não é possível remover o titular da conta"
            );
        }

        const memberDoc = await db
            .collection("accountMembers")
            .doc(accountId)
            .collection("members")
            .doc(memberId)
            .get();

        if (!memberDoc.exists) {
            throw new https.HttpsError("not-found", "Membro não encontrado");
        }

        await memberDoc.ref.delete();

        await db.collection("accounts").doc(accountId).update({
            "metrics.currentMembers": FieldValue.increment(-1),
        });

        const memberUserRecord = await auth.getUser(memberId);
        const currentClaims = (memberUserRecord.customClaims || {}) as any;
        const accountIds = (currentClaims.accountIds || []).filter(
            (id: string) => id !== accountId
        );

        let newDefaultAccountId = currentClaims.defaultAccountId;
        if (newDefaultAccountId === accountId) {
            newDefaultAccountId = accountIds[0] || null;
        }

        await auth.setCustomUserClaims(memberId, {
            ...currentClaims,
            accountIds,
            defaultAccountId: newDefaultAccountId,
        });

        const userDoc = await db.collection("users").doc(uid).get();
        const userName = userDoc.data()?.name || "Usuário";

        const memberUserDoc = await db.collection("users").doc(memberId).get();
        const memberName = memberUserDoc.data()?.name || "Usuário";

        await logAudit(
            "member_removed",
            uid,
            userName,
            "member",
            memberId,
            { accountId, memberName },
            accountId
        );

        return { success: true };
    }
);

interface TransferOwnershipRequest {
    accountId: string;
    newTitularId: string;
}

export const transferOwnership = https.onCall<TransferOwnershipRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { accountId, newTitularId } = request.data;

        if (!accountId || !newTitularId) {
            throw new https.HttpsError("invalid-argument", "Dados incompletos");
        }

        await validateAuth(uid);

        const accountDoc = await db.collection("accounts").doc(accountId).get();
        if (!accountDoc.exists) {
            throw new https.HttpsError("not-found", "Conta não encontrada");
        }

        const accountData = accountDoc.data()!;
        if (accountData.titularId !== uid) {
            throw new https.HttpsError(
                "permission-denied",
                "Apenas o titular atual pode transferir a propriedade"
            );
        }

        const newTitularMemberDoc = await db
            .collection("accountMembers")
            .doc(accountId)
            .collection("members")
            .doc(newTitularId)
            .get();

        if (!newTitularMemberDoc.exists) {
            throw new https.HttpsError(
                "not-found",
                "O novo titular deve ser membro da conta"
            );
        }

        await accountDoc.ref.update({
            titularId: newTitularId,
            updatedAt: FieldValue.serverTimestamp(),
        });

        await db
            .collection("accountMembers")
            .doc(accountId)
            .collection("members")
            .doc(uid)
            .update({
                role: "convidado",
            });

        await db
            .collection("accountMembers")
            .doc(accountId)
            .collection("members")
            .doc(newTitularId)
            .update({
                role: "titular",
            });

        const oldTitularRecord = await auth.getUser(uid);
        const oldClaims = (oldTitularRecord.customClaims || {}) as any;
        await auth.setCustomUserClaims(uid, {
            ...oldClaims,
            role: "convidado",
        });

        const newTitularRecord = await auth.getUser(newTitularId);
        const newClaims = (newTitularRecord.customClaims || {}) as any;
        await auth.setCustomUserClaims(newTitularId, {
            ...newClaims,
            role: "titular",
        });

        const userDoc = await db.collection("users").doc(uid).get();
        const userName = userDoc.data()?.name || "Usuário";

        const newTitularDoc = await db.collection("users").doc(newTitularId).get();
        const newTitularName = newTitularDoc.data()?.name || "Usuário";

        await logAudit(
            "ownership_transferred",
            uid,
            userName,
            "account",
            accountId,
            { newTitularId, newTitularName },
            accountId
        );

        return { success: true };
    }
);


