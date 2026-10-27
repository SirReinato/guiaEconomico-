// context/SaldoContext.js
import { createContext, useContext, useEffect, useState } from "react";
import {
    getSaldo,
    adicionarReceitaAPI,
    atualizarReceitaAPI,
    removerReceitaAPI,
    getSalariosAjustadosAPI,
    salvarSalariosAjustadosAPI,
} from "../services/saldoService";
import { parseCurrency } from "../utils/currencyUtils";
import { useMes } from "./MesContext";
import { useAuth } from "./AuthContext";

const SaldoContext = createContext();

function getStorageKeySalarios(perfil = "renato") {
    return perfil === "ingrid"
        ? "guia_economico_salarios_ajustados_ingrid"
        : "guia_economico_salarios_ajustados";
}

export function SaldoProvider({ children }) {
    const { perfilAtivo } = useAuth() || {};
    const perfil = perfilAtivo || "renato";
    const [saldo, setSaldo] = useState([]);
    const { mesReferencia } = useMes() || {};
    const [salarioPadrao, setSalarioPadrao] = useState();
    const [salariosPorMes, setSalariosPorMes] = useState({});

    // Carrega salários locais e remotos quando o perfil mudar
    useEffect(() => {
        let isMounted = true;
        const storageKey = getStorageKeySalarios(perfil);

        let salvoLocal = {};
        try {
            const salvo = localStorage.getItem(storageKey);
            if (salvo) salvoLocal = JSON.parse(salvo);
        } catch {
            salvoLocal = {};
        }

        setSalariosPorMes(salvoLocal);

        async function carregar() {
            const [dadosSaldo, dadosSalariosRemotos] = await Promise.all([
                getSaldo(perfil),
                getSalariosAjustadosAPI(perfil),
            ]);
            if (!isMounted) return;
            setSaldo(dadosSaldo);

            if (dadosSalariosRemotos && Object.keys(dadosSalariosRemotos).length > 0) {
                setSalariosPorMes((prev) => {
                    const mesclado = { ...prev, ...dadosSalariosRemotos };
                    try {
                        localStorage.setItem(storageKey, JSON.stringify(mesclado));
                    } catch (err) {
                        console.warn("Erro ao atualizar cache local de salários:", err);
                    }
                    return mesclado;
                });
            }
        }
        carregar();

        return () => {
            isMounted = false;
        };
    }, [perfil]);

    useEffect(() => {
        if (!salariosPorMes || Object.keys(salariosPorMes).length === 0) return;
        const storageKey = getStorageKeySalarios(perfil);
        try {
            localStorage.setItem(storageKey, JSON.stringify(salariosPorMes));
        } catch (e) {
            console.warn("Erro ao salvar salários no localStorage:", e);
        }
        salvarSalariosAjustadosAPI(salariosPorMes, perfil);
    }, [salariosPorMes, perfil]);

    const adicionarReceita = async (novaReceita) => {
        const receitaSalva = await adicionarReceitaAPI(novaReceita, perfil);
        if (receitaSalva) {
            setSaldo((prev) => [...prev, receitaSalva]);
        }
        return receitaSalva;
    };

    const atualizarReceita = async (id, dadosAtualizados) => {
        const receitaAtualizada = await atualizarReceitaAPI(id, dadosAtualizados, perfil);
        if (receitaAtualizada) {
            setSaldo((prev) =>
                prev.map((item) => (item.id === id ? { ...item, ...receitaAtualizada } : item))
            );
        }
        return receitaAtualizada;
    };

    const removerReceita = async (id) => {
        const sucesso = await removerReceitaAPI(id, perfil);
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

    // Obter salário do mês
    const getSalarioDoMes = (ano, mes) => {
        const ajuste = salariosPorMes[`${ano}-${mes}`];
        if (ajuste !== undefined && ajuste !== null && ajuste !== "") {
            return ajuste;
        }

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

        return salarioPadrao || getUltimoSalarioLancado();
    };

    const getEntradasDoMes = (ref = mesReferencia) => {
        const dataRef = ref || new Date();
        const ano = dataRef.getFullYear();
        const mes = dataRef.getMonth();

        const receitasDoMes = (saldo || []).filter((item) => {
            if (!item.data) return false;
            const data = new Date(
                item.data.includes("T") ? item.data : `${item.data}T12:00:00`
            );
            return data.getMonth() === mes && data.getFullYear() === ano;
        });

        const totalReceitas = receitasDoMes.reduce(
            (acc, item) => acc + parseCurrency(item.valor),
            0
        );

        // Se houver salário configurado e nenhuma receita de salário cadastrada no mês
        const temSalarioLancado = receitasDoMes.some((item) => {
            const tipo = item.tipo?.toLowerCase() || "";
            return tipo.includes("salari") || tipo.includes("salário");
        });

        if (!temSalarioLancado) {
            const salarioConfig = parseCurrency(getSalarioDoMes(ano, mes));
            return totalReceitas + salarioConfig;
        }

        return totalReceitas;
    };

    return (
        <SaldoContext.Provider
            value={{
                saldo,
                adicionarReceita,
                atualizarReceita,
                removerReceita,
                salarioPadrao,
                setSalarioPadrao,
                getSalarioDoMes,
                ajustarSalarioMes,
                salariosPorMes,
                getEntradasDoMes,
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
