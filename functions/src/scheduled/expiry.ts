import { scheduler } from "firebase-functions/v2";
import { db } from "../config";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const checkExpiredAccounts = scheduler.onSchedule(
    {
        schedule: "0 2 * * *",
        timeZone: "America/Sao_Paulo",
    },
    async () => {
        console.log("Verificando contas expiradas...");

        const now = new Date();
        const accountsSnapshot = await db
            .collection("accounts")
            .where("status", "==", "active")
            .where("isLifetime", "==", false)
            .where("expiresAt", "<=", now)
            .get();

        if (accountsSnapshot.empty) {
            console.log("Nenhuma conta expirada encontrada");
            return;
        }

        const batch = db.batch();
        let count = 0;

        for (const doc of accountsSnapshot.docs) {
            batch.update(doc.ref, {
                status: "expired",
                updatedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
            });
            count++;
        }

        await batch.commit();
        console.log(`${count} conta(s) marcada(s) como expirada(s)`);
    }
);

export const checkExpiredInvitations = scheduler.onSchedule(
    {
        schedule: "0 3 * * *",
        timeZone: "America/Sao_Paulo",
    },
    async () => {
        console.log("Verificando convites expirados...");

        const now = new Date();
        const invitationsSnapshot = await db
            .collection("invitations")
            .where("status", "==", "pending")
            .where("expiresAt", "<=", now)
            .get();

        if (invitationsSnapshot.empty) {
            console.log("Nenhum convite expirado encontrado");
            return;
        }

        const batch = db.batch();
        let count = 0;

        for (const doc of invitationsSnapshot.docs) {
            batch.update(doc.ref, {
                status: "expired",
            });
            count++;
        }

        await batch.commit();
        console.log(`${count} convite(s) marcado(s) como expirado(s)`);
    }
);


