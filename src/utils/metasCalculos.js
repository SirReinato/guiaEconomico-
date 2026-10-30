import { parseCurrency } from "./currencyUtils.js";

/**
 * Taxas de juros de financiamento médias de mercado por categoria (% ao mês).
 * Usadas como ponto de partida inicial que o usuário pode personalizar livremente.
 */
export const TAXAS_PADRAO_CATEGORIA = {
    veiculo: {
        nome: "Veículo (Carro / Moto)",
        taxaFinanciamentoMensal: 1.79, // ~23.7% a.a.
        taxaAdmConsorcioTotal: 15.0,  // ~15% taxa total
        entradaMinimaSugerida: 0.20,  // 20%
        prazosSugeridos: [24, 36, 48, 60],
        icone: "🚗",
        custosExtras: "Lembre-se de reservar ~10% a 15% do valor para IPVA, emplacamento, seguro e manutenção preventiva.",
    },
    imovel: {
        nome: "Imóvel (Casa / Apartamento / Terreno)",
        taxaFinanciamentoMensal: 0.85, // ~10.7% a.a. (SFH / SBPE)
        taxaAdmConsorcioTotal: 18.0,
        entradaMinimaSugerida: 0.20,  // 20%
        prazosSugeridos: [120, 180, 240, 360],
        icone: "🏠",
        custosExtras: "Custos de cartório, ITBI e escritura somam em média 4% a 6% do valor do imóvel.",
    },
    viagem: {
        nome: "Viagem / Férias / Intercâmbio",
        taxaFinanciamentoMensal: 2.10, // Crédito pessoal / parcelamento
        taxaAdmConsorcioTotal: 14.0,
        entradaMinimaSugerida: 0.30,
        prazosSugeridos: [6, 12, 18, 24],
        icone: "✈️",
        custosExtras: "Inclua margem de 15% para alimentação, transporte local e variação cambial.",
    },
    eletronico: {
        nome: "Eletrônicos / Equipamentos de Trabalho",
        taxaFinanciamentoMensal: 2.50, // Cartão / CDC loja
        taxaAdmConsorcioTotal: 12.0,
        entradaMinimaSugerida: 0.20,
        prazosSugeridos: [6, 10, 12, 18],
        icone: "💻",
        custosExtras: "Considere seguro contra furto/dano para equipamentos de alto valor.",
    },
    outro: {
        nome: "Outro Bem / Objetivo Pessoal",
        taxaFinanciamentoMensal: 1.99,
        taxaAdmConsorcioTotal: 15.0,
        entradaMinimaSugerida: 0.20,
        prazosSugeridos: [12, 24, 36, 48],
        icone: "🎯",
        custosExtras: "Sempre planeje uma margem de segurança de 10% sobre o valor planejado.",
    },
};

/**
 * Converte um número de meses em uma descrição rica contendo meses, anos e data estimada de conquista.
 * Exemplo: 21 meses -> "Mês 21 — 1 ano e 9 meses (30/07/2028)"
 *
 * @param {number} totalMeses
 * @param {Date|string} dataBase
 * @returns {{ meses: number, anosTexto: string, dataEstimadaStr: string, mesAnoExtenso: string, textoCurto: string, textoCompleto: string }}
 */
export function formatarPrazoMesesEAnos(totalMeses, dataBase = new Date()) {
    const n = Math.max(0, Math.round(Number(totalMeses) || 0));
    const anos = Math.floor(n / 12);
    const mesesRestantes = n % 12;

    let anosTexto = "";
    if (anos === 0) {
        anosTexto = `${mesesRestantes} ${mesesRestantes === 1 ? "mês" : "meses"}`;
    } else {
        const parteAnos = `${anos} ${anos === 1 ? "ano" : "anos"}`;
        if (mesesRestantes === 0) {
            anosTexto = parteAnos;
        } else {
            anosTexto = `${parteAnos} e ${mesesRestantes} ${mesesRestantes === 1 ? "mês" : "meses"}`;
        }
    }

    const base = dataBase instanceof Date ? dataBase : new Date(dataBase || Date.now());
    const dataAlvo = new Date(base.getFullYear(), base.getMonth() + n, base.getDate());
    const dia = String(dataAlvo.getDate()).padStart(2, "0");
    const mes = String(dataAlvo.getMonth() + 1).padStart(2, "0");
    const ano = dataAlvo.getFullYear();
    const dataEstimadaStr = `${dia}/${mes}/${ano}`;

    const mesesNomes = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const mesAnoExtenso = `${mesesNomes[dataAlvo.getMonth()]}/${ano}`;

    return {
        meses: n,
        anosTexto,
        dataEstimadaStr,
        mesAnoExtenso,
        textoCurto: n >= 12 ? `${n}m (${anosTexto})` : `${n} meses`,
        textoCompleto: `Mês ${n} — ${anosTexto} (${dataEstimadaStr})`,
    };
}

