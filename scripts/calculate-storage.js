const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'lista-compra-mercado.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function calculateStorageForAllAccounts() {
    console.log('\n📊 Calculando storage retroativo para todas as contas...\n');

    try {
        // 1. Buscar todas as contas
        const accountsSnapshot = await db.collection('accounts').get();

        if (accountsSnapshot.empty) {
            console.log('⚠️  Nenhuma conta encontrada.');
            return;
        }

        // 2. Para cada conta
        for (const accountDoc of accountsSnapshot.docs) {
            const accountId = accountDoc.id;
            const accountData = accountDoc.data();

            console.log(`\n📋 Conta: ${accountData.name} (${accountId})`);

            let totalStorageMB = 0;

            // Calcular storage dos arquivos em accounts/{accountId}/
            const [accountFiles] = await bucket.getFiles({ prefix: `accounts/${accountId}/` });

            if (accountFiles.length > 0) {
                for (const file of accountFiles) {
                    const [metadata] = await file.getMetadata();
                    const sizeInMB = parseInt(metadata.size) / (1024 * 1024);
                    totalStorageMB += sizeInMB;
                }
                console.log(`   📁 Arquivos da conta: ${accountFiles.length} arquivos, ${totalStorageMB.toFixed(2)} MB`);
            }

            // Buscar todos os UIDs associados a esta conta
            const associatedUIDs = new Set();

            // 1. Adicionar o titular
            if (accountData.titularId) {
                associatedUIDs.add(accountData.titularId);
            }

            // 2. Adicionar membros da subcoleção
            const membersSnapshot = await db.collection('accounts').doc(accountId).collection('members').get();
            membersSnapshot.docs.forEach(doc => {
                associatedUIDs.add(doc.id);
            });

            // 3. Buscar usuários que tenham este accountId como defaultAccountId
            const usersSnapshot = await db.collection('users').where('defaultAccountId', '==', accountId).get();
            usersSnapshot.docs.forEach(doc => {
                associatedUIDs.add(doc.id);
            });

            console.log(`   👥 Usuários vinculados: ${associatedUIDs.size}`);

            // Calcular storage dos avatares de todos os usuários vinculados
            if (associatedUIDs.size > 0) {
                let avatarsCount = 0;
                let avatarsSizeMB = 0;

                for (const uid of associatedUIDs) {
                    const [avatarFiles] = await bucket.getFiles({ prefix: `avatars/${uid}/` });

                    if (avatarFiles.length > 0) {
                        for (const file of avatarFiles) {
                            const [metadata] = await file.getMetadata();
                            const sizeInMB = parseInt(metadata.size) / (1024 * 1024);
                            avatarsSizeMB += sizeInMB;
                            avatarsCount++;
                        }
                    }
                }

                if (avatarsCount > 0) {
                    console.log(`   🖼️  Avatares: ${avatarsCount} arquivos, ${avatarsSizeMB.toFixed(2)} MB`);
                    totalStorageMB += avatarsSizeMB;
                }
            }

            // 3. Atualizar o valor no Firestore
            if (totalStorageMB > 0) {
                await db.collection('accounts').doc(accountId).update({
                    'metrics.currentStorageMB': totalStorageMB,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`   ✅ Total calculado e atualizado: ${totalStorageMB.toFixed(2)} MB`);
            } else {
                console.log(`   ℹ️  Nenhum arquivo encontrado`);
            }
        }

        console.log('\n✅ Cálculo retroativo concluído!\n');

    } catch (error) {
        console.error('\n❌ Erro ao calcular storage:', error);
    } finally {
        process.exit(0);
    }
}

calculateStorageForAllAccounts();
