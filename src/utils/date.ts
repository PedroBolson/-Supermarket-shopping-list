export function formatDate(date: Date | null | undefined): string {
    if (!date) return 'N/A'
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export function formatDateTime(date: Date | null | undefined): string {
    if (!date) return 'N/A'
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

