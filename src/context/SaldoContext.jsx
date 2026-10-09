// context/SaldoContext.js
import { createContext, useContext, useEffect, useState } from "react";
import {
    getSaldo,
    adicionarReceitaAPI,
    atualizarReceitaAPI,
    removerReceitaAPI,
} from "../services/saldoService";
import { parseCurrency } from "../utils/currencyUtils";
import { useMes } from "./MesContext";

const SaldoContext = createContext();

const STORAGE_KEY_SALARIOS = "guia_economico_salarios_ajustados";

export function SaldoProvider({ children }) {
    const [saldo, setSaldo] = useState([]);
    const { mesReferencia } = useMes() || {};
    const [salarioPadrao, setSalarioPadrao] = useState(); // valor recorrente padrão
    const [salariosPorMes, setSalariosPorMes] = useState(() => {
        try {
            const salvo = localStorage.getItem(STORAGE_KEY_SALARIOS);
            return salvo ? JSON.parse(salvo) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        async function carregar() {
            const dados = await getSaldo();
            setSaldo(dados);
        }
        carregar();
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_SALARIOS, JSON.stringify(salariosPorMes));
        } catch (e) {
            console.warn("Erro ao salvar salários no localStorage:", e);
        }
    }, [salariosPorMes]);

    const adicionarReceita = async (novaReceita) => {
        const receitaSalva = await adicionarReceitaAPI(novaReceita);
        if (receitaSalva) {
            setSaldo((prev) => [...prev, receitaSalva]);
        }
        return receitaSalva;
    };

    const atualizarReceita = async (id, dadosAtualizados) => {
        const receitaAtualizada = await atualizarReceitaAPI(id, dadosAtualizados);
        if (receitaAtualizada) {
            setSaldo((prev) =>
                prev.map((item) => (item.id === id ? { ...item, ...receitaAtualizada } : item))
            );
        }
        return receitaAtualizada;
    };

    const removerReceita = async (id) => {
        const sucesso = await removerReceitaAPI(id);
        if (sucesso) {
            setSaldo((prev) => prev.filter((item) => item.id !== id));
        }
        return sucesso;
    };

    // Ajustar salário de um mês específico
    const ajustarSalarioMes = (ano, mes, valor) => {
        setSalariosPorMes((prev) => ({
            ...prev,
            [`${ano}-${mes}`]: valor,
        }));
    };

    // Obtém o último salário registrado historicamente em lançamentos
    const getUltimoSalarioLancado = () => {
        const salariosLancados = (saldo || [])
            .filter((item) => {
                const tipo = item.tipo?.toLowerCase() || "";
                return tipo.includes("salari") || tipo.includes("salário");
            })
            .sort((a, b) => {
                const dataA = a.data ? new Date(a.data.includes("T") ? a.data : `${a.data}T00:00:00`) : 0;
                const dataB = b.data ? new Date(b.data.includes("T") ? b.data : `${b.data}T00:00:00`) : 0;
                return dataB - dataA;
            });

        return salariosLancados.length > 0
            ? parseCurrency(salariosLancados[0].valor)
            : 0;
    };

    // Obter salário do mês (ajustado manualmente, lançado em receita ou herdado do mês anterior/último salário)
    const getSalarioDoMes = (ano, mes) => {
        // 1. Ajuste manual explícito para este mês
        const ajuste = salariosPorMes[`${ano}-${mes}`];
        if (ajuste !== undefined && ajuste !== null && ajuste !== "") {
            return ajuste;
        }

        // 2. Se há lançamento de salário registrado para este mês específico
        const lancamentoMes = (saldo || []).find((item) => {
            if (!item.data) return false;
            const tipo = item.tipo?.toLowerCase() || "";
            if (!tipo.includes("salari") && !tipo.includes("salário")) return false;
            const data = new Date(item.data.includes("T") ? item.data : `${item.data}T12:00:00`);
            return data.getFullYear() === ano && data.getMonth() === mes;
        });

        if (lancamentoMes && lancamentoMes.valor) {
            return lancamentoMes.valor;
        }

        // 3. Fallback: salário padrão configurado ou último salário registrado do mês anterior
        return salarioPadrao || getUltimoSalarioLancado();
    };

    const getEntradasDoMes = (ref = mesReferencia) => {
        const dataRef = ref || new Date();
        const ano = dataRef.getFullYear();
        const mes = dataRef.getMonth();

        // Receitas cadastradas no mês selecionado
        const receitasDoMes = (saldo || []).filter((item) => {
            if (!item.data) return false;
            const data = new Date(
                item.data.includes("T") ? item.data : `${item.data}T12:00:00`
            );
            return data.getMonth() === mes && data.getFullYear() === ano;
        });

        // Verifica se já existe um lançamento de salário entre as receitas deste mês
        const temSalarioLancado = receitasDoMes.some((item) => {
            const tipo = item.tipo?.toLowerCase() || "";
            return tipo.includes("salari") || tipo.includes("salário");
        });

        const totalLancamentos = receitasDoMes.reduce(
            (acc, item) => acc + parseCurrency(item.valor),
            0
        );

        // Se NÃO tem salário lançado neste mês, soma o salário base herdado/ajustado do mês anterior
        const salarioComplementar = !temSalarioLancado
            ? parseCurrency(getSalarioDoMes(ano, mes))
            : 0;

        return (totalLancamentos + salarioComplementar).toFixed(2);
    };

    return (
        <SaldoContext.Provider
            value={{
                saldo,
                adicionarReceita,
                atualizarReceita,
                removerReceita,
                getEntradasDoMes,
                getSalarioDoMes,
                ajustarSalarioMes,
                salarioPadrao,
                setSalarioPadrao,
            }}
        >
            {children}
        </SaldoContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSaldo() {
    return useContext(SaldoContext);
}
