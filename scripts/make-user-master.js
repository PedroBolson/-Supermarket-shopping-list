// Script para tornar um usuário Master Admin
// Execute com: node scripts/make-user-master.js SEU_EMAIL@exemplo.com

const admin = require('firebase-admin');

// Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
const auth = admin.auth();

async function makeUserMaster(email) {
    try {
        // Buscar usuário por email
        const userRecord = await auth.getUserByEmail(email);
        const uid = userRecord.uid;

        console.log(`Encontrado usuário: ${email} (${uid})`);

        // Atualizar documento no Firestore
        await db.collection('users').doc(uid).update({
            isMaster: true,
            'supportFlags.canAccessAllAccounts': true,
            'supportFlags.canModifyPlans': true,
            'supportFlags.canViewAudits': true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Documento users atualizado');

        // Atualizar Custom Claims
        const currentClaims = userRecord.customClaims || {};
        await auth.setCustomUserClaims(uid, {
            ...currentClaims,
            master: true
        });

        console.log('✅ Custom claims atualizadas');
        console.log('\n🎉 Usuário agora é Master Admin!');
        console.log('⚠️  O usuário precisa fazer logout/login para aplicar as mudanças\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

// Pegar email dos argumentos
const email = process.argv[2];

if (!email) {
    console.error('❌ Uso: node scripts/make-user-master.js SEU_EMAIL@exemplo.com');
    process.exit(1);
}

makeUserMaster(email);

