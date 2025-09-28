import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { Input, Button } from '../../../components/ui'
import { cn } from '../../../utils/cn'
import type { ShoppingListItem } from '../../../types'

interface ItemSearchFieldProps {
    items: ShoppingListItem[]
    onItemsFiltered: (filteredItems: ShoppingListItem[]) => void
    className?: string
}

export function ItemSearchField({ items, onItemsFiltered, className }: ItemSearchFieldProps) {
    const [searchTerm, setSearchTerm] = useState('')

    // Filter items based on search term
    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) {
            return items
        }

        const term = searchTerm.toLowerCase().trim()

        return items.filter(item => {
            const matchesName = item.name.toLowerCase().includes(term)
            const matchesQuantity = item.quantity?.toLowerCase().includes(term) || false
            const matchesNotes = item.notes?.toLowerCase().includes(term) || false
            const matchesCreatedBy = item.createdByName?.toLowerCase().includes(term) || false
            const matchesPurchasedBy = item.purchasedByName?.toLowerCase().includes(term) || false

            return matchesName || matchesQuantity || matchesNotes || matchesCreatedBy || matchesPurchasedBy
        })
    }, [items, searchTerm])

    // Notify parent component when filtered items change
    useMemo(() => {
        onItemsFiltered(filteredItems)
    }, [filteredItems, onItemsFiltered])

    const handleClearSearch = () => {
        setSearchTerm('')
    }

    const hasSearchTerm = searchTerm.trim().length > 0
    const resultsCount = filteredItems.length
    const totalCount = items.length

    return (
        <div className={cn('space-y-3 rounded-2xl border border-border/40 bg-card/50 p-4', className)}>
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted">Buscar itens</label>
                <div className="relative">
                    <Input
                        leftAddon={<Search className="h-4 w-4 text-primary-500" />}
                        placeholder="Digite para buscar por nome, quantidade, observações..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={cn(
                            "transition-all duration-200",
                            hasSearchTerm ? "pr-12" : "",
                            "focus:ring-2 focus:ring-primary-200"
                        )}
                    />

                    {hasSearchTerm && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:text-foreground hover:bg-primary-100/50 transition-all duration-200"
                            title="Limpar busca"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {hasSearchTerm && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm">
                        {resultsCount === 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                                ⚠️ Nenhum item encontrado
                            </span>
                        ) : (
                            <span className="text-success-600 dark:text-success-400">
                                ✓ {resultsCount === 1
                                    ? '1 item encontrado'
                                    : `${resultsCount} itens encontrados`
                                }
                                {resultsCount > 0 && totalCount > resultsCount && (
                                    <span className="text-muted ml-1">de {totalCount} total</span>
                                )}
                            </span>
                        )}
                    </div>

                    {resultsCount === 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClearSearch}
                            className="text-xs self-start sm:self-auto"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Limpar
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}