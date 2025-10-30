# 🚀 Setup Final - Lista Mercado Multi-Conta

## ✅ Status Atual

- [x] Cloud Functions deployadas (15/15)
- [x] Regras Firestore deployadas
- [x] Frontend atualizado com setupNewUser
- [ ] Planos criados no Firestore
- [ ] Primeiro usuário Master configurado
- [ ] Teste completo

---

## 1️⃣ Criar Planos no Firestore

Acesse: https://console.firebase.google.com → Seu Projeto → Firestore Database

### Plano 1: Free

1. Criar coleção: `plans`
2. Criar documento com ID: `free`
3. Adicionar campos:

```
name: "Free"
description: "Plano gratuito com funcionalidades básicas"
price: 0
interval: "lifetime"
limits: (map)
  ├─ maxMembers: 5
  ├─ maxLists: 10
  ├─ maxItemsPerList: 50
  └─ maxStorageMB: 100
features: (array)
  ├─ "Até 5 membros"
  ├─ "Até 10 listas"
  └─ "100MB de armazenamento"
isActive: true
order: 1
createdAt: (timestamp) → clique em "Add field" → tipo "timestamp"
updatedAt: (timestamp) → clique em "Add field" → tipo "timestamp"
```

### Plano 2: Premium

1. Criar documento com ID: `premium`
2. Adicionar campos:

```
name: "Premium"
description: "Plano premium com recursos avançados"
price: 9.90
interval: "monthly"
limits: (map)
  ├─ maxMembers: 50
  ├─ maxLists: 100
  ├─ maxItemsPerList: 500
  └─ maxStorageMB: 1000
features: (array)
  ├─ "Até 50 membros"
  ├─ "Até 100 listas"
  ├─ "1GB de armazenamento"
  └─ "Suporte prioritário"
isActive: true
order: 2
createdAt: (timestamp)
updatedAt: (timestamp)
```

---

## 2️⃣ Tornar Seu Usuário Master Admin

### Opção A: Via Script (Recomendado)

```bash
# 1. Instalar dependências do script
cd scripts
npm install
cd ..

# 2. Executar script com seu email
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json" node scripts/make-user-master.js SEU_EMAIL@gmail.com
```

**Onde conseguir service account key:**
1. Firebase Console → Project Settings (engrenagem) → Service Accounts
2. Clique em "Generate new private key"
3. Salve o arquivo JSON em local seguro (NÃO commitar!)
4. Use o caminho do arquivo no comando

### Opção B: Via Console Firebase (Manual)

1. **Firestore:**
   - Vá em `users/{seu-uid}`
   - Edite o documento:
   ```
   isMaster: true
   supportFlags: (map)
     ├─ canAccessAllAccounts: true
     ├─ canModifyPlans: true
     └─ canViewAudits: true
   ```

2. **Custom Claims (via Cloud Functions):**
   
   Crie uma function temporária para você mesmo:
   
   ```typescript
   // No console Firebase Functions
   export const makeMeMaster = onRequest(async (req, res) => {
     const uid = "SEU_UID_AQUI"; // Pegar em Firebase Auth
     
     await auth.setCustomUserClaims(uid, {
       ...currentClaims,
       master: true
     });
     
     res.send("Master claim set!");
   });
   ```
   
   Ou use o console do Firebase Functions:
   ```bash
   firebase functions:shell
   
   // No shell:
   admin.auth().setCustomUserClaims('SEU_UID', { master: true })
   ```

3. **Fazer Logout/Login** para aplicar as mudanças

---

## 3️⃣ Testar em Dev

```bash
# 1. Iniciar dev server
npm run dev

# 2. Acessar http://localhost:5173
```

### Fluxo de Teste Completo

#### Teste 1: Registro de Novo Usuário
1. Acessar `/auth`
2. Criar conta com nome, email e senha
3. ✅ Deve criar conta automaticamente
4. ✅ Deve criar conta "Free" automaticamente
5. ✅ Deve redirecionar para `/app`
6. ✅ Deve carregar listas (vazio inicialmente)

#### Teste 2: Criar Lista
1. Clicar em "Nova Lista"
2. Adicionar nome e descrição
3. ✅ Deve criar com `accountId` da sua conta
4. Adicionar itens à lista
5. ✅ Deve funcionar normalmente

#### Teste 3: Painel do Titular
1. Ir em `/app/account`
2. ✅ Deve mostrar painel do titular
3. ✅ Deve mostrar card de limites
4. Ver aba "Membros" → deve mostrar você como titular
5. Ver aba "Convites" → deve estar vazio
6. Ver aba "Configurações" → deve mostrar dados da conta

#### Teste 4: Enviar Convite
1. No painel, aba "Convites"
2. Clicar "Enviar Convite"
3. Colocar email de teste
4. ✅ Deve criar convite na coleção `invitations/`
5. Copiar URL: `http://localhost:5173/invite?token=XXXXX`

