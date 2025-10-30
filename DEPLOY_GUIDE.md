# Guia Completo de Deploy

## 📋 Checklist Pré-Deploy

### 1. Configuração Local

- [ ] Node.js 20+ instalado
- [ ] Firebase CLI instalado (`npm install -g firebase-tools`)
- [ ] Dependências instaladas (`npm install` e `cd functions && npm install`)
- [ ] Arquivo `.env` configurado com credenciais Firebase
- [ ] Firebase login realizado (`firebase login`)
- [ ] Projeto Firebase selecionado (`firebase use --add`)

### 2. Configuração Firebase Console

#### 2.1 Firebase Authentication
- [ ] Método Email/Password ativado
- [ ] Domínios autorizados configurados

#### 2.2 Firestore Database
- [ ] Database criado (modo production)
- [ ] Localização definida (ex: `southamerica-east1`)

#### 2.3 Firebase Storage
- [ ] Storage ativado
- [ ] Mesma localização do Firestore

#### 2.4 Cloud Functions
- [ ] Plano Blaze ativo (necessário para Functions)
- [ ] Região configurada (ex: `southamerica-east1`)

#### 2.5 App Check
- [ ] App Check ativado
- [ ] reCAPTCHA v3 configurado
- [ ] Site key copiada para `.env` (`VITE_RECAPTCHA_SITE_KEY`)

### 3. Deploy Inicial (Local)

#### 3.1 Deploy das Regras de Segurança

```bash
firebase deploy --only firestore:rules,storage:rules
```

✅ Isso vai configurar as regras de segurança para Firestore e Storage.

#### 3.2 Deploy das Cloud Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

⚠️ **Importante**: 
- Algumas functions podem falhar no primeiro deploy se índices não existirem
- O Firebase vai mostrar links para criar os índices automaticamente
- Clique nos links e aguarde os índices serem criados (5-10 min)
- Rode `firebase deploy --only functions` novamente

#### 3.3 Criar Planos no Firestore

Acesse o console do Firebase → Firestore Database e crie os documentos:

**Coleção: `plans`**

