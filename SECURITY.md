# Checklist de Segurança - Lista Mercado

## ✅ Autenticação e Autorização

### Firebase Auth
- [x] Autenticação via email/senha configurada
- [x] Custom claims implementadas para controle de acesso
- [x] Refresh automático de tokens no frontend
- [x] Logout em caso de conta suspensa/inativa

### Custom Claims
- [x] `role`: Define o papel do usuário (titular, convidado, master)
- [x] `accountIds`: Lista de contas que o usuário tem acesso
- [x] `defaultAccountId`: Conta padrão do usuário
- [x] `master`: Flag para administradores do sistema

## ✅ Regras de Segurança Firestore

### Coleção `users`
- [x] Leitura: Qualquer usuário autenticado
- [x] Criação: Apenas o próprio usuário
- [x] Atualização: Apenas o próprio usuário (campos limitados)
- [x] Proteção de campos: `isMaster`, `supportFlags`, `defaultAccountId`

### Coleção `accounts`
- [x] Leitura: Apenas membros da conta ou master
- [x] Criação: Apenas via Cloud Functions
- [x] Atualização: Apenas titular (campos limitados)
- [x] Proteção de campos: `titularId`, `planId`, `limits`, `metrics`, `status`, `isLifetime`

### Coleção `accountMembers`
- [x] Leitura: Apenas membros da conta ou master
- [x] Escrita: Apenas via Cloud Functions

### Coleção `plans`
- [x] Leitura: Qualquer usuário autenticado
- [x] Escrita: Bloqueada (apenas via console ou functions)

### Coleção `invitations`
- [x] Leitura: Apenas titular da conta, destinatário ou master
- [x] Escrita: Apenas via Cloud Functions

### Coleção `lists`
- [x] Leitura: Apenas membros ativos da conta
- [x] Criação: Apenas membros ativos com accountId válido
- [x] Atualização: Apenas membros ativos (proteção de accountId e createdBy)
- [x] Exclusão: Apenas criador, titular ou master

### Subcoleção `lists/{listId}/items`
- [x] Leitura: Apenas membros ativos da conta
- [x] Criação: Apenas membros ativos
- [x] Atualização: Apenas membros ativos (proteção de listId e createdBy)
- [x] Exclusão: Apenas criador, titular ou master

### Coleção `audits`
- [x] Leitura: Apenas master
- [x] Escrita: Bloqueada (apenas via Cloud Functions)

## ✅ Regras de Segurança Storage

### Path `accounts/{accountId}/avatars/{fileName}`
- [x] Leitura: Apenas membros da conta ou master
- [x] Escrita: Apenas membros ativos dentro do limite de storage
- [x] Exclusão: Apenas membros da conta ou master

### Path `accounts/{accountId}/lists/{listId}/{fileName}`
- [x] Leitura: Apenas membros da conta ou master
- [x] Escrita: Apenas membros ativos dentro do limite de storage
- [x] Exclusão: Apenas membros da conta ou master

### Path `users/{uid}/profile/{fileName}`
- [x] Leitura: Qualquer usuário autenticado
- [x] Escrita: Apenas o próprio usuário
- [x] Exclusão: Apenas o próprio usuário

## ✅ Cloud Functions

### Validações Gerais
- [x] Autenticação validada em todas as functions
- [x] Permissões validadas (titular, master)
- [x] Inputs sanitizados
- [x] Erros tratados adequadamente
- [x] Logging de auditoria

### Functions de Convites
- [x] `sendInvitation`: Valida limite de membros antes de enviar
- [x] `sendInvitation`: Verifica duplicatas de convites
- [x] `acceptInvitation`: Valida expiração do convite
- [x] `acceptInvitation`: Verifica se email coincide
- [x] `revokeInvitation`: Apenas titular pode revogar

### Functions de Membros
- [x] `suspendMember`: Não permite suspender titular
- [x] `removeMember`: Não permite remover titular
- [x] `removeMember`: Atualiza claims do usuário removido
- [x] `transferOwnership`: Apenas titular atual pode transferir
- [x] `transferOwnership`: Novo titular deve ser membro

### Functions de Planos
- [x] `switchPlan`: Apenas titular pode trocar
- [x] `switchPlan`: Não permite trocar se conta é lifetime
- [x] `grantLifetimeAccess`: Apenas master
- [x] `updateAccountLimits`: Apenas master

