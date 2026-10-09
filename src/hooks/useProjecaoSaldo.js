import { useSaldo } from "../context/SaldoContext";
import { useGastos } from "../context/GastosContext";
import { useEssencial } from "../context/EssencialContext";
import { getProximosMeses } from "../utils/proximoMesUtils";
import { parseCurrency } from "../utils/currencyUtils";
import { useMes } from "../context/MesContext";

export function useProjecaoSaldo(qtd = 3) {
    const { saldo, getSalarioDoMes } = useSaldo();
    const { gastos } = useGastos();
    const { essenciais } = useEssencial();
    const { mesReferencia } = useMes() || {};

    const meses = getProximosMeses(qtd, mesReferencia);

    // Obtém o último salário registrado
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

    const ultimoSalario =
        ultimosSalarios.length > 0
            ? parseCurrency(ultimosSalarios[0].valor)
            : 0;

    const parseDataSegura = (dataStr) => {
        if (!dataStr) return null;
        return new Date(dataStr.includes("T") ? dataStr : `${dataStr}T00:00:00`);
    };

    const dados = meses.map(({ mes, ano, mesIndex }) => {
        // Salário do mês (ajuste específico ou último salário registrado)
        const salarioAjustado = getSalarioDoMes
            ? parseCurrency(getSalarioDoMes(ano, mesIndex))
            : 0;
        const salario = salarioAjustado > 0 ? salarioAjustado : ultimoSalario;

        // entradas extras (receitas além do salário)
        const entradasExtras = (saldo || [])
            .filter((item) => {
                const tipo = item.tipo?.toLowerCase();
                const isSalario = tipo === "salario" || tipo === "salário";
                if (isSalario) return false;

                const data = parseDataSegura(item.data);
                return (
                    data &&
                    data.getMonth() === mesIndex &&
                    data.getFullYear() === ano
                );
            })
            .reduce((acc, item) => acc + parseCurrency(item.valor), 0);

        // saídas (gastos com cartão - excluindo Mozi e aplicando 50% em divididos)
        const saidas = (gastos || [])
            .filter((item) => {
                const data = parseDataSegura(item.data);
                return (
                    data &&
                    data.getMonth() === mesIndex &&
                    data.getFullYear() === ano
                );
            })
            .reduce((acc, item) => {
                const responsavel = (item.responsavel || "meu").toLowerCase();
                if (responsavel === "mozi") return acc;
                const fator = responsavel === "dividido" ? 0.5 : 1.0;
                return acc + parseCurrency(item.valor) * fator;
            }, 0);

        // essenciais (base fixa recorrente)
        const essenciaisTotal = (essenciais || []).reduce(
            (acc, item) => acc + parseCurrency(item.valor),
            0
        );

        // saldo líquido do mês
        const valor = Number((salario + entradasExtras - (saidas + essenciaisTotal)).toFixed(2));
        const strMes = String(mesIndex + 1).padStart(2, "0");
        const chave = `${ano}-${strMes}`;

        return { mes, valor, ano, mesIndex, chave };
    });

    return Array.isArray(dados) ? dados : [];
}
