# AGENTS.md — Guia Econômico

> **🤖 LEIA ISTO PRIMEIRO.** Este arquivo é o ponto de entrada obrigatório para qualquer IA/agente
> (Antigravity, Gemini, Claude, Copilot, Cursor, Codex etc.) que for analisar ou alterar este projeto.
> Ele resume arquitetura, convenções, modelo de dados e regras de negócio. Leia-o **inteiro** antes de
> explorar o código.

---

## ⚠️ REGRA OBRIGATÓRIA DE MANUTENÇÃO DESTE ARQUIVO

**Toda alteração que mexa na estrutura do projeto DEVE atualizar este `AGENTS.md` no mesmo commit/tarefa.**

Considera-se "alteração estrutural" (lista não exaustiva):

- Criar, renomear, mover ou remover arquivos/pastas em `src/`, `api/`, `scripts/` ou `public/`.
- Criar/remover **páginas, rotas, componentes, contexts, hooks, services ou utils**.
- Alterar **coleções/documentos do Firestore**, campos do modelo de dados ou chaves de `localStorage`.
- Adicionar/remover/atualizar (major) **dependências** ou scripts do `package.json`.
- Adicionar/alterar **variáveis de ambiente**.
- Alterar **regras de negócio** (ciclos de fatura, perfis, responsável/reembolso, 50/30/20, reserva, Selic).
- Alterar **permissões/autenticação**, PWA/Service Worker, deploy (Vercel) ou o webhook.
- Adotar nova convenção de código, biblioteca de estilo, testes etc.

