import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

export async function deleteAccount(accountId: string) {
  const deleteAccountFn = httpsCallable(functions, 'deleteAccount')
  return deleteAccountFn({ accountId })
}

export async function deleteUser(userId: string) {
  const deleteUserFn = httpsCallable(functions, 'deleteUser')
  return deleteUserFn({ userId })
}

