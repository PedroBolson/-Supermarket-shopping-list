export type UserProfile = {
  uid: string
  email: string
  name: string
  photoURL?: string | null
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
  bio?: string
}
