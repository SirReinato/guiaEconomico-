import { useState, useEffect, useMemo } from "react";
import { useSaldo } from "../context/SaldoContext";
import { useEssencial } from "../context/EssencialContext";
import { useGastos } from "../context/GastosContext";
import { useMes } from "../context/MesContext";
import { useAuth } from "../context/AuthContext";
import { getTaxaSelicAtual } from "../services/selicService";
import { getReservaConfig } from "../services/reservaService";
import { parseCurrency } from "../utils/currencyUtils";
import { estimarSobraRealista, gerarTodosCenarios } from "../utils/metasCalculos";

export function usePlanoMeta(metaAtiva) {
    const { saldo, getSalarioDoMes } = useSaldo() || {};
    const { essenciais } = useEssencial() || {};
    const { gastos } = useGastos() || {};
    const { mesReferencia } = useMes() || {};
    const { perfilAtivo } = useAuth() || {};

    const [taxaSelic, setTaxaSelic] = useState(0.93);
    const [reservaAtual, setReservaAtual] = useState(0);
    const [carregandoContexto, setCarregandoContexto] = useState(true);

    // Carrega dados de Selic e Reserva
    useEffect(() => {
        let isMounted = true;
        async function carregarDadosExternos() {
            setCarregandoContexto(true);
            try {
                const [selic, resConfig] = await Promise.all([
                    getTaxaSelicAtual(),
                    getReservaConfig(perfilAtivo),
                ]);

                if (!isMounted) return;
                if (selic?.taxaMensal) {
                    setTaxaSelic(Number((selic.taxaMensal * 100).toFixed(2)) || 0.93);
                }
                if (resConfig?.saldoReal !== undefined) {
                    setReservaAtual(Number(resConfig.saldoReal) || 0);
                }
            } catch (e) {
                console.warn("Aviso ao carregar dados complementares para plano da meta:", e);
            } finally {
                if (isMounted) setCarregandoContexto(false);
            }
        }

        carregarDadosExternos();
        return () => {
            isMounted = false;
        };
    }, [perfilAtivo]);

    // Obtém o salário do mês de referência ou último registrado
    const salarioAtual = useMemo(() => {
        const ref = mesReferencia || new Date();
        const ano = ref.getFullYear();
        const mesIndex = ref.getMonth();

        const salarioAjustado = getSalarioDoMes ? parseCurrency(getSalarioDoMes(ano, mesIndex)) : 0;
        if (salarioAjustado > 0) return salarioAjustado;

        const ultimosSalarios = (saldo || [])
            .filter((item) => {
                const tipo = item.tipo?.toLowerCase();
                return tipo === "salario" || tipo === "salário";
            })
            .sort((a, b) => {
                const dataA = a.data ? new Date(a.data.includes("T") ? a.data : `${a.data}T00:00:00`) : 0;
                const dataB = b.data ? new Date(b.data.includes("T") ? b.data : `${b.data}T00:00:00`) : 0;
                return dataB - dataA;
            });

        return ultimosSalarios.length > 0 ? parseCurrency(ultimosSalarios[0].valor) : 3000;
    }, [mesReferencia, getSalarioDoMes, saldo]);

    // Estimativa de sobra realista
    const estimativaSobra = useMemo(() => {
        return estimarSobraRealista({
            salario: salarioAtual,
            essenciais: essenciais || [],
            gastos: gastos || [],
            saldo: saldo || [],
        });
    }, [salarioAtual, essenciais, gastos, saldo]);

    // Monta o contexto financeiro estruturado
    const contextoFinanceiro = useMemo(() => {
        return {
            salario: salarioAtual,
            totalEssenciais: estimativaSobra.totalEssenciais,
            mediaGastosVariaveis: estimativaSobra.mediaGastosVariaveis,
            sobraReal: estimativaSobra.sobraReal,
            reservaAtual,
            taxaSelicMensal: taxaSelic,
        };
    }, [salarioAtual, estimativaSobra, reservaAtual, taxaSelic]);

    // Gera os cenários matemáticos para a meta ativa
    const cenarios = useMemo(() => {
        if (!metaAtiva) return null;
        return gerarTodosCenarios({
            meta: metaAtiva,
            contextoFinanceiro,
        });
    }, [metaAtiva, contextoFinanceiro]);

    return {
        contextoFinanceiro,
        cenarios,
        carregandoContexto,
    };
}
