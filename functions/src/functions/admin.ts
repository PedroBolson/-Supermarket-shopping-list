import { https } from "firebase-functions/v2";
import { db, auth } from "../config";
import { logAudit } from "../utils/audit";
import { validateAuth, isMasterAdmin } from "../utils/validation";
import { FieldValue } from "firebase-admin/firestore";

interface PromoteToMasterRequest {
    userId: string;
}

export const promoteToMaster = https.onCall<PromoteToMasterRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { userId } = request.data;

        if (!userId) {
            throw new https.HttpsError("invalid-argument", "ID do usuário não fornecido");
        }

        await validateAuth(uid);

        const isMaster = await isMasterAdmin(uid);
        if (!isMaster) {
            throw new https.HttpsError(
                "permission-denied",
                "Apenas administradores master podem promover usuários"
            );
        }

        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            throw new https.HttpsError("not-found", "Usuário não encontrado");
        }

        await userDoc.ref.update({
            isMaster: true,
            "supportFlags.canAccessAllAccounts": true,
            "supportFlags.canModifyPlans": true,
            "supportFlags.canViewAudits": true,
            updatedAt: FieldValue.serverTimestamp(),
        });

        const userRecord = await auth.getUser(userId);
        const currentClaims = (userRecord.customClaims || {}) as any;

        await auth.setCustomUserClaims(userId, {
            ...currentClaims,
            master: true,
        });

        const adminDoc = await db.collection("users").doc(uid).get();
        const adminName = adminDoc.data()?.name || "Administrador";

        const targetUserName = userDoc.data()?.name || "Usuário";

        await logAudit(
            "user_promoted_to_master",
            uid,
            adminName,
            "user",
            userId,
            { targetUserName },
            null
        );

        return { success: true };
    }
);

interface DemoteFromMasterRequest {
    userId: string;
}

export const demoteFromMaster = https.onCall<DemoteFromMasterRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { userId } = request.data;

        if (!userId) {
            throw new https.HttpsError("invalid-argument", "ID do usuário não fornecido");
        }

        if (uid === userId) {
            throw new https.HttpsError(
                "permission-denied",
                "Você não pode remover suas próprias permissões de master"
            );
        }

        await validateAuth(uid);

        const isMaster = await isMasterAdmin(uid);
        if (!isMaster) {
            throw new https.HttpsError(
                "permission-denied",
                "Apenas administradores master podem rebaixar usuários"
            );
        }

        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            throw new https.HttpsError("not-found", "Usuário não encontrado");
        }

        await userDoc.ref.update({
            isMaster: false,
            "supportFlags.canAccessAllAccounts": false,
            "supportFlags.canModifyPlans": false,
            "supportFlags.canViewAudits": false,
            updatedAt: FieldValue.serverTimestamp(),
        });

        const userRecord = await auth.getUser(userId);
        const currentClaims = (userRecord.customClaims || {}) as any;

        await auth.setCustomUserClaims(userId, {
            ...currentClaims,
            master: false,
        });

        const adminDoc = await db.collection("users").doc(uid).get();
        const adminName = adminDoc.data()?.name || "Administrador";

        const targetUserName = userDoc.data()?.name || "Usuário";

        await logAudit(
            "user_demoted_from_master",
            uid,
            adminName,
            "user",
            userId,
            { targetUserName },
            null
        );

        return { success: true };
    }
);

interface SuspendAccountRequest {
    accountId: string;
    suspend: boolean;
}

export const suspendAccount = https.onCall<SuspendAccountRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { accountId, suspend } = request.data;

        if (!accountId || suspend === undefined) {
            throw new https.HttpsError("invalid-argument", "Dados incompletos");
        }

        await validateAuth(uid);

        const isMaster = await isMasterAdmin(uid);
        if (!isMaster) {
            throw new https.HttpsError(
                "permission-denied",
                "Apenas administradores master podem suspender contas"
            );
        }

        const accountDoc = await db.collection("accounts").doc(accountId).get();
        if (!accountDoc.exists) {
            throw new https.HttpsError("not-found", "Conta não encontrada");
        }

        const newStatus = suspend ? "suspended" : "active";

        await accountDoc.ref.update({
            status: newStatus,
            updatedAt: FieldValue.serverTimestamp(),
        });

        const adminDoc = await db.collection("users").doc(uid).get();
        const adminName = adminDoc.data()?.name || "Administrador";

        await logAudit(
            suspend ? "account_suspended" : "account_reactivated",
            uid,
            adminName,
            "account",
            accountId,
            { accountId },
            accountId
        );

        return { success: true };
    }
);


