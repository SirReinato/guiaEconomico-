import { useMemo } from "react";
import { useGastos } from "../context/GastosContext";
import { useMes } from "../context/MesContext";

export function useResumoCartoes(ciclo = "atual") {
    const {
        getFaturaPorCartao,
        getFaturaTotalCartao,
        cartoesAtivos,
        assinaturas,
        isAssinaturaValidaNoCiclo,
        chaveMesAtual,
    } = useGastos();
    const { mesReferencia } = useMes() || {};

    const totaisPorCartao = getFaturaPorCartao(ciclo, mesReferencia);
    const totalGeral = getFaturaTotalCartao(ciclo, mesReferencia);
    const valorTotal = `R$ ${totalGeral.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    // Mapeamento rico de cartões com contagem de assinaturas ativas
    const cartoesDetalhes = useMemo(() => {
        return (cartoesAtivos || []).map((c) => {
            const id = c.id || c.nome;
            const valor = totaisPorCartao[id] !== undefined ? totaisPorCartao[id] : totaisPorCartao[c.nome] || 0;

            const assinaturasCartao = (assinaturas || []).filter((a) => {
                const cNome = (a.cartao || "").toLowerCase();
                const idAlvo = (c.id || "").toLowerCase();
                const nomeAlvo = (c.nome || "").toLowerCase();
                const ehDesseCartao = cNome === idAlvo || cNome === nomeAlvo;
                return ehDesseCartao && (isAssinaturaValidaNoCiclo ? isAssinaturaValidaNoCiclo(a, chaveMesAtual) : a.ativa);
            });

            const totalAssinaturas = assinaturasCartao.reduce((acc, a) => acc + (Number(a.valor) || 0), 0);

            return {
                id,
                nome: c.nome,
                icone: c.icone || "💳",
                cor: c.cor || "#820ad1",
                valorNumerico: valor,
                valorFormatado: `R$ ${valor.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`,
                qtdAssinaturas: assinaturasCartao.length,
                totalAssinaturas,
                totalAssinaturasFormatado: `R$ ${totalAssinaturas.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`,
                integrado: !!c.integrado,
            };
        });
    }, [cartoesAtivos, totaisPorCartao, assinaturas, isAssinaturaValidaNoCiclo, chaveMesAtual]);

    const nomeCartao = cartoesDetalhes.map((c) => `${c.icone} ${c.nome}`);
    const valorPorCartao = cartoesDetalhes.map((c) => c.valorFormatado);

    return {
        nomeCartao,
        valorPorCartao,
        valorTotal,
        totaisPorCartao,
        cartoesDetalhes,
    };
}
