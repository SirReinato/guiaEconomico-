import { useSaldo } from "../context/SaldoContext";
import { useGastos } from "../context/GastosContext";
import { useEssencial } from "../context/EssencialContext";
import { parseCurrency } from "../utils/currencyUtils";
import { useMes } from "../context/MesContext";

export function useResumoFinanceiro(refProp) {
    const { getEntradasDoMes } = useSaldo();
    const { getFaturaTotalCartao, getGanhosMozi } = useGastos();
    const { essenciais } = useEssencial();
    const { mesReferencia } = useMes() || {};

    const dataRef = refProp || mesReferencia || new Date();
    const ano = dataRef.getFullYear();
    const mesIndex = dataRef.getMonth();

    // Entradas do mês selecionado (inclui salário herdado/ajustado se não houver lançamento explícito)
    const totalReceitasBase = parseFloat(getEntradasDoMes(dataRef)) || 0;

    const { totalGeral: totalGanhosMozi = 0 } = getGanhosMozi
        ? getGanhosMozi("atual", dataRef)
        : {};
    const totalReceitas = totalReceitasBase + totalGanhosMozi;

    // Despesas essenciais do mês (se houver lançamento datado específico no mês, filtra; senão usa recorrente)
    const essenciaisDoMes = (essenciais || []).filter((item) => {
        if (!item.data) return false;
        const data = new Date(item.data.includes("T") ? item.data : `${item.data}T12:00:00`);
        return data.getMonth() === mesIndex && data.getFullYear() === ano;
    });

    const totalEssenciais = essenciaisDoMes.length > 0
        ? essenciaisDoMes.reduce((acc, item) => acc + parseCurrency(item.valor), 0)
        : (essenciais || []).reduce((acc, item) => acc + parseCurrency(item.valor), 0);

    const totalGastos = getFaturaTotalCartao("atual", dataRef);
    const totalGeralGastos = totalGastos + totalEssenciais;

    const saldoLiquido = totalReceitas - totalGeralGastos;

    return {
        totalReceitas: totalReceitas.toFixed(2),
        totalReceitasBase: totalReceitasBase.toFixed(2),
        totalGanhosMozi: totalGanhosMozi.toFixed(2),
        totalGastos: totalGastos.toFixed(2),
        saldoLiquido: saldoLiquido.toFixed(2),
        totalGeralGastos: totalGeralGastos.toFixed(2),
    };
}
