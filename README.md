# 📊 Guia Econômico

O **Guia Econômico** é um dashboard financeiro pessoal completo, moderno e inteligente, desenvolvido com foco na gestão prática de despesas mensais, acompanhamento de faturas de cartão de crédito por ciclo de fechamento, regra orçamentária **50/30/20**, projeção de fluxo de caixa futuro, **simulação de metas futuras com IA** e **captura automática de compras em tempo real via Webhook**.

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
- **Projeção de Saldo (Próximos Meses)**: Estimativa de saldo para os próximos 3 meses considerando salário recorrente, gastos fixos essenciais e parcelas futuras de cartão.

### 4. 🎯 Metas Futuras & Planejador com IA
- Cadastro de bens de médio e longo prazo (ex: carro entre R$ 30 mil e R$ 40 mil).
- **Motor de Cenários Pré-Calculados**:
  - **À Vista**: acúmulo em 3 ritmos com rendimento de ~100% do CDI (Selic oficial do Banco Central).
  - **Financiamento**: simulação com tabela Price, parcelas e cálculo real de juros.
  - **Híbrido Inteligente**: poupança para entrada robusta + financiamento leve em poucas parcelas.
  - **Consórcio**: parcelas sem juros bancários e estratégia de lance.
- **Travas de Segurança Financeira**: avaliação automática de impacto na renda (verde para confortável, amarelo para atenção e vermelho para inviável).
- **Consultoria com Gemini (Firebase AI Logic)**: análise estratégica que gera resumo executivo, passo a passo prático e alertas sobre custos ocultos (IPVA, seguro, ITBI, etc.).

### 5. 🔒 Segurança e Privacidade Total
- Acesso restrito via autenticação Google.
- Proteção de rotas no frontend (bloqueia renderização e consultas para usuários não autenticados).
- Regras de segurança a nível de banco de dados no Firestore (`request.auth != null`), garantindo que ninguém consiga ler ou gravar dados sem autorização.

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
│   │   ├── PlanoIA/               # Painel de consultoria e recomendações da IA
│   │   └── ...                    # Outros componentes e modais
│   ├── config/
│   │   └── firebase.js            # Inicialização do Firebase e Firestore
│   ├── context/                   # Contextos de estado global (Auth, Gastos, Saldo, Essencial, Mes)
│   ├── hooks/                     # Custom hooks (useMetas, usePlanoMeta, useProjecaoSaldo, etc.)
│   ├── pages/                     # Páginas (Home, Cartoes, Saldos, Insights, Metas, Login)
│   ├── routes/
│   │   └── AppRoutes.jsx          # Definição de rotas com React Router
│   ├── services/                  # Camada de comunicação com Firestore e APIs externas
│   ├── styles/                    # Temas e estilos globais (Theme & GlobalStyle)
│   └── utils/                     # Formatadores monetários, cálculos matemáticos e parsers
├── vercel.json                    # Configuração de rewrites SPA para a Vercel
├── package.json
└── vite.config.js
```

---

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite localmente (`localhost:5173`) |
| `npm run build` | Compila a versão otimizada para produção |
| `npm run preview` | Pré-visualiza localmente a build de produção |
| `npm run lint` | Executa o ESLint para validação de padrões de código |
| `npm run seed:firebase` | Importa os dados de amostra do `db.json` direto para o Firestore |

---

## ⚙️ Variáveis de Ambiente (.env)

Crie um arquivo `.env.local` na raiz do projeto (ou adicione nas configurações da Vercel) com as seguintes chaves:

```env
# Credenciais do Google Firebase (Console do Firebase -> Configurações do Projeto)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...

# Restrição de Acesso (Opcional: define qual e-mail tem permissão de login)
VITE_ALLOWED_EMAIL=seu-email@gmail.com

# Chave de Segurança do Webhook Serverless
WEBHOOK_SECRET=sua_chave_secreta_aqui
```

---

## 📱 Configuração da Automação no Celular (MacroDroid)

Para cadastrar compras automaticamente quando passar o cartão:

1. Instale o app **MacroDroid** (Android) pela Google Play Store.
2. Crie uma nova Macro:
   - **Gatilho (Trigger)**: `Notificação` ➡️ `Notificação recebida` ➡️ Marque **Nubank** e **Banco do Brasil**.
   - **Ação (Action)**: `Conectividade` ➡️ `Requisição HTTP`:
     - **Método**: `POST`
     - **URL**: `https://SUA-URL-VERCEL.vercel.app/api/webhook?token=SEU_WEBHOOK_SECRET`
     - **Content Type**: `application/json`
     - **Corpo (JSON)**:
       ```json
       {
         "banco": "[notif_app_name]",
         "texto": "[notif_text]",
         "titulo": "[notif_title]"
       }
       ```
3. Salve a macro. Toda compra aprovada cairá instantaneamente no seu painel!

---

## 💻 Instruções para Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd guiaEconomico-
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o `.env.local`** com as credenciais do seu Firebase.

4. **Inicie a aplicação:**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador:**
   ```text
   http://localhost:5173
   ```

---

Desenvolvido por **SirReinato** 🚀
