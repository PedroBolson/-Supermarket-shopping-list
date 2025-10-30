import { onCall } from "firebase-functions/v2/https";
import { auth, db } from "../config";
import type { Account, AccountMember } from "../types";
import { FieldValue } from "firebase-admin/firestore";
import { logAudit } from "../utils/audit";
import { FREE_PLAN_ID, DEFAULT_PLAN_LIMITS } from "../config";

interface SetupUserRequest {
    uid: string;
    email: string;
    name: string;
}

export const setupNewUser = onCall<SetupUserRequest>(async (request) => {
    const { uid, email, name } = request.data;

    if (!uid || !email || !name) {
        throw new Error("Missing required fields");
    }

    try {
        // Verificar se já foi processado
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists && userDoc.data()?.defaultAccountId) {
            console.log(`User ${uid} already processed, skipping`);
            return { success: true, message: "User already set up" };
        }

        const displayName = name || email.split("@")[0];

        const invitationQuery = await db
            .collection("invitations")
            .where("email", "==", email)
            .where("status", "==", "pending")
            .limit(1)
            .get();

        let accountId: string;
        let role: "titular" | "convidado" = "titular";
        let defaultAccountId: string;

        if (!invitationQuery.empty) {
            const invitationDoc = invitationQuery.docs[0];
            const invitation = invitationDoc.data();
            accountId = invitation.accountId;
            role = invitation.role as "convidado";
            defaultAccountId = accountId;

            await invitationDoc.ref.update({
                status: "accepted",
                acceptedAt: FieldValue.serverTimestamp(),
                acceptedBy: uid,
            });

            const memberDoc: AccountMember = {
                uid,
                accountId,
                role,
                status: "active",
                invitedBy: invitation.invitedBy,
                invitedAt: invitation.createdAt,
                joinedAt: FieldValue.serverTimestamp() as any,
                suspendedAt: null,
                suspendedBy: null,
            };

            await db
                .collection("accountMembers")
                .doc(accountId)
                .collection("members")
                .doc(uid)
                .set(memberDoc);

            await db
                .collection("accounts")
                .doc(accountId)
                .update({
                    "metrics.currentMembers": FieldValue.increment(1),
                });

            await logAudit(
                "member_joined",
                uid,
                displayName,
                "member",
                uid,
                { accountId, role },
                accountId
            );
        } else {
            const accountRef = db.collection("accounts").doc();
            accountId = accountRef.id;
            defaultAccountId = accountId;

            const planDoc = await db.collection("plans").doc(FREE_PLAN_ID).get();
            const planLimits = planDoc.exists
                ? planDoc.data()?.limits
                : DEFAULT_PLAN_LIMITS;

            const accountDoc: Omit<Account, "id"> = {
                name: `Conta de ${displayName}`,
                titularId: uid,
                planId: FREE_PLAN_ID,
                status: "active",
                expiresAt: null,
                limits: planLimits,
                metrics: {
                    currentMembers: 1,
                    currentLists: 0,
                    currentStorageMB: 0,
                },
                isLifetime: false,
                createdAt: FieldValue.serverTimestamp() as any,
                updatedAt: FieldValue.serverTimestamp() as any,
            };

            await accountRef.set(accountDoc);

            const memberDoc: AccountMember = {
                uid,
                accountId,
                role: "titular",
                status: "active",
                invitedBy: uid,
                invitedAt: FieldValue.serverTimestamp() as any,
                joinedAt: FieldValue.serverTimestamp() as any,
                suspendedAt: null,
                suspendedBy: null,
            };

            await db
                .collection("accountMembers")
                .doc(accountId)
                .collection("members")
                .doc(uid)
                .set(memberDoc);

            await logAudit(
                "account_created",
                uid,
                displayName,
                "account",
                accountId,
                { planId: FREE_PLAN_ID },
                accountId
            );
        }

        // Criar/Atualizar documento do usuário
        await db.collection("users").doc(uid).set({
            email,
            name: displayName,
            photoURL: null,
            bio: "",
            defaultAccountId,
            isActive: true,
            isMaster: false,
            consents: {
                termsAccepted: true,
                privacyAccepted: true,
                marketingAccepted: false,
                acceptedAt: FieldValue.serverTimestamp(),
            },
            supportFlags: {
                canAccessAllAccounts: false,
                canModifyPlans: false,
                canViewAudits: false,
            },
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        const accountIds = [accountId];
        await auth.setCustomUserClaims(uid, {
            role,
            accountIds,
            defaultAccountId,
            master: false,
        });

        console.log(`Custom claims definidas para usuário ${uid}`);

        return {
            success: true,
            accountId,
            role,
            defaultAccountId
        };
    } catch (error) {
        console.error("Erro ao configurar usuário:", error);
        throw error;
    }
});
