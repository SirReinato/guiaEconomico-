import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
    getGastos,
    adicionarGastoAPI,
    atualizarGastoAPI,
    removerGastoAPI,
    getGastosReembolsoMoziAPI,
    getGastosReembolsoIngridAPI,
    getCartoesPersonalizadosAPI,
    salvarCartoesPersonalizadosAPI,
    getFaturasItauAPI,
    salvarFaturaItauMesAPI,
    getParcelamentosFaturaAPI,
    salvarParcelamentosFaturaAPI,
    removerGastosPorParcelamentoAPI,
} from "../services/gastosService";
import {
    getAssinaturasAPI,
    adicionarAssinaturaAPI,
    atualizarAssinaturaAPI,
    cancelarAssinaturaAPI,
    reativarAssinaturaAPI,
    removerAssinaturaAPI,
    getAssinaturasReembolsoParceiroAPI,
} from "../services/assinaturasService";
import { parseCurrency } from "../utils/currencyUtils";
import { useMes } from "./MesContext";
import { useAuth } from "./AuthContext";

const GastosContext = createContext();

const CARTOES_PADRAO_RENATO = [
    { id: "Nubank", nome: "Nubank", cor: "#820ad1", icone: "🟣", diaFechamento: 30 },
    { id: "Banco do Brasil", nome: "Banco do Brasil", cor: "#eab308", icone: "🟡", diaFechamento: 27 },
    { id: "Picpay", nome: "Picpay", cor: "#10b981", icone: "🟢", diaFechamento: 30 },
];

