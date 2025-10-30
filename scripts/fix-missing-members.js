const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixMissingMembers() {
    console.log('\n🔧 Corrigindo membros faltantes nas contas...\n');

    const accountsSnapshot = await db.collection('accounts').get();

    let fixed = 0;
    let alreadyOk = 0;

    for (const accountDoc of accountsSnapshot.docs) {
        const accountId = accountDoc.id;
        const accountData = accountDoc.data();
        const titularId = accountData.titularId;

        console.log(`📋 Conta: ${accountData.name}`);
        console.log(`   Titular: ${titularId}`);

        // Verificar se o titular já está na subcoleção members
        const memberDoc = await db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .doc(titularId)
            .get();

        if (memberDoc.exists) {
            console.log('   ✅ Titular já está na subcoleção members\n');
            alreadyOk++;
            continue;
        }

        // Adicionar o titular na subcoleção
        console.log('   ⚠️  Titular NÃO está na subcoleção, adicionando...');

        await db
            .collection('accounts')
            .doc(accountId)
            .collection('members')
            .doc(titularId)
            .set({
                uid: titularId,
                accountId: accountId,
                role: 'titular',
                status: 'active',
                invitedBy: titularId,
                invitedAt: admin.firestore.FieldValue.serverTimestamp(),
                joinedAt: admin.firestore.FieldValue.serverTimestamp(),
                suspendedAt: null,
                suspendedBy: null,
            });

        console.log('   ✅ Titular adicionado com sucesso!\n');
        fixed++;
    }

    console.log('\n📊 Resumo:');
    console.log(`   ✅ Contas já OK: ${alreadyOk}`);
    console.log(`   🔧 Contas corrigidas: ${fixed}`);
    console.log(`   📋 Total de contas: ${accountsSnapshot.size}\n`);

    process.exit(0);
}

fixMissingMembers().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});

