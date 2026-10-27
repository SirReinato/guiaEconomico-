import { DADOS_HISTORICOS_INICIAIS } from "./reservaHistoricoData.js";

export const NOMES_MESES = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
];

/**
 * Data de nascimento do usuário: 05/09/1997.
 * Calcula a idade com uma casa decimal (ex: 29.0, 29.1...).
 */
export function calcularIdade(dataStr) {
    const data = new Date(dataStr + "T12:00:00");
    const anos = data.getFullYear() - 1997;
    // Setembro é mês index 8
    const fracaoMeses = (data.getMonth() - 8) / 12;
    return Number((anos + fracaoMeses).toFixed(1));
}

/**
 * Calcula os anos decorridos desde o início da planilha em 01/09/2021.
 */
export function calcularAnoDecorrido(dataStr, anoBase = 2021) {
    const data = new Date(dataStr + "T12:00:00");
    const anos = data.getFullYear() - anoBase;
    const fracaoMeses = (data.getMonth() - 8 + 1) / 12;
    return Number(Math.max(0.1, anos + fracaoMeses).toFixed(1));
}

/**
 * Retorna a chave YYYY-MM do mês anterior.
 */
export function getMesAnteriorChave(chave) {
    if (!chave || typeof chave !== "string") return "";
    const [anoStr, mesStr] = chave.split("-");
    let ano = parseInt(anoStr, 10);
    let mes = parseInt(mesStr, 10) - 1;
    if (mes < 1) {
        mes = 12;
        ano--;
    }
    return `${ano}-${String(mes).padStart(2, "0")}`;
}

/**
 * Retorna a chave YYYY-MM do mês seguinte.
 */
export function getMesSeguinteChave(chave) {
    if (!chave || typeof chave !== "string") return "";
    const [anoStr, mesStr] = chave.split("-");
    let ano = parseInt(anoStr, 10);
    let mes = parseInt(mesStr, 10) + 1;
    if (mes > 12) {
        mes = 1;
        ano++;
    }
    return `${ano}-${String(mes).padStart(2, "0")}`;
}

/**
 * Gera a série completa mensal da Reserva de Emergência.
 * Para Renato: inicia em 01/09/2021 com os dados históricos até 2097.
 * Para Ingrid: inicia do zero a partir do mês atual (Outubro/2026) até 2097.
 */
