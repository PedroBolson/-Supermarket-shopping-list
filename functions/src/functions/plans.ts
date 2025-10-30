import { https } from "firebase-functions/v2";
import { db } from "../config";
import { logAudit } from "../utils/audit";
import { validateAuth, validateAccountPermission, isMasterAdmin } from "../utils/validation";
import { FieldValue } from "firebase-admin/firestore";

interface SwitchPlanRequest {
    accountId: string;
    newPlanId: string;
}

export const switchPlan = https.onCall<SwitchPlanRequest>(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { accountId, newPlanId } = request.data;

    if (!accountId || !newPlanId) {
        throw new https.HttpsError("invalid-argument", "Dados incompletos");
    }

    await validateAuth(uid);
    await validateAccountPermission(uid, accountId);

    const accountDoc = await db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        throw new https.HttpsError("not-found", "Conta não encontrada");
    }

    const planDoc = await db.collection("plans").doc(newPlanId).get();
    if (!planDoc.exists) {
        throw new https.HttpsError("not-found", "Plano não encontrado");
    }

    const planData = planDoc.data()!;
    if (!planData.isActive) {
        throw new https.HttpsError("failed-precondition", "Este plano não está disponível");
    }

    const accountData = accountDoc.data()!;
    if (accountData.isLifetime) {
        throw new https.HttpsError(
            "failed-precondition",
            "Contas com acesso vitalício não podem trocar de plano"
        );
    }

    let expiresAt = null;
    if (planData.interval === "monthly") {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        expiresAt = expiry;
    } else if (planData.interval === "yearly") {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        expiresAt = expiry;
    }

    await accountDoc.ref.update({
        planId: newPlanId,
        limits: planData.limits,
        expiresAt: expiresAt ? FieldValue.serverTimestamp() : null,
        updatedAt: FieldValue.serverTimestamp(),
    });

    const userDoc = await db.collection("users").doc(uid).get();
    const userName = userDoc.data()?.name || "Usuário";

    await logAudit(
        "plan_switched",
        uid,
        userName,
        "plan",
        newPlanId,
        { accountId, oldPlanId: accountData.planId, newPlanId },
        accountId
    );

    return { success: true };
});

interface GrantLifetimeAccessRequest {
    accountId: string;
}

export const grantLifetimeAccess = https.onCall<GrantLifetimeAccessRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { accountId } = request.data;

        if (!accountId) {
            throw new https.HttpsError("invalid-argument", "ID da conta não fornecido");
        }

        await validateAuth(uid);

        const isMaster = await isMasterAdmin(uid);
        if (!isMaster) {
            throw new https.HttpsError(
                "permission-denied",
                "Apenas administradores master podem conceder acesso vitalício"
            );
        }

        const accountDoc = await db.collection("accounts").doc(accountId).get();
        if (!accountDoc.exists) {
            throw new https.HttpsError("not-found", "Conta não encontrada");
        }

        await accountDoc.ref.update({
            isLifetime: true,
            expiresAt: null,
            status: "active",
            updatedAt: FieldValue.serverTimestamp(),
        });

        const userDoc = await db.collection("users").doc(uid).get();
        const userName = userDoc.data()?.name || "Administrador";

        await logAudit(
            "lifetime_access_granted",
            uid,
            userName,
            "account",
            accountId,
            { accountId },
            accountId
        );

        return { success: true };
    }
);

interface UpdateAccountLimitsRequest {
    accountId: string;
    limits: {
        maxMembers?: number;
        maxLists?: number;
        maxItemsPerList?: number;
        maxStorageMB?: number;
    };
}

export const updateAccountLimits = https.onCall<UpdateAccountLimitsRequest>(
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) {
            throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
        }

        const { accountId, limits } = request.data;

        if (!accountId || !limits) {
            throw new https.HttpsError("invalid-argument", "Dados incompletos");
        }

        await validateAuth(uid);

        const isMaster = await isMasterAdmin(uid);
        if (!isMaster) {
            throw new https.HttpsError(
                "permission-denied",
                "Apenas administradores master podem atualizar limites"
            );
        }

        const accountDoc = await db.collection("accounts").doc(accountId).get();
        if (!accountDoc.exists) {
            throw new https.HttpsError("not-found", "Conta não encontrada");
        }

        const accountData = accountDoc.data()!;
        const updatedLimits = {
            ...accountData.limits,
            ...limits,
        };

        await accountDoc.ref.update({
            limits: updatedLimits,
            updatedAt: FieldValue.serverTimestamp(),
        });

        const userDoc = await db.collection("users").doc(uid).get();
        const userName = userDoc.data()?.name || "Administrador";

        await logAudit(
            "account_limits_updated",
            uid,
            userName,
            "account",
            accountId,
            { accountId, oldLimits: accountData.limits, newLimits: updatedLimits },
            accountId
        );

        return { success: true };
    }
);


