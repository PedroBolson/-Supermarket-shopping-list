"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupNewUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../config");
const firestore_1 = require("firebase-admin/firestore");
const audit_1 = require("../utils/audit");
const config_2 = require("../config");
exports.setupNewUser = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const { uid, email, name } = request.data;
    if (!uid || !email || !name) {
        throw new Error("Missing required fields");
    }
    try {
        // Verificar se já foi processado
        const userDoc = await config_1.db.collection("users").doc(uid).get();
        if (userDoc.exists && ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.defaultAccountId)) {
            console.log(`User ${uid} already processed, skipping`);
            return { success: true, message: "User already set up" };
        }
        const displayName = name || email.split("@")[0];
        const invitationQuery = await config_1.db
            .collection("invitations")
            .where("email", "==", email)
            .where("status", "==", "pending")
            .limit(1)
            .get();
        let accountId;
        let role = "titular";
        let defaultAccountId;
        if (!invitationQuery.empty) {
            const invitationDoc = invitationQuery.docs[0];
            const invitation = invitationDoc.data();
            accountId = invitation.accountId;
            role = invitation.role;
            defaultAccountId = accountId;
            await invitationDoc.ref.update({
                status: "accepted",
                acceptedAt: firestore_1.FieldValue.serverTimestamp(),
                acceptedBy: uid,
            });
            const memberDoc = {
                uid,
                accountId,
                role,
                status: "active",
                invitedBy: invitation.invitedBy,
                invitedAt: invitation.createdAt,
                joinedAt: firestore_1.FieldValue.serverTimestamp(),
                suspendedAt: null,
                suspendedBy: null,
            };
            await config_1.db
                .collection("accountMembers")
                .doc(accountId)
                .collection("members")
                .doc(uid)
                .set(memberDoc);
            await config_1.db
                .collection("accounts")
                .doc(accountId)
                .update({
                "metrics.currentMembers": firestore_1.FieldValue.increment(1),
            });
            await (0, audit_1.logAudit)("member_joined", uid, displayName, "member", uid, { accountId, role }, accountId);
        }
        else {
            const accountRef = config_1.db.collection("accounts").doc();
            accountId = accountRef.id;
            defaultAccountId = accountId;
            const planDoc = await config_1.db.collection("plans").doc(config_2.FREE_PLAN_ID).get();
            const planLimits = planDoc.exists
                ? (_b = planDoc.data()) === null || _b === void 0 ? void 0 : _b.limits
                : config_2.DEFAULT_PLAN_LIMITS;
            const accountDoc = {
                name: `Conta de ${displayName}`,
                titularId: uid,
                planId: config_2.FREE_PLAN_ID,
                status: "active",
                expiresAt: null,
                limits: planLimits,
                metrics: {
                    currentMembers: 1,
                    currentLists: 0,
                    currentStorageMB: 0,
                },
                isLifetime: false,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            };
            await accountRef.set(accountDoc);
            const memberDoc = {
                uid,
                accountId,
                role: "titular",
                status: "active",
                invitedBy: uid,
                invitedAt: firestore_1.FieldValue.serverTimestamp(),
                joinedAt: firestore_1.FieldValue.serverTimestamp(),
                suspendedAt: null,
                suspendedBy: null,
            };
            await config_1.db
                .collection("accountMembers")
                .doc(accountId)
                .collection("members")
                .doc(uid)
                .set(memberDoc);
            await (0, audit_1.logAudit)("account_created", uid, displayName, "account", accountId, { planId: config_2.FREE_PLAN_ID }, accountId);
        }
        // Criar/Atualizar documento do usuário
        await config_1.db.collection("users").doc(uid).set({
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
                acceptedAt: firestore_1.FieldValue.serverTimestamp(),
            },
            supportFlags: {
                canAccessAllAccounts: false,
                canModifyPlans: false,
                canViewAudits: false,
            },
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        const accountIds = [accountId];
        await config_1.auth.setCustomUserClaims(uid, {
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
    }
    catch (error) {
        console.error("Erro ao configurar usuário:", error);
        throw error;
    }
});
//# sourceMappingURL=auth.js.map