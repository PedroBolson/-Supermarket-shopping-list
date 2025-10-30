const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkMembers(accountId) {
    console.log(`\n🔍 Verificando membros da conta: ${accountId}\n`);

    const accountDoc = await db.collection('accounts').doc(accountId).get();
    if (!accountDoc.exists) {
        console.log('❌ Conta não existe!');
        process.exit(1);
    }

    const accountData = accountDoc.data();
    console.log(`✅ Conta: ${accountData.name}`);
    console.log(`   Titular: ${accountData.titularId}`);

    const membersSnapshot = await db.collection('accounts').doc(accountId).collection('members').get();

    console.log(`\n📋 Membros na subcoleção: ${membersSnapshot.size}`);

    if (membersSnapshot.size === 0) {
        console.log('\n⚠️  PROBLEMA: Nenhum membro encontrado na subcoleção!');
        console.log('   O titular deveria estar lá.');
    } else {
        membersSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\n   👤 ${doc.id}`);
            console.log(`      Role: ${data.role}`);
            console.log(`      Status: ${data.status}`);
            console.log(`      Joined: ${data.joinedAt ? 'Sim' : 'Não'}`);
        });
    }

    process.exit(0);
}

const accountId = process.argv[2];
if (!accountId) {
    console.error('❌ Uso: node scripts/check-members.js <accountId>');
    console.error('\nPara pegar o ID da sua conta, acesse o Firestore Console:');
    console.error('https://console.firebase.google.com/project/lista-compra-mercado/firestore/data/accounts');
    process.exit(1);
}

checkMembers(accountId);

