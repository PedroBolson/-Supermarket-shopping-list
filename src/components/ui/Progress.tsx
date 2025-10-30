import { cn } from '../../utils/cn'

type ProgressProps = {
    value: number
    max?: number
    className?: string
    showLabel?: boolean
}

export function Progress({ value, max = 100, className, showLabel = false }: ProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const getColor = () => {
        if (percentage >= 90) return 'bg-red-500'
        if (percentage >= 75) return 'bg-yellow-500'
        return 'bg-blue-500'
    }

    return (
        <div className={cn('w-full', className)}>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                    className={cn('h-full transition-all duration-300', getColor())}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {value} / {max} ({percentage.toFixed(0)}%)
                </div>
            )}
        </div>
    )
}


