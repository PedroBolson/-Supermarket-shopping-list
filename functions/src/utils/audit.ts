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
    const auditDoc: Omit<AuditLog, "id"> = {
        accountId: accountId || null,
        action,
        performedBy,
        performedByName,
        targetType,
        targetId,
        details,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        timestamp: FieldValue.serverTimestamp() as unknown as Timestamp,
    };

    await db.collection("audits").add(auditDoc);
}


