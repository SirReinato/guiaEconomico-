import { createContext, useContext, useEffect, useState } from "react";
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

    const adicionarEssencial = async (novoEssencial) => {
        const perfil = perfilAtivo || "renato";
        const essencialSalvo = await adicionarEssencialAPI(novoEssencial, perfil);
        if (essencialSalvo) {
            setEssenciais((prev) => [...prev, essencialSalvo]);
        }
        return essencialSalvo;
    };

    const atualizarEssencial = async (id, dadosAtualizados) => {
        const perfil = perfilAtivo || "renato";
        const atualizado = await atualizarEssencialAPI(id, dadosAtualizados, perfil);
        if (atualizado) {
            setEssenciais((prev) =>
                prev.map((item) => (item.id === id ? atualizado : item))
            );
        }
        return atualizado;
    };

    const removerEssencial = async (id) => {
        const perfil = perfilAtivo || "renato";
        const sucesso = await removerEssencialAPI(id, perfil);
        if (sucesso) {
            setEssenciais((prev) => prev.filter((item) => item.id !== id));
        }
        return sucesso;
    };

    const getTotalEssenciais = () => {
        return essenciais.reduce(
            (acc, item) => acc + parseCurrency(item.valor),
            0
        );
    };

    return (
        <EssencialContext.Provider
            value={{
                essenciais,
                adicionarEssencial,
                atualizarEssencial,
                removerEssencial,
                getTotalEssenciais,
            }}
        >
            {children}
        </EssencialContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEssencial() {
    return useContext(EssencialContext);
}