/**
 * Calcula a prestação fixa (Tabela Price) de um financiamento.
 * PMT = PV * [i * (1 + i)^n] / [(1 + i)^n - 1]
 */
export function calcularPrice({ valor, taxaMensalPercentual, meses }) {
    const pv = Number(valor);
    const n = parseInt(meses, 10);
    const i = Number(taxaMensalPercentual) / 100;

    if (pv <= 0 || n <= 0) {
        return { parcela: 0, totalPago: 0, jurosTotal: 0 };
    }

    if (i <= 0) {
        const parcela = pv / n;
        return {
            parcela: Number(parcela.toFixed(2)),
            totalPago: Number(pv.toFixed(2)),
            jurosTotal: 0,
        };
    }

    const fator = Math.pow(1 + i, n);
    const parcela = pv * ((i * fator) / (fator - 1));
    const totalPago = parcela * n;
    const jurosTotal = totalPago - pv;

    return {
        parcela: Number(parcela.toFixed(2)),
        totalPago: Number(totalPago.toFixed(2)),
        jurosTotal: Number(jurosTotal.toFixed(2)),
        taxaMensalPercentual: Number(taxaMensalPercentual),
        meses: n,
    };
}

/**
 * Calcula a prestação decrescente (Tabela SAC).
 */
export function calcularSAC({ valor, taxaMensalPercentual, meses }) {
    const pv = Number(valor);
    const n = parseInt(meses, 10);
    const i = Number(taxaMensalPercentual) / 100;

    if (pv <= 0 || n <= 0) {
        return { primeiraParcela: 0, ultimaParcela: 0, parcelaMedia: 0, totalPago: 0, jurosTotal: 0 };
    }

    const amortizacao = pv / n;
    let totalJuros = 0;
    let saldoDevedor = pv;
    const primeiraParcela = amortizacao + (saldoDevedor * i);

    for (let k = 0; k < n; k++) {
        totalJuros += saldoDevedor * i;
        saldoDevedor -= amortizacao;
    }

    const ultimaParcela = amortizacao + (amortizacao * i);
    const totalPago = pv + totalJuros;
    const parcelaMedia = totalPago / n;

    return {
        primeiraParcela: Number(primeiraParcela.toFixed(2)),
        ultimaParcela: Number(ultimaParcela.toFixed(2)),
        parcelaMedia: Number(parcelaMedia.toFixed(2)),
        totalPago: Number(totalPago.toFixed(2)),
        jurosTotal: Number(totalJuros.toFixed(2)),
        taxaMensalPercentual: Number(taxaMensalPercentual),
        meses: n,
    };
}

/**
 * Simulação de consórcio tradicional (parcelas sem juros, mas com taxa de administração e fundo de reserva).
 */
export function simularConsorcio({ valor, taxaAdmTotalPercentual = 15, meses = 36, fundoReserva = 2 }) {
    const pv = Number(valor);
    const n = parseInt(meses, 10);
    const taxaTotal = (Number(taxaAdmTotalPercentual) + Number(fundoReserva)) / 100;

    if (pv <= 0 || n <= 0) {
        return { parcela: 0, totalPago: 0, taxaAdmTotal: 0 };
    }

    const valorTotalComTaxas = pv * (1 + taxaTotal);
    const parcela = valorTotalComTaxas / n;
    const taxaAdmTotal = valorTotalComTaxas - pv;

    return {
        parcela: Number(parcela.toFixed(2)),
        totalPago: Number(valorTotalComTaxas.toFixed(2)),
        taxaAdmTotal: Number(taxaAdmTotal.toFixed(2)),
        taxaAdmPercentual: Number(taxaAdmTotalPercentual),
        meses: n,
    };
}

/**
 * Simula o tempo necessário para acumular determinado valor investindo mensalmente
 * com rendimento de juros compostos (ex: Selic / 100% CDI).
 * FV = PMT * [((1 + i)^n - 1) / i] + PV * (1 + i)^n
 */