export function gerarProjecaoReserva({
    salarioMensal = 3000,
    saldoSobraMes = null,
    taxaSelicMensal = 0.0093,
    configManual = {},
    mesReferencia = new Date(),
    mapaProjecoes = {},
    totalEssenciais = 0,
    isIngrid = false,
} = {}) {
    const salario = Number(salarioMensal) > 0 ? Number(salarioMensal) : 3000;
    const meta6Meses = salario * 6;

    const anoRef = mesReferencia ? mesReferencia.getFullYear() : new Date().getFullYear();
    const mesRefIndex = mesReferencia ? mesReferencia.getMonth() : new Date().getMonth();
    const chaveMesAtual = `${anoRef}-${String(mesRefIndex + 1).padStart(2, "0")}`;
    const chaveMesSeguinte = getMesSeguinteChave(chaveMesAtual);

    const taxaPadrao =
        configManual?.taxaManual !== undefined && configManual?.taxaManual !== null && configManual.taxaManual > 0
            ? Math.pow(1 + configManual.taxaManual / 100, 1 / 12) - 1
            : taxaSelicMensal || 0.0093;

    const poupancaPadraoFutura =
        configManual?.poupancaFixa !== undefined &&
        configManual?.poupancaFixa !== null &&
        configManual.poupancaFixa !== ""
            ? Number(configManual.poupancaFixa)
            : totalEssenciais > 0
            ? Number(Math.max(0, salario - totalEssenciais).toFixed(2))
            : saldoSobraMes !== null && saldoSobraMes !== undefined && Number(saldoSobraMes) > 0
            ? Number(saldoSobraMes)
            : Number((salario * 0.4).toFixed(2));

    const linhas = [];

    let anoCursor;
    let mesCursorIndex;
    let valorAnterior;

    if (isIngrid) {
        // Ingrid começa do zero no mês de Outubro/2026 (ou mês ativo)
        const mesInicioAno = 2026;
        const mesInicioIndex = 9; // Outubro
        const strMesInicio = String(mesInicioIndex + 1).padStart(2, "0");
        const dataInicioStr = `${mesInicioAno}-${strMesInicio}-01`;
        const chaveInicio = `${mesInicioAno}-${strMesInicio}`;

        const saldoInicialConfig =
            configManual?.saldoReal !== undefined && configManual?.saldoReal !== null
                ? Number(configManual.saldoReal)
                : 0;

        const ehMesAtualInicio = chaveInicio === chaveMesAtual;
        const poupancaInicial = saldoSobraMes !== null && Number.isFinite(Number(saldoSobraMes))
            ? Number(saldoSobraMes)
            : poupancaPadraoFutura;

        const valorFinalInicio = saldoInicialConfig > 0 ? saldoInicialConfig : Math.max(0, poupancaInicial);
        const rendimentoInicio = Number(configManual?.rendimentoManual || 0);

        linhas.push({
            data: dataInicioStr,
            mes: NOMES_MESES[mesInicioIndex],
            valorInicial: 0,
            poupanca: poupancaInicial,
            taxa: taxaPadrao,
            valorFinal: valorFinalInicio,
            rendimento: rendimentoInicio,
            anoDecorrido: 0.1,
            idade: calcularIdade(dataInicioStr),
            ehHistorico: false,
            ehMesAtual: ehMesAtualInicio,
            mesesProtegidos: salario > 0 ? Number((valorFinalInicio / salario).toFixed(2)) : 0,
            statusMeta: classificarStatusMeta(valorFinalInicio, meta6Meses),
        });

        anoCursor = mesInicioAno;
        mesCursorIndex = mesInicioIndex + 1;
        if (mesCursorIndex > 11) {
            mesCursorIndex = 0;
            anoCursor++;
        }
        valorAnterior = valorFinalInicio;
    } else {
        // Renato: Carrega os dados históricos conhecidos (2021 - 2026)
        for (let i = 0; i < DADOS_HISTORICOS_INICIAIS.length; i++) {
            const item = { ...DADOS_HISTORICOS_INICIAIS[i] };
            const chaveItem = item.data.slice(0, 7);
            const ehMesAtual = chaveItem === chaveMesAtual;

            if (ehMesAtual && configManual?.saldoReal !== undefined && configManual?.saldoReal !== null) {
                item.valorFinal = Number(configManual.saldoReal);
                if (configManual?.rendimentoManual !== undefined && configManual?.rendimentoManual !== null) {
                    item.rendimento = Number(configManual.rendimentoManual);
                }
            }

            const mesesProtegidos = salario > 0 ? Number((item.valorFinal / salario).toFixed(2)) : 0;
            const statusMeta = classificarStatusMeta(item.valorFinal, meta6Meses);

            linhas.push({
                ...item,
                ehHistorico: true,
                ehMesAtual,
                mesesProtegidos,
                statusMeta,
            });
        }

        const ultimaLinhaHistorica = linhas[linhas.length - 1];
        const ultimaData = new Date(ultimaLinhaHistorica.data + "T12:00:00");

        anoCursor = ultimaData.getFullYear();
        mesCursorIndex = ultimaData.getMonth() + 1;

        if (mesCursorIndex > 11) {
            mesCursorIndex = 0;
            anoCursor++;
        }

        valorAnterior = ultimaLinhaHistorica.valorFinal;
    }

    // Projeta até os 100 anos: 01/09/2097
    while (anoCursor < 2097 || (anoCursor === 2097 && mesCursorIndex <= 8)) {
        const strMes = String(mesCursorIndex + 1).padStart(2, "0");
        const dataStr = `${anoCursor}-${strMes}-01`;
        const chaveItem = `${anoCursor}-${strMes}`;
        const chaveMesAnterior = getMesAnteriorChave(chaveItem);
        const ehMesAtual = chaveItem === chaveMesAtual;
        const ehMesSeguinteAoAtual = chaveItem === chaveMesSeguinte;

        let valorInicial = valorAnterior;
        let poupanca = poupancaPadraoFutura;
        let taxa = taxaPadrao;

        const aporteConfirmado =
            configManual?.aportesConfirmados?.[chaveItem] ||
            configManual?.aportesConfirmados?.[chaveMesAnterior];

        if (aporteConfirmado && aporteConfirmado.sobra !== undefined && aporteConfirmado.sobra !== null) {
            poupanca = Number(aporteConfirmado.sobra);
        } else if (ehMesAtual) {
            if (saldoSobraMes !== null && saldoSobraMes !== undefined && Number.isFinite(Number(saldoSobraMes))) {
                poupanca = Number(saldoSobraMes);
            }
        } else if (ehMesSeguinteAoAtual) {
            if (saldoSobraMes !== null && saldoSobraMes !== undefined && Number.isFinite(Number(saldoSobraMes))) {
                poupanca = Number(saldoSobraMes);
            } else if (mapaProjecoes[chaveMesAnterior] !== undefined && Number.isFinite(Number(mapaProjecoes[chaveMesAnterior]))) {
                poupanca = Number(mapaProjecoes[chaveMesAnterior]);
            }
        } else if (mapaProjecoes[chaveMesAnterior] !== undefined && Number.isFinite(Number(mapaProjecoes[chaveMesAnterior]))) {
            poupanca = Number(mapaProjecoes[chaveMesAnterior]);
        } else if (mapaProjecoes[chaveItem] !== undefined && Number.isFinite(Number(mapaProjecoes[chaveItem]))) {
            poupanca = Number(mapaProjecoes[chaveItem]);
        }

        const baseParaRendimento = Math.max(0, valorInicial + poupanca);
        let rendimento = Number((baseParaRendimento * taxa).toFixed(2));
        let valorFinal = Number(Math.max(0, valorInicial + poupanca + rendimento).toFixed(2));

        if (ehMesAtual && configManual?.saldoReal !== undefined && configManual?.saldoReal !== null) {
            valorFinal = Number(configManual.saldoReal);
            if (configManual?.rendimentoManual !== undefined && configManual?.rendimentoManual !== null) {
                rendimento = Number(configManual.rendimentoManual);
            }
        }

        const idade = calcularIdade(dataStr);
        const anoDecorrido = calcularAnoDecorrido(dataStr, isIngrid ? 2026 : 2021);
        const mesesProtegidos = salario > 0 ? Number((valorFinal / salario).toFixed(2)) : 0;
        const statusMeta = classificarStatusMeta(valorFinal, meta6Meses);

        linhas.push({
            data: dataStr,
            mes: NOMES_MESES[mesCursorIndex],
            valorInicial,
            poupanca,
            taxa,
            valorFinal,
            rendimento,
            anoDecorrido,
            idade,
            ehHistorico: false,
            ehMesAtual,
            mesesProtegidos,
            statusMeta,
        });

        valorAnterior = valorFinal;

        mesCursorIndex++;
        if (mesCursorIndex > 11) {
            mesCursorIndex = 0;
            anoCursor++;
        }
    }

    // Extrair métricas consolidadas e marcos
    const linhaAtual = linhas.find((l) => l.ehMesAtual) || linhas.find((l) => l.data.startsWith(chaveMesAtual)) || linhas[0];
    const estaProtegidoNoMesAtual = linhaAtual ? (linhaAtual.valorFinal >= meta6Meses) : false;

    let marco6Meses = null;
    if (estaProtegidoNoMesAtual) {
        const marcoPassado = linhas.find((l) => l.valorFinal >= meta6Meses);
        if (marcoPassado) {
            marco6Meses = {
                atingido: true,
                data: marcoPassado.data,
                mes: marcoPassado.mes,
                idade: marcoPassado.idade,
                valorFinal: marcoPassado.valorFinal,
            };
        }
    } else {
        const marcoFuturo = linhas.find((l) => l.data >= linhaAtual?.data && l.valorFinal >= meta6Meses);
        if (marcoFuturo) {
            marco6Meses = {
                atingido: false,
                data: marcoFuturo.data,
                mes: marcoFuturo.mes,
                idade: marcoFuturo.idade,
                valorFinal: marcoFuturo.valorFinal,
            };
        }
    }

    const primeiroMesMilhao = linhas.find((l) => l.valorFinal >= 1000000);

    const marcos = {
        meta6Meses: marco6Meses,
        milhao1: primeiroMesMilhao ? {
            data: primeiroMesMilhao.data,
            mes: primeiroMesMilhao.mes,
            idade: primeiroMesMilhao.idade,
            valorFinal: primeiroMesMilhao.valorFinal,
        } : null,
        milhao2: encontrarPrimeiroAcimaDe(linhas, 2000000),
        milhao3: encontrarPrimeiroAcimaDe(linhas, 3000000),
        milhao5: encontrarPrimeiroAcimaDe(linhas, 5000000),
        milhao10: encontrarPrimeiroAcimaDe(linhas, 10000000),
    };

    const saldoAtual = linhaAtual?.valorFinal || 0;
    const rendimentoAtual = linhaAtual?.rendimento || 0;
    const mesesProtegidosAtual = salario > 0 ? Number((saldoAtual / salario).toFixed(2)) : 0;
    const porcentagemMeta6Meses = Math.min(100, Math.round((saldoAtual / meta6Meses) * 100));

    return {
        linhas,
        salario,
        meta6Meses,
        saldoAtual,
        rendimentoAtual,
        mesesProtegidosAtual,
        porcentagemMeta6Meses,
        linhaAtual,
        marcos,
        taxaSelicMensal: taxaPadrao,
    };
}

