import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config/firebase";
import { parseCurrency } from "../utils/currencyUtils";

function getNomeColecaoAssinaturas(perfil = "renato") {
    return perfil === "ingrid" ? "assinaturas_ingrid" : "assinaturas";
}

/**
 * Busca todas as assinaturas do perfil informado
 */
export async function getAssinaturasAPI(perfil = "renato") {
    if (!isFirebaseConfigured) return [];
    const colecao = getNomeColecaoAssinaturas(perfil);
    try {
        const querySnapshot = await getDocs(collection(db, colecao));
        const lista = [];
        querySnapshot.forEach((docSnap) => {
            lista.push({
                id: docSnap.id,
                ...docSnap.data(),
            });
        });
        return lista;
    } catch (error) {
        console.error(`Erro ao buscar assinaturas (${colecao}) no Firestore:`, error);
        return [];
    }
}

/**
 * Adiciona uma nova assinatura recorrente
 */
export async function adicionarAssinaturaAPI(novaAssinatura, perfil = "renato") {
    if (!isFirebaseConfigured) return null;
    const colecao = getNomeColecaoAssinaturas(perfil);
    try {
        const agora = new Date().toISOString();
        const payload = {
            nome: novaAssinatura.nome?.trim() || "Assinatura",
            valor: parseCurrency(novaAssinatura.valor),
            cartao: novaAssinatura.cartao || "Nubank",
            categoria: novaAssinatura.categoria?.trim() || "Assinaturas",
            tipo: novaAssinatura.tipo || "Desejo",
            responsavel: novaAssinatura.responsavel || "meu",
            dataInicio: novaAssinatura.dataInicio || agora.split("T")[0],
            inicioCiclo: novaAssinatura.inicioCiclo || agora.substring(0, 7),
            ativa: true,
            canceladaAPartirDe: null,
            descricao: novaAssinatura.descricao?.trim() || "",
            criadoEm: agora,
            atualizadoEm: agora,
        };

        const docRef = await addDoc(collection(db, colecao), payload);
        return { id: docRef.id, ...payload };
    } catch (error) {
        console.error(`Erro ao adicionar assinatura (${colecao}) no Firestore:`, error);
        return null;
    }
}

/**
 * Atualiza campos de uma assinatura existente
 */
export async function atualizarAssinaturaAPI(id, dadosAtualizados, perfil = "renato") {
    if (!isFirebaseConfigured) return null;
    const colecao = getNomeColecaoAssinaturas(perfil);
    try {
        const { id: _id, criadoEm: _criadoEm, ...dados } = dadosAtualizados;
        if (dados.valor !== undefined) {
            dados.valor = parseCurrency(dados.valor);
        }
        dados.atualizadoEm = new Date().toISOString();

        const docRef = doc(db, colecao, id);
        await updateDoc(docRef, dados);
        return { id, ...dados };
    } catch (error) {
        console.error(`Erro ao atualizar assinatura (${colecao}) no Firestore:`, error);
        return null;
    }
}

/**
 * Cancela a assinatura a partir de um ciclo específico (preservando o histórico nos ciclos anteriores)
 */
export async function cancelarAssinaturaAPI(id, chaveCicloCancelamento, perfil = "renato") {
    if (!isFirebaseConfigured) return false;
    const colecao = getNomeColecaoAssinaturas(perfil);
    try {
        const dados = {
            ativa: false,
            canceladaAPartirDe: chaveCicloCancelamento,
            atualizadoEm: new Date().toISOString(),
        };
        const docRef = doc(db, colecao, id);
        await updateDoc(docRef, dados);
        return true;
    } catch (error) {
        console.error(`Erro ao cancelar assinatura (${colecao}) no Firestore:`, error);
        return false;
    }
}

/**
 * Reativa uma assinatura que havia sido cancelada
 */
export async function reativarAssinaturaAPI(id, perfil = "renato") {
    if (!isFirebaseConfigured) return false;
    const colecao = getNomeColecaoAssinaturas(perfil);
    try {
        const dados = {
            ativa: true,
            canceladaAPartirDe: null,
            atualizadoEm: new Date().toISOString(),
        };
        const docRef = doc(db, colecao, id);
        await updateDoc(docRef, dados);
        return true;
    } catch (error) {
        console.error(`Erro ao reativar assinatura (${colecao}) no Firestore:`, error);
        return false;
    }
}

/**
 * Exclui permanentemente o registro de assinatura (ex: cadastrada por engano)
 */
export async function removerAssinaturaAPI(id, perfil = "renato") {
    if (!isFirebaseConfigured) return false;
    const colecao = getNomeColecaoAssinaturas(perfil);
    try {
        const docRef = doc(db, colecao, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error(`Erro ao remover assinatura (${colecao}) no Firestore:`, error);
        return false;
    }
}

/**
 * Busca assinaturas compartilhadas/reembolsáveis do parceiro ('mozi' ou 'dividido')
 */
export async function getAssinaturasReembolsoParceiroAPI(origemPerfil = "renato") {
    if (!isFirebaseConfigured) return [];
    const colecao = getNomeColecaoAssinaturas(origemPerfil);
    try {
        const q = query(
            collection(db, colecao),
            where("responsavel", "in", ["mozi", "dividido"])
        );
        const querySnapshot = await getDocs(q);
        const compartilhadas = [];
        querySnapshot.forEach((docSnap) => {
            compartilhadas.push({
                id: docSnap.id,
                origemPerfil,
                ...docSnap.data(),
            });
        });
        return compartilhadas;
    } catch (error) {
        console.warn(`Erro ao buscar assinaturas compartilhadas de ${colecao}:`, error);
        return [];
    }
}
