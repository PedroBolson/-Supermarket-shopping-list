"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFileDeleted = exports.onFileUploaded = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const config_1 = require("../config");
const firestore_1 = require("firebase-admin/firestore");
const audit_1 = require("../utils/audit");
async function getAccountIdFromPath(filePath) {
    const parts = filePath.split('/');
    // Caso 1: accounts/{accountId}/...
    if (parts.length >= 2 && parts[0] === 'accounts') {
        return parts[1];
    }
    // Caso 2: avatars/{uid}/...
    if (parts.length >= 2 && parts[0] === 'avatars') {
        const uid = parts[1];
        try {
            const userDoc = await config_1.db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return (userData === null || userData === void 0 ? void 0 : userData.defaultAccountId) || null;
            }
        }
        catch (error) {
            console.error(`Erro ao buscar defaultAccountId para usuário ${uid}:`, error);
            return null;
        }
    }
    return null;
}
exports.onFileUploaded = (0, storage_1.onObjectFinalized)({ region: 'us-east1' }, async (event) => {
    const file = event.data;
    if (!file || !file.name || !file.size) {
        return null;
    }
    const accountId = await getAccountIdFromPath(file.name);
    if (!accountId) {
        console.log(`Arquivo ${file.name} não pertence a uma conta. Ignorando.`);
        return null;
    }
    const fileSizeMB = file.size / (1024 * 1024);
    try {
        await config_1.db.collection('accounts').doc(accountId).update({
            'metrics.currentStorageMB': firestore_1.FieldValue.increment(fileSizeMB),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await (0, audit_1.logAudit)('storage_file_uploaded', 'system', 'System', 'account', accountId, { fileName: file.name, fileSizeMB, change: 'increment' }, accountId);
        console.log(`Storage da conta ${accountId} incrementado em ${fileSizeMB.toFixed(2)} MB.`);
    }
    catch (error) {
        console.error(`Erro ao atualizar storage da conta ${accountId} no upload:`, error);
        await (0, audit_1.logAudit)('storage_file_uploaded_error', 'system', 'System', 'account', accountId, { fileName: file.name, fileSizeMB, error: String(error), change: 'increment' }, accountId);
    }
    return null;
});
exports.onFileDeleted = (0, storage_1.onObjectDeleted)({ region: 'us-east1' }, async (event) => {
    const file = event.data;
    if (!file || !file.name || !file.size) {
        return null;
    }
    const accountId = await getAccountIdFromPath(file.name);
    if (!accountId) {
        console.log(`Arquivo ${file.name} não pertence a uma conta. Ignorando.`);
        return null;
    }
    const fileSizeMB = file.size / (1024 * 1024);
    try {
        await config_1.db.collection('accounts').doc(accountId).update({
            'metrics.currentStorageMB': firestore_1.FieldValue.increment(-fileSizeMB),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await (0, audit_1.logAudit)('storage_file_deleted', 'system', 'System', 'account', accountId, { fileName: file.name, fileSizeMB, change: 'decrement' }, accountId);
        console.log(`Storage da conta ${accountId} decrementado em ${fileSizeMB.toFixed(2)} MB.`);
    }
    catch (error) {
        console.error(`Erro ao atualizar storage da conta ${accountId} na exclusão:`, error);
        await (0, audit_1.logAudit)('storage_file_deleted_error', 'system', 'System', 'account', accountId, { fileName: file.name, fileSizeMB, error: String(error), change: 'decrement' }, accountId);
    }
    return null;
});
//# sourceMappingURL=storage.js.map