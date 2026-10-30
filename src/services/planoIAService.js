import { app, isFirebaseConfigured } from "../config/firebase";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

/**
 * Monta o prompt rico para a IA contendo o contexto real e os cenários pré-calculados.
 */
function construirPromptIA({ meta, contextoFinanceiro, cenarios }) {
    const { min, max, medio, jaGuardado } = cenarios.metaValores;
    const { salario, sobraReal, totalEssenciais, reservaAtual } = contextoFinanceiro;

    const cenariosSimplificados = [
        ...cenarios.aVista.map((c) => ({
            id: c.id,
            tipo: "À Vista",
            titulo: c.titulo,
            aporteMensal: c.aporteMensal,
            meses: c.tempoMesesMedio,
            seguranca: c.seguranca.rotulo,
            motivoSeguranca: c.seguranca.motivo,
        })),
        ...cenarios.hibrido.map((c) => ({
            id: c.id,
            tipo: "Híbrido",
            titulo: c.titulo,
            mesesPoupando: c.mesesPoupando,
            entradaAlcancada: c.entradaAlcancada,
            prazoFinanciamento: c.prazoFinanciamento,
            parcela: c.parcelaFinanciamento,
            jurosTotal: c.jurosTotal,
            seguranca: c.seguranca.rotulo,
        })),
        ...cenarios.financiamento.slice(0, 6).map((c) => ({
            id: c.id,
            tipo: "Financiamento",
            titulo: c.titulo,
            entrada: c.valorEntrada,
            mesesParaEntrada: c.mesesParaEntrada,
            parcela: c.parcela,
            prazo: c.prazoParcelas,
            jurosTotal: c.jurosTotal,
            seguranca: c.seguranca.rotulo,
            motivoSeguranca: c.seguranca.motivo,
        })),
        ...cenarios.consorcio.map((c) => ({
            id: c.id,
            tipo: "Consórcio",
            titulo: c.titulo,
            parcela: c.parcela,
            prazo: c.meses,
            taxaAdmTotal: c.taxaAdmTotal,
            seguranca: c.seguranca.rotulo,
        })),
    ];

    return `
Você é o consultor financeiro pessoal de elite do aplicativo "Guia Econômico".
O usuário cadastrou uma meta futura e precisa de um plano prático, inteligente e seguro para realizá-la SEM SE APERTAR financeiramente.

DADOS DA META:
- Bem desejado: "${meta.nome}" (Categoria: ${meta.categoria || "veículo"})
- Faixa de valor: R$ ${min.toLocaleString("pt-BR")} a R$ ${max.toLocaleString("pt-BR")} (Valor médio considerado: R$ ${medio.toLocaleString("pt-BR")})
- Valor já guardado: R$ ${jaGuardado.toLocaleString("pt-BR")}
- Prazo desejado informado: ${meta.prazoDesejadoMeses ? `${meta.prazoDesejadoMeses} meses` : "Flexível / Sem prazo fixo"}

SITUAÇÃO FINANCEIRA DO USUÁRIO:
- Renda Líquida Mensal: R$ ${salario.toLocaleString("pt-BR")}
- Gastos Fixos Essenciais: R$ ${totalEssenciais.toLocaleString("pt-BR")}
- Sobra Mensal Livre Realista: R$ ${sobraReal.toLocaleString("pt-BR")}
- Reserva de Emergência Atual: R$ ${Number(reservaAtual || 0).toLocaleString("pt-BR")}

CENÁRIOS PRÉ-CALCULADOS PELO SISTEMA (Use APENAS estes números, NUNCA invente outros valores):
${JSON.stringify(cenariosSimplificados, null, 2)}

DIRETRIZES DA ANÁLISE:
1. Recomende o cenário que melhor equilibra prazo x custo total sem comprometer a estabilidade do usuário (a parcela deve deixar folga mensal para imprevistos).
2. Se houver opção híbrida ou à vista confortável, explique porque poupar antes economiza milhares de reais em juros bancários.
3. Se o financiamento for a única forma de obter rápido, escolha a configuração de entrada mais robusta e menor prazo viável.
4. Forneça um passo a passo cronológico claro (fase de preparação, fase de execução e fase pós-conquista).
5. Aponte custos ocultos típicos dessa categoria (ex: para carros: IPVA, seguro, combustível; para imóveis: ITBI, reformas, condomínio).

Responda OBRIGATORIAMENTE em formato JSON com esta estrutura exata:
{
  "resumoExecutivo": "Breve parágrafo acolhedor e estratégico sintetizando a melhor estratégia.",
  "cenarioRecomendadoId": "id_exato_do_cenario_recomendado",
  "cenarioRecomendadoNome": "Nome legível do cenário",
  "justificativaRecomendacao": "Por que esta opção é a melhor escolha sem apertar seu bolso.",
  "passoAPasso": [
    "Passo 1: ...",
    "Passo 2: ...",
    "Passo 3: ..."
  ],
  "dicasEconomia": [
    "Dica prática 1",
    "Dica prática 2"
  ],
  "alertasRiscos": [
    "Alerta sobre custos adicionais ou armadilha de juros"
  ]
}
`.trim();
}

/**
 * Fallback heurístico inteligente: gera um plano consultivo humano e completo caso a
 * chamada para a API do Gemini esteja indisponível ou ocorra falha de rede/cota.
 */