Como atualizar:
1. Edite a(s) seção(ões) afetada(s) abaixo (árvore de pastas, tabelas, modelo de dados...).
2. Registre a mudança no [Histórico de alterações](#-histórico-de-alterações-deste-arquivo) (data + resumo).
3. Se a mudança também afetar o usuário final, atualize o `README.md`.

> Se você é uma IA e terminou uma tarefa estrutural **sem** atualizar este arquivo, a tarefa **não está concluída**.

---

## 1. Visão geral

**Guia Econômico** é um dashboard financeiro pessoal (SPA + PWA) em português (pt-BR) para:

- Controle de gastos de **cartão de crédito por ciclo de fatura** (anterior / atual / próximo) com base no dia de fechamento de cada cartão.
- Divisão de responsabilidade de gastos: `meu`, `mozi` (100% reembolsável pela parceira) e `dividido` (50%).
- Parcelamento automático de compras.
- Receitas/salários por mês, gastos essenciais fixos e **projeção de saldo** dos próximos meses.
- Regra orçamentária **50/30/20** (Essencial / Desejo / Poupança).
- **Insights financeiros** e **Reserva de Emergência** (com taxa Selic do Banco Central).
- **Captura automática de compras** via webhook (MacroDroid no Android → `/api/webhook`).
- **Multi-perfil**: `renato` (perfil original) e `ingrid` (perfil isolado, com integrações).

Usuários: uso privado, acesso restrito a e-mails autorizados (ver `src/utils/permissoes.js`).

---

## 2. Stack técnica

| Camada | Tecnologia |
|---|---|
| Build/dev | **Vite 7** (`vite.config.js`), ESM (`"type": "module"`) |
| UI | **React 19** + **react-router-dom 7** (`BrowserRouter`) |
| Estilo | **styled-components 6** (principal, tema em `src/styles/base/theme.js`) + Bootstrap 5 CSS (importado em `main.jsx`). `sass` está instalado mas não é o padrão. |
| Formulários | react-hook-form |
| Gráficos | chart.js + react-chartjs-2 + chartjs-plugin-datalabels (também há `recharts` instalado) |
| Ícones | react-icons + emojis |
| Datas | date-fns (e muito cálculo manual com `Date`) |
| Backend | **Firebase** (Auth Google + **Cloud Firestore**) — SDK cliente `firebase` v12 |
| Serverless | **Vercel Functions** (`api/webhook.js`) |
| PWA | vite-plugin-pwa (Workbox, `autoUpdate`, fallback `public/offline.html`) |
| Lint | ESLint 9 flat config (`eslint.config.js`) |
| Legado | `json-server` + `db.json` (dados antigos/seed; **não** é mais a fonte de dados) |

**Não há** TypeScript, testes automatizados, nem `firestore.rules` versionado no repositório.

---

## 3. Comandos

| Comando | O que faz |
|---|---|
| `npm install` | Instala dependências |
| `npm run dev` | Servidor Vite em `http://localhost:5173` (SW é desregistrado em DEV) |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve a build |
| `npm run lint` | ESLint — **rode antes de finalizar qualquer alteração** |
| `npm run seed:firebase` | `scripts/seedFirestore.js` — importa `db.json` para o Firestore (usa `.env.local`) |
| `npm run server` / `json-server` | json-server legado na porta 3000 |

Ambiente do desenvolvedor: **Windows / PowerShell**.

---

## 4. Variáveis de ambiente

Arquivo local: `.env.local` (ignorado pelo git). Modelo: `.env.example`. Em produção: painel da Vercel.

| Variável | Onde é usada | Descrição |
|---|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | `src/config/firebase.js`, `api/webhook.js`, `scripts/seedFirestore.js` | Config do Firebase. Sem `API_KEY`+`PROJECT_ID`, `isFirebaseConfigured=false` e os services retornam vazio. |
| `VITE_ALLOWED_EMAIL`, `VITE_OWNER_EMAIL`, `VITE_INSIGHTS_ALLOWED_EMAILS` | `src/utils/permissoes.js` | E-mails extras autorizados (aceitam lista separada por vírgula). |
| `WEBHOOK_SECRET` (ou `VITE_WEBHOOK_SECRET`) | `api/webhook.js` | Token exigido no webhook (`?token=`, header `x-webhook-token` ou body). |
| `WEBHOOK_AUTH_EMAIL`, `WEBHOOK_AUTH_PASSWORD` | `api/webhook.js` | (Opcional) conta e-mail/senha para o webhook autenticar no Firestore. |

> **Nunca** commite `.env.local` nem segredos. Ao criar uma variável nova, adicione-a ao `.env.example` e a esta tabela.

---

## 5. Estrutura de pastas

```text
guiaEconomico-/
├── AGENTS.md                  # ESTE ARQUIVO — leia primeiro / mantenha atualizado
├── CLAUDE.md, GEMINI.md       # Apenas ponteiros para o AGENTS.md (Claude Code / Gemini CLI) — não duplicar conteúdo
├── .github/copilot-instructions.md # Ponteiro para o AGENTS.md (GitHub Copilot)
├── README.md                  # Documentação voltada ao usuário
├── api/
│   └── webhook.js             # Vercel Function: recebe notificação bancária → grava em Firestore "gastos"
├── public/
│   ├── data/gastos.json, saldo.json   # Dados estáticos legados
│   ├── offline.html           # Fallback offline do PWA
│   └── pwa-192x192.png, pwa-512x512.png
├── scripts/
│   └── seedFirestore.js       # Seed db.json → Firestore (saldo, essenciais, gastos)
├── src/
│   ├── main.jsx               # Bootstrap: ThemeProvider + GlobalStyle + Bootstrap CSS; desregistra SW em DEV
│   ├── App.jsx                # Router + AuthProvider; se logado, providers de dados + AppRoutes; senão <Login/>
│   ├── config/firebase.js     # initializeApp, db, auth, googleProvider, isFirebaseConfigured
│   ├── routes/AppRoutes.jsx   # Rotas (todas dentro do layout <ContainerGeral/>)
│   ├── context/               # Estado global (React Context)
│   │   ├── AuthContext.jsx    # user, login Google, logout, perfilAtivo, isIngrid/isRenato, temAcessoInsights
│   │   ├── MesContext.jsx     # mesReferencia (mês navegado), meses pagos (localStorage)
│   │   ├── SaldoContext.jsx   # receitas + salários ajustados por mês (Firestore + cache localStorage)
│   │   ├── EssencialContext.jsx # gastos essenciais fixos/recorrentes
│   │   └── GastosContext.jsx  # gastos de cartão, ciclos de fatura, parcelas, cartões, Mozi, Itaú
│   ├── services/              # ÚNICA camada que fala com Firestore / APIs externas
│   │   ├── gastosService.js   # CRUD gastos, reembolso Mozi, cartões personalizados, fatura Itaú
│   │   ├── saldoService.js    # CRUD receitas, salários ajustados
│   │   ├── essencial.js       # CRUD essenciais
│   │   ├── reservaService.js  # Config da reserva de emergência + aportes confirmados
│   │   └── selicService.js    # Selic (API BCB série 432 → fallback BrasilAPI → padrão 11,15% a.a.), cache mensal
│   ├── hooks/                 # Cálculos derivados (sem I/O direto)
│   │   ├── useProjecaoSaldo.js           # Projeção de saldo N meses
│   │   ├── useResumoCartoes.js           # Resumo de faturas por ciclo
│   │   ├── useResumoComparativoGrafico.js# Dados 50/30/20
│   │   ├── useResumoEssencial.js         # Resumo de essenciais (MAPA_NOMES_ESSENCIAIS)
│   │   ├── useResumoEvitaveis.js         # Gastos evitáveis
│   │   ├── useResumoFinanceiro.js        # Resumo geral
│   │   └── useShowModals.js              # Controle de abertura de modais
│   ├── pages/                 # Uma pasta por página, arquivo index.jsx
│   │   ├── Outlet/            # Layout mestre (ContainerGeral): sidebar desktop, menu/bottom-nav mobile, badge de perfil
│   │   ├── Home/              # Dashboard principal
│   │   ├── Cartoes/           # Faturas por cartão e ciclo
│   │   ├── Saldos/            # Receitas/saldos (também atende /comparativo)
│   │   ├── Insights/          # Insights + Reserva de Emergência (maior arquivo, ~1.5k linhas)
│   │   ├── Login/             # Login com Google
│   │   ├── Pagina404/         # Não está registrada nas rotas atualmente
│   │   └── Comparativo/, Configuracoes/, Relatorios/  # STUBS (~7 linhas)
│   ├── components/            # Uma pasta por componente, arquivo index.jsx
│   │   ├── Card/, CardComparativo/, CardGastosAbas/, CardSaldoGrafico/
│   │   ├── ListaGanhosMozi/, ListaProximosMeses/, Logo/, AcessoRestritoInsights/
│   │   └── Modal*/ (AjusteReserva, EditarGasto, EditarReceita, FaturaItau, GastoEssencial,
│   │                GerenciarCartoes, NovoGasto, Receita)
│   ├── styles/base/           # theme.js (cores/espacamentos/tipografia) e GlobalStyle.js
│   └── utils/
│       ├── permissoes.js      # E-mails autorizados, getPerfilUsuario, isEmailAutorizado
│       ├── currencyUtils.js   # parseCurrency / formatCurrency (formatters.js apenas re-exporta)
│       ├── categoriasGasto.js # CATEGORIAS_PADRAO, normalizarCategoria
│       ├── notificationParser.js # parseNotification (usado pelo webhook — roda em Node e no browser)
│       ├── proximoMesUtils.js # getProximosMeses
│       ├── reservaCalculos.js # Projeção/status da reserva de emergência
│       └── reservaHistoricoData.js # DADOS_HISTORICOS_INICIAIS da reserva
├── db.json                    # Dados legados (json-server / seed)
├── vercel.json                # Rewrite SPA: tudo → /index.html
├── vite.config.js             # React + VitePWA (manifest, Workbox runtimeCaching)
└── eslint.config.js
```

Pastas geradas/ignoradas: `node_modules/`, `dist/`, `dev-dist/`, `graphify-out/` (grafo de conhecimento do código gerado pela ferramenta graphify — pode ser consultado, `GRAPH_REPORT.md`).

---

## 6. Arquitetura e fluxo de dados

```text
main.jsx → ThemeProvider → App
  App: BrowserRouter → AuthProvider
    ├─ loading → spinner
    ├─ !user  → <Login/>
    └─ user   → MesProvider → SaldoProvider → EssencialProvider → GastosProvider → AppRoutes
                                                                                   └─ <ContainerGeral/> (Outlet) → páginas
```

Camadas (respeite a direção das dependências):

`pages/components` → `hooks` → `context` → `services` → `config/firebase` (Firestore)

- **Componentes/páginas não chamam Firestore diretamente**: usam `useGastos()`, `useSaldo()`, `useEssencial()`, `useMes()`, `useAuth()` ou hooks de resumo.
- **Services** recebem sempre o parâmetro `perfil` (`"renato"` padrão | `"ingrid"`) e escolhem a coleção.
- Services retornam `[]`/`null` em erro (com `console.error/warn`) em vez de lançar; os contexts atualizam o estado local de forma otimista após sucesso.
- Alguns dados têm **cache em `localStorage`** + sincronização no Firestore (salários, reserva, Selic).

### Rotas (`src/routes/AppRoutes.jsx`)

| Path | Página | Observação |
|---|---|---|
| `/` | Home | Dashboard |
| `/gastos-cartao` | Cartoes | Faturas por ciclo |
| `/saldos` e `/comparativo` | Saldos | Mesma página |
| `/insights` | Insights | Exibe `AcessoRestritoInsights` se sem permissão; excluída do `navigateFallback` do PWA |
| `/relatorios` | Relatorios | Stub |
| `/configuracoes` | Configuracoes | Stub |

Não há rota `*` (Pagina404 existe mas não está ligada).

---

## 7. Modelo de dados (Firestore)

Coleções por perfil (sufixo `_ingrid` para o perfil Ingrid):

| Recurso | Renato | Ingrid | Service |
|---|---|---|---|
| Gastos de cartão | `gastos` | `gastos_ingrid` | gastosService |
| Receitas / saldo | `saldo` | `saldo_ingrid` | saldoService |
| Gastos essenciais | `essenciais` | `essenciais_ingrid` | essencial.js |

Documentos na coleção `configuracoes`:

| Documento | Conteúdo |
|---|---|
| `configuracoes/cartoes_renato`, `configuracoes/cartoes_ingrid` | Lista de cartões personalizados |
| `configuracoes/fatura_itau_ingrid` | Mapa `{ "YYYY-MM": valor }` da fatura Itaú (Ingrid) |
| `configuracoes/salarios_ajustados`, `configuracoes/salarios_ingrid` | Salários ajustados por mês |
| `configuracoes/reserva`, `configuracoes/reserva_ingrid` | Config da reserva + `aportesConfirmados` |

### Formato de um gasto (`gastos`)

```js
{
  data: "YYYY-MM-DD",          // string; parse seguro com `${data}T12:00:00`
  valor: "123,45" | 123.45,    // ATENÇÃO: pode ser string BR ou number → sempre usar parseCurrency()
  cartao: "Nubank" | "Banco do Brasil" | "Picpay" | <cartão personalizado>,
  categoria: "Supermercado" | ... (CATEGORIAS_PADRAO) | texto livre,
  tipo: "Essencial" | "Desejo" | "Poupança",   // usado na regra 50/30/20
  responsavel: "meu" | "mozi" | "dividido",    // default "meu"
  descricao: string,
  parcela?: "1/3",             // presente em compras parceladas (1 doc por parcela)
  origem?: "webhook_notificacao",
  criadoEm?: ISOString
}
```

### Chaves de `localStorage`

- `guia_economico_mes_referencia`, `guia_economico_meses_pagos` (MesContext)
- `guia_selic_cache` (selicService)
- Chaves por perfil de salários (`getStorageKeySalarios` em SaldoContext) e reserva (`getStorageKeyReserva` em reservaService)

---

## 8. Regras de negócio importantes

1. **Perfis** (`src/utils/permissoes.js`): e-mail da Ingrid → perfil `ingrid`; qualquer outro autorizado → `renato`. Login só para e-mails em `EMAILS_PROPRIETARIOS_PADRAO` + variáveis de ambiente; não autorizados são deslogados.
2. **Ciclo de fatura** (`getIntervaloFatura` em GastosContext): para o mês de referência M e fechamento F:
   - `atual`: de (M-1, F+1) até (M, F)
   - `anterior`: um mês antes; `proximo`: um mês depois.
   - Fechamentos padrão: Nubank 30, Banco do Brasil 27, Picpay 30, Itaú 30.
3. **Responsável**: `mozi` = 100% da parceira (não entra nos gastos do Renato, entra em "Ganhos Mozi"); `dividido` = 50%.
4. **Parcelamento**: gera N documentos, um por mês (`calcularDataParcela`, respeitando último dia do mês); centavos de sobra vão para a 1ª parcela.
5. **Perfil Ingrid** tem cartões dinâmicos + dois cartões "integrados":
   - `Itaú`: valor manual mensal (`fatura_itau_ingrid`).
   - `Cartões do Renato`: lê da coleção `gastos` (Renato) os itens `responsavel in ["mozi","dividido"]` (fator 1 ou 0,5), no ciclo do Nubank.
   - Ambos somam como **Essencial** no 50/30/20 da Ingrid.
6. **50/30/20**: Essencial 50%, Desejo 30%, Poupança 20%.
7. **Selic**: API BCB → BrasilAPI → padrão 11,15% a.a.; conversão mensal por juros compostos.
8. **Webhook**: `POST /api/webhook` (GET = health check). Valida token, faz `parseNotification({banco, texto, titulo})` e grava sempre na coleção `gastos` (perfil Renato) com `responsavel: "meu"`.

---

## 9. Convenções de código

- **Idioma**: nomes de variáveis, funções, arquivos, comentários e UI em **português** (ex.: `adicionarGastoAPI`, `getGastosDoCiclo`). Mantenha o padrão.
- Componentes/páginas: pasta em PascalCase com `index.jsx`; `export default function Nome()`.
- **styled-components no mesmo arquivo** do componente, geralmente no final; props transitórias com `$` (ex.: `$ativo`, `$isIngrid`). Use cores de `theme.colors` quando possível. Visual: tema escuro "neon" (roxo `#820ad1`, azul `#00b3ff`; rosa `#f472b6` para Ingrid).
- Contexts exportam `XProvider` e `useX()` (com `// eslint-disable-next-line react-refresh/only-export-components`).
- Services: funções `async`, sufixo `API` nas mutações, parâmetro `perfil = "renato"`, checar `isFirebaseConfigured` antes de acessar o Firestore.
- Valores monetários: **sempre** `parseCurrency()` para ler e `formatCurrency()` para exibir (pt-BR).
- Datas de gastos como string `YYYY-MM-DD`; meses como chave `YYYY-MM`.
- Layout responsivo: desktop (sidebar) e mobile (bottom nav) — teste ambos ao mexer em navegação.
- Mensagens de commit no padrão Conventional Commits em português (`feat:`, `fix(escopo):`, `refactor:`, `chore:`).

---

## 10. Cuidados / armadilhas conhecidas

- `valor` misto (string com vírgula ou number) — nunca some direto.
- `README.md` está parcialmente desatualizado (não cita multi-perfil, Insights, Reserva, PWA, novos modais). Este arquivo é a referência técnica.
- `firestore.rules` não está no repo; segurança depende das regras configuradas no console Firebase. Não presuma acesso aberto.
- `api/webhook.js` importa `../src/utils/notificationParser.js`: esse util **não pode** usar APIs de browser nem `import.meta.env`.
- PWA: Workbox `CacheFirst` para assets do mesmo domínio; mudanças de cache podem afetar usuários instalados. SW desativado em DEV.
- Arquivos grandes (`Insights`, `Cartoes`, `Outlet`, `Saldos`): prefira extrair componentes em vez de aumentá-los ainda mais.
- Não há testes: valide com `npm run lint` e `npm run build`, e descreva testes manuais.

---

## 11. Checklist para agentes ao finalizar uma tarefa

- [ ] `npm run lint` sem erros novos.
- [ ] `npm run build` funcionando (para mudanças relevantes).
- [ ] Ambos os perfis (`renato` e `ingrid`) considerados quando a mudança toca dados.
- [ ] Novas variáveis de ambiente em `.env.example`.
- [ ] **`AGENTS.md` atualizado** se houve alteração estrutural (ver regra no topo).
- [ ] `README.md` atualizado se a mudança é visível ao usuário.

---

## 📜 Histórico de alterações deste arquivo

| Data | Alteração |
|---|---|
| 2026-10-30 | Criação inicial do AGENTS.md com mapeamento completo do projeto (stack, estrutura, Firestore, regras de negócio, convenções). |
| 2026-10-30 | Adicionados `CLAUDE.md`, `GEMINI.md` e `.github/copilot-instructions.md` como ponteiros para este arquivo. |
