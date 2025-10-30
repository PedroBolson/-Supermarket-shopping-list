import { db } from "../config";
import type { AuditLog } from "../types";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function logAudit(
    action: string,
    performedBy: string,
    performedByName: string,
    targetType: AuditLog["targetType"],
    targetId: string,
    details: Record<string, unknown>,
    accountId?: string | null,
    metadata?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
    const auditDoc: Record<string, unknown> = {
        accountId: accountId || null,
        action,
        performedBy,
        performedByName,
        targetType,
        targetId,
        details,
        timestamp: FieldValue.serverTimestamp() as unknown as Timestamp,
    };

    // Só adiciona se não for undefined
    if (metadata?.ipAddress) {
        auditDoc.ipAddress = metadata.ipAddress;
    }
    if (metadata?.userAgent) {
        auditDoc.userAgent = metadata.userAgent;
    }

    await db.collection("audits").add(auditDoc);
}


