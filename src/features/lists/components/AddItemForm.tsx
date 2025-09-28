import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Input } from '../../../components/ui'

interface ItemFormData {
    name: string
    quantity: string
    notes: string
}

interface AddItemFormProps {
    onSubmit: (data: ItemFormData) => Promise<void>
    isLoading?: boolean
}

export function AddItemForm({ onSubmit, isLoading = false }: AddItemFormProps) {
    const [formData, setFormData] = useState<ItemFormData>({
        name: '',
        quantity: '',
        notes: ''
    })

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!formData.name.trim()) {
            return
        }

        try {
            await onSubmit({
                name: formData.name.trim(),
                quantity: formData.quantity.trim(),
                notes: formData.notes.trim()
            })

            // Reset form on success
            setFormData({ name: '', quantity: '', notes: '' })
        } catch (error) {
            // Error handling is done by parent component
            console.error('Error adding item:', error)
        }
    }

    const updateField = (field: keyof ItemFormData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <form
            className="grid gap-4 rounded-2xl border border-border/40 bg-card p-4"
            onSubmit={handleSubmit}
        >
            <div className="grid gap-4 md:grid-cols-[2fr_repeat(2,_1fr)]">
                <Input
                    label="Novo item"
                    placeholder="O que vamos comprar?"
                    value={formData.name}
                    onChange={(event) => updateField('name')(event.target.value)}
                    required
                    disabled={isLoading}
                />
                <Input
                    label="Quantidade"
                    placeholder="Ex: 2kg"
                    value={formData.quantity}
                    onChange={(event) => updateField('quantity')(event.target.value)}
                    disabled={isLoading}
                />
                <Input
                    label="Observações"
                    placeholder="Detalhes importantes"
                    value={formData.notes}
                    onChange={(event) => updateField('notes')(event.target.value)}
                    disabled={isLoading}
                />
            </div>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    size="sm"
                    loading={isLoading}
                >
                    <Plus className="h-4 w-4" />
                    Adicionar
                </Button>
            </div>
        </form>
    )
}