export function GastosProvider({ children }) {
    const { perfilAtivo } = useAuth() || {};
    const perfil = perfilAtivo || "renato";
    const isIngrid = perfil === "ingrid";

    const [gastos, setGastos] = useState([]);
    const [gastosReembolsoRenato, setGastosReembolsoRenato] = useState([]);
    const [gastosReembolsoIngrid, setGastosReembolsoIngrid] = useState([]);
    const [cartoesPersonalizados, setCartoesPersonalizados] = useState([]);
    const [faturasItau, setFaturasItau] = useState({});

    // Assinaturas e Recorrências
    const [assinaturas, setAssinaturas] = useState([]);
    const [assinaturasReembolsoParceiro, setAssinaturasReembolsoParceiro] = useState([]);

    // Acordos de parcelamento de fatura ("Apertou a Fatura")
    const [parcelamentosFatura, setParcelamentosFatura] = useState({});

    const { mesReferencia } = useMes() || {};

    // 1. Carrega dados do perfil atual e dados cruzados integrados
    useEffect(() => {
        let isMounted = true;
        async function carregar() {
            const [
                meusGastos,
                faturasItauRemotas,
                minhasAssinaturas,
                meusParcelamentos,
            ] = await Promise.all([
                getGastos(perfil),
                getFaturasItauAPI(),
                getAssinaturasAPI(perfil),
                getParcelamentosFaturaAPI(perfil),
            ]);

            if (!isMounted) return;
            setGastos(meusGastos);
            if (faturasItauRemotas) setFaturasItau(faturasItauRemotas);
            setAssinaturas(minhasAssinaturas || []);
            setParcelamentosFatura(meusParcelamentos || {});

            if (isIngrid) {
                const [reembolsos, cartoesIngrid, assinaturasRenato] = await Promise.all([
                    getGastosReembolsoMoziAPI(),
                    getCartoesPersonalizadosAPI("ingrid"),
                    getAssinaturasReembolsoParceiroAPI("renato"),
                ]);
                if (isMounted) {
                    setGastosReembolsoRenato(reembolsos);
                    setCartoesPersonalizados(cartoesIngrid || []);
                    setAssinaturasReembolsoParceiro(assinaturasRenato || []);
                }
            } else {
                const [reembolsosIngrid, assinaturasIngrid] = await Promise.all([
                    getGastosReembolsoIngridAPI(),
                    getAssinaturasReembolsoParceiroAPI("ingrid"),
                ]);
                if (isMounted) {
                    setGastosReembolsoIngrid(reembolsosIngrid);
                    setGastosReembolsoRenato([]);
                    setAssinaturasReembolsoParceiro(assinaturasIngrid || []);
                }
            }
        }
        carregar();

        return () => {
            isMounted = false;
        };
    }, [perfil, isIngrid]);

    // Calcula chave do mês (YYYY-MM)
    const getChaveMes = useCallback((ref = mesReferencia) => {
        const d = ref || new Date();
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        return `${ano}-${mes}`;
    }, [mesReferencia]);

    // Lista de cartões ativos do usuário
    const cartoesAtivos = useMemo(() => {
        if (!isIngrid) {
            const lista = [...CARTOES_PADRAO_RENATO];
            // Se houver lançamentos ou acordos da Ingrid a reembolsar pelo Renato, exibe cartão integrado
            const temReembolsoIngrid =
                (gastosReembolsoIngrid || []).length > 0 ||
                (assinaturasReembolsoParceiro || []).length > 0;
            if (temReembolsoIngrid) {
                lista.push({
                    id: "Cartões da Ingrid",
                    nome: "Cartões da Ingrid (A Pagar)",
                    cor: "#ec4899",
                    icone: "💳",
                    diaFechamento: 30,
                    integrado: true,
                });
            }
            return lista;
        }

        const lista = [...cartoesPersonalizados];

        // Adiciona Cartão Itaú
        lista.push({
            id: "Itaú",
            nome: "Itaú",
            cor: "#ea580c",
            icone: "🟧",
            diaFechamento: 30,
            integrado: true,
        });

        // Adiciona Cartões do Renato (A Pagar)
        lista.push({
            id: "Cartões do Renato",
            nome: "Cartões do Renato (A Pagar)",
            cor: "#820ad1",
            icone: "💳",
            diaFechamento: 30,
            integrado: true,
        });

        return lista;
    }, [isIngrid, cartoesPersonalizados, gastosReembolsoIngrid, assinaturasReembolsoParceiro]);

    // Mapeamento de fechamentos
    const fechamentosPorCartao = useMemo(() => {
        const mapa = {
            Nubank: 30,
            Picpay: 30,
            "Banco do Brasil": 27,
            "Itaú": 30,
            "Cartões do Renato": 30,
            "Cartões da Ingrid": 30,
        };
        cartoesAtivos.forEach((c) => {
            mapa[c.id] = c.diaFechamento || 30;
            mapa[c.nome] = c.diaFechamento || 30;
        });
        return mapa;
    }, [cartoesAtivos]);

    // Adicionar Cartão Personalizado
    const adicionarCartaoPersonalizado = async (novoCartao) => {
        const cartaoFormatado = {
            id: novoCartao.id || novoCartao.nome?.trim(),
            nome: novoCartao.nome?.trim(),
            diaFechamento: parseInt(novoCartao.diaFechamento, 10) || 30,
            cor: novoCartao.cor || "#00b3ff",
            icone: novoCartao.icone || "💳",
        };
        const novaLista = [...cartoesPersonalizados, cartaoFormatado];
        setCartoesPersonalizados(novaLista);
        await salvarCartoesPersonalizadosAPI(novaLista, perfil);
        return cartaoFormatado;
    };

    // Remover Cartão Personalizado
    const removerCartaoPersonalizado = async (cartaoId) => {
        const novaLista = cartoesPersonalizados.filter((c) => c.id !== cartaoId && c.nome !== cartaoId);
        setCartoesPersonalizados(novaLista);
        await salvarCartoesPersonalizadosAPI(novaLista, perfil);
    };

    // Salvar Fatura Itaú do Mês
    const salvarFaturaItauMes = async (chaveMes, valor) => {
        const atualizadas = await salvarFaturaItauMesAPI(chaveMes, valor);
        if (atualizadas) {
            setFaturasItau(atualizadas);
        }
    };

    // Calcula a data para cada mês seguinte de uma parcela
    function calcularDataParcela(dataBaseStr, mesesAFrente) {
        if (!dataBaseStr || mesesAFrente === 0) return dataBaseStr;

        const [anoStr, mesStr, diaStr] = dataBaseStr.split("-");
        const ano = parseInt(anoStr, 10);
        const mes = parseInt(mesStr, 10) - 1;
        const dia = parseInt(diaStr, 10);

        const totalMeses = mes + mesesAFrente;
        const novoAno = ano + Math.floor(totalMeses / 12);
        const novoMes = totalMeses % 12;

        const ultimoDiaDoMes = new Date(novoAno, novoMes + 1, 0).getDate();
        const diaFinal = Math.min(dia, ultimoDiaDoMes);

        const anoFormatado = novoAno;
        const mesFormatado = String(novoMes + 1).padStart(2, "0");
        const diaFormatado = String(diaFinal).padStart(2, "0");

        return `${anoFormatado}-${mesFormatado}-${diaFormatado}`;
    }

    const adicionarGasto = async (novoGasto) => {
        const numParcelas = parseInt(novoGasto.parcelas, 10) || 1;
        const valorTotal = parseCurrency(novoGasto.valor);
        const responsavel = novoGasto.responsavel || "meu";

        if (numParcelas <= 1) {
            const gastoSalvo = await adicionarGastoAPI({
                ...novoGasto,
                responsavel,
                valor: valorTotal > 0 ? valorTotal.toFixed(2).replace(".", ",") : novoGasto.valor,
            }, perfil);
            if (gastoSalvo) setGastos((prev) => [...prev, gastoSalvo]);
            return;
        }

        const valorParcelaBase = Math.floor((valorTotal / numParcelas) * 100) / 100;
        const sobraCentavos = Number((valorTotal - valorParcelaBase * numParcelas).toFixed(2));
        const dataBase = novoGasto.data;

        const novosGastos = [];
        for (let i = 0; i < numParcelas; i++) {
            const valorParcela = i === 0 ? valorParcelaBase + sobraCentavos : valorParcelaBase;
            const dataParcela = calcularDataParcela(dataBase, i);

            novosGastos.push({
                ...novoGasto,
                data: dataParcela,
                valor: valorParcela.toFixed(2).replace(".", ","),
                parcela: `${i + 1}/${numParcelas}`,
            });
        }

        const promessas = novosGastos.map((gasto) => adicionarGastoAPI(gasto, perfil));
        const gastosSalvos = await Promise.all(promessas);
        const gastosValidos = gastosSalvos.filter(Boolean);

        if (gastosValidos.length > 0) {
            setGastos((prev) => [...prev, ...gastosValidos]);
        }
    };

    const atualizarGasto = async (id, dadosAtualizados) => {
        const atualizado = await atualizarGastoAPI(id, dadosAtualizados, perfil);
        if (atualizado) {
            setGastos((prev) =>
                prev.map((g) => (g.id === id ? atualizado : g))
            );
        }
    };

    const removerGasto = async (id) => {
        const removido = await removerGastoAPI(id, perfil);
        if (removido) {
            setGastos((prev) => prev.filter((g) => g.id !== id));
        }
    };

    // Intervalo de fatura (atual, anterior, próximo)
    const getIntervaloFatura = useCallback(
        (cartao, referencia = mesReferencia || new Date(), ciclo = "atual") => {
            const ref = referencia || mesReferencia || new Date();
            const ano = ref.getFullYear();
            const mes = ref.getMonth();
            const fechamento = fechamentosPorCartao[cartao] ?? 30;

            if (ciclo === "atual") {
                return {
                    inicio: new Date(ano, mes - 1, fechamento + 1, 0, 0, 0, 0),
                    fim: new Date(ano, mes, fechamento, 23, 59, 59, 999),
                };
            }

            if (ciclo === "anterior") {
                return {
                    inicio: new Date(ano, mes - 2, fechamento + 1, 0, 0, 0, 0),
                    fim: new Date(ano, mes - 1, fechamento, 23, 59, 59, 999),
                };
            }

            if (ciclo === "proximo") {
                return {
                    inicio: new Date(ano, mes, fechamento + 1, 0, 0, 0, 0),
                    fim: new Date(ano, mes + 1, fechamento, 23, 59, 59, 999),
                };
            }

            return { inicio: null, fim: null };
        },
        [fechamentosPorCartao, mesReferencia]
    );

    const parseDataSegura = useCallback((dataStr) => {
        if (!dataStr) return null;
        return new Date(dataStr.includes("T") ? dataStr : `${dataStr}T12:00:00`);
    }, []);

    // Determina a data de referência para um ciclo específico a partir de uma data base
    const getDataReferenciaCiclo = useCallback((ref = mesReferencia || new Date(), ciclo = "atual") => {
        const d = ref ? new Date(ref) : new Date();
        if (ciclo === "anterior") {
            return new Date(d.getFullYear(), d.getMonth() - 1, 1);
        }
        if (ciclo === "proximo") {
            return new Date(d.getFullYear(), d.getMonth() + 1, 1);
        }
        return d;
    }, [mesReferencia]);

    // Verifica se uma assinatura está ativa e vigente em determinado ciclo 'YYYY-MM'
    const isAssinaturaValidaNoCiclo = useCallback((assinatura, chaveCiclo) => {
        if (!assinatura) return false;
        if (assinatura.inicioCiclo && chaveCiclo < assinatura.inicioCiclo) return false;
        if (!assinatura.ativa && assinatura.canceladaAPartirDe && chaveCiclo >= assinatura.canceladaAPartirDe) {
            return false;
        }
        return true;
    }, []);

    // Retorna o acordo ativo de "Apertou a Fatura" para um cartão e ciclo específicos
    const getAcordoAtivoCartaoCiclo = useCallback((cartao, ciclo = "atual", ref = mesReferencia) => {
        const dataCiclo = getDataReferenciaCiclo(ref, ciclo);
        const chaveCiclo = getChaveMes(dataCiclo);
        const chaveAcordo = `${cartao}_${chaveCiclo}`;
        return parcelamentosFatura[chaveAcordo] || null;
    }, [getDataReferenciaCiclo, getChaveMes, parcelamentosFatura, mesReferencia]);

    // Gastos de um ciclo específico com injeção de Assinaturas e regras de Apertou a Fatura
    const getGastosDoCiclo = useCallback(
        (cartao, ciclo = "atual", ref = mesReferencia) => {
            const dataCiclo = getDataReferenciaCiclo(ref, ciclo);
            const chaveCiclo = getChaveMes(dataCiclo);
            const { inicio, fim } = getIntervaloFatura(cartao, ref, ciclo);

            // 1. Perfil Ingrid: Cartões do Renato (Integrado A Pagar)
            if (isIngrid && (cartao === "Cartões do Renato" || cartao === "Cartões do Renato (A Pagar)")) {
                const { inicio: iniNubank, fim: fimNubank } = getIntervaloFatura("Nubank", ref, ciclo);

                // Compras avulsas lançadas pelo Renato
                const itensCompras = gastosReembolsoRenato
                    .filter((g) => {
                        const data = parseDataSegura(g.data);
                        return data && data >= iniNubank && data <= fimNubank;
                    })
                    .map((g) => {
                        const valorTotal = parseCurrency(g.valor);
                        const fator = g.responsavel === "dividido" ? 0.5 : 1.0;
                        return {
                            ...g,
                            cartaoOriginal: g.cartao,
                            cartao: "Cartões do Renato",
                            valorCalculado: valorTotal * fator,
                            descricaoExibicao: `${g.tipo || "Gasto"} (Pago no ${g.cartao} pelo Renato)`,
                        };
                    });

                // Assinaturas ativas do Renato que são mozi ou dividido
                const assinaturasRenatoCiclo = (assinaturasReembolsoParceiro || [])
                    .filter((a) => isAssinaturaValidaNoCiclo(a, chaveCiclo))
                    .map((a) => {
                        const valorTotal = parseCurrency(a.valor);
                        const fator = a.responsavel === "dividido" ? 0.5 : 1.0;
                        const dia = String(a.dataInicio || "10").slice(-2);
                        return {
                            id: `assinatura-parceiro-${a.id}-${chaveCiclo}`,
                            idAssinatura: a.id,
                            cartao: "Cartões do Renato",
                            cartaoOriginal: a.cartao,
                            categoria: a.categoria || "Assinaturas",
                            tipo: a.tipo || "Desejo",
                            responsavel: a.responsavel,
                            valor: valorTotal,
                            valorCalculado: valorTotal * fator,
                            data: `${chaveCiclo}-${dia}`,
                            descricao: a.nome,
                            descricaoExibicao: `🔄 ${a.nome} (Assinatura do Renato)`,
                            origem: "assinatura",
                            isAssinatura: true,
                        };
                    });

                return [...itensCompras, ...assinaturasRenatoCiclo];
            }

            // 2. Perfil Renato: Cartões da Ingrid (Integrado A Pagar caso ela parcele ou divida algo com ele)
            if (!isIngrid && (cartao === "Cartões da Ingrid" || cartao === "Cartões da Ingrid (A Pagar)")) {
                const { inicio: iniIngrid, fim: fimIngrid } = getIntervaloFatura("Nubank", ref, ciclo);

                const itensCompras = (gastosReembolsoIngrid || [])
                    .filter((g) => {
                        const data = parseDataSegura(g.data);
                        return data && data >= iniIngrid && data <= fimIngrid;
                    })
                    .map((g) => {
                        const valorTotal = parseCurrency(g.valor);
                        const fator = g.responsavel === "dividido" ? 0.5 : 1.0;
                        return {
                            ...g,
                            cartaoOriginal: g.cartao,
                            cartao: "Cartões da Ingrid",
                            valorCalculado: valorTotal * fator,
                            descricaoExibicao: `${g.tipo || "Gasto"} (Pago no ${g.cartao} pela Ingrid)`,
                        };
                    });

                const assinaturasIngridCiclo = (assinaturasReembolsoParceiro || [])
                    .filter((a) => isAssinaturaValidaNoCiclo(a, chaveCiclo))
                    .map((a) => {
                        const valorTotal = parseCurrency(a.valor);
                        const fator = a.responsavel === "dividido" ? 0.5 : 1.0;
                        const dia = String(a.dataInicio || "10").slice(-2);
                        return {
                            id: `assinatura-parceiro-${a.id}-${chaveCiclo}`,
                            idAssinatura: a.id,
                            cartao: "Cartões da Ingrid",
                            cartaoOriginal: a.cartao,
                            categoria: a.categoria || "Assinaturas",
                            tipo: a.tipo || "Desejo",
                            responsavel: a.responsavel,
                            valor: valorTotal,
                            valorCalculado: valorTotal * fator,
                            data: `${chaveCiclo}-${dia}`,
                            descricao: a.nome,
                            descricaoExibicao: `🔄 ${a.nome} (Assinatura da Ingrid)`,
                            origem: "assinatura",
                            isAssinatura: true,
                        };
                    });

                return [...itensCompras, ...assinaturasIngridCiclo];
            }

            // 3. Perfil Ingrid: Cartão Itaú (Valor manual ou parcelado)
            if (isIngrid && cartao === "Itaú") {
                const acordoItau = parcelamentosFatura[`Itaú_${chaveCiclo}`];
                if (acordoItau) {
                    const linhasAcordo = [];
                    if (acordoItau.divisaoEntrada?.tipo === "dividido") {
                        linhasAcordo.push({
                            id: `acordo-itau-meu-${acordoItau.id}`,
                            parcelamentoId: acordoItau.id,
                            cartao: "Itaú",
                            categoria: "Parcelamento de Fatura",
                            tipo: "Essencial",
                            responsavel: "meu",
                            valor: acordoItau.divisaoEntrada.valorMeu,
                            data: acordoItau.dataEntrada || `${chaveCiclo}-10`,
                            descricao: "Apertou a Fatura (Entrada - Minha Parte)",
                            descricaoExibicao: "🚨 Entrada Fatura Itaú (Minha Parte)",
                            origem: "apertou_fatura_entrada",
                            isEntradaParcelamento: true,
                        });
                        linhasAcordo.push({
                            id: `acordo-itau-mozi-${acordoItau.id}`,
                            parcelamentoId: acordoItau.id,
                            cartao: "Itaú",
                            categoria: "Parcelamento de Fatura",
                            tipo: "Essencial",
                            responsavel: "mozi",
                            valor: acordoItau.divisaoEntrada.valorMozi,
                            data: acordoItau.dataEntrada || `${chaveCiclo}-10`,
                            descricao: "Apertou a Fatura (Entrada - Parte Renato)",
                            descricaoExibicao: "🚨 Entrada Fatura Itaú (Parte Renato)",
                            origem: "apertou_fatura_entrada",
                            isEntradaParcelamento: true,
                        });
                    } else {
                        linhasAcordo.push({
                            id: `acordo-itau-${acordoItau.id}`,
                            parcelamentoId: acordoItau.id,
                            cartao: "Itaú",
                            categoria: "Parcelamento de Fatura",
                            tipo: "Essencial",
                            responsavel: acordoItau.divisaoEntrada?.tipo || "meu",
                            valor: acordoItau.valorEntradaTotal,
                            data: acordoItau.dataEntrada || `${chaveCiclo}-10`,
                            descricao: "Apertou a Fatura (Entrada Total)",
                            descricaoExibicao: "🚨 Entrada Fatura Itaú (Total)",
                            origem: "apertou_fatura_entrada",
                            isEntradaParcelamento: true,
                        });
                    }
                    return linhasAcordo;
                }

                const valorItau = faturasItau[chaveCiclo] || 0;
                if (valorItau > 0) {
                    return [
                        {
                            id: `itau-${chaveCiclo}`,
                            cartao: "Itaú",
                            tipo: "Fatura Total Itaú",
                            data: `${chaveCiclo}-10`,
                            valor: valorItau,
                            responsavel: "meu",
                        },
                    ];
                }
                return [];
            }

            // 4. Cartões normais do perfil (Nubank, BB, Picpay ou personalizados da Ingrid)
            const acordoAtivo = parcelamentosFatura[`${cartao}_${chaveCiclo}`];

            // A) Coleta compras avulsas e parcelas normais salvas no banco
            const itensDoBanco = gastos.filter((g) => {
                const data = parseDataSegura(g.data);
                return g.cartao === cartao && data && data >= inicio && data <= fim;
            });

            // Se a fatura desse mês foi parcelada via "Apertou a Fatura":
            // As compras originais permanecem visíveis, porém marcadas como congeladas para não somar duplicado!
            const itensProcessados = itensDoBanco.map((g) => {
                if (acordoAtivo && g.origem !== "apertou_fatura_entrada" && g.origem !== "apertou_fatura_parcela") {
                    return {
                        ...g,
                        congeladoPorParcelamento: true,
                        descricaoExibicao: `${g.descricao || g.categoria} (Substituído pela Entrada do Parcelamento)`,
                    };
                }
                return g;
            });

            // B) Injeta a Entrada explícita se houver acordo neste ciclo
            const linhasEntrada = [];
            if (acordoAtivo) {
                if (acordoAtivo.divisaoEntrada?.tipo === "dividido") {
                    linhasEntrada.push({
                        id: `entrada-meu-${acordoAtivo.id}`,
                        parcelamentoId: acordoAtivo.id,
                        cartao: acordoAtivo.cartao,
                        categoria: "Parcelamento de Fatura",
                        tipo: "Essencial",
                        responsavel: "meu",
                        valor: acordoAtivo.divisaoEntrada.valorMeu,
                        data: acordoAtivo.dataEntrada || `${chaveCiclo}-10`,
                        descricao: "Apertou a Fatura (Entrada - Minha Parte)",
                        descricaoExibicao: `🚨 Entrada Fatura (${isIngrid ? "Pessoal" : "Minha Parte"})`,
                        origem: "apertou_fatura_entrada",
                        isEntradaParcelamento: true,
                    });
                    linhasEntrada.push({
                        id: `entrada-mozi-${acordoAtivo.id}`,
                        parcelamentoId: acordoAtivo.id,
                        cartao: acordoAtivo.cartao,
                        categoria: "Parcelamento de Fatura",
                        tipo: "Essencial",
                        responsavel: "mozi",
                        valor: acordoAtivo.divisaoEntrada.valorMozi,
                        data: acordoAtivo.dataEntrada || `${chaveCiclo}-10`,
                        descricao: "Apertou a Fatura (Entrada - Parte Parceiro)",
                        descricaoExibicao: `🚨 Entrada Fatura (Parte ${isIngrid ? "Renato" : "Mozi"})`,
                        origem: "apertou_fatura_entrada",
                        isEntradaParcelamento: true,
                    });
                } else {
                    linhasEntrada.push({
                        id: `entrada-${acordoAtivo.id}`,
                        parcelamentoId: acordoAtivo.id,
                        cartao: acordoAtivo.cartao,
                        categoria: "Parcelamento de Fatura",
                        tipo: "Essencial",
                        responsavel: acordoAtivo.divisaoEntrada?.tipo || "meu",
                        valor: acordoAtivo.valorEntradaTotal,
                        data: acordoAtivo.dataEntrada || `${chaveCiclo}-10`,
                        descricao: "Apertou a Fatura (Entrada Total)",
                        descricaoExibicao: `🚨 Entrada Fatura (${acordoAtivo.cartao})`,
                        origem: "apertou_fatura_entrada",
                        isEntradaParcelamento: true,
                    });
                }
            }

            // C) Injeta assinaturas vigentes neste cartão para o ciclo em questão
            const assinaturasDoCiclo = (assinaturas || [])
                .filter((a) => a.cartao === cartao && isAssinaturaValidaNoCiclo(a, chaveCiclo))
                .map((a) => {
                    const dia = String(a.dataInicio || "10").slice(-2);
                    return {
                        id: `assinatura-${a.id}-${chaveCiclo}`,
                        idAssinatura: a.id,
                        cartao: a.cartao,
                        categoria: a.categoria || "Assinaturas",
                        tipo: a.tipo || "Desejo",
                        responsavel: a.responsavel || "meu",
                        valor: parseCurrency(a.valor),
                        data: `${chaveCiclo}-${dia}`,
                        descricao: a.nome,
                        descricaoExibicao: `🔄 ${a.nome}`,
                        origem: "assinatura",
                        isAssinatura: true,
                    };
                });

            return [...linhasEntrada, ...itensProcessados, ...assinaturasDoCiclo];
        },
        [
            getDataReferenciaCiclo,
            getChaveMes,
            getIntervaloFatura,
            isIngrid,
            gastosReembolsoRenato,
            parseDataSegura,
            assinaturasReembolsoParceiro,
            isAssinaturaValidaNoCiclo,
            gastosReembolsoIngrid,
            parcelamentosFatura,
            faturasItau,
            gastos,
            assinaturas,
            mesReferencia,
        ]
    );

    // Fatura por cartão
    function getFaturaPorCartao(ciclo = "atual", ref = mesReferencia) {
        const totais = {};

        (cartoesAtivos || []).forEach((c) => {
            const id = c.id || c.nome;
            const itens = getGastosDoCiclo(id, ciclo, ref) || [];
            let totalCartao = 0;

            itens.forEach((g) => {
                // Gastos congelados pelo acordo de fatura NÃO somam (vale a Entrada!)
                if (g.congeladoPorParcelamento) return;

                const v = g.valorCalculado !== undefined ? g.valorCalculado : parseCurrency(g.valor);
                totalCartao += v;
            });

            totais[id] = totalCartao;
            totais[c.nome] = totalCartao;
        });

        return totais;
    }

    // Fatura total (todos os cartões)
    function getFaturaTotalCartao(ciclo = "atual", ref = mesReferencia) {
        let total = 0;
        (cartoesAtivos || []).forEach((c) => {
            const id = c.id || c.nome;
            const itens = getGastosDoCiclo(id, ciclo, ref) || [];
            itens.forEach((g) => {
                if (g.congeladoPorParcelamento) return;
                const v = g.valorCalculado !== undefined ? g.valorCalculado : parseCurrency(g.valor);
                total += v;
            });
        });
        return total;
    }

    // Gastos por categoria (Essencial, Desejo, Poupança)
    function getGastosPorCategoria(tipo, ciclo = "atual", ref = mesReferencia) {
        let total = 0;

        (cartoesAtivos || []).forEach((c) => {
            const id = c.id || c.nome;
            const itens = getGastosDoCiclo(id, ciclo, ref) || [];

            itens.forEach((gasto) => {
                if (gasto.congeladoPorParcelamento) return;

                const responsavel = gasto.responsavel || "meu";
                if (!isIngrid && responsavel === "mozi") return;

                if (gasto.tipo !== tipo) return;

                const fator = responsavel === "dividido" ? 0.5 : 1.0;
                const valorBase = gasto.valorCalculado !== undefined ? gasto.valorCalculado : parseCurrency(gasto.valor);
                total += valorBase * (gasto.valorCalculado !== undefined ? 1.0 : fator);
            });
        });

        return total;
    }

    function getEssenciais(ciclo = "atual") {
        return getGastosPorCategoria("Essencial", ciclo);
    }

    function getLivres(ciclo = "atual") {
        return getGastosPorCategoria("Desejo", ciclo);
    }

    function getInvestimentos(ciclo = "atual") {
        return getGastosPorCategoria("Poupança", ciclo);
    }

    // Calcula os valores da Mozi por cartão e total geral (apenas para o perfil do Renato)
    function getGanhosMozi(ciclo = "atual", ref = mesReferencia) {
        const porCartao = {
            Nubank: 0,
            Picpay: 0,
            "Banco do Brasil": 0,
        };
        let totalGeral = 0;

        if (isIngrid) {
            return { porCartao, totalGeral: 0 };
        }

        (cartoesAtivos || []).forEach((c) => {
            const id = c.id || c.nome;
            const itens = getGastosDoCiclo(id, ciclo, ref) || [];

            itens.forEach((gasto) => {
                if (gasto.congeladoPorParcelamento) return;

                const responsavel = gasto.responsavel || "meu";
                if (responsavel === "meu") return;

                const valorTotal = gasto.valorCalculado !== undefined ? gasto.valorCalculado : parseCurrency(gasto.valor);
                const valorMozi = responsavel === "mozi" ? valorTotal : valorTotal * 0.5;

                if (!porCartao[gasto.cartao]) {
                    porCartao[gasto.cartao] = 0;
                }
                porCartao[gasto.cartao] += valorMozi;
                totalGeral += valorMozi;
            });
        });

        return {
            porCartao,
            totalGeral,
        };
    }

    /**
     * Retorna o ajuste de fatura ativo para um cartão e ciclo específicos
     */
    const getAjusteFaturaCartao = useCallback(
        (cartao, ciclo = "atual", ref = mesReferencia) => {
            const itens = getGastosDoCiclo(cartao, ciclo, ref) || [];
            return itens.find((g) => g.origem === "ajuste_fatura") || null;
        },
        [getGastosDoCiclo, mesReferencia]
    );

    /**
     * Salva, atualiza ou remove um ajuste de fatura para bater certinho com o total real
     */
    const salvarAjusteFaturaCartao = async ({
        cartao,
        ciclo = "atual",
        valorAjuste,
        tipo = "Essencial",
        descricao = "Ajuste de Fatura",
    }) => {
        const valorNum = parseCurrency(valorAjuste);
        const { fim } = getIntervaloFatura(cartao, mesReferencia, ciclo);

        if (!fim) {
            console.error("Não foi possível determinar o intervalo da fatura para o ajuste.");
            return null;
        }

        const ano = fim.getFullYear();
        const mes = String(fim.getMonth() + 1).padStart(2, "0");
        const dia = String(fim.getDate()).padStart(2, "0");
        const dataAjuste = `${ano}-${mes}-${dia}`;

        const itensCiclo = getGastosDoCiclo(cartao, ciclo, mesReferencia) || [];
        const ajusteExistente = itensCiclo.find((g) => g.origem === "ajuste_fatura");

        // Se o valor for 0, remove o ajuste se existir
        if (Math.abs(valorNum) < 0.001) {
            if (ajusteExistente) {
                await removerGasto(ajusteExistente.id);
            }
            return null;
        }

        const payload = {
            data: dataAjuste,
            valor: valorNum,
            cartao,
            categoria: "Ajuste de Fatura",
            tipo: tipo || "Essencial",
            responsavel: "meu",
            descricao: descricao?.trim() || "Ajuste de Fatura",
            origem: "ajuste_fatura",
        };

        if (ajusteExistente) {
            const atualizado = await atualizarGastoAPI(ajusteExistente.id, payload, perfil);
            if (atualizado) {
                setGastos((prev) =>
                    prev.map((g) => (g.id === ajusteExistente.id ? { ...g, ...atualizado } : g))
                );
                return atualizado;
            }
        } else {
            const novo = await adicionarGastoAPI(payload, perfil);
            if (novo) {
                setGastos((prev) => [...prev, novo]);
                return novo;
            }
        }
        return null;
    };

    /* ===============================================================
       AÇÕES DE ASSINATURAS RECORRENTES
       =============================================================== */

    const adicionarAssinatura = async (novaAssinatura) => {
        const salva = await adicionarAssinaturaAPI(novaAssinatura, perfil);
        if (salva) {
            setAssinaturas((prev) => [...prev, salva]);
            return salva;
        }
        return null;
    };

    const atualizarAssinatura = async (id, dadosAtualizados) => {
        const atualizada = await atualizarAssinaturaAPI(id, dadosAtualizados, perfil);
        if (atualizada) {
            setAssinaturas((prev) =>
                prev.map((a) => (a.id === id ? { ...a, ...atualizada } : a))
            );
            return atualizada;
        }
        return null;
    };

    const cancelarAssinatura = async (id, chaveCicloCancelamento = getChaveMes(mesReferencia)) => {
        const ok = await cancelarAssinaturaAPI(id, chaveCicloCancelamento, perfil);
        if (ok) {
            setAssinaturas((prev) =>
                prev.map((a) =>
                    a.id === id
                        ? { ...a, ativa: false, canceladaAPartirDe: chaveCicloCancelamento }
                        : a
                )
            );
            return true;
        }
        return false;
    };

    const reativarAssinatura = async (id) => {
        const ok = await reativarAssinaturaAPI(id, perfil);
        if (ok) {
            setAssinaturas((prev) =>
                prev.map((a) =>
                    a.id === id
                        ? { ...a, ativa: true, canceladaAPartirDe: null }
                        : a
                )
            );
            return true;
        }
        return false;
    };

    const removerAssinatura = async (id) => {
        const ok = await removerAssinaturaAPI(id, perfil);
        if (ok) {
            setAssinaturas((prev) => prev.filter((a) => a.id !== id));
            return true;
        }
        return false;
    };

    /* ===============================================================
       AÇÕES DE "APERTOU A FATURA" (PARCELAMENTO DE FATURA)
       =============================================================== */

    /**
     * Salva o acordo de parcelamento da fatura:
     * - Registra o acordo em parcelamentosFatura (substituindo o mês atual pela Entrada)
     * - Gera os lançamentos das N parcelas para os próximos meses
     */
    const salvarParcelamentoFatura = async ({
        cartao,
        ciclo = "atual",
        valorEntradaTotal,
        dataEntrada,
        divisaoEntrada, // { tipo: 'meu'|'mozi'|'dividido', valorMeu, valorMozi }
        qtdParcelas,
        valorParcelaTotal,
        divisaoParcela, // { tipo: 'meu'|'mozi'|'dividido', valorMeu, valorMozi }
        gastosOriginaisIds = [],
    }) => {
        const dataCiclo = getDataReferenciaCiclo(mesReferencia, ciclo);
        const chaveCicloEntrada = getChaveMes(dataCiclo);
        const idAcordo = `acordo_${cartao}_${chaveCicloEntrada}_${Date.now()}`;
        const chaveMapa = `${cartao}_${chaveCicloEntrada}`;

        const novoAcordo = {
            id: idAcordo,
            cartao,
            chaveCicloEntrada,
            dataEntrada: dataEntrada || `${chaveCicloEntrada}-10`,
            valorEntradaTotal: parseCurrency(valorEntradaTotal),
            divisaoEntrada,
            qtdParcelas: parseInt(qtdParcelas, 10),
            valorParcelaTotal: parseCurrency(valorParcelaTotal),
            divisaoParcela,
            gastosOriginaisIds,
            criadoEm: new Date().toISOString(),
        };

        // 1. Atualiza o mapa de acordos de parcelamento no estado e no Firestore
        const novosAcordos = {
            ...parcelamentosFatura,
            [chaveMapa]: novoAcordo,
        };
        setParcelamentosFatura(novosAcordos);
        await salvarParcelamentosFaturaAPI(novosAcordos, perfil);

        // 2. Gera os lançamentos das parcelas nos próximos N meses
        const baseDate = dataEntrada || `${chaveCicloEntrada}-10`;
        const parcelasParaSalvar = [];

        for (let i = 1; i <= novoAcordo.qtdParcelas; i++) {
            const dataParcela = calcularDataParcela(baseDate, i);
            const rotuloParcela = `${i}/${novoAcordo.qtdParcelas}`;

            if (divisaoParcela?.tipo === "dividido") {
                // Linha 1: Minha parte
                parcelasParaSalvar.push({
                    data: dataParcela,
                    valor: parseCurrency(divisaoParcela.valorMeu),
                    cartao,
                    categoria: "Parcelamento de Fatura",
                    tipo: "Essencial",
                    responsavel: "meu",
                    parcela: rotuloParcela,
                    parcelas: novoAcordo.qtdParcelas,
                    parcelamentoId: idAcordo,
                    descricao: `Parcela Fatura (${rotuloParcela} - Minha Parte)`,
                    origem: "apertou_fatura_parcela",
                });

                // Linha 2: Parte do parceiro (Mozi)
                parcelasParaSalvar.push({
                    data: dataParcela,
                    valor: parseCurrency(divisaoParcela.valorMozi),
                    cartao,
                    categoria: "Parcelamento de Fatura",
                    tipo: "Essencial",
                    responsavel: "mozi",
                    parcela: rotuloParcela,
                    parcelas: novoAcordo.qtdParcelas,
                    parcelamentoId: idAcordo,
                    descricao: `Parcela Fatura (${rotuloParcela} - Parte Mozi)`,
                    origem: "apertou_fatura_parcela",
                });
            } else {
                // Linha única (100% de um dos dois)
                parcelasParaSalvar.push({
                    data: dataParcela,
                    valor: novoAcordo.valorParcelaTotal,
                    cartao,
                    categoria: "Parcelamento de Fatura",
                    tipo: "Essencial",
                    responsavel: divisaoParcela?.tipo || "meu",
                    parcela: rotuloParcela,
                    parcelas: novoAcordo.qtdParcelas,
                    parcelamentoId: idAcordo,
                    descricao: `Parcela Fatura ${cartao} (${rotuloParcela})`,
                    origem: "apertou_fatura_parcela",
                });
            }
        }

        const promessas = parcelasParaSalvar.map((p) => adicionarGastoAPI(p, perfil));
        const parcelasSalvas = await Promise.all(promessas);
        const parcelasValidas = parcelasSalvas.filter(Boolean);

        if (parcelasValidas.length > 0) {
            setGastos((prev) => [...prev, ...parcelasValidas]);
        }

        return novoAcordo;
    };

    /**
     * Cancela e desfaz um acordo de parcelamento, removendo as parcelas geradas
     * e descongelando os gastos originais daquele cartão naquele ciclo.
     */
    const cancelarParcelamentoFatura = async (idAcordo, cartao, chaveCiclo) => {
        const chaveMapa = `${cartao}_${chaveCiclo}`;
        const novosAcordos = { ...parcelamentosFatura };
        delete novosAcordos[chaveMapa];

        setParcelamentosFatura(novosAcordos);
        await salvarParcelamentosFaturaAPI(novosAcordos, perfil);

        // Remove todos os gastos vinculados a esse parcelamento
        await removerGastosPorParcelamentoAPI(idAcordo, perfil);
        setGastos((prev) => prev.filter((g) => g.parcelamentoId !== idAcordo));
        return true;
    };

    return (
        <GastosContext.Provider
            value={{
                gastos,
                adicionarGasto,
                atualizarGasto,
                removerGasto,
                getIntervaloFatura,
                getGastosDoCiclo,
                getFaturaPorCartao,
                getFaturaTotalCartao,
                getEssenciais,
                getLivres,
                getInvestimentos,
                getGanhosMozi,
                // Novos recursos multi-perfil e integração
                cartoesAtivos,
                adicionarCartaoPersonalizado,
                removerCartaoPersonalizado,
                faturasItau,
                salvarFaturaItauMes,
                gastosReembolsoRenato,
                gastosReembolsoIngrid,
                chaveMesAtual: getChaveMes(mesReferencia),
                salvarAjusteFaturaCartao,
                getAjusteFaturaCartao,
                // Assinaturas Recorrentes
                assinaturas,
                adicionarAssinatura,
                atualizarAssinatura,
                cancelarAssinatura,
                reativarAssinatura,
                removerAssinatura,
                isAssinaturaValidaNoCiclo,
                // Apertou a Fatura
                parcelamentosFatura,
                salvarParcelamentoFatura,
                cancelarParcelamentoFatura,
                getAcordoAtivoCartaoCiclo,
            }}
        >
            {children}
        </GastosContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGastos() {
    return useContext(GastosContext);
}