### Functions de Administração
- [x] `promoteToMaster`: Apenas master
- [x] `demoteFromMaster`: Apenas master
- [x] `demoteFromMaster`: Não permite remover próprios privilégios
- [x] `suspendAccount`: Apenas master

## ✅ App Check

- [x] App Check inicializado no frontend
- [x] reCAPTCHA v3 configurado
- [x] Token refresh automático ativo
- [x] Variável de ambiente VITE_RECAPTCHA_SITE_KEY configurada

## ✅ Dados Sensíveis

### Variáveis de Ambiente
- [x] Arquivo `.env.example` criado
- [x] Arquivo `.env` no `.gitignore`
- [x] Secrets configurados no GitHub Actions
- [x] Secrets configurados no Firebase

### Informações Sensíveis
- [x] API keys no frontend (pública, mas com App Check)
- [x] Service account keys protegidas (nunca no código)
- [x] Tokens de convite com TTL de 7 dias
- [x] Passwords nunca armazenadas (Firebase Auth)

## ✅ LGPD / GDPR

### Consentimentos
- [x] Termos de uso coletados no cadastro
- [x] Política de privacidade coletada no cadastro
- [x] Consentimento de marketing opcional
- [x] Timestamps de aceitação armazenados

### Dados Pessoais
- [x] Email armazenado apenas em `users/{uid}`
- [x] Nome e foto apenas com consentimento
- [x] Bio opcional
- [x] Dados segregados por conta

### Direitos do Usuário
- [ ] TODO: Implementar exportação de dados
- [ ] TODO: Implementar exclusão de conta
- [ ] TODO: Implementar portabilidade de dados

## ✅ Rate Limiting e Proteção contra Abuso

### Firebase
- [x] Quotas do Firebase ativas
- [x] App Check para proteção contra bots
- [x] Regras de segurança impedem leitura/escrita não autorizada

### Cloud Functions
- [x] Validação de limites antes de operações
- [x] Logging de tentativas suspeitas
- [ ] TODO: Implementar rate limiting customizado

## ✅ Monitoramento e Logs

### Logs de Auditoria
- [x] Criação de contas
- [x] Adição/remoção de membros
- [x] Envio/aceitação/revogação de convites
- [x] Mudanças de plano
- [x] Suspensão de contas
- [x] Promoção/rebaixamento de usuários

### Métricas
- [x] Número de membros por conta
- [x] Número de listas por conta
- [x] Uso de armazenamento por conta

## ✅ Backups e Recovery

### Firestore
- [x] Backups automáticos do Firebase (plano Blaze)
- [ ] TODO: Configurar exports programáticos

### Storage
- [x] Versionamento do Firebase Storage ativo
- [ ] TODO: Configurar lifecycle rules

## 🔴 Pendências

### Alto Impacto
- [ ] Implementar rate limiting customizado nas functions
- [ ] Implementar exportação de dados (LGPD)
- [ ] Implementar exclusão completa de conta

### Médio Impacto
- [ ] Configurar alertas de segurança
- [ ] Implementar 2FA (autenticação de dois fatores)
- [ ] Adicionar logs de acesso detalhados

### Baixo Impacto
- [ ] Implementar rotação automática de tokens
- [ ] Adicionar watermark em imagens
- [ ] Implementar detecção de anomalias

## 📋 Checklist de Deploy

Antes de fazer deploy para produção:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] App Check configurado e testado
- [ ] Regras de segurança revisadas e testadas
- [ ] Cloud Functions testadas com emuladores
- [ ] Logs de auditoria verificados
- [ ] Backups configurados
- [ ] Monitoring ativo
- [ ] Rate limits configurados
- [ ] Documentação atualizada

## 🚨 Procedimento de Incidente

Em caso de incidente de segurança:

1. **Contenção**: Suspender conta/usuário afetado
2. **Investigação**: Consultar logs de auditoria
3. **Mitigação**: Corrigir vulnerabilidade
4. **Comunicação**: Notificar usuários se necessário
5. **Documentação**: Registrar lições aprendidas

## 📞 Contatos de Segurança

- Security Lead: [seu-email@example.com]
- Reportar vulnerabilidade: [security@example.com]

---

**Última atualização**: 2025-10-30
**Revisado por**: Sistema AI