#### Teste 5: Aceitar Convite (novo usuário)
1. Abrir navegador anônimo
2. Acessar URL do convite
3. Criar conta com o email do convite
4. ✅ Deve aceitar automaticamente
5. ✅ Deve adicionar à conta existente como "convidado"
6. ✅ Deve ver as mesmas listas

#### Teste 6: Painel Master (seu usuário)
1. Logout e login novamente (para pegar claims)
2. Ir em `/app/account`
3. ✅ Deve mostrar "Painel Administrativo Master"
4. ✅ Deve ter acesso completo

**Recursos disponíveis no Painel Master:**

**Aba "Gerenciar Contas":**
- Buscar conta por email do titular
- Trocar plano de qualquer conta (Free ⇔ Premium)
- Conceder acesso vitalício
- Ajustar limites customizados por conta
- Suspender/reativar contas

**Aba "Gerenciar Planos":**
- Editar limites dos planos (Free, Premium, etc)
- Alterar preços e intervalos de cobrança
- Adicionar/remover features de cada plano
- Ativar/desativar planos (visibilidade)
- Criar novos planos personalizados
- Reordenar planos

#### Teste 7: Limites de Plano
1. Criar 10 listas (limite do free)
2. Tentar criar a 11ª
3. ✅ Deve bloquear e sugerir upgrade
4. Convidar 5 membros (limite do free)
5. Tentar convidar o 6º
6. ✅ Deve bloquear

---

## 4️⃣ Checklist de Verificação

### Firestore Collections
- [ ] `plans/free` existe
- [ ] `plans/premium` existe
- [ ] Após registro: `users/{uid}` criado
- [ ] Após registro: `accounts/{id}` criado
- [ ] Após registro: `accountMembers/{id}/members/{uid}` criado
- [ ] Após convite: `invitations/{token}` criado
- [ ] Após aceitar: convite com `status: "accepted"`
- [ ] Logs em `audits/` sendo criados

### Auth & Claims
- [ ] Seu usuário tem `isMaster: true` em `users/`
- [ ] Seu usuário tem claim `master: true`
- [ ] Novos usuários recebem claims automaticamente
- [ ] Claims incluem `role`, `accountIds`, `defaultAccountId`

### Frontend
- [ ] Registro funcionando com setupNewUser
- [ ] Login verificando isActive
- [ ] AuthContext carregando claims e conta
- [ ] Navegação mostrando links corretos por role
- [ ] Painel adaptando por role (titular/convidado/master)
- [ ] Limites sendo validados e exibidos

### Functions (todas 15)
- [ ] setupNewUser
- [ ] sendInvitation
- [ ] acceptInvitation
- [ ] revokeInvitation
- [ ] suspendMember
- [ ] removeMember
- [ ] transferOwnership
- [ ] switchPlan
- [ ] grantLifetimeAccess
- [ ] updateAccountLimits
- [ ] promoteToMaster
- [ ] demoteFromMaster
- [ ] suspendAccount
- [ ] checkExpiredAccounts
- [ ] checkExpiredInvitations

---

## 5️⃣ Troubleshooting

### Problema: "Permissões insuficientes" no Firestore

**Solução:**
1. Verificar se regras foram deployadas: `firebase deploy --only firestore:rules`
2. Verificar se usuário tem claims corretas
3. Fazer logout/login para refresh do token
4. Verificar no console Firestore → Rules se está correto

### Problema: Claims não aparecem

**Solução:**
```typescript
// No console do navegador
const user = auth.currentUser;
const token = await user.getIdTokenResult(true); // force refresh
console.log(token.claims);
```

### Problema: setupNewUser não está sendo chamada

**Solução:**
1. Verificar console do navegador para erros
2. Verificar se function foi deployada: Firebase Console → Functions
3. Verificar logs da function: `firebase functions:log`

### Problema: Convite não aceita automaticamente

**Solução:**
1. Verificar se email do convite == email do cadastro
2. Verificar se convite não está expirado (7 dias)
3. Verificar se status é "pending"

---

## 6️⃣ Comandos Úteis

```bash
# Ver logs das functions
firebase functions:log

# Ver logs de uma function específica
firebase functions:log --only setupNewUser

# Redeploy tudo
firebase deploy

# Redeploy apenas functions
firebase deploy --only functions

# Redeploy apenas regras
firebase deploy --only firestore:rules,storage

# Iniciar emuladores locais
firebase emulators:start

# Build do frontend
npm run build

# Dev server
npm run dev
```

---

## 🎉 Pronto!

Se todos os testes passaram, seu sistema multi-conta está 100% funcional!

**Próximos passos sugeridos:**
1. Implementar troca de planos com pagamento
2. Adicionar notificações por email
3. Implementar dashboard de métricas
4. Adicionar exportação de dados (LGPD)
5. Configurar monitoramento e alertas

---

**Desenvolvido com ❤️ para Lista Mercado**

