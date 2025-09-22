# Lista Mercado Inteligente

Aplicação web colaborativa para organizar listas de compras em tempo real. O projeto combina React 19, TypeScript e Tailwind CSS 4 com a stack Firebase (Authentication, Cloud Firestore e Storage) para oferecer um fluxo moderno de cadastro, aprovação de usuários e gerenciamento compartilhado de itens.

## Visão Geral
- Interface responsiva com layout em abas (Listas, Usuários e Perfil) carregada dentro de um `AppShell` animado com Framer Motion.
- Autenticação por email e senha integrada ao Firebase com fluxo de aprovação: contas recém-criadas ficam inativas até liberação manual.
- Dados sincronizados em tempo real via Cloud Firestore, com feedback visual imediato em todas as ações.
- Suporte a tema claro/escuro persistido no navegador e otimizações de UX (animações, loaders, confirmações de ação).
- Progressive Web App (PWA) habilitado com `vite-plugin-pwa`, cache de dados do Firestore/Storage e manifesto customizado em `public/manifest.json`.

## Principais Funcionalidades
- **Listas de compras:** criação, edição e exclusão de listas; adição de itens com quantidade e observações; contadores de status e reordenação automática.
- **Itens colaborativos:** marcação de itens como comprados, registro do autor da compra e histórico visual de quem adicionou cada item.
- **Gestão de usuários:** painel administrativo para aprovar ou suspender acessos (atualiza o campo `isActive` no Firestore).
- **Perfil pessoal:** atualização de nome e upload de avatar para o Firebase Storage com barra de progresso e validações de tamanho/tipo.
- **Tema e responsividade:** alternância de tema global via `ThemeProvider`, layout mobile-first e componentes reutilizáveis (`Button`, `Card`, `Modal`, etc.).

## Tecnologias e Bibliotecas
- React 19 + TypeScript + Vite 7
- Tailwind CSS 4 (`@tailwindcss/vite`) e design tokens utilitários
- Framer Motion para animações e transições
- Firebase: Authentication, Cloud Firestore, Storage e Hosting
- React Router DOM 7 para roteamento protegido (`ProtectedRoute`)
- Lucide React para ícones
- Vite Plugin PWA para registro do Service Worker
- ESLint 9 com configuração moderna baseada em TypeScript

## Arquitetura do Código
A estrutura segue uma organização baseada em funcionalidades:

```text
src/
├─ features/
│  ├─ auth/         # telas de login/registro e formulários
│  ├─ layout/       # AppShell com navegação lateral e mobile drawer
│  ├─ lists/        # página principal das listas e serviços Firestore
│  ├─ profile/      # edição de perfil e upload de avatar
│  └─ users/        # painel de aprovação e suspensão de usuários
├─ components/      # biblioteca de UI (Avatar, Button, Card, Modal...) e feedbacks
├─ contexts/        # AuthProvider (estado do usuário + perfil) e ThemeProvider
├─ hooks/           # hooks de apoio (`useAuth`, `useMediaQuery`)
├─ routes/          # `ProtectedRoute` que bloqueia acesso sem perfil ativo
├─ types/           # contratos de dados (ShoppingList, ShoppingListItem, UserProfile)
└─ utils/           # utilitários como `cn` para composição de classes
```

Serviços que acessam o Firestore/Storage ficam próximos das telas para reduzir acoplamento e facilitar testes. Contextos expõem estado global (auth, tema) para toda a aplicação e os componentes de UI abstraem a estilização Tailwind.

## Modelo de Dados (Firestore & Storage)
- **Coleção `users`:** documentos com `uid`, `name`, `email`, `photoURL`, `isActive`, `bio`, `createdAt`, `updatedAt`.
  - Regras (`firestore.rules`): qualquer usuário autenticado pode ler; updates são permitidos para o próprio usuário ou para alterar apenas `isActive` (fluxo de aprovação).
- **Coleção `lists`:** cada documento trata de uma lista com `name`, `description`, dados do criador e timestamps.
  - **Subcoleção `items`:** itens de cada lista contêm `name`, `quantity`, `notes`, autor, status de compra e metadados de quem comprou.
- **Storage (`storage.rules`):** avatares são salvos em `avatars/{uid}/`. Apenas o dono pode escrever, com limite de 15 MB e tipo `image/*`.

## Pré-requisitos
- Node.js 18.18 ou superior (recomendado Node 20 LTS)
- npm 9+ (ou compatível)
- Conta Firebase com Authentication, Cloud Firestore, Storage e Hosting habilitados
- (Opcional) Firebase CLI configurado (`npm install -g firebase-tools`)

## Configuração do Ambiente Local
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie um arquivo `.env.local` na raiz com as credenciais do seu projeto Firebase:
   ```bash
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_FIREBASE_MEASUREMENT_ID= # opcional (Analytics)
   ```
3. Habilite o login por email/senha no console do Firebase.
4. Crie as coleções `users` e `lists` (os documentos são gerados pelo app) e publique as regras:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```
5. Inicie o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```

O projeto utiliza o modo strict do React e recarregamento instantâneo do Vite. A aplicação carrega em `http://localhost:5173/`.

## Scripts Disponíveis
- `npm run dev` – executa o servidor Vite com HMR.
- `npm run build` – gera build de produção (`dist/`) com checagem de tipos (`tsc -b`).
- `npm run preview` – serve o build estático localmente (útil para testar o PWA).
- `npm run lint` – analisa o código com ESLint.

## Testando o PWA
Após `npm run build`, execute `npm run preview` e acesse a aplicação. Use as ferramentas de desenvolvedor do navegador para:
- Testar instalação (menu "Instalar app" ou `Add to homescreen`).
- Inspecionar o Service Worker registrado por `vite-plugin-pwa`.
- Verificar o manifesto em `public/manifest.json`.

## Deploy com Firebase Hosting
1. Autentique-se: `firebase login`.
2. Garanta que `firebase.json`, `firestore.rules` e `storage.rules` estejam atualizados.
3. Gere a build: `npm run build`.
4. Publique: `firebase deploy` ou selecione recursos específicos:
   ```bash
   firebase deploy --only hosting,firestore:rules,storage:rules
   ```

A configuração de hosting já redireciona todas as rotas para `index.html`, permitindo o roteamento via React Router.

## Boas Práticas e Próximos Passos
- Revise as permissões do Firestore se precisar de papéis mais granulares (por exemplo, restringir quem altera `isActive`).
- Adicione testes automatizados (unitários ou e2e) para assegurar o fluxo de aprovação e manipulação de listas.
- Considere internacionalização (i18n) caso a aplicação precise suportar outros idiomas.
- Defina uma licença (`LICENSE`) e diretrizes de contribuição caso o projeto seja público.

---

Para dúvidas ou sugestões, abra uma issue ou entre em contato com a equipe responsável pelo projeto.
