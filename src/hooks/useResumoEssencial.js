import { useEssencial } from "../context/EssencialContext";
import { parseCurrency } from "../utils/currencyUtils";

export const MAPA_NOMES_ESSENCIAIS = {
    aluguel: "Aluguel",
    agua: "Água",
    manutencao: "Manutenção",
    "pos-graduacao": "Pós-graduação",
    pos: "Pós-graduação",
    pós: "Pós-graduação",
    "pós-graduação": "Pós-graduação",
};

export function useResumoEssenciais() {
    const { essenciais } = useEssencial();

    // Os 4 tipos essenciais padrão sempre garantidos no card
    const tiposPadrao = ["aluguel", "agua", "manutencao", "pos-graduacao"];

    const agruparPorTipo = {};

    // Inicializa os 4 tipos padrão com 0 para garantir que todos apareçam
    tiposPadrao.forEach((tipo) => {
        agruparPorTipo[tipo] = 0;
    });

    // Agrupa os valores reais cadastrados
    (essenciais || []).forEach((item) => {
        const rawTipo = (item.tipo || "").toLowerCase().trim();
        let chave = rawTipo;

        if (rawTipo.includes("pos") || rawTipo.includes("pós")) {
            chave = "pos-graduacao";
        } else if (rawTipo.includes("alug")) {
            chave = "aluguel";
        } else if (rawTipo.includes("agu") || rawTipo.includes("águ")) {
            chave = "agua";
        } else if (rawTipo.includes("manut")) {
            chave = "manutencao";
        }

        const valor = parseCurrency(item.valor);
        agruparPorTipo[chave] = (agruparPorTipo[chave] || 0) + valor;
    });

    const nomes = Object.keys(agruparPorTipo).map(
        (tipo) =>
            MAPA_NOMES_ESSENCIAIS[tipo] ||
            tipo.charAt(0).toUpperCase() + tipo.slice(1)
    );

    const valores = Object.values(agruparPorTipo).map(
        (valor) => `R$ ${valor.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`
    );

    const total = Object.values(agruparPorTipo).reduce(
        (acc, val) => acc + val,
        0
    );
    const destaque = `R$ ${total.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    return {
        nomes,
        valores,
        destaque,
    };
}
