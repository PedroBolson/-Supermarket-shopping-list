# Guia de Contribuição

Obrigado por considerar contribuir com o Lista Mercado! Este documento fornece diretrizes para contribuir com o projeto.

## 🎯 Como Contribuir

### Reportando Bugs

1. Verifique se o bug já não foi reportado nas [Issues](https://github.com/seu-usuario/lista-mercado/issues)
2. Crie uma nova issue com o template de bug report
3. Inclua:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs. atual
   - Screenshots (se aplicável)
   - Ambiente (navegador, OS, versão)

### Sugerindo Melhorias

1. Verifique se a sugestão já não existe nas Issues
2. Crie uma nova issue com o template de feature request
3. Inclua:
   - Descrição clara da funcionalidade
   - Justificativa (problema que resolve)
   - Exemplos de uso
   - Mockups (se aplicável)

### Pull Requests

1. **Fork o repositório**
2. **Clone seu fork**
   ```bash
   git clone https://github.com/seu-usuario/lista-mercado.git
   cd lista-mercado
   ```

3. **Crie uma branch**
   ```bash
   git checkout -b feature/minha-feature
   # ou
   git checkout -b fix/meu-bugfix
   ```

4. **Instale as dependências**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

5. **Faça suas alterações**
   - Siga o estilo de código do projeto
   - Adicione testes quando apropriado
   - Atualize documentação se necessário

6. **Teste suas alterações**
   ```bash
   npm run lint
   npm run build
   
   # Teste functions
   cd functions
   npm run lint
   npm run build
   npm test
   cd ..
   ```

7. **Commit suas mudanças**
   ```bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade X"
   ```

   Use commits semânticos:
   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `docs:` mudanças na documentação
   - `style:` formatação, ponto e vírgula faltando, etc
   - `refactor:` refatoração de código
   - `test:` adição ou correção de testes
   - `chore:` atualização de tarefas de build, configs, etc

8. **Push para seu fork**
   ```bash
   git push origin feature/minha-feature
   ```

9. **Abra um Pull Request**
   - Preencha o template de PR
   - Referencie issues relacionadas
   - Aguarde review

## 📝 Diretrizes de Código

### TypeScript

- Use TypeScript strict mode
- Defina tipos explícitos
- Evite `any`, use `unknown` quando necessário
- Use interfaces para objetos complexos

```typescript
// ✅ Bom
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// ❌ Ruim
function getUser(id: any): any {
  // ...
}
```

### React

- Use componentes funcionais
- Use hooks para estado e efeitos
- Prefira composição sobre herança
- Mantenha componentes pequenos e focados

```typescript
// ✅ Bom
function UserCard({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false)
  
  return (
    <Card>
      {/* ... */}
    </Card>
  )
}

// ❌ Ruim
class UserCard extends React.Component {
  // ...
}
```

### Estilo

- Use TailwindCSS para estilização
- Siga o design system existente
- Mantenha consistência visual
- Use o utilitário `cn()` para classes condicionais

```typescript
// ✅ Bom
<div className={cn(
  'rounded-lg border p-4',
  isActive && 'bg-blue-50',
  disabled && 'opacity-50'
)}>

// ❌ Ruim
<div className={`rounded-lg border p-4 ${isActive ? 'bg-blue-50' : ''} ${disabled ? 'opacity-50' : ''}`}>
```

### Cloud Functions

- Valide sempre autenticação
- Use tipos do TypeScript
- Faça logging de auditoria
- Trate erros apropriadamente
- Documente funções complexas

```typescript
// ✅ Bom
export const myFunction = https.onCall<RequestType>(async (request) => {
  const uid = request.auth?.uid
  if (!uid) {
    throw new https.HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  await validateAuth(uid)
  
  try {
    // lógica
    await logAudit(...)
    return { success: true }
  } catch (error) {
    console.error('Erro:', error)
    throw new https.HttpsError('internal', 'Erro interno')
  }
})
```

## 🧪 Testes

### Frontend

- Teste componentes críticos
- Teste hooks customizados
- Teste fluxos importantes

### Functions

- Teste cada função callable
- Teste validações de permissão
- Teste edge cases
- Use emuladores do Firebase

```typescript
// Exemplo de teste
import { myFunction } from '../src/functions/myFunction'

describe('myFunction', () => {
  it('deve retornar sucesso para usuário válido', async () => {
    const result = await myFunction({
      auth: { uid: 'test-uid' },
      data: { /* ... */ }
    })
    
    expect(result.success).toBe(true)
  })
  
  it('deve lançar erro para usuário não autenticado', async () => {
    await expect(
      myFunction({ data: { /* ... */ } })
    ).rejects.toThrow('unauthenticated')
  })
})
```

## 📚 Documentação

- Documente APIs públicas
- Atualize README quando necessário
- Adicione JSDoc para funções complexas
- Mantenha tipos documentados

```typescript
/**
 * Envia um convite para um novo membro.
 * 
 * @param accountId - ID da conta
 * @param email - Email do convidado
 * @param role - Papel a ser atribuído (sempre 'convidado')
 * @returns Token do convite criado
 * @throws {HttpsError} Se o limite de membros for atingido
 */
export async function sendInvitation(
  accountId: string,
  email: string,
  role: 'convidado'
): Promise<string> {
  // ...
}
```

## 🔐 Segurança

- Nunca commite secrets ou API keys
- Use variáveis de ambiente
- Siga o checklist de segurança
- Reporte vulnerabilidades privadamente

## 📦 Versionamento

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Funcionalidades novas compatíveis
- **PATCH**: Correções de bugs compatíveis

## 🎨 Design

- Siga o design system do projeto
- Use componentes UI existentes
- Mantenha consistência visual
- Considere acessibilidade (a11y)

## ✅ Checklist de PR

Antes de abrir um PR, verifique:

- [ ] Código segue o estilo do projeto
- [ ] Testes passam
- [ ] Lint passa
- [ ] Build funciona
- [ ] Documentação atualizada
- [ ] Commits semânticos
- [ ] PR description preenchida
- [ ] Issues referenciadas

## 🤝 Código de Conduta

- Seja respeitoso e profissional
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## 📞 Dúvidas?

- Abra uma [Discussion](https://github.com/seu-usuario/lista-mercado/discussions)
- Entre em contato: [seu-email@example.com]

---

Obrigado por contribuir! 🎉


