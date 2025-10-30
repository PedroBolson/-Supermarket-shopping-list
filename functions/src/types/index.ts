import type { Timestamp } from "firebase-admin/firestore";

export type UserRole = "titular" | "convidado" | "master";

export type AccountStatus = "active" | "suspended" | "expired" | "pending";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type MemberStatus = "active" | "suspended" | "pending";

export interface Plan {
    id: string;
    name: string;
    description?: string;
    price: number;
    interval: "monthly" | "yearly" | "lifetime";
    limits: {
        maxMembers: number;
        maxLists: number;
        maxItemsPerList: number;
        maxStorageMB: number;
    };
    features: string[];
    isActive: boolean;
    order: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Account {
    id: string;
    name: string;
    titularId: string;
    planId: string;
    status: AccountStatus;
    expiresAt?: Timestamp | null;
    limits: {
        maxMembers: number;
        maxLists: number;
        maxItemsPerList: number;
        maxStorageMB: number;
    };
    metrics: {
        currentMembers: number;
        currentLists: number;
        currentStorageMB: number;
    };
    isLifetime: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface AccountMember {
    uid: string;
    accountId: string;
    role: UserRole;
    status: MemberStatus;
    invitedBy: string;
    invitedAt: Timestamp;
    joinedAt?: Timestamp | null;
    suspendedAt?: Timestamp | null;
    suspendedBy?: string | null;
}

export interface UserDoc {
    uid: string;
    email: string;
    name: string;
    photoURL?: string | null;
    bio?: string;
    defaultAccountId?: string | null;
    isActive: boolean;
    isMaster: boolean;
    consents: {
        termsAccepted: boolean;
        privacyAccepted: boolean;
        marketingAccepted: boolean;
        acceptedAt?: Timestamp | null;
    };
    supportFlags: {
        canAccessAllAccounts: boolean;
        canModifyPlans: boolean;
        canViewAudits: boolean;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Invitation {
    token: string;
    accountId: string;
    email: string;
    role: UserRole;
    status: InvitationStatus;
    invitedBy: string;
    invitedByName: string;
    accountName: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    acceptedAt?: Timestamp | null;
    acceptedBy?: string | null;
}

export interface AuditLog {
    id: string;
    accountId?: string | null;
    action: string;
    performedBy: string;
    performedByName: string;
    targetType: "account" | "member" | "invitation" | "plan" | "list" | "user";
    targetId: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Timestamp;
}

export interface CustomClaims {
    role?: UserRole;
    accountIds?: string[];
    defaultAccountId?: string;
    master?: boolean;
}

export interface ShoppingList {
    id: string;
    accountId: string;
    name: string;
    description?: string | null;
    createdBy: string;
    createdByName?: string;
    createdByPhoto?: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}


