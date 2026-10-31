# Guia de Segurança — Guia Econômico

Este documento descreve a arquitetura de segurança, o modelo de ameaças, as políticas de controle de acesso (RBAC), as regras de proteção de dados e as diretrizes de conformidade implementadas no projeto **Guia Econômico**.

---

## 1. Princípios Fundamentais de Segurança

O Guia Econômico adota as melhores práticas de cibersegurança e engenharia de software seguro:

1. **Menor Privilégio (Principle of Least Privilege)**: Cada usuário ou serviço só possui acesso de leitura e escrita às coleções estritamente necessárias para a sua operação.
2. **Defesa em Profundidade (Defense-in-Depth)**: A segurança não depende exclusivamente do frontend. Há validação em múltiplas camadas:
   - *Cliente*: Validação de sessão, verificação de e-mails autorizados e higienização de inputs.
   - *Borda / Edge*: Cabeçalhos de segurança HTTP, HSTS e Content Security Policy (CSP) na Vercel.
   - *API / Webhook*: Comparação em tempo constante contra Timing Attacks, fail-safe defaults e sanitização.
   - *Banco de Dados (Firestore)*: Regras de segurança no servidor com checagem de identidade e validação de schema.
3. **Padrão de Bloqueio Seguro (Fail-Safe Defaults)**: Por padrão, todo acesso não mapeado é explicitamente rejeitado (`deny all`). Na ausência de variáveis de ambiente críticas (ex.: `WEBHOOK_SECRET`), o sistema falha fechado (HTTP 500) em vez de permitir requisições sem credenciais.
4. **Isolamento Completo entre Perfis (Multi-Tenant Segregation)**: Separação física e lógica de coleções entre os perfis `renato` e `ingrid`, com cruzamento autorizado estritamente para itens compartilhados/reembolsos e parcelamentos.

---

## 2. Matriz de Controle de Acesso (RBAC)

O Guia Econômico opera com autenticação Google Firebase Auth e restringe o acesso por e-mail autenticado:

- **Perfil Renato**: E-mail `renatofranca2881@gmail.com` (e variáveis de ambiente proprietárias).
- **Perfil Ingrid**: E-mail `ingridfadvogada@gmail.com`.
- **Webhook Bot**: Autenticado via credenciais de serviço ou `WEBHOOK_SECRET` com conta bot.

| Recurso / Coleção | Perfil Renato | Perfil Ingrid | Webhook Bot | Não Autorizado |
|---|---|---|---|---|
| `gastos` (cartões Renato) | **CRUD Completo** | **Leitura Apenas** (itens `mozi`/`dividido`) | **Create (Append)** | ❌ Negado |
| `gastos_ingrid` (cartões Ingrid) | **Leitura Apenas** (reembolsos e parcelas) | **CRUD Completo** | ❌ Negado | ❌ Negado |
| `assinaturas` (cartões Renato) | **CRUD Completo** | **Leitura Apenas** (itens `mozi`/`dividido`) | ❌ Negado | ❌ Negado |
| `assinaturas_ingrid` (cartões Ingrid) | ❌ Negado | **CRUD Completo** | ❌ Negado | ❌ Negado |
| `saldo` (receitas Renato) | **CRUD Completo** | ❌ Negado | ❌ Negado | ❌ Negado |
| `saldo_ingrid` (receitas Ingrid) | ❌ Negado | **CRUD Completo** | ❌ Negado | ❌ Negado |
| `essenciais` (fixos Renato) | **CRUD Completo** | ❌ Negado | ❌ Negado | ❌ Negado |
| `essenciais_ingrid` (fixos Ingrid) | ❌ Negado | **CRUD Completo** | ❌ Negado | ❌ Negado |
| `metas` (metas Renato) | **CRUD Completo** | ❌ Negado | ❌ Negado | ❌ Negado |
| `metas_ingrid` (metas Ingrid) | ❌ Negado | **CRUD Completo** | ❌ Negado | ❌ Negado |
| `configuracoes/cartoes_renato` | **Leitura / Escrita** | ❌ Negado | ❌ Negado | ❌ Negado |
| `configuracoes/cartoes_ingrid` | ❌ Negado | **Leitura / Escrita** | ❌ Negado | ❌ Negado |
| `configuracoes/parcelamentos_fatura_renato` | **Leitura / Escrita** | **Leitura Apenas** | ❌ Negado | ❌ Negado |
| `configuracoes/parcelamentos_fatura_ingrid` | **Leitura Apenas** | **Leitura / Escrita** | ❌ Negado | ❌ Negado |
| `configuracoes/salarios_ajustados` | **Leitura / Escrita** | ❌ Negado | ❌ Negado | ❌ Negado |
| `configuracoes/salarios_ingrid` | ❌ Negado | **Leitura / Escrita** | ❌ Negado | ❌ Negado |
| `configuracoes/reserva` | **Leitura / Escrita** | ❌ Negado | ❌ Negado | ❌ Negado |
| `configuracoes/reserva_ingrid` | ❌ Negado | **Leitura / Escrita** | ❌ Negado | ❌ Negado |
| `configuracoes/fatura_itau_ingrid` | **Leitura / Escrita** | **Leitura / Escrita** | ❌ Negado | ❌ Negado |
| Outras rotas/coleções não mapeadas | ❌ Negado | ❌ Negado | ❌ Negado | ❌ Negado |

---

## 3. Segurança do Webhook de Notificações (`/api/webhook`)