**Documento ID: `free`**
```json
{
  "name": "Free",
  "description": "Plano gratuito com funcionalidades básicas",
  "price": 0,
  "interval": "lifetime",
  "limits": {
    "maxMembers": 5,
    "maxLists": 10,
    "maxItemsPerList": 50,
    "maxStorageMB": 100
  },
  "features": [
    "Até 5 membros",
    "Até 10 listas",
    "100MB de armazenamento"
  ],
  "isActive": true,
  "order": 1,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Documento ID: `premium`**
```json
{
  "name": "Premium",
  "description": "Plano premium com recursos avançados",
  "price": 9.90,
  "interval": "monthly",
  "limits": {
    "maxMembers": 50,
    "maxLists": 100,
    "maxItemsPerList": 500,
    "maxStorageMB": 1000
  },
  "features": [
    "Até 50 membros",
    "Até 100 listas",
    "1GB de armazenamento",
    "Suporte prioritário"
  ],
  "isActive": true,
  "order": 2,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

#### 3.4 Deploy do Frontend (Hosting)

```bash
npm run build
firebase deploy --only hosting
```

✅ Após o deploy, você verá a URL do seu app:
- **Production**: `https://seu-projeto-id.web.app`

### 4. Configurar GitHub Actions (Opcional)

Se quiser CI/CD automático:

#### 4.1 Gerar Token do Firebase

```bash
firebase login:ci
```

Copie o token gerado.

#### 4.2 Configurar Secrets no GitHub

Vá em: Repositório → Settings → Secrets and variables → Actions

Adicione os seguintes secrets:

**Credenciais Firebase:**
- `VITE_FIREBASE_API_KEY` - Sua API key
- `VITE_FIREBASE_AUTH_DOMAIN` - `seu-projeto.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID` - ID do seu projeto
- `VITE_FIREBASE_STORAGE_BUCKET` - `seu-projeto.appspot.com`
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Sender ID
- `VITE_FIREBASE_APP_ID` - App ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Measurement ID (Analytics)
- `VITE_RECAPTCHA_SITE_KEY` - Site key do reCAPTCHA

**Token de Deploy:**
- `FIREBASE_TOKEN` - Token gerado no passo 4.1

#### 4.3 Como Funciona o CI/CD

**Branch `main` (Production):**
- Push na main → GitHub Actions roda
- Build automático
- Deploy para `https://seu-projeto-id.web.app`

**Branch `develop` (Staging):**
- Push na develop → GitHub Actions roda
- Build automático
- Deploy para canal preview: `https://seu-projeto-id--staging-xyz.web.app`
- Canal expira em 30 dias

**Pull Requests:**
- Apenas roda lint e build
- Não faz deploy

## 🚀 Workflow Diário

### Desenvolvimento Local

```bash
# Terminal 1: Emuladores
firebase emulators:start

# Terminal 2: Dev Server
npm run dev
```

Acesse: `http://localhost:5173`

### Deploy para Produção

**Opção 1: Via Git (Recomendado)**
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```
→ GitHub Actions faz deploy automático

**Opção 2: Deploy Manual**
```bash
npm run build
firebase deploy
```

### Deploy Apenas Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### Deploy Apenas Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Deploy Apenas Regras

```bash
firebase deploy --only firestore:rules,storage:rules
```

## 🧪 Testar Antes de Produção

### 1. Testar Localmente com Emuladores

```bash
firebase emulators:start
```

Isso inicia:
- Auth Emulator: `http://localhost:9099`
- Firestore Emulator: `http://localhost:8080`
- Functions Emulator: `http://localhost:5001`
- Hosting Emulator: `http://localhost:5000`
- Emulator UI: `http://localhost:4000`

### 2. Testar Functions Específicas

```bash
cd functions
npm run build
firebase functions:shell
```

### 3. Testar Build de Produção

```bash
npm run build
npm run preview
```

## ⚠️ Problemas Comuns

### 1. Functions falhando no deploy

**Erro**: `Deployment failed: Index required`

**Solução**: 
1. Clique no link fornecido no erro
2. Aguarde índice ser criado (5-10 min)
3. Rode deploy novamente

### 2. App Check bloqueando requisições

**Erro**: `Firebase App Check token is invalid`

**Solução**:
1. Verifique se `VITE_RECAPTCHA_SITE_KEY` está correto
2. Certifique-se de que App Check está ativo no console
3. Em desenvolvimento, adicione debug token

### 3. CORS errors

**Erro**: `CORS policy blocked`

**Solução**:
1. Adicione domínio em Firebase Auth → Settings → Authorized domains
2. Para localhost: já está autorizado por padrão

### 4. Rules bloqueando acesso

**Erro**: `Missing or insufficient permissions`

**Solução**:
1. Verifique se custom claims foram definidas
2. Force refresh do token: `user.getIdToken(true)`
3. Verifique regras no console

## 📊 Monitoramento Pós-Deploy

### 1. Console Firebase

Acesse: `https://console.firebase.google.com`

**Monitorar:**
- Functions → Logs e métricas
- Firestore → Uso e performance
- Storage → Uso de armazenamento
- Auth → Usuários ativos

### 2. Coleção Audits

```javascript
// Query no console Firestore
db.collection('audits')
  .orderBy('timestamp', 'desc')
  .limit(100)
```

### 3. Métricas de Conta

```javascript
// Query no console Firestore
db.collection('accounts')
  .where('status', '==', 'active')
  .get()
```

## 🔄 Migrações (Se Já Tem Dados)

Se você já tem usuários e listas em produção:

### Script de Migração (executar via Functions)

```typescript
// functions/src/migrations/migrateToMultiAccount.ts
import * as admin from 'firebase-admin'

export async function migrateUsers() {
  const db = admin.firestore()
  const auth = admin.auth()
  
  const usersSnapshot = await db.collection('users').get()
  
  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id
    const userData = userDoc.data()
    
    // Pular se já migrado
    if (userData.defaultAccountId) continue
    
    // Criar conta
    const accountRef = db.collection('accounts').doc()
    await accountRef.set({
      name: `Conta de ${userData.name}`,
      titularId: uid,
      planId: 'free',
      status: 'active',
      expiresAt: null,
      limits: {
        maxMembers: 5,
        maxLists: 10,
        maxItemsPerList: 50,
        maxStorageMB: 100
      },
      metrics: {
        currentMembers: 1,
        currentLists: 0,
        currentStorageMB: 0
      },
      isLifetime: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    
    // Atualizar usuário
    await userDoc.ref.update({
      defaultAccountId: accountRef.id,
      isMaster: false,
      consents: {
        termsAccepted: true,
        privacyAccepted: true,
        marketingAccepted: false,
        acceptedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      supportFlags: {
        canAccessAllAccounts: false,
        canModifyPlans: false,
        canViewAudits: false
      }
    })
    
    // Criar membro
    await db
      .collection('accountMembers')
      .doc(accountRef.id)
      .collection('members')
      .doc(uid)
      .set({
        uid,
        accountId: accountRef.id,
        role: 'titular',
        status: 'active',
        invitedBy: uid,
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        suspendedAt: null,
        suspendedBy: null
      })
    
    // Definir claims
    await auth.setCustomUserClaims(uid, {
      role: 'titular',
      accountIds: [accountRef.id],
      defaultAccountId: accountRef.id,
      master: false
    })
    
    console.log(`Migrado usuário ${uid}`)
  }
}

export async function migrateLists() {
  const db = admin.firestore()
  
  const listsSnapshot = await db.collection('lists').get()
  
  for (const listDoc of listsSnapshot.docs) {
    const listData = listDoc.data()
    
    // Pular se já migrado
    if (listData.accountId) continue
    
    // Buscar conta do criador
    const creatorDoc = await db.collection('users').doc(listData.createdBy).get()
    const accountId = creatorDoc.data()?.defaultAccountId
    
    if (accountId) {
      await listDoc.ref.update({ accountId })
      console.log(`Migrada lista ${listDoc.id}`)
    }
  }
}
```

### Executar Migração

1. Crie uma HTTP function temporária:

```typescript
// functions/src/index.ts
export const runMigration = https.onRequest(async (req, res) => {
  // Validar senha secreta
  if (req.query.secret !== 'SUA_SENHA_SECRETA') {
    res.status(401).send('Unauthorized')
    return
  }
  
  try {
    await migrateUsers()
    await migrateLists()
    res.send('Migration completed')
  } catch (error) {
    console.error(error)
    res.status(500).send('Migration failed')
  }
})
```

2. Deploy da function:
```bash
firebase deploy --only functions:runMigration
```

3. Execute via URL:
```
https://southamerica-east1-seu-projeto.cloudfunctions.net/runMigration?secret=SUA_SENHA_SECRETA
```

4. Após sucesso, remova a function

## 🎯 Checklist Final

Antes de considerar o deploy completo:

- [ ] Regras Firestore deployadas
- [ ] Regras Storage deployadas
- [ ] Cloud Functions deployadas (todas green)
- [ ] Índices Firestore criados
- [ ] Planos criados no Firestore
- [ ] App Check configurado
- [ ] Hosting deployado
- [ ] GitHub Actions configurado (opcional)
- [ ] Migrações executadas (se necessário)
- [ ] Testes manuais realizados
- [ ] Monitoramento ativo

## 📞 Suporte

Em caso de problemas:

1. Verifique logs do Firebase Console
2. Verifique coleção `audits/` para erros
3. Teste com emuladores localmente
4. Consulte documentação do Firebase

---

**Boa sorte com o deploy! 🚀**


