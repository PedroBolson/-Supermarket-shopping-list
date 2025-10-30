import * as admin from "firebase-admin";

admin.initializeApp();

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export const INVITATION_EXPIRY_DAYS = 7;
export const FREE_PLAN_ID = "free";
export const DEFAULT_PLAN_LIMITS = {
    maxMembers: 5,
    maxLists: 10,
    maxItemsPerList: 50,
    maxStorageMB: 100,
};


