export type UserProfile = {
  uid: string
  email: string
  name: string
  photoURL?: string | null
  bio?: string
  defaultAccountId?: string | null
  isActive: boolean
  isMaster: boolean
  consents: {
    termsAccepted: boolean
    privacyAccepted: boolean
    marketingAccepted: boolean
    acceptedAt?: Date | null
  }
  supportFlags: {
    canAccessAllAccounts: boolean
    canModifyPlans: boolean
    canViewAudits: boolean
  }
  createdAt?: Date
  updatedAt?: Date
}
