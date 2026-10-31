import { useGastos } from "../context/GastosContext";
import { parseCurrency } from "../utils/currencyUtils";
import { useMes } from "../context/MesContext";

export function useResumoEvitaveis() {
    const { gastos, assinaturas, isAssinaturaValidaNoCiclo } = useGastos();
    const { mesReferencia } = useMes() || {};

    const dataRef = mesReferencia || new Date();
    const ano = dataRef.getFullYear();
    const mes = dataRef.getMonth();
    const strMes = String(mes + 1).padStart(2, "0");
    const chaveMes = `${ano}-${strMes}`;

    const agruparPorNome = (gastos || []).reduce((acc, gasto) => {
        const { tipo, categoria, valor, data, responsavel = "meu", congeladoPorParcelamento } = gasto;
        if (!data || congeladoPorParcelamento) return acc;

        // Gastos da Mozi não são despesas do usuário
        if (responsavel === "mozi") return acc;

        const tipoNorm = (tipo || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
        const isDesejo = tipoNorm.includes("desejo");

        const dataGasto = new Date(data.includes("T") ? data : `${data}T12:00:00`);
        const isDoMes =
            dataGasto.getMonth() === mes && dataGasto.getFullYear() === ano;

        if (isDesejo && isDoMes) {
            const cat = categoria || "Outros";
            const fator = responsavel === "dividido" ? 0.5 : 1.0;
            const valorNum = parseCurrency(valor) * fator;
            acc[cat] = (acc[cat] || 0) + valorNum;
        }

        return acc;
    }, {});

    // Adiciona assinaturas do tipo Desejo vigentes no mês
    (assinaturas || []).forEach((assinatura) => {
        const { tipo, categoria, valor, responsavel = "meu" } = assinatura;
        if (responsavel === "mozi") return;

        const ehValida = isAssinaturaValidaNoCiclo
            ? isAssinaturaValidaNoCiclo(assinatura, chaveMes)
            : assinatura.ativa;
        if (!ehValida) return;

        const tipoNorm = (tipo || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
        if (tipoNorm.includes("desejo")) {
            const cat = categoria || "Assinaturas";
            const fator = responsavel === "dividido" ? 0.5 : 1.0;
            const valorNum = parseCurrency(valor) * fator;
            agruparPorNome[cat] = (agruparPorNome[cat] || 0) + valorNum;
        }
    });

    const nomesEvitaveis = Object.keys(agruparPorNome);
    const valoresEvitaveis = Object.values(agruparPorNome).map(
        (valor) =>
            `R$ ${valor.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`
    );

    const total = Object.values(agruparPorNome).reduce(
        (acc, val) => acc + val,
        0
    );
    const destaqueEvitaveis = `R$ ${total.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    return {
        nomesEvitaveis,
        valoresEvitaveis,
        destaqueEvitaveis,
        destaque: destaqueEvitaveis,
        nomes: nomesEvitaveis,
        valores: valoresEvitaveis,
    };
}