function gerarPlanoHeuristico({ meta, contextoFinanceiro, cenarios }) {
    const { min, max, medio, jaGuardado } = cenarios.metaValores;
    const { sobraReal } = contextoFinanceiro;
    const rec = cenarios.recomendacaoRapida || cenarios.aVista[1] || cenarios.aVista[0];

    const isCarro = (meta.categoria || "").toLowerCase().includes("veic") || (meta.nome || "").toLowerCase().includes("carro");
    const isImovel = (meta.categoria || "").toLowerCase().includes("imov");

    const alertas = [];
    if (isCarro) {
        alertas.push("Custos Ocultos do Veículo: Reserve cerca de 10% a 15% do valor da compra para despesas iniciais (IPVA proporcional, transferência, emplacamento e primeiro seguro total).");
        alertas.push("Manutenção & Combustível: Após a compra, haverá um acréscimo médio de R$ 400 a R$ 800/mês nos seus gastos essenciais para combustível e seguro.");
    } else if (isImovel) {
        alertas.push("Despesas Cartorárias e ITBI: Reserve de 4% a 6% do valor total do imóvel para escritura, imposto de transmissão (ITBI) e certidões.");
    } else {
        alertas.push("Margem de Imprevisto: Mantenha sempre sua reserva de emergência intocada para que imprevistos do dia a dia não forcem você a abandonar o plano.");
    }

    alertas.push("Evite financiamentos longos (acima de 48x): os juros compostos cobrados pelos bancos podem fazer você pagar quase dois bens.");

    const passos = [];
    if (jaGuardado < min * 0.2) {
        passos.push(`Fase 1 (Acúmulo de Entrada): Guarde R$ ${(sobraReal * 0.5).toFixed(2)} mensalmente em uma conta com rendimento diário de 100% CDI até formar uma entrada sólida.`);
    } else {
        passos.push(`Fase 1 (Aporte Inicial): Você já conta com R$ ${jaGuardado.toLocaleString("pt-BR")} guardados. Mantenha esse montante rendendo a 100% do CDI até a data da compra.`);
    }

    if (rec.tipo === "avista") {
        passos.push(`Fase 2 (Acúmulo com Desconto): Mantenha aportes disciplinados de R$ ${rec.aporteMensal.toFixed(2)}/mês. Em ~${rec.tempoMesesMedio} meses você atinge R$ ${medio.toLocaleString("pt-BR")} e ganha poder de pechinchar 5% a 10% de desconto à vista.`);
    } else if (rec.tipo === "hibrido") {
        passos.push(`Fase 2 (Poupança Focada): Guarde durante ${rec.mesesPoupando} meses para atingir uma entrada de R$ ${rec.entradaAlcancada.toLocaleString("pt-BR")}.`);
        passos.push(`Fase 3 (Financiamento Leve): Financie apenas o restante em ${rec.prazoFinanciamento}x leves de R$ ${rec.parcelaFinanciamento.toFixed(2)}, cortando mais da metade dos juros convencionais.`);
    } else {
        passos.push(`Fase 2 (Contratação Segura): Dê a maior entrada possível e contrate o financiamento com parcela de R$ ${(rec.parcela || 0).toFixed(2)}, garantindo que continue sobrando margem todo mês.`);
    }

    passos.push("Fase 4 (Pós-Aquisição): Comemore a conquista e reorganize seu orçamento mensal ajustando as novas despesas de manutenção.");

    const dicas = [
        "Negociação agressiva: ao comprar à vista ou com entrada alta, exija brindes, documentação paga pela concessionária/loja ou desconto real.",
        "Automatize o aporte: assim que cair o salário no dia do pagamento, separe imediatamente o valor da meta em uma caixinha antes de começar a gastar.",
        "Monitore seus gastos de cartão: manter despesas com lanches e supérfluos controladas pode antecipar essa meta em vários meses.",
    ];

    return {
        resumoExecutivo: `Com base na sua sobra mensal realista de R$ ${sobraReal.toLocaleString("pt-BR")}, traçamos um plano para conquistar "${meta.nome}" (faixa de R$ ${min.toLocaleString("pt-BR")} a R$ ${max.toLocaleString("pt-BR")}) sem desestabilizar suas contas ou comprometer sua reserva.`,
        cenarioRecomendadoId: rec.id,
        cenarioRecomendadoNome: rec.titulo,
        justificativaRecomendacao: rec.descricao || `O cenário "${rec.titulo}" preserva sua tranquilidade financeira, mantendo sua parcela dentro da margem de segurança de até 30% da renda.`,
        passoAPasso: passos,
        dicasEconomia: dicas,
        alertasRiscos: alertas,
        geradoPorIA: false,
        geradoEm: new Date().toISOString(),
    };
}

/**
 * Gera o plano consultivo da meta utilizando Firebase AI Logic (Gemini).
 * Se o SDK não estiver inicializado ou falhar por rede/permissões, ativa o fallback heurístico automaticamente.
 */
export async function gerarPlanoIAMeta({ meta, contextoFinanceiro, cenarios }) {
    if (!isFirebaseConfigured) {
        return gerarPlanoHeuristico({ meta, contextoFinanceiro, cenarios });
    }

    try {
        const ai = getAI(app, { backend: new GoogleAIBackend() });
        const model = getGenerativeModel(ai, {
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.3,
                topP: 0.9,
            },
        });

        const prompt = construirPromptIA({ meta, contextoFinanceiro, cenarios });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const parsed = JSON.parse(text);

        return {
            ...parsed,
            geradoPorIA: true,
            geradoEm: new Date().toISOString(),
        };
    } catch (erro) {
        console.warn("Aviso na chamada do Firebase AI Logic (usando fallback consultivo inteligente):", erro);
        return {
            ...gerarPlanoHeuristico({ meta, contextoFinanceiro, cenarios }),
            motivoFallback: erro.message || "Serviço de IA indisponível temporariamente",
        };
    }
}
