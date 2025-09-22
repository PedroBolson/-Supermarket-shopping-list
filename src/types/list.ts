export type ShoppingList = {
  id: string
  name: string
  description?: string | null
  createdBy: string
  createdByName?: string
  createdByPhoto?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export type ShoppingListItem = {
  id: string
  listId: string
  name: string
  quantity?: string | null
  notes?: string | null
  createdBy: string
  createdByName?: string
  createdByPhoto?: string | null
  isPurchased: boolean
  purchasedBy?: string | null
  purchasedByName?: string | null
  purchasedByPhoto?: string | null
  purchasedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}
