import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
    getGastos,
    adicionarGastoAPI,
    atualizarGastoAPI,
    removerGastoAPI,
    getGastosReembolsoMoziAPI,
    getCartoesPersonalizadosAPI,
    salvarCartoesPersonalizadosAPI,
    getFaturasItauAPI,
    salvarFaturaItauMesAPI,
} from "../services/gastosService";
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
    const [cartoesPersonalizados, setCartoesPersonalizados] = useState([]);
    const [faturasItau, setFaturasItau] = useState({});

    const { mesReferencia } = useMes() || {};

    // 1. Carrega gastos do perfil atual + dados integrados
    useEffect(() => {
        let isMounted = true;
        async function carregar() {
            const [meusGastos, faturasItauRemotas] = await Promise.all([
                getGastos(perfil),
                getFaturasItauAPI(),
            ]);

            if (!isMounted) return;
            setGastos(meusGastos);
            if (faturasItauRemotas) setFaturasItau(faturasItauRemotas);

            if (isIngrid) {
                const [reembolsos, cartoesIngrid] = await Promise.all([
                    getGastosReembolsoMoziAPI(),
                    getCartoesPersonalizadosAPI("ingrid"),
                ]);
                if (isMounted) {
                    setGastosReembolsoRenato(reembolsos);
                    setCartoesPersonalizados(cartoesIngrid || []);
                }
            } else {
                setGastosReembolsoRenato([]);
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
            return CARTOES_PADRAO_RENATO;
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
    }, [isIngrid, cartoesPersonalizados]);

    // Mapeamento de fechamentos
    const fechamentosPorCartao = useMemo(() => {
        const mapa = {
            Nubank: 30,
            Picpay: 30,
            "Banco do Brasil": 27,
            "Itaú": 30,
            "Cartões do Renato": 30,
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

    // Gastos de um ciclo específico
    const getGastosDoCiclo = useCallback(
        (cartao, ciclo = "atual", ref = mesReferencia) => {
            if (isIngrid && (cartao === "Cartões do Renato" || cartao === "Cartões do Renato (A Pagar)")) {
                // Retorna os gastos lançados pelo Renato com responsavel mozi ou dividido
                const { inicio, fim } = getIntervaloFatura("Nubank", ref, ciclo);
                return gastosReembolsoRenato
                    .filter((g) => {
                        const data = parseDataSegura(g.data);
                        return data && data >= inicio && data <= fim;
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
            }

            if (isIngrid && cartao === "Itaú") {
                const chave = getChaveMes(ref);
                const valorItau = faturasItau[chave] || 0;
                if (valorItau > 0) {
                    return [
                        {
                            id: `itau-${chave}`,
                            cartao: "Itaú",
                            tipo: "Fatura Total Itaú",
                            data: `${chave}-10`,
                            valor: valorItau,
                            responsavel: "meu",
                        },
                    ];
                }
                return [];
            }

            const { inicio, fim } = getIntervaloFatura(cartao, ref, ciclo);
            return gastos.filter((g) => {
                const data = parseDataSegura(g.data);
                return g.cartao === cartao && data && data >= inicio && data <= fim;
            });
        },
        [isIngrid, getIntervaloFatura, gastosReembolsoRenato, parseDataSegura, getChaveMes, faturasItau, gastos, mesReferencia]
    );

    // Fatura por cartão
    function getFaturaPorCartao(ciclo = "atual", ref = mesReferencia) {
        const totais = {};

        // 1. Gastos próprios lançados no perfil
        gastos.forEach((gasto) => {
            const cartao = gasto.cartao;
            const valor = parseCurrency(gasto.valor);
            const dataGasto = parseDataSegura(gasto.data);
            const { inicio, fim } = getIntervaloFatura(cartao, ref, ciclo);

            if (dataGasto && dataGasto >= inicio && dataGasto <= fim) {
                if (!totais[cartao]) totais[cartao] = 0;
                totais[cartao] += valor;
            }
        });

        // 2. Se for Ingrid: inclui Cartão Itaú e Cartões do Renato
        if (isIngrid) {
            const chave = getChaveMes(ref);
            const valorItau = faturasItau[chave] || 0;
            totais["Itaú"] = valorItau;

            // Soma dos gastos do Renato a reembolsar no ciclo
            let totalRenatoAPagar = 0;
            const { inicio, fim } = getIntervaloFatura("Nubank", ref, ciclo);
            gastosReembolsoRenato.forEach((g) => {
                const dataGasto = parseDataSegura(g.data);
                if (dataGasto && dataGasto >= inicio && dataGasto <= fim) {
                    const v = parseCurrency(g.valor);
                    const fator = g.responsavel === "dividido" ? 0.5 : 1.0;
                    totalRenatoAPagar += v * fator;
                }
            });
            totais["Cartões do Renato"] = totalRenatoAPagar;
        }

        return totais;
    }

    // Fatura total (todos os cartões)
    function getFaturaTotalCartao(ciclo = "atual", ref = mesReferencia) {
        const faturaPorCartao = getFaturaPorCartao(ciclo, ref);
        return Object.values(faturaPorCartao).reduce((acc, val) => acc + (val || 0), 0);
    }

    // Gastos por categoria (Essencial, Desejo, Poupança)
    function getGastosPorCategoria(tipo, ciclo = "atual", ref = mesReferencia) {
        let total = 0;

        gastos.forEach((gasto) => {
            const responsavel = gasto.responsavel || "meu";
            if (!isIngrid && responsavel === "mozi") return;

            if (gasto.tipo !== tipo) return;
            const dataGasto = parseDataSegura(gasto.data);
            const { inicio, fim } = getIntervaloFatura(
                gasto.cartao,
                ref,
                ciclo
            );

            if (dataGasto && dataGasto >= inicio && dataGasto <= fim) {
                const fator = responsavel === "dividido" ? 0.5 : 1.0;
                total += parseCurrency(gasto.valor) * fator;
            }
        });

        // Se for Ingrid e categoria Essencial, inclui também os gastos integrados correspondentes
        if (isIngrid && tipo === "Essencial") {
            const faturaPorCartao = getFaturaPorCartao(ciclo, ref);
            // Inclui a fatura do Itaú e Cartões do Renato como compromisso fixo/essencial de pagamento
            total += (faturaPorCartao["Itaú"] || 0);
            total += (faturaPorCartao["Cartões do Renato"] || 0);
        }

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

        gastos.forEach((gasto) => {
            const responsavel = gasto.responsavel || "meu";
            if (responsavel === "meu") return;

            const cartao = gasto.cartao;
            const valorTotal = parseCurrency(gasto.valor);
            const dataGasto = parseDataSegura(gasto.data);
            const { inicio, fim } = getIntervaloFatura(
                cartao,
                ref,
                ciclo
            );

            if (dataGasto && dataGasto >= inicio && dataGasto <= fim) {
                const valorMozi = responsavel === "mozi" ? valorTotal : valorTotal * 0.5;

                if (!porCartao[cartao]) {
                    porCartao[cartao] = 0;
                }
                porCartao[cartao] += valorMozi;
                totalGeral += valorMozi;
            }
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
                chaveMesAtual: getChaveMes(mesReferencia),
                salvarAjusteFaturaCartao,
                getAjusteFaturaCartao,
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
