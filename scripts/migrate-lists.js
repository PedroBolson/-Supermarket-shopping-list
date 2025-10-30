const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateLists() {
    console.log('🚀 Iniciando migração de listas...\n');

    try {
        // 1. Buscar todas as listas sem accountId
        const listsSnapshot = await db.collection('lists').get();
        const listsWithoutAccount = [];

        listsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.accountId) {
                listsWithoutAccount.push({ id: doc.id, ...data });
            }
        });

        console.log(`📋 Encontradas ${listsWithoutAccount.length} listas sem conta\n`);

        if (listsWithoutAccount.length === 0) {
            console.log('✅ Todas as listas já estão migradas!');
            process.exit(0);
        }

        // 2. Agrupar listas por ownerId
        const listsByOwner = {};
        listsWithoutAccount.forEach((list) => {
            const ownerId = list.ownerId || list.createdBy;
            if (!listsByOwner[ownerId]) {
                listsByOwner[ownerId] = [];
            }
            listsByOwner[ownerId].push(list);
        });

        console.log(`👥 Donos de listas: ${Object.keys(listsByOwner).length}\n`);

        // 3. Para cada dono, buscar ou criar conta
        const batch = db.batch();
        let updatedCount = 0;

        for (const [ownerId, lists] of Object.entries(listsByOwner)) {
            console.log(`\n👤 Processando usuário: ${ownerId}`);

            // Verificar se o usuário existe
            const userDoc = await db.collection('users').doc(ownerId).get();
            if (!userDoc.exists) {
                console.log(`   ⚠️  Usuário não encontrado, pulando ${lists.length} listas`);
                continue;
            }

            const userData = userDoc.data();
            let accountId = userData.defaultAccountId;

            // Se o usuário não tem conta, criar uma
            if (!accountId) {
                console.log(`   📦 Criando conta para ${userData.name || userData.email}`);

                // Buscar plano Free
                const freePlanDoc = await db.collection('plans').doc('free').get();
                if (!freePlanDoc.exists) {
                    console.log(`   ❌ Plano Free não encontrado! Crie primeiro.`);
                    continue;
                }

                const planData = freePlanDoc.data();
                const accountRef = db.collection('accounts').doc();
                accountId = accountRef.id;

                batch.set(accountRef, {
                    name: `Conta de ${userData.name || userData.email}`,
                    titularId: ownerId,
                    planId: 'free',
                    status: 'active',
                    isLifetime: false,
                    expiresAt: null,
                    limits: planData.limits || {
                        maxMembers: 5,
                        maxLists: 10,
                        maxItemsPerList: 50,
                        maxStorageMB: 100,
                    },
                    metrics: {
                        currentMembers: 1,
                        currentLists: lists.length,
                        currentStorageMB: 0,
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Adicionar membro titular
                batch.set(accountRef.collection('members').doc(ownerId), {
                    userId: ownerId,
                    role: 'titular',
                    status: 'active',
                    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Atualizar usuário com defaultAccountId
                batch.update(db.collection('users').doc(ownerId), {
                    defaultAccountId: accountId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                console.log(`   ✅ Conta criada: ${accountId}`);
            } else {
                console.log(`   ✅ Conta existente: ${accountId}`);
            }

            // 4. Atualizar listas com accountId
            for (const list of lists) {
                batch.update(db.collection('lists').doc(list.id), {
                    accountId: accountId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                updatedCount++;
            }

            // 5. Atualizar metrics da conta (se já existia)
            if (userData.defaultAccountId) {
                batch.update(db.collection('accounts').doc(accountId), {
                    'metrics.currentLists': admin.firestore.FieldValue.increment(lists.length),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`   📊 Contador de listas atualizado (+${lists.length})`);
            }

            console.log(`   📝 ${lists.length} listas atualizadas`);
        }

        // 5. Commit batch
        console.log(`\n💾 Salvando alterações...`);
        await batch.commit();

        console.log(`\n✅ Migração concluída com sucesso!`);
        console.log(`📊 Estatísticas:`);
        console.log(`   - Listas migradas: ${updatedCount}`);
        console.log(`   - Usuários processados: ${Object.keys(listsByOwner).length}`);

    } catch (error) {
        console.error('\n❌ Erro na migração:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Executar migração
migrateLists();

