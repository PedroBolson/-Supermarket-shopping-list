import { onObjectFinalized, onObjectDeleted } from 'firebase-functions/v2/storage'
import { db } from '../config'
import { FieldValue } from 'firebase-admin/firestore'
import { logAudit } from '../utils/audit'

async function getAccountIdFromPath(filePath: string): Promise<string | null> {
    const parts = filePath.split('/')

    // Caso 1: accounts/{accountId}/...
    if (parts.length >= 2 && parts[0] === 'accounts') {
        return parts[1]
    }

    // Caso 2: avatars/{uid}/...
    if (parts.length >= 2 && parts[0] === 'avatars') {
        const uid = parts[1]
        try {
            const userDoc = await db.collection('users').doc(uid).get()
            if (userDoc.exists) {
                const userData = userDoc.data()
                return userData?.defaultAccountId || null
            }
        } catch (error) {
            console.error(`Erro ao buscar defaultAccountId para usuário ${uid}:`, error)
            return null
        }
    }

    return null
}

export const onFileUploaded = onObjectFinalized({ region: 'us-east1' }, async (event) => {
    const file = event.data
    if (!file || !file.name || !file.size) {
        return null
    }

    const accountId = await getAccountIdFromPath(file.name)
    if (!accountId) {
        console.log(`Arquivo ${file.name} não pertence a uma conta. Ignorando.`)
        return null
    }

    const fileSizeMB = file.size / (1024 * 1024)

    try {
        await db.collection('accounts').doc(accountId).update({
            'metrics.currentStorageMB': FieldValue.increment(fileSizeMB),
            updatedAt: FieldValue.serverTimestamp(),
        })
        await logAudit(
            'storage_file_uploaded',
            'system',
            'System',
            'account',
            accountId,
            { fileName: file.name, fileSizeMB, change: 'increment' },
            accountId,
        )
        console.log(`Storage da conta ${accountId} incrementado em ${fileSizeMB.toFixed(2)} MB.`)
    } catch (error) {
        console.error(`Erro ao atualizar storage da conta ${accountId} no upload:`, error)
        await logAudit(
            'storage_file_uploaded_error',
            'system',
            'System',
            'account',
            accountId,
            { fileName: file.name, fileSizeMB, error: String(error), change: 'increment' },
            accountId,
        )
    }
    return null
})

export const onFileDeleted = onObjectDeleted({ region: 'us-east1' }, async (event) => {
    const file = event.data
    if (!file || !file.name || !file.size) {
        return null
    }

    const accountId = await getAccountIdFromPath(file.name)
    if (!accountId) {
        console.log(`Arquivo ${file.name} não pertence a uma conta. Ignorando.`)
        return null
    }

    const fileSizeMB = file.size / (1024 * 1024)

    try {
        await db.collection('accounts').doc(accountId).update({
            'metrics.currentStorageMB': FieldValue.increment(-fileSizeMB),
            updatedAt: FieldValue.serverTimestamp(),
        })
        await logAudit(
            'storage_file_deleted',
            'system',
            'System',
            'account',
            accountId,
            { fileName: file.name, fileSizeMB, change: 'decrement' },
            accountId,
        )
        console.log(`Storage da conta ${accountId} decrementado em ${fileSizeMB.toFixed(2)} MB.`)
    } catch (error) {
        console.error(`Erro ao atualizar storage da conta ${accountId} na exclusão:`, error)
        await logAudit(
            'storage_file_deleted_error',
            'system',
            'System',
            'account',
            accountId,
            { fileName: file.name, fileSizeMB, error: String(error), change: 'decrement' },
            accountId,
        )
    }
    return null
})
