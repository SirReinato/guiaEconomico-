# 📊 Guia Econômico

O **Guia Econômico** é um dashboard financeiro pessoal completo, moderno e inteligente, desenvolvido com foco na gestão prática de despesas mensais, acompanhamento de faturas de cartão de crédito por ciclo de fechamento, **assinaturas recorrentes**, **acordos de parcelamento de fatura ("Apertou a Fatura")**, regra orçamentária **50/30/20**, projeção de fluxo de caixa futuro, **simulação de metas futuras com IA** e **captura automática de compras em tempo real via Webhook**.

---

## 🚀 Tecnologias Utilizadas

| Camada | Tecnologia | Descrição |
|---|---|---|
| **Frontend** | React 19 + Vite 7 | Interface SPA ultrarrápida e moderna |
| **Estilização** | styled-components 6 | Estilização componentizada com tema Dark Neon |
| **Autenticação** | Firebase Authentication | Login seguro com conta Google e controle de acesso |
| **Banco de Dados** | Google Cloud Firestore | Banco NoSQL em nuvem em tempo real (100% gratuito) |
| **Inteligência Artificial** | Firebase AI Logic (Gemini) | Consultoria inteligente para planejamento de metas sem aperto |
| **Backend / API** | Vercel Serverless Functions | Endpoint Serverless (`/api/webhook`) em Node.js |
| **Automação Mobile** | MacroDroid (Android) | Escuta notificações push de compras e dispara Webhook |
| **Gráficos** | Chart.js + react-chartjs-2 | Visualizações dinâmicas e comparativo orçamentário |
| **Formulários** | React Hook Form | Gerenciamento e validação performática de formulários |
| **Deploy** | Vercel | Hospedagem contínua integrada ao GitHub |

---

## ✨ Funcionalidades Principais

### 1. 💳 Gestão Inteligente de Cartões de Crédito
- **Ciclos de Fatura Reais**: Separação automática dos gastos por ciclo (*Anterior*, *Atual* e *Próximo*) com base na data de fechamento real de cada banco (ex: Nubank dia 30, Banco do Brasil dia 27).
- **🔄 Assinaturas Recorrentes no Cartão**:
  - Cadastro de assinaturas (Netflix, Spotify, ChatGPT etc.) com seleção do cartão e dia de cobrança.
  - A cobrança é gerada dinamicamente mês a mês até ser cancelada.
  - Cancelamento preserva os meses passados no histórico para auditoria precisa.
  - Linhas com destaque visual em esmeralda/ciano neon e contador de assinaturas por cartão na Home com atalho direto.
- **🚨 Apertou a Fatura (Acordo de Parcelamento)**:
  - Ferramenta de emergência para quando a fatura pesar no orçamento.
  - **Entrada Substitutiva**: Substitui o total de compras daquele ciclo pelo valor de entrada negociado. Permite divisão personalizada (100% Meu, 100% Mozi, ou Dividido 50/50 / valores customizados).
  - **Parcelas Futuras ($X$ vezes de $R\$ Y$)**: Sem precisar calcular totais com juros na mão, define quantidade e valor da parcela, com projeção automática nos próximos meses e divisão para cada parceiro.
  - **Congelamento Seguro**: As compras do mês do acordo permanecem visíveis para conferência com etiqueta de congelamento, sem duplicar o valor da fatura. A entrada fica destacada no topo.
  - **Sincronização Bidirecional**: Parcelamentos feitos pela parceira (inclusive no Itaú) divididos com o Renato refletem automaticamente nos próximos meses dele.
- **🎯 Ajustar para Dar Certinho (Calibração de Fatura)**: Ferramenta ágil para bater o valor exato da fatura do aplicativo do banco quando houver pequenas divergências manuais ou de IOF/taxas. Permite informar o valor final real (calculando a diferença automaticamente) ou o valor direto de ajuste com sinal positivo + ou negativo -. O lançamento é fixado com destaque visual e prioridade no **topo da lista** para fácil conferência.
- **Divisão de Responsabilidade**: Permite classificar cada despesa como:
  - 👤 **Meu**: Gasto próprio individual.
  - 💕 **Mozi**: Gasto do parceiro (100% reembolsável, computado em Ganhos+).
  - 🤝 **Dividido**: Rachado igualmente (50% de reembolso).
- **Suporte a Parcelamento**: Divisão automática de parcelas com cálculo de datas futuras e ajuste de centavos.
- **Edição e Exclusão Segura**: Modal completa para editar qualquer informação de um lançamento ou excluí-lo do banco com confirmação.

### 2. ⚡ Automação de Compras em Tempo Real (Webhook)
- Endpoint Serverless `/api/webhook` hospedado na Vercel e protegido por token secreto (`WEBHOOK_SECRET`).
- Ao passar o cartão na maquininha, o **MacroDroid** no celular captura a notificação do app do banco e envia ao Webhook.
- **Parser Inteligente**:
  - Extrai valor em reais com precisão de centavos.
  - Identifica o cartão utilizado (**Nubank** ou **Banco do Brasil**).
  - Extrai o nome do estabelecimento (loja, restaurante, posto, etc.).
  - **Categorização Automática**: Reconhece palavras-chave e classifica o gasto imediatamente (ex: *Posto/Uber* ➡️ Transporte, *Mercado* ➡️ Supermercado, *Farmácia* ➡️ Saúde).

