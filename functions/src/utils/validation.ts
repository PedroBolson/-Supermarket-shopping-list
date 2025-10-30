import { db, auth } from "../config";
import type { CustomClaims, UserRole } from "../types";
import { https } from "firebase-functions/v2";

export async function validateAuth(uid: string): Promise<void> {
    const userRecord = await auth.getUser(uid);
    if (!userRecord) {
        throw new https.HttpsError("unauthenticated", "Usuário não autenticado");
    }
}

export async function getUserClaims(uid: string): Promise<CustomClaims> {
    const userRecord = await auth.getUser(uid);
    return (userRecord.customClaims as CustomClaims) || {};
}

export async function isMasterAdmin(uid: string): Promise<boolean> {
    const claims = await getUserClaims(uid);
    return claims.master === true;
}

export async function isAccountTitular(uid: string, accountId: string): Promise<boolean> {
    const accountDoc = await db.collection("accounts").doc(accountId).get();
    if (!accountDoc.exists) {
        return false;
    }
    return accountDoc.data()?.titularId === uid;
}

export async function hasAccountAccess(uid: string, accountId: string): Promise<boolean> {
    const memberDoc = await db
        .collection("accounts")
        .doc(accountId)
        .collection("members")
        .doc(uid)
        .get();

    if (!memberDoc.exists) {
        return false;
    }

    const memberData = memberDoc.data();
    return memberData?.status === "active";
}

export async function validateAccountPermission(
    uid: string,
    accountId: string,
    requiredRole?: UserRole
): Promise<void> {
    const isMaster = await isMasterAdmin(uid);
    if (isMaster) {
        return;
    }

    const isTitular = await isAccountTitular(uid, accountId);
    if (isTitular) {
        return;
    }

    if (requiredRole) {
        const memberDoc = await db
            .collection("accounts")
            .doc(accountId)
            .collection("members")
            .doc(uid)
            .get();

        if (!memberDoc.exists) {
            throw new https.HttpsError(
                "permission-denied",
                "Você não tem permissão para acessar esta conta"
            );
        }

        const memberData = memberDoc.data();
        if (memberData?.status !== "active") {
            throw new https.HttpsError(
                "permission-denied",
                "Sua conta está suspensa"
            );
        }

        if (memberData?.role !== requiredRole && requiredRole !== "convidado") {
            throw new https.HttpsError(
                "permission-denied",
                "Você não tem o papel necessário para esta operação"
            );
        }
    } else {
        const hasAccess = await hasAccountAccess(uid, accountId);
        if (!hasAccess) {
            throw new https.HttpsError(
                "permission-denied",
                "Você não tem acesso a esta conta"
            );
        }
    }
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePlanLimits(
    currentValue: number,
    maxValue: number,
    resourceName: string
): void {
    if (currentValue >= maxValue) {
        throw new https.HttpsError(
            "resource-exhausted",
            `Limite de ${resourceName} atingido. Faça upgrade do seu plano.`
        );
    }
}

export async function validateMasterPermission(uid: string): Promise<void> {
    const isMaster = await isMasterAdmin(uid);
    if (!isMaster) {
        throw new https.HttpsError(
            "permission-denied",
            "Apenas administradores Master podem realizar esta operação"
        );
    }
}