export function simularAcumulo({
    aporteMensal,
    taxaRendimentoMensalPercentual = 0.93,
    alvo,
    saldoInicial = 0,
    limiteMaxMeses = 240,
}) {
    const pmt = Number(aporteMensal);
    const target = Number(alvo);
    const i = (Number(taxaRendimentoMensalPercentual) || 0.93) / 100;
    let saldo = Number(saldoInicial) || 0;

    if (target <= 0) return { meses: 0, totalAportado: 0, rendimentoGanho: 0, saldoFinal: 0, evolucao: [] };
    if (saldo >= target) return { meses: 0, totalAportado: 0, rendimentoGanho: 0, saldoFinal: saldo, evolucao: [] };
    if (pmt <= 0) return { meses: Infinity, totalAportado: 0, rendimentoGanho: 0, saldoFinal: saldo, evolucao: [] };

    let meses = 0;
    let totalAportado = saldo;
    let totalRendimento = 0;
    const evolucao = [{ mes: 0, saldo: Number(saldo.toFixed(2)), rendimento: 0 }];

    while (saldo < target && meses < limiteMaxMeses) {
        meses++;
        const rendimentoMes = saldo * i;
        saldo += rendimentoMes + pmt;
        totalAportado += pmt;
        totalRendimento += rendimentoMes;

        if (meses <= 36 || meses % 6 === 0 || saldo >= target) {
            evolucao.push({
                mes: meses,
                saldo: Number(saldo.toFixed(2)),
                rendimento: Number(totalRendimento.toFixed(2)),
            });
        }
    }

    return {
        meses,
        totalAportado: Number(totalAportado.toFixed(2)),
        rendimentoGanho: Number(totalRendimento.toFixed(2)),
        saldoFinal: Number(saldo.toFixed(2)),
        evolucao,
    };
}

/**
 * Avalia o nível de segurança financeira de um determinado valor de parcela
 * em relação à renda líquida e à sobra mensal.
 */
export function avaliarSeguranca({
    valorParcela,
    salarioLiquido,
    sobraMensalEstimada,
}) {
    const parcela = Number(valorParcela) || 0;
    const salario = Number(salarioLiquido) || 1;
    const sobra = Number(sobraMensalEstimada) || 0;

    const percentualRenda = (parcela / salario) * 100;
    const sobraAposParcela = sobra - parcela;
    const percentualSobraRestante = salario > 0 ? (sobraAposParcela / salario) * 100 : 0;

    // Regra "Sem me apertar totalmente":
    // Seguro: Parcela até 25% da renda E ainda sobra pelo menos 10% da renda como folga
    if (percentualRenda <= 25 && percentualSobraRestante >= 10) {
        return {
            status: "seguro",
            rotulo: "Confortável (Sem aperto)",
            cor: "#10b981",
            icone: "✅",
            motivo: `A parcela consome ${percentualRenda.toFixed(1)}% da sua renda, mantendo uma folga de R$ ${sobraAposParcela.toFixed(2)} (${percentualSobraRestante.toFixed(1)}%) todo mês.`,
            percentualRenda: Number(percentualRenda.toFixed(1)),
            sobraAposParcela: Number(sobraAposParcela.toFixed(2)),
        };
    }

    // Moderado / Atenção: Parcela entre 25% e 35% da renda OU folga entre 3% e 10%
    if (percentualRenda <= 35 && sobraAposParcela >= 0) {
        return {
            status: "atencao",
            rotulo: "Moderado (Requer disciplina)",
            cor: "#f59e0b",
            icone: "⚠️",
            motivo: `A parcela consome ${percentualRenda.toFixed(1)}% da renda. Sua folga mensal restante será de R$ ${sobraAposParcela.toFixed(2)}. Não permite imprevistos sem usar a reserva.`,
            percentualRenda: Number(percentualRenda.toFixed(1)),
            sobraAposParcela: Number(sobraAposParcela.toFixed(2)),
        };
    }

    // Inviável / Alto Risco: Parcela > 35% da renda OU estoura o orçamento mensal
    return {
        status: "inviavel",
        rotulo: "Apertado / Risco de dívida",
        cor: "#ef4444",
        icone: "❌",
        motivo: sobraAposParcela < 0
            ? `A parcela de R$ ${parcela.toFixed(2)} excede sua sobra livre atual em R$ ${Math.abs(sobraAposParcela).toFixed(2)}, gerando déficit mensal!`
            : `A parcela consome ${percentualRenda.toFixed(1)}% da sua renda (acima do limite saudável de 30%).`,
        percentualRenda: Number(percentualRenda.toFixed(1)),
        sobraAposParcela: Number(sobraAposParcela.toFixed(2)),
    };
}

/**
 * Calcula a sobra mensal futura realista considerando a renda, essenciais fixos e
 * uma estimativa prudente de gastos variáveis mensais (média real do histórico).
 */