### 3. 📈 Regra Orçamentária 50/30/20 & Projeções
- **Gráfico Comparativo**: Compara a distribuição financeira atual contra a meta ideal (50% Essenciais, 30% Desejos, 20% Poupança/Investimentos), com indicação visual por cores (verde/vermelho).
- **Projeção de Saldo (Próximos Meses)**: Estimativa de saldo para os próximos 3 meses considerando salário recorrente, gastos fixos essenciais, assinaturas ativas e parcelas de faturas renegociadas.

### 4. 🎯 Metas Futuras & Planejador com IA
- Cadastro de bens de médio e longo prazo (ex: carro entre R$ 30 mil e R$ 40 mil).
- **Motor de Cenários Pré-Calculados**:
  - **À Vista**: acúmulo em 3 ritmos com rendimento de ~100% do CDI (Selic oficial do Banco Central).
  - **Financiamento**: simulação com tabela Price, parcelas e cálculo real de juros.
  - **Híbrido Inteligente**: poupança para entrada robusta + financiamento leve em poucas parcelas.
  - **Consórcio**: parcelas sem juros bancários e estratégia de lance.
- **Travas de Segurança Financeira**: avaliação automática de impacto na renda (verde para confortável, amarelo para atenção e vermelho para inviável).
- **Consultoria com Gemini (Firebase AI Logic)**: análise estratégica que gera resumo executivo, passo a passo prático e alertas sobre custos ocultos (IPVA, seguro, ITBI, etc.).

### 5. 📱 Experiência Mobile Totalmente Responsiva & PWA
- **Layout Fluido & Harmônico**: Interface calibrada para qualquer tamanho de tela (320px a desktop), eliminando rolagem horizontal acidental (overflow-x: hidden) e truncamento de textos.
- **Cards Dinâmicos em Mobile**: Lançamentos de cartão e tabelas de saldos e receitas transformam-se automaticamente em cards compactos de 2 linhas nos smartphones para leitura rápida.
- **Modais Adaptados e Bottom Navigation Ergonômica**: Modais com altura dinâmica (max-height: 90dvh), suporte a safe-area em iOS/Android e fechamento amigável por toque no fundo escurecido.

### 6. 🔒 Segurança e Privacidade Total (Plano de Segurança Completo)
- **Autenticação e RBAC Estrito**: Acesso restrito via Google Authentication e controle granular por perfil (`renato` e `ingrid`).
- **Cloud Firestore Security Rules (`firestore.rules`)**: Regras no servidor com modelo *Default Deny*, validação de schemas em criação e atualização, isolamento de coleções e proteção de campos imutáveis (`criadoEm`). Deploy com `firebase deploy --only firestore:rules`.
- **Webhook Blindado**: Endpoint `/api/webhook` com *fail-safe defaults* (rejeita requisições se `WEBHOOK_SECRET` não estiver configurado), mitigação contra *Timing Attacks* com `crypto.timingSafeEqual` e sanitização de payloads contra DoS.
- **Cabeçalhos HTTP Defensivos & Content Security Policy (CSP)**: `vercel.json` configurado com CSP restrito, `X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff` (anti-MIME sniffing) e HSTS com preload.
- **Higienização de Inputs (`securityUtils.js`)**: Prevenção ativa contra XSS e corrupção de tipos numéricos.
- Consulte o documento completo em [`SECURITY.md`](./SECURITY.md).

---

## 📁 Estrutura do Projeto

```text
guia-economico/
├── api/                           # Serverless Functions na Vercel
│   └── webhook.js                 # Endpoint receptor de notificações bancárias
├── public/                        # Ativos estáticos
├── scripts/
│   └── seedFirestore.js           # Script para migrar dados locais para o Firestore
├── src/
│   ├── components/                # Componentes reutilizáveis
│   │   ├── Card/                  # Card de exibição de métricas
│   │   ├── CardComparativo/       # Gráfico de barras da regra 50/30/20
│   │   ├── CardMeta/              # Card de visualização e progresso da meta
│   │   ├── CenariosMeta/          # Abas comparativas de cenários (À vista, Financiamento, Híbrido, Consórcio)
│   │   ├── GraficoEvolucaoMeta/   # Gráfico de acúmulo patrimonial vs meta
│   │   ├── ModalNovaMeta/         # Modal de cadastro e edição de metas
│   │   ├── ModalAjusteFaturaCartao/ # Modal de calibração exata de fatura (+ / -)
│   │   ├── ModalAssinaturasCartao/ # Gerenciador de assinaturas recorrentes por cartão
│   │   ├── ModalApertouFatura/    # Acordo de emergência para parcelar fatura do cartão
│   │   ├── PlanoIA/               # Painel de consultoria e recomendações da IA
│   │   └── ...                    # Outros componentes e modais
│   ├── config/
│   │   └── firebase.js            # Inicialização do Firebase e Firestore
│   ├── context/                   # Contextos de estado global (Auth, Gastos, Saldo, Essencial, Mes)
│   ├── hooks/                     # Custom hooks (useMetas, usePlanoMeta, useProjecaoSaldo, etc.)
│   ├── pages/                     # Páginas (Home, Cartoes, Saldos, Insights, Metas, Login)
│   ├── services/                  # Comunicação com Firestore e APIs externas
│   ├── styles/                    # Temas Dark Neon e estilos globais
│   └── utils/                     # Motores de cálculo, permissões e sanitização
├── firestore.rules                # Regras de segurança RBAC no Cloud Firestore
└── vercel.json                    # Rewrite SPA e cabeçalhos de segurança HTTP
```
