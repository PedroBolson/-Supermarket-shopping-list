const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function checkUser(email) {
    console.log(`\n🔍 Verificando usuário: ${email}\n`);

    try {
        // 1. Verificar no Auth
        const userRecord = await auth.getUserByEmail(email);
        console.log('✅ Usuário existe no Firebase Auth');
        console.log(`   UID: ${userRecord.uid}`);
        console.log(`   Email verificado: ${userRecord.emailVerified}`);
        console.log(`   Desabilitado: ${userRecord.disabled}`);
        console.log(`   Custom Claims:`, JSON.stringify(userRecord.customClaims || {}, null, 2));

        // 2. Verificar no Firestore
        const userDoc = await db.collection('users').doc(userRecord.uid).get();

        if (!userDoc.exists) {
            console.log('\n❌ PROBLEMA: Usuário NÃO existe no Firestore!');
            console.log('   → Isso explica o erro de login');
            return;
        }

        console.log('\n✅ Usuário existe no Firestore');
        const userData = userDoc.data();
        console.log(`   isActive: ${userData.isActive}`);
        console.log(`   isMaster: ${userData.isMaster}`);
        console.log(`   defaultAccountId: ${userData.defaultAccountId || 'null'}`);
        console.log(`   name: ${userData.name}`);

        // 3. Verificar se tem conta
        if (userData.defaultAccountId) {
            const accountDoc = await db.collection('accounts').doc(userData.defaultAccountId).get();
            if (accountDoc.exists) {
                const accountData = accountDoc.data();
                console.log(`\n✅ Conta encontrada: ${accountData.name}`);
                console.log(`   Status: ${accountData.status}`);
                console.log(`   Plano: ${accountData.planId}`);
            } else {
                console.log('\n⚠️  AVISO: defaultAccountId existe mas conta não foi encontrada');
            }
        } else {
            console.log('\n⚠️  AVISO: Usuário não tem defaultAccountId');
        }

        console.log('\n✅ Verificação concluída!\n');

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
    }

    process.exit(0);
}

const email = process.argv[2];
if (!email) {
    console.error('❌ Uso: node scripts/check-user.js <email>');
    process.exit(1);
}

checkUser(email);