export function estimarSobraRealista({
    salario = 3000,
    essenciais = [],
    gastos = [],
}) {
    const salarioBase = Number(salario) > 0 ? Number(salario) : 3000;

    // Total de despesas fixas cadastradas
    const totalEssenciais = (essenciais || []).reduce(
        (acc, item) => acc + parseCurrency(item.valor),
        0
    );

    // Média de gastos variáveis com cartão nos últimos 3 meses (excluindo Mozi e aplicando 50% em dividido)
    const agora = new Date();
    const mesesAtras = [0, 1, 2].map((i) => {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        return { ano: d.getFullYear(), mes: d.getMonth() };
    });

    const somaGastosVariaveis = mesesAtras.reduce((total, { ano, mes }) => {
        const gastosDoMes = (gastos || []).filter((g) => {
            if (!g.data) return false;
            const dt = new Date(g.data.includes("T") ? g.data : `${g.data}T00:00:00`);
            return dt.getFullYear() === ano && dt.getMonth() === mes;
        });

        const somaMes = gastosDoMes.reduce((acc, g) => {
            const resp = (g.responsavel || "meu").toLowerCase();
            if (resp === "mozi") return acc;
            const fator = resp === "dividido" ? 0.5 : 1.0;
            return acc + parseCurrency(g.valor) * fator;
        }, 0);

        return total + somaMes;
    }, 0);

    const mediaGastosVariaveis = somaGastosVariaveis > 0
        ? Number((somaGastosVariaveis / mesesAtras.length).toFixed(2))
        : Number((salarioBase * 0.25).toFixed(2)); // estimativa prudente de 25% se não houver histórico

    // Sobra real estimada = Salário - Essenciais - Média Variável
    const sobraReal = Math.max(0, salarioBase - totalEssenciais - mediaGastosVariaveis);

    return {
        salarioBase,
        totalEssenciais,
        mediaGastosVariaveis,
        sobraReal: Number(sobraReal.toFixed(2)),
        sobra30: Number((sobraReal * 0.3).toFixed(2)), // ritmo conservador
        sobra50: Number((sobraReal * 0.5).toFixed(2)), // ritmo moderado
        sobra70: Number((sobraReal * 0.7).toFixed(2)), // ritmo acelerado
    };
}

/**
 * Gera a série cronológica mensal detalhada do cenário adotado (estilo tabela do Insights).
 * Permite visualização rica mês a mês em formato planilha ou cartões.
 */
