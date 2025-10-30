export { setupNewUser } from "./triggers/auth";

export {
    sendInvitation,
    acceptInvitation,
    revokeInvitation,
} from "./functions/invitations";

export {
    suspendMember,
    removeMember,
    transferOwnership,
} from "./functions/members";

export {
    switchPlan,
    grantLifetimeAccess,
    updateAccountLimits,
} from "./functions/plans";

export {
    promoteToMaster,
    demoteFromMaster,
    suspendAccount,
} from "./functions/admin";

export {
    checkExpiredAccounts,
    checkExpiredInvitations,
} from "./scheduled/expiry";

export {
    createAccountManually,
    addUserToAccountManually,
    removeUserFromAccountManually,
} from "./functions/master";

// Account management
export { deleteAccount, deleteUser } from "./functions/accounts";

// Storage triggers
export { onFileUploaded, onFileDeleted } from "./triggers/storage";
