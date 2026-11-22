import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    adicionarEssencialAPI,
    getEssencial,
    atualizarEssencialAPI,
    removerEssencialAPI,
} from "../services/essencial";
import { parseCurrency } from "../utils/currencyUtils";
import { useAuth } from "./AuthContext";

const EssencialContext = createContext();

export function EssencialProvider({ children }) {
    const { perfilAtivo } = useAuth() || {};
    const [essenciais, setEssenciais] = useState([]);

    useEffect(() => {
        let isMounted = true;
        async function carregar() {
            const perfil = perfilAtivo || "renato";
            const dados = await getEssencial(perfil);
            if (!isMounted) return;
            setEssenciais(dados);

            // Apenas para o Renato: garante que pos-graduacao esteja inicializada se houver dados
            if (perfil === "renato") {
                const temPos = (dados || []).some(
                    (e) =>
                        e.tipo?.toLowerCase().includes("pos") ||
                        e.tipo?.toLowerCase().includes("pós")
                );
                if (!temPos && dados.length > 0) {
                    adicionarEssencialAPI({
                        tipo: "pos-graduacao",
                        valor: 0,
                        data: new Date().toISOString().split("T")[0],
                    }, "renato")
                        .then((novo) => {
                            if (novo && isMounted) {
                                setEssenciais((prev) => [...prev, novo]);
                            }
                        })
                        .catch((err) =>
                            console.warn("Auto-inicialização de pos-graduacao:", err)
                        );
                }
            }
        }
        carregar();
        return () => {
            isMounted = false;
        };
    }, [perfilAtivo]);

    const adicionarEssencial = useCallback(async (novoEssencial) => {
        const perfil = perfilAtivo || "renato";
        const essencialSalvo = await adicionarEssencialAPI(novoEssencial, perfil);
        if (essencialSalvo) {
            setEssenciais((prev) => [...prev, essencialSalvo]);
        }
        return essencialSalvo;
    }, [perfilAtivo]);

    const atualizarEssencial = useCallback(async (id, dadosAtualizados) => {
        const perfil = perfilAtivo || "renato";
        const atualizado = await atualizarEssencialAPI(id, dadosAtualizados, perfil);
        if (atualizado) {
            setEssenciais((prev) =>
                prev.map((item) => (item.id === id ? atualizado : item))
            );
        }
        return atualizado;
    }, [perfilAtivo]);

    const removerEssencial = useCallback(async (id) => {
        const perfil = perfilAtivo || "renato";
        const sucesso = await removerEssencialAPI(id, perfil);
        if (sucesso) {
            setEssenciais((prev) => prev.filter((item) => item.id !== id));
        }
        return sucesso;
    }, [perfilAtivo]);

    const getTotalEssenciais = useCallback(() => {
        return essenciais.reduce(
            (acc, item) => acc + parseCurrency(item.valor),
            0
        );
    }, [essenciais]);

    const value = useMemo(
        () => ({
            essenciais,
            adicionarEssencial,
            atualizarEssencial,
            removerEssencial,
            getTotalEssenciais,
        }),
        [essenciais, adicionarEssencial, atualizarEssencial, removerEssencial, getTotalEssenciais]
    );

    return (
        <EssencialContext.Provider value={value}>
            {children}
        </EssencialContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEssencial() {
    return useContext(EssencialContext);
}
