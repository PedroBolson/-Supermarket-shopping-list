import { useState } from 'react'
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { TextArea } from '../../../components/ui/TextArea'
import { usePlans } from '../../../hooks/use-plans'
import type { Plan } from '../../../types'
import { Edit3, Plus } from 'lucide-react'

export function MasterPlansManager() {
    const { plans, loading } = usePlans()
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        price: 0,
        interval: 'monthly' as 'monthly' | 'yearly' | 'lifetime',
        maxMembers: 0,
        maxLists: 0,
        maxItemsPerList: 0,
        maxStorageMB: 0,
        features: [] as string[],
        isActive: true,
        order: 0,
    })

    const [newFeature, setNewFeature] = useState('')

    const openEditModal = (plan: Plan) => {
        setSelectedPlan(plan)
        setFormData({
            id: plan.id,
            name: plan.name,
            description: plan.description || '',
            price: plan.price,
            interval: plan.interval,
            maxMembers: plan.limits.maxMembers,
            maxLists: plan.limits.maxLists,
            maxItemsPerList: plan.limits.maxItemsPerList,
            maxStorageMB: plan.limits.maxStorageMB,
            features: [...plan.features],
            isActive: plan.isActive,
            order: plan.order,
        })
        setIsEditing(true)
    }

    const openCreateModal = () => {
        setFormData({
            id: '',
            name: '',
            description: '',
            price: 0,
            interval: 'monthly',
            maxMembers: 5,
            maxLists: 10,
            maxItemsPerList: 50,
            maxStorageMB: 100,
            features: [],
            isActive: true,
            order: plans.length + 1,
        })
        setIsCreating(true)
    }

    const handleAddFeature = () => {
        if (newFeature.trim()) {
            setFormData((prev) => ({
                ...prev,
                features: [...prev.features, newFeature.trim()],
            }))
            setNewFeature('')
        }
    }

    const handleRemoveFeature = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index),
        }))
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Nome do plano é obrigatório')
            return
        }

        setActionLoading(true)
        try {
            const planData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: formData.price,
                interval: formData.interval,
                limits: {
                    maxMembers: formData.maxMembers,
                    maxLists: formData.maxLists,
                    maxItemsPerList: formData.maxItemsPerList,
                    maxStorageMB: formData.maxStorageMB,
                },
                features: formData.features,
                isActive: formData.isActive,
                order: formData.order,
                updatedAt: new Date(),
            }

            if (isEditing && selectedPlan) {
                // Atualizar plano existente
                await updateDoc(doc(db, 'plans', selectedPlan.id), planData)
            } else if (isCreating) {
                // Criar novo plano
                await addDoc(collection(db, 'plans'), {
                    ...planData,
                    createdAt: new Date(),
                })
            }

            setIsEditing(false)
            setIsCreating(false)
            setSelectedPlan(null)
        } catch (error) {
            console.error('Erro ao salvar plano:', error)
            alert('Erro ao salvar plano')
        } finally {
            setActionLoading(false)
        }
    }

    const handleToggleActive = async (plan: Plan) => {
        if (!confirm(`Deseja ${plan.isActive ? 'desativar' : 'ativar'} o plano "${plan.name}"?`)) {
            return
        }

        try {
            await updateDoc(doc(db, 'plans', plan.id), {
                isActive: !plan.isActive,
                updatedAt: new Date(),
            })
        } catch (error) {
            console.error('Erro ao atualizar status do plano:', error)
            alert('Erro ao atualizar status do plano')
        }
    }

    if (loading) {
        return <div className="text-center">Carregando planos...</div>
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Gerenciar Planos</h2>
                    <Button onClick={openCreateModal} size="sm">
                        <Plus className="h-4 w-4" />
                        Novo Plano
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <Card key={plan.id} className="p-4">
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{plan.name}</h3>
                                            <Badge variant={plan.isActive ? 'success' : 'error'}>
                                                {plan.isActive ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            {plan.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Preço:</span>
                                        <span className="font-medium">
                                            {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                                            {plan.price > 0 && (
                                                <span className="text-xs text-gray-500">
                                                    {' '}/ {plan.interval === 'monthly' ? 'mês' : plan.interval === 'yearly' ? 'ano' : 'vitalício'}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Membros:</span>
                                        <span className="font-medium">{plan.limits.maxMembers}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Listas:</span>
                                        <span className="font-medium">{plan.limits.maxLists}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Itens/lista:</span>
                                        <span className="font-medium">{plan.limits.maxItemsPerList}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Storage:</span>
                                        <span className="font-medium">{plan.limits.maxStorageMB} MB</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openEditModal(plan)}
                                        className="flex-1"
                                    >
                                        <Edit3 className="h-3 w-3" />
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleToggleActive(plan)}
                                        className={plan.isActive ? 'text-red-600' : 'text-green-600'}
                                    >
                                        {plan.isActive ? 'Desativar' : 'Ativar'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Modal: Editar/Criar Plano */}
            <Modal
                isOpen={isEditing || isCreating}
                onClose={() => {
                    setIsEditing(false)
                    setIsCreating(false)
                    setSelectedPlan(null)
                }}
                title={isEditing ? 'Editar Plano' : 'Criar Novo Plano'}
            >
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Input
                            label="Nome do Plano"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            required
                        />
                        <Input
                            label="Preço (R$)"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                            }
                        />
                    </div>

                    <TextArea
                        label="Descrição"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={2}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Intervalo</label>
                            <select
                                value={formData.interval}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        interval: e.target.value as 'monthly' | 'yearly' | 'lifetime',
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="monthly">Mensal</option>
                                <option value="yearly">Anual</option>
                                <option value="lifetime">Vitalício</option>
                            </select>
                        </div>
                        <Input
                            label="Ordem"
                            type="number"
                            value={formData.order}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))
                            }
                        />
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="mb-3 font-medium">Limites</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input
                                label="Máx. Membros"
                                type="number"
                                value={formData.maxMembers}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, maxMembers: parseInt(e.target.value) || 0 }))
                                }
                            />
                            <Input
                                label="Máx. Listas"
                                type="number"
                                value={formData.maxLists}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, maxLists: parseInt(e.target.value) || 0 }))
                                }
                            />
                            <Input
                                label="Itens por Lista"
                                type="number"
                                value={formData.maxItemsPerList}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        maxItemsPerList: parseInt(e.target.value) || 0,
                                    }))
                                }
                            />
                            <Input
                                label="Storage (MB)"
                                type="number"
                                value={formData.maxStorageMB}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        maxStorageMB: parseInt(e.target.value) || 0,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="mb-3 font-medium">Features</h3>
                        <div className="space-y-2">
                            {formData.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="flex-1 text-sm">{feature}</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemoveFeature(index)}
                                        className="text-red-600"
                                    >
                                        Remover
                                    </Button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nova feature"
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddFeature()
                                        }
                                    }}
                                />
                                <Button onClick={handleAddFeature} size="sm">
                                    Adicionar
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                            className="h-4 w-4"
                        />
                        <label htmlFor="isActive" className="text-sm">
                            Plano ativo (visível para usuários)
                        </label>
                    </div>

                    <div className="flex gap-2 border-t pt-4">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsEditing(false)
                                setIsCreating(false)
                                setSelectedPlan(null)
                            }}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={actionLoading} className="flex-1">
                            {actionLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Plano'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

