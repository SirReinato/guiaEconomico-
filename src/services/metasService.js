import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config/firebase";

function getNomeColecaoMetas(perfil = "renato") {
    return perfil === "ingrid" ? "metas_ingrid" : "metas";
}

function getStorageKeyMetas(perfil = "renato") {
    return `guia_economico_metas_${perfil || "renato"}`;
}

/**
 * Busca todas as metas financeiras do perfil ativo.
 * Consulta o Firestore com fallback transparente para o cache do localStorage.
 */
export async function getMetas(perfil = "renato") {
    const storageKey = getStorageKeyMetas(perfil);

    // Lê cache local primeiro para carregamento instantâneo
    let cacheLocal = [];
    try {
        const salvo = localStorage.getItem(storageKey);
        if (salvo) {
            cacheLocal = JSON.parse(salvo);
        }
    } catch (e) {
        console.warn("Erro ao ler cache local de metas:", e);
    }

    if (!isFirebaseConfigured) {
        return cacheLocal;
    }

    const colecao = getNomeColecaoMetas(perfil);
    try {
        const querySnapshot = await getDocs(collection(db, colecao));
        const metas = [];
        querySnapshot.forEach((docSnap) => {
            metas.push({
                id: docSnap.id,
                ...docSnap.data(),
            });
        });

        // Atualiza cache local
        try {
            localStorage.setItem(storageKey, JSON.stringify(metas));
        } catch (e) {
            console.warn("Erro ao atualizar cache local de metas:", e);
        }

        return metas;
    } catch (error) {
        console.error(`Erro ao buscar metas (${colecao}) no Firestore:`, error);
        return cacheLocal;
    }
}

/**
 * Adiciona uma nova meta ao perfil.
 */
export async function adicionarMetaAPI(novaMeta, perfil = "renato") {
    const payload = {
        ...novaMeta,
        valorMin: Number(novaMeta.valorMin) || 0,
        valorMax: Number(novaMeta.valorMax) || Number(novaMeta.valorMin) || 0,
        valorJaGuardado: Number(novaMeta.valorJaGuardado) || 0,
        status: novaMeta.status || "ativa",
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
    };

    const storageKey = getStorageKeyMetas(perfil);

    if (!isFirebaseConfigured) {
        const fakeId = `local-${Date.now()}`;
        const metaLocal = { id: fakeId, ...payload };
        try {
            const lista = JSON.parse(localStorage.getItem(storageKey) || "[]");
            lista.push(metaLocal);
            localStorage.setItem(storageKey, JSON.stringify(lista));
        } catch (e) {
            console.warn("Erro ao salvar meta localmente:", e);
        }
        return metaLocal;
    }

    const colecao = getNomeColecaoMetas(perfil);
    try {
        const docRef = await addDoc(collection(db, colecao), payload);
        const metaCriada = { id: docRef.id, ...payload };

        // Sincroniza cache local
        try {
            const lista = JSON.parse(localStorage.getItem(storageKey) || "[]");
            lista.push(metaCriada);
            localStorage.setItem(storageKey, JSON.stringify(lista));
        } catch (e) {
            console.warn("Erro ao atualizar cache local com nova meta:", e);
        }

        return metaCriada;
    } catch (error) {
        console.error(`Erro ao criar meta (${colecao}) no Firestore:`, error);
        return null;
    }
}

/**
 * Atualiza os dados de uma meta existente.
 */
export async function atualizarMetaAPI(id, dadosAtualizados, perfil = "renato") {
    const payload = {
        ...dadosAtualizados,
        atualizadoEm: new Date().toISOString(),
    };

    const storageKey = getStorageKeyMetas(perfil);

    // Atualiza cache local
    try {
        const lista = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const idx = lista.findIndex((m) => m.id === id);
        if (idx >= 0) {
            lista[idx] = { ...lista[idx], ...payload };
            localStorage.setItem(storageKey, JSON.stringify(lista));
        }
    } catch (e) {
        console.warn("Erro ao atualizar meta localmente:", e);
    }

    if (!isFirebaseConfigured) {
        return { id, ...payload };
    }

    const colecao = getNomeColecaoMetas(perfil);
    try {
        const docRef = doc(db, colecao, id);
        await updateDoc(docRef, payload);
        return { id, ...payload };
    } catch (error) {
        console.error(`Erro ao atualizar meta (${colecao}/${id}) no Firestore:`, error);
        return null;
    }
}

/**
 * Remove uma meta do perfil.
 */
export async function removerMetaAPI(id, perfil = "renato") {
    const storageKey = getStorageKeyMetas(perfil);

    // Remove do cache local
    try {
        const lista = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const novaLista = lista.filter((m) => m.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(novaLista));
    } catch (e) {
        console.warn("Erro ao remover meta do cache local:", e);
    }

    if (!isFirebaseConfigured) {
        return true;
    }

    const colecao = getNomeColecaoMetas(perfil);
    try {
        const docRef = doc(db, colecao, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error(`Erro ao remover meta (${colecao}/${id}) no Firestore:`, error);
        return false;
    }
}

/**
 * Salva ou atualiza especificamente o plano gerado pela IA em uma meta.
 */
export async function salvarPlanoIAMetaAPI(id, planoIA, perfil = "renato") {
    return atualizarMetaAPI(id, { planoIA }, perfil);
}