O webhook serverless recebe alertas bancários de compras por push notification (MacroDroid no Android):

1. **Validação Obrigatória do Segredo**:
   - Exige `WEBHOOK_SECRET` ou `VITE_WEBHOOK_SECRET` configurado no ambiente.
   - Se a variável estiver ausente ou vazia no servidor, o endpoint retorna `HTTP 500` imediatamente e bloqueia a operação.
2. **Prevenção a Ataques de Temporização (Timing Attacks)**:
   - A comparação do token enviado com o segredo do servidor é feita através de `crypto.timingSafeEqual(bufA, bufB)` em tempo de execução constante.
3. **Preferência de Cabeçalhos Seguros**:
   - Suporta prioritariamente `Authorization: Bearer <token>` e o cabeçalho customizado `x-webhook-token`.
   - Suporte a query string e body mantido apenas como fallback com higienização estrita.
4. **Proteção Contra Payload Bombs & Injeção**:
   - Tamanho de textos sanitizado e limitado a no máximo 500 caracteres (`sanitizarEntrada`).
   - Remoção de tags `<script>` e caracteres HTML perigosos.
   - Validação de sanidade do valor monetário: o valor extraído deve ser numérico, finito, positivo e não exceder `R$ 1.000.000,00`.
5. **Cabeçalhos HTTP Defensivos**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`

---

## 4. Regras do Cloud Firestore (`firestore.rules`)

As regras são versionadas no repositório (`firestore.rules`) e referenciadas em `firebase.json`:

- **Versão**: `rules_version = '2';`
- **Validação de Autenticação**: Todas as requisições requerem `request.auth != null` e `request.auth.token.email != null`.
- **Validação Estrutural de Documentos**:
  - `valor`: Tipo numérico obrigatório, maior ou igual a 0 (ou com suporte a negativos quando explicitamente marcado como `origem: "ajuste_fatura"`).
  - `categoria`, `responsavel`: Valores validados contra listas de opções válidas quando aplicável.
  - Campos de texto não podem ultrapassar limites seguros para evitar sobrecarga.
  - Imutabilidade do campo `criadoEm` garantida tanto em gastos quanto em assinaturas.
- **Comando para Deploy das Regras**:
  ```bash
  firebase deploy --only firestore:rules
  ```

---

## 5. Cabeçalhos HTTP de Proteção Web e Content Security Policy (CSP)

Configurados em `vercel.json` para aplicação em todas as rotas:

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.googleusercontent.com https://*.githubusercontent.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.bcb.gov.br https://brasilapi.com.br; frame-src 'self' https://*.firebaseapp.com; object-src 'none'; base-uri 'self';"
}
```

Esses cabeçalhos garantem:
- **Zero Clickjacking**: Impossibilita o aplicativo de ser encapsulado em iframes maliciosos.
- **Zero MIME Sniffing**: Força os navegadores a respeitarem estritamente os tipos MIME declarados.
- **Isolamento de Recursos**: Scripts e conexões só podem ser estabelecidos com origens autorizadas (Firebase, Banco Central do Brasil, BrasilAPI e Google Fonts).
- **HSTS Forçado**: Garante conexões estritamente via HTTPS por 2 anos.

---

## 6. Higienização no Frontend (`src/utils/securityUtils.js`)

Utilitários de segurança para prevenir injeções antes mesmo da persistência ou renderização:

- `escaparHtml(valor)`: Converte caracteres `< > & " '` para entidades HTML seguras.
- `sanitizarTexto(input, maxLen)`: Remove tags HTML, normaliza espaços e trunca ao limite especificado.
- `isValorFinanceiroSeguro(valor)`: Checa se é número real, não NaN, finito e dentro dos limites orçamentários.
- `isDataValida(dataStr)` / `isChaveMesValida(chave)`: Garante integridade temporal dos dados nos formatos `YYYY-MM-DD` e `YYYY-MM`.

---

## 7. Gerenciamento de Segredos e Variáveis de Ambiente

1. **Nunca versionar arquivos de credenciais**: `.env.local` e `serviceAccountKey.json` estão e devem permanecer permanentemente no `.gitignore`.
2. **Ambiente Local**: Copie `.env.example` para `.env.local` e preencha as variáveis.
3. **Ambiente de Produção (Vercel)**: As variáveis são injetadas de forma criptografada pelo painel de controle do projeto na Vercel.
4. **Política de Rotação de Chaves**:
   - Chave `WEBHOOK_SECRET`: Em caso de suspeita de comprometimento, altere o valor no painel da Vercel e atualize a configuração da macro no MacroDroid imediatamente.
   - Credenciais do Firebase: Chaves de API do Firebase são públicas por design no bundle do cliente, mas a integridade dos dados é **100% protegida pelas `firestore.rules`**.

---

## 8. Procedimento de Resposta a Incidentes

Em caso de suspeita de incidente ou vazamento de credenciais:

1. **Webhook comprometido**:
   - Acesse o painel da Vercel → Settings → Environment Variables.
   - Atualize `WEBHOOK_SECRET` com uma string criptograficamente aleatória (mínimo 32 caracteres).
   - Faça redeploy da Vercel Function.
   - Atualize a configuração no MacroDroid.
2. **Acesso não autorizado ao Firebase**:
   - Acesse o Firebase Console → Authentication → Users.
   - Revogue ou desative a conta suspeita.
   - Verifique os logs de auditoria no Google Cloud Logging.
   - Reaplique as regras com `firebase deploy --only firestore:rules`.
