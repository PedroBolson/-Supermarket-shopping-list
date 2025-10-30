const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixAccountMetrics() {
    console.log('🔧 Recalculando métricas das contas...\n');

    try {
        const accountsSnapshot = await db.collection('accounts').get();

        if (accountsSnapshot.empty) {
            console.log('⚠️  Nenhuma conta encontrada');
            process.exit(0);
        }

        console.log(`📦 Encontradas ${accountsSnapshot.size} contas\n`);

        const batch = db.batch();
        let updatedCount = 0;

        for (const accountDoc of accountsSnapshot.docs) {
            const accountId = accountDoc.id;
            const accountData = accountDoc.data();

            console.log(`📊 Processando: ${accountData.name || accountId}`);

            // 1. Contar membros
            const membersSnapshot = await db
                .collection('accounts')
                .doc(accountId)
                .collection('members')
                .where('status', '==', 'active')
                .get();

            const currentMembers = membersSnapshot.size;

            // 2. Contar listas
            const listsSnapshot = await db
                .collection('lists')
                .where('accountId', '==', accountId)
                .get();

            const currentLists = listsSnapshot.size;

            // 3. Calcular storage (placeholder - pode implementar depois)
            const currentStorageMB = accountData.metrics?.currentStorageMB || 0;

            // 4. Atualizar metrics
            const newMetrics = {
                currentMembers,
                currentLists,
                currentStorageMB,
            };

            const oldMetrics = accountData.metrics || {};

            // Verificar se mudou
            const needsUpdate =
                oldMetrics.currentMembers !== currentMembers ||
                oldMetrics.currentLists !== currentLists;

            if (needsUpdate) {
                batch.update(accountDoc.ref, {
                    metrics: newMetrics,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                console.log(`   ✅ Atualizado: Membros ${oldMetrics.currentMembers || 0} → ${currentMembers}, Listas ${oldMetrics.currentLists || 0} → ${currentLists}`);
                updatedCount++;
            } else {
                console.log(`   ⏭️  Já está correto (Membros: ${currentMembers}, Listas: ${currentLists})`);
            }
        }

        if (updatedCount > 0) {
            console.log(`\n💾 Salvando alterações...`);
            await batch.commit();
            console.log(`✅ ${updatedCount} conta(s) atualizada(s)`);
        } else {
            console.log(`\n✅ Todas as contas já estavam corretas!`);
        }

    } catch (error) {
        console.error('\n❌ Erro ao recalcular métricas:', error);
        process.exit(1);
    }

    process.exit(0);
}

fixAccountMetrics();

