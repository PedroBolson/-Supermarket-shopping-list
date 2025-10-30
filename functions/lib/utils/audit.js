"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const config_1 = require("../config");
const firestore_1 = require("firebase-admin/firestore");
async function logAudit(action, performedBy, performedByName, targetType, targetId, details, accountId, metadata) {
    const auditDoc = {
        accountId: accountId || null,
        action,
        performedBy,
        performedByName,
        targetType,
        targetId,
        details,
        ipAddress: metadata === null || metadata === void 0 ? void 0 : metadata.ipAddress,
        userAgent: metadata === null || metadata === void 0 ? void 0 : metadata.userAgent,
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    };
    await config_1.db.collection("audits").add(auditDoc);
}
//# sourceMappingURL=audit.js.map