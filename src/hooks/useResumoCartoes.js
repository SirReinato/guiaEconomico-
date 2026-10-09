import { useGastos } from "../context/GastosContext";

export function useResumoCartoes(ciclo = "atual") {
    const { getFaturaPorCartao, getFaturaTotalCartao } = useGastos();

    const totaisPorCartao = getFaturaPorCartao(ciclo);
    const nomeCartao = Object.keys(totaisPorCartao);
    const valorPorCartao = Object.values(totaisPorCartao).map(
        (valor) => `R$ ${valor.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`
    );
    const totalGeral = getFaturaTotalCartao(ciclo);
    const valorTotal = `R$ ${totalGeral.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    return {
        nomeCartao,
        valorPorCartao,
        valorTotal,
        totaisPorCartao,
    };
}