function encontrarPrimeiroAcimaDe(linhas, valor) {
    const item = linhas.find((l) => l.valorFinal >= valor);
    if (!item) return null;
    return {
        data: item.data,
        mes: item.mes,
        idade: item.idade,
        valorFinal: item.valorFinal,
    };
}

export function classificarStatusMeta(valorFinal, meta6Meses) {
    if (valorFinal >= 2000000) {
        const milhoes = Math.floor(valorFinal / 1000000);
        return {
            tipo: "multimilhao",
            label: `${milhoes}M 💎`,
            corTexto: "#38bdf8",
            corFundo: "rgba(56, 189, 248, 0.15)",
            corBorda: "#0284c7",
            milhoes,
        };
    }

    if (valorFinal >= 1000000) {
        return {
            tipo: "milhao",
            label: "1º Milhão 🏆",
            corTexto: "#c084fc",
            corFundo: "rgba(192, 132, 252, 0.18)",
            corBorda: "#9333ea",
            milhoes: 1,
        };
    }

    if (valorFinal >= meta6Meses) {
        return {
            tipo: "protegido",
            label: "Protegido 🛡️",
            corTexto: "#34d399",
            corFundo: "rgba(52, 211, 153, 0.15)",
            corBorda: "#10b981",
        };
    }

    return {
        tipo: "abaixo",
        label: "Em Construção 🏗️",
        corTexto: "#fbbf24",
        corFundo: "rgba(251, 191, 36, 0.12)",
        corBorda: "#d97706",
    };
}
