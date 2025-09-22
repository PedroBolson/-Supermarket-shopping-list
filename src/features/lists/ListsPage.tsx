import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Plus, Sparkles, Trash2, Edit3, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/use-auth'
import { Avatar, Button, Card, Checkbox, Input, Modal } from '../../components/ui'
import { ConfirmDialog } from '../../components/feedback'
import type { ShoppingList, ShoppingListItem } from '../../types'
import {
  createList,
  createListItem,
  deleteList,
  deleteListItem,
  listenListItems,
  listenLists,
  toggleItemPurchased,
  updateList,
  updateListItem,
} from './services'
import { cn } from '../../utils/cn'
import { useMediaQuery } from '../../hooks/use-media-query'

interface FeedbackMessage {
  type: 'success' | 'error'
  message: string
}

type ListModalState = { mode: 'create' } | { mode: 'edit'; list: ShoppingList }
type ConfirmState =
  | { type: 'list'; listId: string; title: string }
  | { type: 'item'; listId: string; item: ShoppingListItem }

export function ListsPage() {
  const { profile } = useAuth()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemForm, setItemForm] = useState({ name: '', quantity: '', notes: '' })
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemForm, setEditItemForm] = useState({ name: '', quantity: '', notes: '' })
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const [activeView, setActiveView] = useState<'lists' | 'items'>('lists')
  const [listModal, setListModal] = useState<ListModalState | null>(null)
  const [listModalForm, setListModalForm] = useState({ name: '', description: '' })
  const [listModalLoading, setListModalLoading] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    setListLoading(true)
    const unsubscribe = listenLists((data) => {
      setLists(data)
      setListLoading(false)
      setSelectedListId((current) => {
        if (current && data.some((list) => list.id === current)) {
          return current
        }
        return data[0]?.id ?? null
      })
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!selectedListId) {
      setItems([])
      return
    }

    setItemsLoading(true)

    const unsubscribe = listenListItems(selectedListId, (data) => {
      setItems(data)
      setItemsLoading(false)
    })

    return () => unsubscribe()
  }, [selectedListId])

  useEffect(() => {
    if (isLargeScreen) {
      setActiveView('lists')
    }
  }, [isLargeScreen])

  useEffect(() => {
    if (isLargeScreen) {
      return
    }

    setActiveView(selectedListId ? 'items' : 'lists')
  }, [selectedListId, isLargeScreen])

  useEffect(() => {
    if (!listModal) {
      setListModalForm({ name: '', description: '' })
      return
    }

    if (listModal.mode === 'edit') {
      setListModalForm({ name: listModal.list.name, description: listModal.list.description ?? '' })
    } else {
      setListModalForm({ name: '', description: '' })
    }
  }, [listModal])

  const selectedList = useMemo(
    () => lists.find((list) => list.id === selectedListId) ?? null,
    [lists, selectedListId],
  )

  const purchasedCount = useMemo(() => items.filter((item) => item.isPurchased).length, [items])
  const showListsPanel = isLargeScreen || activeView === 'lists'
  const showItemsPanel = isLargeScreen || activeView === 'items'

  const handleSubmitListModal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile || !listModal) return

    if (!listModalForm.name.trim()) {
      setFeedback({ type: 'error', message: 'O nome da lista é obrigatório.' })
      return
    }

    try {
      setListModalLoading(true)
      if (listModal.mode === 'create') {
        await createList({
          name: listModalForm.name.trim(),
          description: listModalForm.description.trim(),
          owner: profile,
        })
        setFeedback({ type: 'success', message: 'Lista criada com sucesso!' })
      } else {
        await updateList(listModal.list.id, {
          name: listModalForm.name.trim(),
          description: listModalForm.description.trim(),
        })
        setFeedback({ type: 'success', message: 'Lista atualizada com sucesso.' })
      }
      setListModal(null)
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Não foi possível salvar a lista.' })
    } finally {
      setListModalLoading(false)
    }
  }

  const handleAddItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile || !selectedListId) return

    if (!itemForm.name.trim()) {
      setFeedback({ type: 'error', message: 'Informe o nome do item.' })
      return
    }

    try {
      setFeedback(null)
      await createListItem(selectedListId, {
        name: itemForm.name.trim(),
        quantity: itemForm.quantity.trim(),
        notes: itemForm.notes.trim(),
        user: profile,
      })
      setItemForm({ name: '', quantity: '', notes: '' })
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Não foi possível adicionar o item.' })
    }
  }

  const handleToggleItem = async (item: ShoppingListItem) => {
    if (!profile || !selectedListId) return
    try {
      await toggleItemPurchased(selectedListId, item.id, !item.isPurchased, profile)
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Erro ao atualizar o item.' })
    }
  }

  const handleStartEditItem = (item: ShoppingListItem) => {
    setEditingItemId(item.id)
    setEditItemForm({ name: item.name, quantity: item.quantity ?? '', notes: item.notes ?? '' })
  }

  const handleUpdateItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedListId || !editingItemId) return

    try {
      await updateListItem(selectedListId, editingItemId, {
        name: editItemForm.name.trim(),
        quantity: editItemForm.quantity.trim(),
        notes: editItemForm.notes.trim(),
      })
      setEditingItemId(null)
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Não foi possível atualizar o item.' })
    }
  }

  const openCreateListModal = () => setListModal({ mode: 'create' })
  const openEditListModal = () => {
    if (!selectedList) return
    setListModal({ mode: 'edit', list: selectedList })
  }

  const requestDeleteList = () => {
    if (!selectedList) return
    setConfirmState({ type: 'list', listId: selectedList.id, title: selectedList.name })
  }

  const requestDeleteItem = (item: ShoppingListItem) => {
    if (!selectedListId) return
    setConfirmState({ type: 'item', listId: selectedListId, item })
  }

  const handleConfirmDelete = async () => {
    if (!confirmState) return
    setConfirmLoading(true)
    try {
      if (confirmState.type === 'list') {
        await deleteList(confirmState.listId)
        setFeedback({ type: 'success', message: 'Lista removida com sucesso.' })
      } else {
        await deleteListItem(confirmState.listId, confirmState.item.id)
      }
      setConfirmState(null)
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Não foi possível concluir a exclusão.' })
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <motion.h1
            className="text-3xl font-semibold text-foreground md:text-4xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Listas de compras
          </motion.h1>
          <p className="text-sm text-muted">
            Gerencie listas e itens em tempo real com aprovação visual de cada ação.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {!isLargeScreen && activeView === 'items' ? (
            <Button variant="ghost" size="sm" onClick={() => setActiveView('lists')}>
              <ArrowLeft className="h-4 w-4" />
              Listas
            </Button>
          ) : null}
          {(isLargeScreen || activeView === 'lists') && (
            <Button onClick={openCreateListModal} variant="outline" className="self-start md:self-auto">
              <Plus className="h-4 w-4" />
              Nova lista
            </Button>
          )}
        </div>
      </header>

      {feedback ? (
        <motion.div
          className={cn(
            'rounded-3xl border border-border/50 bg-card/70 px-4 py-3 text-sm',
            feedback.type === 'error' ? 'text-danger-500' : 'text-success-500',
          )}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
        >
          {feedback.message}
        </motion.div>
      ) : null}

      <div
        className={cn(
          'grid gap-6',
          isLargeScreen ? 'xl:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] xl:items-start' : 'grid-cols-1',
        )}
      >
        {showListsPanel ? (
          <Card
            className={cn(
              'flex flex-col gap-5',
              isLargeScreen && 'xl:max-h-[calc(100vh-260px)] xl:min-h-0',
              !isLargeScreen && activeView !== 'lists' && 'hidden',
            )}
          >
            <div className="flex flex-shrink-0 items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Listas</h2>
              {listLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary-500" /> : null}
            </div>

            <div
              className={cn(
                'space-y-3',
                isLargeScreen && 'xl:flex-1 xl:min-h-0 xl:overflow-y-auto xl:pr-1',
              )}
              style={isLargeScreen ? { maxHeight: 'calc(100vh - 340px)' } : undefined}
            >
              <AnimatePresence>
                {lists.map((list) => {
                  const isActive = list.id === selectedListId
                  return (
                    <motion.button
                      key={list.id}
                      onClick={() => {
                        setSelectedListId(list.id)
                        if (!isLargeScreen) {
                          setActiveView('items')
                        }
                      }}
                      className="relative w-full rounded-2xl border border-border/40 bg-card p-4 text-left transition hover:border-primary-300/60"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="list-active"
                          className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary-500/25 via-primary-500/10 to-transparent"
                          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                        />
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{list.name}</h3>
                          {list.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted">{list.description}</p>
                          ) : null}
                        </div>
                        <Avatar src={list.createdByPhoto ?? null} alt={list.createdByName} size="sm" />
                      </div>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
              {!lists.length && !listLoading ? (
                <div className="rounded-2xl border border-dashed border-border/40 p-6 text-center text-sm text-muted">
                  Nenhuma lista cadastrada. Que tal criar a primeira?
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}

        {showItemsPanel ? (
          <Card
            className={cn(
              'flex flex-col space-y-6',
              isLargeScreen && 'xl:flex-1 xl:min-h-0 xl:max-h-[calc(100vh-240px)]',
              !isLargeScreen && activeView !== 'items' && 'hidden',
            )}
          >
            {selectedList ? (
              <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{selectedList.name}</h2>
                    {selectedList.description ? (
                      <p className="mt-1 text-sm text-muted">{selectedList.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={openEditListModal}>
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-500 hover:text-danger-600"
                      onClick={requestDeleteList}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <StatusCard title="Itens" value={items.length} subtitle="Total" />
                  <StatusCard title="Comprados" value={purchasedCount} subtitle="Finalizados" />
                  <StatusCard title="Pendentes" value={items.length - purchasedCount} subtitle="Restantes" />
                </div>

                <form className="grid gap-4 rounded-2xl border border-border/40 bg-card p-4" onSubmit={handleAddItem}>
                  <div className="grid gap-4 md:grid-cols-[2fr_repeat(2,_1fr)]">
                    <Input
                      label="Novo item"
                      placeholder="O que vamos comprar?"
                      value={itemForm.name}
                      onChange={(event) => setItemForm((state) => ({ ...state, name: event.target.value }))}
                      required
                    />
                    <Input
                      label="Quantidade"
                      placeholder="Ex: 2kg"
                      value={itemForm.quantity}
                      onChange={(event) =>
                        setItemForm((state) => ({ ...state, quantity: event.target.value }))
                      }
                    />
                    <Input
                      label="Observações"
                      placeholder="Detalhes importantes"
                      value={itemForm.notes}
                      onChange={(event) => setItemForm((state) => ({ ...state, notes: event.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" size="sm">
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </form>

                <div className="flex flex-1 flex-col overflow-hidden xl:min-h-0">
                  {itemsLoading ? (
                    <div className="mb-3 flex flex-shrink-0 items-center justify-center gap-3 rounded-2xl border border-border/40 p-6 text-sm text-muted">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando itens...
                    </div>
                  ) : null}

                  <div
                    className="flex-1 space-y-3 overflow-y-auto pr-1"
                    style={isLargeScreen ? { maxHeight: 'calc(100vh - 480px)' } : { maxHeight: '50vh' }}
                  >
                    <AnimatePresence>
                      {items.map((item) => {
                        const isEditing = editingItemId === item.id

                        return (
                          <motion.div
                            key={item.id}
                            className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            {isEditing ? (
                              <form className="flex flex-1 flex-col gap-3" onSubmit={handleUpdateItem}>
                                <div className="grid gap-3 sm:grid-cols-[2fr_repeat(2,_1fr)]">
                                  <Input
                                    label="Nome do item"
                                    placeholder="Ex: Leite integral"
                                    value={editItemForm.name}
                                    onChange={(event) =>
                                      setEditItemForm((state) => ({ ...state, name: event.target.value }))
                                    }
                                    required
                                  />
                                  <Input
                                    label="Quantidade"
                                    placeholder="Ex: 2kg, 500ml"
                                    value={editItemForm.quantity}
                                    onChange={(event) =>
                                      setEditItemForm((state) => ({ ...state, quantity: event.target.value }))
                                    }
                                  />
                                  <Input
                                    label="Observações"
                                    placeholder="Marca, detalhes..."
                                    value={editItemForm.notes}
                                    onChange={(event) =>
                                      setEditItemForm((state) => ({ ...state, notes: event.target.value }))
                                    }
                                  />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button type="submit" size="sm">
                                    Salvar
                                  </Button>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingItemId(null)}>
                                    Cancelar
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                <div className="flex items-center gap-3">
                                  <Checkbox checked={item.isPurchased} onChange={() => handleToggleItem(item)} />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      {item.name}
                                      {item.quantity ? (
                                        <span className="ml-2 text-xs font-normal text-muted">{item.quantity}</span>
                                      ) : null}
                                    </p>
                                    {item.notes ? (
                                      <p className="text-xs text-muted">{item.notes}</p>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="flex flex-1 items-center justify-end gap-3">
                                  <div className="flex items-center gap-2 text-xs text-muted">
                                    <Avatar src={item.createdByPhoto ?? null} alt={item.createdByName} size="sm" />
                                    <span>{item.createdByName}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleStartEditItem(item)}>
                                      Editar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-danger-500 hover:text-danger-600"
                                      onClick={() => requestDeleteItem(item)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

                    {!items.length && !itemsLoading ? (
                      <div className="rounded-2xl border border-dashed border-border/40 p-8 text-center text-sm text-muted">
                        Comece adicionando os itens desta lista.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted">
                <Sparkles className="h-8 w-8 text-primary-300" />
                <p>Selecione uma lista para visualizar os itens.</p>
              </div>
            )}
          </Card>
        ) : null}
      </div>

      <Modal
        open={Boolean(listModal)}
        onClose={() => (!listModalLoading ? setListModal(null) : undefined)}
        title={listModal?.mode === 'edit' ? 'Editar lista' : 'Nova lista'}
        description={listModal?.mode === 'edit'
          ? 'Atualize o nome e a descrição da lista selecionada.'
          : 'Crie uma nova lista para organizar suas compras.'}
      >
        <form className="space-y-4" onSubmit={handleSubmitListModal}>
          <Input
            label="Nome da lista"
            placeholder="Ex: Compras da semana"
            value={listModalForm.name}
            onChange={(event) => setListModalForm((form) => ({ ...form, name: event.target.value }))}
            required
          />
          <Input
            label="Descrição"
            placeholder="Detalhes adicionais"
            value={listModalForm.description}
            onChange={(event) => setListModalForm((form) => ({ ...form, description: event.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setListModal(null)} disabled={listModalLoading}>
              Cancelar
            </Button>
            <Button type="submit" loading={listModalLoading}>
              {listModal?.mode === 'edit' ? 'Salvar alterações' : 'Criar lista'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmState)}
        onCancel={() => (!confirmLoading ? setConfirmState(null) : undefined)}
        onConfirm={handleConfirmDelete}
        loading={confirmLoading}
        title={confirmState?.type === 'item' ? 'Remover item' : 'Remover lista'}
        description={
          confirmState?.type === 'item'
            ? `Deseja remover "${confirmState.item.name}" desta lista?`
            : `Deseja remover a lista "${confirmState?.title ?? ''}"? Essa ação excluirá todos os itens associados.`
        }
        confirmLabel="Remover"
        cancelLabel="Cancelar"
      />
    </div>
  )
}

type StatusCardProps = {
  title: string
  value: number
  subtitle: string
}

function StatusCard({ title, value, subtitle }: StatusCardProps) {
  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/40 via-card/30 to-card/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{subtitle}</p>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-3xl font-semibold text-foreground">{value}</span>
        <span className="text-sm text-muted">{title}</span>
      </div>
    </div>
  )
}
