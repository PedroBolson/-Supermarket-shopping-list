import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import type { DocumentData, QueryDocumentSnapshot, Unsubscribe } from 'firebase/firestore'
import { db } from '../../config/firebase'
import type { ShoppingList, ShoppingListItem, UserProfile } from '../../types'

const listsCollection = collection(db, 'lists')

function mapList(docSnapshot: QueryDocumentSnapshot<DocumentData>): ShoppingList {
  const data = docSnapshot.data()

  return {
    id: docSnapshot.id,
    name: data.name ?? 'Lista sem nome',
    description: data.description ?? '',
    createdBy: data.createdBy ?? '',
    createdByName: data.createdByName ?? '',
    createdByPhoto: data.createdByPhoto ?? null,
    createdAt: data.createdAt?.toDate?.() ?? undefined,
    updatedAt: data.updatedAt?.toDate?.() ?? undefined,
  }
}

function mapItem(docSnapshot: QueryDocumentSnapshot<DocumentData>): ShoppingListItem {
  const data = docSnapshot.data()

  return {
    id: docSnapshot.id,
    listId: data.listId ?? '',
    name: data.name ?? '',
    quantity: data.quantity ?? '',
    notes: data.notes ?? '',
    createdBy: data.createdBy ?? '',
    createdByName: data.createdByName ?? '',
    createdByPhoto: data.createdByPhoto ?? null,
    isPurchased: Boolean(data.isPurchased),
    createdAt: data.createdAt?.toDate?.() ?? undefined,
    updatedAt: data.updatedAt?.toDate?.() ?? undefined,
  }
}

export function listenLists(callback: (lists: ShoppingList[]) => void): Unsubscribe {
  const listsQuery = query(listsCollection, orderBy('createdAt', 'desc'))

  return onSnapshot(listsQuery, (snapshot) => {
    const lists = snapshot.docs.map(mapList)
    callback(lists)
  })
}

export function listenListItems(listId: string, callback: (items: ShoppingListItem[]) => void): Unsubscribe {
  const itemsCollection = collection(db, 'lists', listId, 'items')
  const itemsQuery = query(itemsCollection, orderBy('createdAt', 'asc'))

  return onSnapshot(itemsQuery, (snapshot) => {
    const items = snapshot.docs.map(mapItem)
    callback(items)
  })
}

export async function createList(payload: {
  name: string
  description?: string | null
  owner: UserProfile
}) {
  await addDoc(listsCollection, {
    name: payload.name,
    description: payload.description ?? '',
    createdBy: payload.owner.uid,
    createdByName: payload.owner.name,
    createdByPhoto: payload.owner.photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateList(listId: string, payload: { name?: string; description?: string | null }) {
  const listDoc = doc(db, 'lists', listId)
  await updateDoc(listDoc, {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteList(listId: string) {
  const listDoc = doc(db, 'lists', listId)
  const itemsCollection = collection(db, 'lists', listId, 'items')
  const itemsSnapshot = await getDocs(itemsCollection)
  const batch = writeBatch(db)

  itemsSnapshot.forEach((itemDoc) => {
    batch.delete(itemDoc.ref)
  })

  batch.delete(listDoc)

  await batch.commit()
}

export async function createListItem(
  listId: string,
  payload: {
    name: string
    quantity?: string | null
    notes?: string | null
    user: UserProfile
  },
) {
  const itemsCollection = collection(db, 'lists', listId, 'items')

  await addDoc(itemsCollection, {
    listId,
    name: payload.name,
    quantity: payload.quantity ?? '',
    notes: payload.notes ?? '',
    createdBy: payload.user.uid,
    createdByName: payload.user.name,
    createdByPhoto: payload.user.photoURL ?? null,
    isPurchased: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateListItem(
  listId: string,
  itemId: string,
  payload: { name?: string; quantity?: string | null; notes?: string | null },
) {
  const itemDoc = doc(db, 'lists', listId, 'items', itemId)
  await updateDoc(itemDoc, {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export async function toggleItemPurchased(listId: string, itemId: string, purchased: boolean, user: UserProfile) {
  const itemDoc = doc(db, 'lists', listId, 'items', itemId)
  await updateDoc(itemDoc, {
    isPurchased: purchased,
    updatedAt: serverTimestamp(),
    lastUpdatedBy: user.uid,
    lastUpdatedByName: user.name,
    lastUpdatedByPhoto: user.photoURL ?? null,
  })
}

export async function deleteListItem(listId: string, itemId: string) {
  const itemDoc = doc(db, 'lists', listId, 'items', itemId)
  await deleteDoc(itemDoc)
}