export function gerarLinhaDoTempoCenario({
    cenario,
    valorAlvo,
    saldoInicial = 0,
    taxaSelicMensal = 0.93,
    dataInicio = new Date(),
}) {
    if (!cenario) return [];

    const target = Number(valorAlvo) || 30000;
    const iSelic = (Number(taxaSelicMensal) || 0.93) / 100;
    const baseDate = dataInicio instanceof Date ? dataInicio : new Date(dataInicio || Date.now());

    const linhas = [];
    let saldo = Number(saldoInicial) || 0;

    const mesesNomes = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];

    const getInfoDataMes = (mesOffset) => {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + mesOffset, 1);
        const diaFinal = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const strData = `${String(diaFinal).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
        const mesAno = `${mesesNomes[d.getMonth()]}/${d.getFullYear()}`;
        const anosDecorridos = Math.floor(mesOffset / 12);
        const mesesRest = mesOffset % 12;
        const tempoDecorrido = anosDecorridos > 0
            ? `${anosDecorridos}a ${mesesRest}m`
            : `${mesesRest}m`;

        return { strData, mesAno, tempoDecorrido };
    };

    // Mês 0: Ponto de partida
    const info0 = getInfoDataMes(0);
    linhas.push({
        numeroMes: 0,
        dataExibicao: info0.mesAno,
        dataCompletaStr: info0.strData,
        tempoDecorrido: "Início",
        aporteMes: 0,
        rendimentoMes: 0,
        saldoAcumulado: Number(saldo.toFixed(2)),
        percentualMeta: Math.min(100, Math.round((saldo / target) * 100)),
        evento: saldo > 0 ? "Saldo inicial já guardado" : "Início do planejamento",
        ehMesConquista: saldo >= target,
    });

    if (cenario.tipo === "avista") {
        const aporte = Number(cenario.aporteMensal) || 500;
        const totalMeses = Math.min(240, cenario.tempoMesesMedio || 36);

        for (let m = 1; m <= totalMeses; m++) {
            const rendimento = saldo * iSelic;
            saldo += rendimento + aporte;
            const pct = Math.min(100, Math.round((saldo / target) * 100));
            const ehConquista = m === totalMeses || saldo >= target;
            const info = getInfoDataMes(m);

            linhas.push({
                numeroMes: m,
                dataExibicao: info.mesAno,
                dataCompletaStr: info.strData,
                tempoDecorrido: info.tempoDecorrido,
                aporteMes: aporte,
                rendimentoMes: Number(rendimento.toFixed(2)),
                saldoAcumulado: Number(saldo.toFixed(2)),
                percentualMeta: pct,
                evento: ehConquista ? "🎉 Meta Atingida! Compra à vista com poder de desconto" : null,
                ehMesConquista: ehConquista,
            });

            if (saldo >= target && m >= totalMeses) break;
        }
    } else if (cenario.tipo === "hibrido") {
        const aporte = Number(cenario.aporteFasePoupanca) || 500;
        const mesesPoupando = cenario.mesesPoupando || 12;
        const prazoFin = cenario.prazoFinanciamento || 24;
        const parcelaFin = cenario.parcelaFinanciamento || 600;

        // Fase 1: Poupança
        for (let m = 1; m <= mesesPoupando; m++) {
            const rendimento = saldo * iSelic;
            saldo += rendimento + aporte;
            const pct = Math.min(100, Math.round((saldo / target) * 100));
            const info = getInfoDataMes(m);
            const ehMesCompra = m === mesesPoupando;

            linhas.push({
                numeroMes: m,
                dataExibicao: info.mesAno,
                dataCompletaStr: info.strData,
                tempoDecorrido: info.tempoDecorrido,
                aporteMes: aporte,
                rendimentoMes: Number(rendimento.toFixed(2)),
                saldoAcumulado: Number(saldo.toFixed(2)),
                percentualMeta: pct,
                evento: ehMesCompra ? "🚗 Compra do Bem! Pagamento da entrada e início do financiamento leve" : "Acúmulo de Entrada (CDI)",
                ehMesConquista: ehMesCompra,
            });
        }

        // Fase 2: Financiamento
        let saldoDevedor = Math.max(0, target - saldo);
        for (let f = 1; f <= prazoFin; f++) {
            const mTotal = mesesPoupando + f;
            const info = getInfoDataMes(mTotal);
            saldoDevedor = Math.max(0, saldoDevedor - (parcelaFin * 0.8));
            const ehQuitacao = f === prazoFin;

            linhas.push({
                numeroMes: mTotal,
                dataExibicao: info.mesAno,
                dataCompletaStr: info.strData,
                tempoDecorrido: info.tempoDecorrido,
                aporteMes: parcelaFin,
                rendimentoMes: 0,
                saldoAcumulado: target,
                saldoDevedor: Number(saldoDevedor.toFixed(2)),
                percentualMeta: 100,
                evento: ehQuitacao ? "🏆 Bem 100% Quitado sem dívidas!" : `Parcela Financiamento (${f}/${prazoFin})`,
                ehMesConquista: ehQuitacao,
                faseFinanciamento: true,
            });
        }
    } else if (cenario.tipo === "financiamento") {
        const mesesEntrada = cenario.mesesParaEntrada || 0;
        const aporteEntrada = cenario.aporteParaEntrada || 500;
        const prazo = cenario.prazoParcelas || 36;
        const parcela = cenario.parcela || 800;

        // Fase 1: Juntar entrada (se necessário)
        for (let m = 1; m <= mesesEntrada; m++) {
            const rendimento = saldo * iSelic;
            saldo += rendimento + aporteEntrada;
            const info = getInfoDataMes(m);
            const prontaEntrada = m === mesesEntrada;

            linhas.push({
                numeroMes: m,
                dataExibicao: info.mesAno,
                dataCompletaStr: info.strData,
                tempoDecorrido: info.tempoDecorrido,
                aporteMes: aporteEntrada,
                rendimentoMes: Number(rendimento.toFixed(2)),
                saldoAcumulado: Number(saldo.toFixed(2)),
                percentualMeta: Math.round((saldo / target) * 100),
                evento: prontaEntrada ? "Entrada Completa! Contratação do Financiamento" : "Poupança para Entrada",
                ehMesConquista: prontaEntrada,
            });
        }

        // Fase 2: Parcelamento
        for (let p = 1; p <= prazo; p++) {
            const mTotal = mesesEntrada + p;
            const info = getInfoDataMes(mTotal);
            const ehQuitacao = p === prazo;

            linhas.push({
                numeroMes: mTotal,
                dataExibicao: info.mesAno,
                dataCompletaStr: info.strData,
                tempoDecorrido: info.tempoDecorrido,
                aporteMes: parcela,
                rendimentoMes: 0,
                saldoAcumulado: target,
                percentualMeta: 100,
                evento: p === 1
                    ? "🚗 Aquisição Imediata do Bem com Financiamento"
                    : ehQuitacao
                    ? "🏆 Financiamento Totalmente Quitado!"
                    : `Parcela Fixa (${p}/${prazo})`,
                ehMesConquista: p === 1 || ehQuitacao,
                faseFinanciamento: true,
            });
        }
    } else if (cenario.tipo === "consorcio") {
        const meses = cenario.meses || 36;
        const parcela = cenario.parcela || 600;

        for (let m = 1; m <= meses; m++) {
            const info = getInfoDataMes(m);
            const pct = Math.min(100, Math.round((m / meses) * 100));
            const ehFim = m === meses;

            linhas.push({
                numeroMes: m,
                dataExibicao: info.mesAno,
                dataCompletaStr: info.strData,
                tempoDecorrido: info.tempoDecorrido,
                aporteMes: parcela,
                rendimentoMes: 0,
                saldoAcumulado: Number((parcela * m).toFixed(2)),
                percentualMeta: pct,
                evento: m === Math.round(meses / 2)
                    ? "🎲 Média estimada de contemplação por lance ou sorteio"
                    : ehFim
                    ? "🏆 Encerramento do Grupo de Consórcio"
                    : `Parcela Consórcio (${m}/${meses})`,
                ehMesConquista: m === Math.round(meses / 2) || ehFim,
            });
        }
    }

    return linhas;
}

/**
 * Gera todos os cenários matemáticos possíveis para a meta financeira informada.
 */
export function gerarTodosCenarios({
    meta,
    contextoFinanceiro,
}) {
    const {
        valorMin = 30000,
        valorMax = 40000,
        valorJaGuardado = 0,
        categoria = "veiculo",
        premissas = {},
        aceitaFinanciamento = true,
        aceitaConsorcio = true,
        cenarioAdotadoId = null,
    } = meta || {};

    const min = Number(valorMin) || 10000;
    const max = Number(valorMax) || min;
    const medio = Number(((min + max) / 2).toFixed(2));
    const jaGuardado = Number(valorJaGuardado) || 0;

    const padraoCategoria = TAXAS_PADRAO_CATEGORIA[categoria] || TAXAS_PADRAO_CATEGORIA.outro;

    // Taxa de financiamento personalizada ou padrão
    const taxaFinanciamentoMensal = premissas.taxaFinanciamentoMensal !== undefined && premissas.taxaFinanciamentoMensal !== null
        ? Number(premissas.taxaFinanciamentoMensal)
        : padraoCategoria.taxaFinanciamentoMensal;

    const taxaAdmConsorcioTotal = premissas.taxaAdmConsorcioTotal !== undefined && premissas.taxaAdmConsorcioTotal !== null
        ? Number(premissas.taxaAdmConsorcioTotal)
        : padraoCategoria.taxaAdmConsorcioTotal;

    const taxaRendimentoSelic = contextoFinanceiro?.taxaSelicMensal || 0.93;
    const salario = contextoFinanceiro?.salario || 3000;
    const sobraReal = contextoFinanceiro?.sobraReal || 800;

    const cenarios = {
        metaValores: { min, max, medio, jaGuardado },
        taxasAplicadas: {
            financiamentoMensal: taxaFinanciamentoMensal,
            consorcioTotal: taxaAdmConsorcioTotal,
            selicRendimento: taxaRendimentoSelic,
        },
        aVista: [],
        financiamento: [],
        hibrido: [],
        consorcio: [],
        recomendacaoRapida: null,
        cenarioPrincipal: null,
    };

    // -------------------------------------------------------------
    // 1. Cenários À VISTA (Guardar e comprar com desconto)
    // -------------------------------------------------------------
    const ritmos = [
        { id: "conservador", nome: "Conservador (30% da sobra)", percentualSobra: 0.30 },
        { id: "moderado", nome: "Moderado (50% da sobra)", percentualSobra: 0.50 },
        { id: "acelerado", nome: "Focado (70% da sobra)", percentualSobra: 0.70 },
    ];

    ritmos.forEach((ritmo) => {
        const aporte = Math.max(50, Number((sobraReal * ritmo.percentualSobra).toFixed(2)));
        const simMin = simularAcumulo({
            aporteMensal: aporte,
            taxaRendimentoMensalPercentual: taxaRendimentoSelic,
            alvo: min,
            saldoInicial: jaGuardado,
        });

        const simMedio = simularAcumulo({
            aporteMensal: aporte,
            taxaRendimentoMensalPercentual: taxaRendimentoSelic,
            alvo: medio,
            saldoInicial: jaGuardado,
        });

        const simMax = simularAcumulo({
            aporteMensal: aporte,
            taxaRendimentoMensalPercentual: taxaRendimentoSelic,
            alvo: max,
            saldoInicial: jaGuardado,
        });

        const seguranca = avaliarSeguranca({
            valorParcela: aporte,
            salarioLiquido: salario,
            sobraMensalEstimada: sobraReal,
        });

        const prazoFormatado = formatarPrazoMesesEAnos(simMedio.meses);

        cenarios.aVista.push({
            id: `avista-${ritmo.id}`,
            tipo: "avista",
            ritmo: ritmo.id,
            titulo: `À Vista — ${ritmo.nome}`,
            aporteMensal: aporte,
            tempoMesesMin: simMin.meses,
            tempoMesesMedio: simMedio.meses,
            tempoMesesMax: simMax.meses,
            mesesTotalConquista: simMedio.meses,
            prazoFormatado,
            rendimentoGanhoMedio: simMedio.rendimentoGanho,
            totalEconomizadoJuros: Number((calcularPrice({ valor: medio - jaGuardado, taxaMensalPercentual: taxaFinanciamentoMensal, meses: 36 }).jurosTotal).toFixed(2)),
            seguranca,
            descricao: `Você guarda R$ ${aporte.toFixed(2)}/mês com rendimento aproximado de 100% do CDI (${taxaRendimentoSelic}% a.m.). Conquista o valor médio em ${prazoFormatado.textoCompleto} sem pagar juros.`,
        });
    });

    // -------------------------------------------------------------
    // 2. Cenários de ENTRADA + FINANCIAMENTO
    // -------------------------------------------------------------
    if (aceitaFinanciamento) {
        const entradasPercentuais = [0.20, 0.35, 0.50];
        const prazos = padraoCategoria.prazosSugeridos || [24, 36, 48];

        entradasPercentuais.forEach((pctEntrada) => {
            const valorEntradaMedio = Number((medio * pctEntrada).toFixed(2));
            const valorFinanciadoMedio = medio - valorEntradaMedio;

            // Tempo para juntar a entrada se o valor já guardado for menor que ela
            const faltaEntrada = Math.max(0, valorEntradaMedio - jaGuardado);
            const aporteParaEntrada = Math.max(100, Number((sobraReal * 0.5).toFixed(2)));
            const mesesParaEntrada = faltaEntrada > 0
                ? simularAcumulo({
                    aporteMensal: aporteParaEntrada,
                    taxaRendimentoMensalPercentual: taxaRendimentoSelic,
                    alvo: faltaEntrada,
                }).meses
                : 0;

            prazos.forEach((nMeses) => {
                const simPrice = calcularPrice({
                    valor: valorFinanciadoMedio,
                    taxaMensalPercentual: taxaFinanciamentoMensal,
                    meses: nMeses,
                });

                const seguranca = avaliarSeguranca({
                    valorParcela: simPrice.parcela,
                    salarioLiquido: salario,
                    sobraMensalEstimada: sobraReal,
                });

                const mesesTotal = mesesParaEntrada + nMeses;
                const prazoFormatado = formatarPrazoMesesEAnos(mesesTotal);

                cenarios.financiamento.push({
                    id: `finan-${Math.round(pctEntrada * 100)}ent-${nMeses}m`,
                    tipo: "financiamento",
                    titulo: `Entrada ${(pctEntrada * 100)}% + ${nMeses}x`,
                    percentualEntrada: pctEntrada * 100,
                    valorEntrada: valorEntradaMedio,
                    valorFinanciado: valorFinanciadoMedio,
                    mesesParaJuntarEntrada: mesesParaEntrada,
                    prazoEntradaFormatado: mesesParaEntrada > 0 ? formatarPrazoMesesEAnos(mesesParaEntrada) : null,
                    aporteParaEntrada,
                    prazoParcelas: nMeses,
                    mesesTotalConquista: mesesTotal,
                    prazoFormatado,
                    parcela: simPrice.parcela,
                    totalPago: valorEntradaMedio + simPrice.totalPago,
                    jurosTotal: simPrice.jurosTotal,
                    taxaMensal: taxaFinanciamentoMensal,
                    seguranca,
                    destaque: pctEntrada === 0.35 && nMeses === 36 ? "Equilíbrio Custo/Prazo" : null,
                });
            });
        });
    }

    // -------------------------------------------------------------
    // 3. Cenários HÍBRIDOS (Juntar entrada robusta para parcelas mínimas)
    // -------------------------------------------------------------
    if (aceitaFinanciamento) {
        [6, 12].forEach((mesesPoupando) => {
            const aporte = Number((sobraReal * 0.6).toFixed(2));
            const acumuloPre = simularAcumulo({
                aporteMensal: aporte,
                taxaRendimentoMensalPercentual: taxaRendimentoSelic,
                alvo: medio,
                saldoInicial: jaGuardado,
            });

            const saldoAposNMeses = acumuloPre.evolucao.find((e) => e.mes === mesesPoupando)?.saldo || (jaGuardado + aporte * mesesPoupando);
            const entradaGerada = Math.min(saldoAposNMeses, medio * 0.7);
            const saldoRestanteFinanciar = Math.max(0, medio - entradaGerada);

            const prazoCurto = 24;
            const simPrice = calcularPrice({
                valor: saldoRestanteFinanciar,
                taxaMensalPercentual: taxaFinanciamentoMensal,
                meses: prazoCurto,
            });

            const seguranca = avaliarSeguranca({
                valorParcela: simPrice.parcela,
                salarioLiquido: salario,
                sobraMensalEstimada: sobraReal,
            });

            const mesesTotal = mesesPoupando + prazoCurto;
            const prazoFormatado = formatarPrazoMesesEAnos(mesesTotal);
            const prazoFase1Formatado = formatarPrazoMesesEAnos(mesesPoupando);

            cenarios.hibrido.push({
                id: `hibrido-${mesesPoupando}m-poupando`,
                tipo: "hibrido",
                titulo: `Plano Híbrido: Poupar ${mesesPoupando} meses + Financiar ${prazoCurto}x`,
                mesesPoupando,
                prazoFase1Formatado,
                aporteFasePoupanca: aporte,
                entradaAlcancada: Number(entradaGerada.toFixed(2)),
                saldoFinanciado: Number(saldoRestanteFinanciar.toFixed(2)),
                prazoFinanciamento: prazoCurto,
                mesesTotalConquista: mesesTotal,
                prazoFormatado,
                parcelaFinanciamento: simPrice.parcela,
                jurosTotal: simPrice.jurosTotal,
                totalPago: Number((entradaGerada + simPrice.totalPago).toFixed(2)),
                seguranca,
                descricao: `Você junta R$ ${aporte.toFixed(2)}/mês durante ${prazoFase1Formatado.anosTexto} (acumulando R$ ${entradaGerada.toLocaleString("pt-BR")}). Depois financia o resto em ${prazoCurto}x leves de R$ ${simPrice.parcela.toFixed(2)}, concluindo em ${prazoFormatado.textoCompleto}.`,
            });
        });
    }

    // -------------------------------------------------------------
    // 4. Cenários de CONSÓRCIO (Sem juros bancários, mas com taxa de administração)
    // -------------------------------------------------------------
    if (aceitaConsorcio) {
        const prazosConsorcio = padraoCategoria.prazosSugeridos.filter((p) => p >= 36) || [36, 48, 60];
        prazosConsorcio.forEach((mesesCons) => {
            const simCons = simularConsorcio({
                valor: medio,
                taxaAdmTotalPercentual: taxaAdmConsorcioTotal,
                meses: mesesCons,
            });

            const seguranca = avaliarSeguranca({
                valorParcela: simCons.parcela,
                salarioLiquido: salario,
                sobraMensalEstimada: sobraReal,
            });

            const prazoFormatado = formatarPrazoMesesEAnos(mesesCons);

            cenarios.consorcio.push({
                id: `consorcio-${mesesCons}m`,
                tipo: "consorcio",
                titulo: `Consórcio em ${mesesCons} meses`,
                parcela: simCons.parcela,
                totalPago: simCons.totalPago,
                taxaAdmTotal: simCons.taxaAdmTotal,
                taxaAdmPercentual: taxaAdmConsorcioTotal,
                meses: mesesCons,
                mesesTotalConquista: mesesCons,
                prazoFormatado,
                seguranca,
                estrategiaLance: jaGuardado > 0
                    ? `Você já possui R$ ${jaGuardado.toLocaleString("pt-BR")} que pode ser ofertado como lance livre para acelerar a contemplação.`
                    : "Sem lance inicial: depende de sorteio mensal ou acúmulo de sobras para ofertar lance futuro.",
            });
        });
    }

    // Determinar o melhor cenário confortável custo-benefício
    const todosCenarios = [
        ...cenarios.aVista,
        ...cenarios.hibrido,
        ...cenarios.financiamento,
        ...cenarios.consorcio,
    ];

    const seguros = todosCenarios.filter((c) => c.seguranca.status === "seguro");
    if (seguros.length > 0) {
        seguros.sort((a, b) => {
            const jurosA = a.jurosTotal || a.taxaAdmTotal || 0;
            const jurosB = b.jurosTotal || b.taxaAdmTotal || 0;
            return jurosA - jurosB;
        });
        cenarios.recomendacaoRapida = seguros[0];
    } else {
        const moderados = todosCenarios.filter((c) => c.seguranca.status === "atencao");
        cenarios.recomendacaoRapida = moderados.length > 0 ? moderados[0] : todosCenarios[0];
    }

    // Identifica o Cenário Principal (o adotado pelo usuário, ou na falta dele a recomendação)
    if (cenarioAdotadoId) {
        const encontrado = todosCenarios.find((c) => c.id === cenarioAdotadoId);
        cenarios.cenarioPrincipal = encontrado || cenarios.recomendacaoRapida;
    } else {
        cenarios.cenarioPrincipal = cenarios.recomendacaoRapida;
    }

    return cenarios;
}
