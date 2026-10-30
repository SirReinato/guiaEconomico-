import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
    getMetas,
    adicionarMetaAPI,
    atualizarMetaAPI,
    removerMetaAPI,
    salvarPlanoIAMetaAPI,
} from "../services/metasService";
import { gerarPlanoIAMeta } from "../services/planoIAService";

export function useMetas() {
    const { perfilAtivo } = useAuth() || {};
    const perfil = perfilAtivo || "renato";

    const [metas, setMetas] = useState([]);
    const [metaAtivaId, setMetaAtivaId] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [gerandoPlano, setGerandoPlano] = useState(false);
    const [erro, setErro] = useState(null);

    // Carrega as metas do perfil
    const recarregarMetas = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await getMetas(perfil);
            setMetas(dados || []);
            if (dados && dados.length > 0) {
                // Se não há meta ativa selecionada ou se a ativa não existe mais na lista
                setMetaAtivaId((prev) => {
                    if (prev && dados.some((m) => m.id === prev)) return prev;
                    return dados[0].id;
                });
            } else {
                setMetaAtivaId(null);
            }
        } catch (e) {
            console.error("Erro ao carregar metas:", e);
            setErro("Não foi possível carregar as metas.");
        } finally {
            setCarregando(false);
        }
    }, [perfil]);

    useEffect(() => {
        recarregarMetas();
    }, [recarregarMetas]);

    const metaAtiva = metas.find((m) => m.id === metaAtivaId) || metas[0] || null;

    // Criar nova meta
    const criarMeta = async (dadosMeta) => {
        const criada = await adicionarMetaAPI(dadosMeta, perfil);
        if (criada) {
            setMetas((prev) => [criada, ...prev]);
            setMetaAtivaId(criada.id);
            return criada;
        }
        return null;
    };

    // Atualizar meta
    const editarMeta = async (id, dadosAtualizados) => {
        const atualizada = await atualizarMetaAPI(id, dadosAtualizados, perfil);
        if (atualizada) {
            setMetas((prev) =>
                prev.map((m) => (m.id === id ? { ...m, ...atualizada } : m))
            );
            return atualizada;
        }
        return null;
    };

    // Excluir meta
    const excluirMeta = async (id) => {
        const ok = await removerMetaAPI(id, perfil);
        if (ok) {
            setMetas((prev) => {
                const filtradas = prev.filter((m) => m.id !== id);
                if (metaAtivaId === id) {
                    setMetaAtivaId(filtradas.length > 0 ? filtradas[0].id : null);
                }
                return filtradas;
            });
            return true;
        }
        return false;
    };

    // Gerar ou atualizar plano de IA para uma meta específica
    const gerarPlanoIA = async (meta, contextoFinanceiro, cenarios) => {
        if (!meta || !meta.id) return null;
        setGerandoPlano(true);
        try {
            const plano = await gerarPlanoIAMeta({ meta, contextoFinanceiro, cenarios });
            if (plano) {
                await salvarPlanoIAMetaAPI(meta.id, plano, perfil);
                setMetas((prev) =>
                    prev.map((m) => (m.id === meta.id ? { ...m, planoIA: plano } : m))
                );
                return plano;
            }
        } catch (e) {
            console.error("Erro ao gerar plano IA:", e);
        } finally {
            setGerandoPlano(false);
        }
        return null;
    };

    return {
        metas,
        metaAtiva,
        metaAtivaId,
        setMetaAtivaId,
        carregando,
        gerandoPlano,
        erro,
        criarMeta,
        editarMeta,
        excluirMeta,
        gerarPlanoIA,
        recarregarMetas,
    };
}
