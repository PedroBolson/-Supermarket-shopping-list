import { Users, List, HardDrive } from 'lucide-react'
import { Card } from '../ui/Card'
import { Progress } from '../ui/Progress'
import { usePlanLimits } from '../../hooks/use-plan-limits'

export function LimitsCard() {
    const { membersUsage, listsUsage, storageUsage } = usePlanLimits()

    if (!membersUsage || !listsUsage || !storageUsage) {
        return null
    }

    return (
        <Card>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold">Uso do Plano</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Acompanhe o uso dos recursos da sua conta
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Membros</span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {membersUsage.current} / {membersUsage.max}
                            </span>
                        </div>
                        <Progress value={membersUsage.current} max={membersUsage.max} />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <List className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Listas</span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {listsUsage.current} / {listsUsage.max}
                            </span>
                        </div>
                        <Progress value={listsUsage.current} max={listsUsage.max} />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Armazenamento</span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {storageUsage.current.toFixed(1)} / {storageUsage.max} MB
                            </span>
                        </div>
                        <Progress value={storageUsage.current} max={storageUsage.max} />
                    </div>
                </div>
            </div>
        </Card>
    )
}


