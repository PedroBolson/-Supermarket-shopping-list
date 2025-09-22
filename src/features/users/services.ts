import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import type { DocumentData, QueryDocumentSnapshot, Unsubscribe } from 'firebase/firestore'
import { db } from '../../config/firebase'
import type { UserProfile } from '../../types'

const usersCollection = collection(db, 'users')

function mapUser(docSnapshot: QueryDocumentSnapshot<DocumentData>): UserProfile {
  const data = docSnapshot.data()

  return {
    uid: docSnapshot.id,
    name: data.name ?? '',
    email: data.email ?? '',
    photoURL: data.photoURL ?? null,
    isActive: Boolean(data.isActive),
    bio: data.bio ?? '',
    createdAt: data.createdAt?.toDate?.() ?? undefined,
    updatedAt: data.updatedAt?.toDate?.() ?? undefined,
  }
}

export function listenUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
  const usersQuery = query(usersCollection, orderBy('createdAt', 'desc'))
  return onSnapshot(usersQuery, (snapshot) => {
    const users = snapshot.docs.map(mapUser)
    callback(users)
  })
}

export async function setUserActive(uid: string, isActive: boolean) {
  const userDoc = doc(db, 'users', uid)
  await updateDoc(userDoc, {
    isActive,
    updatedAt: serverTimestamp(),
  })
}

export async function updateUserName(uid: string, name: string) {
  const userDoc = doc(db, 'users', uid)
  await updateDoc(userDoc, {
    name,
    updatedAt: serverTimestamp(),
  })
}
