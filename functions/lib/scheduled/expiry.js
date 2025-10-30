"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiredInvitations = exports.checkExpiredAccounts = void 0;
const v2_1 = require("firebase-functions/v2");
const config_1 = require("../config");
const firestore_1 = require("firebase-admin/firestore");
exports.checkExpiredAccounts = v2_1.scheduler.onSchedule({
    schedule: "0 2 * * *",
    timeZone: "America/Sao_Paulo",
}, async () => {
    console.log("Verificando contas expiradas...");
    const now = new Date();
    const accountsSnapshot = await config_1.db
        .collection("accounts")
        .where("status", "==", "active")
        .where("isLifetime", "==", false)
        .where("expiresAt", "<=", now)
        .get();
    if (accountsSnapshot.empty) {
        console.log("Nenhuma conta expirada encontrada");
        return;
    }
    const batch = config_1.db.batch();
    let count = 0;
    for (const doc of accountsSnapshot.docs) {
        batch.update(doc.ref, {
            status: "expired",
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        count++;
    }
    await batch.commit();
    console.log(`${count} conta(s) marcada(s) como expirada(s)`);
});
exports.checkExpiredInvitations = v2_1.scheduler.onSchedule({
    schedule: "0 3 * * *",
    timeZone: "America/Sao_Paulo",
}, async () => {
    console.log("Verificando convites expirados...");
    const now = new Date();
    const invitationsSnapshot = await config_1.db
        .collection("invitations")
        .where("status", "==", "pending")
        .where("expiresAt", "<=", now)
        .get();
    if (invitationsSnapshot.empty) {
        console.log("Nenhum convite expirado encontrado");
        return;
    }
    const batch = config_1.db.batch();
    let count = 0;
    for (const doc of invitationsSnapshot.docs) {
        batch.update(doc.ref, {
            status: "expired",
        });
        count++;
    }
    await batch.commit();
    console.log(`${count} convite(s) marcado(s) como expirado(s)`);
});
//# sourceMappingURL=expiry.js.map