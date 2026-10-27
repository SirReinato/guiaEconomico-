import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config/firebase";
import { parseCurrency } from "../utils/formatters";

function getNomeColecaoEssenciais(perfil = "renato") {
    return perfil === "ingrid" ? "essenciais_ingrid" : "essenciais";
}

export async function getEssencial(perfil = "renato") {
    if (!isFirebaseConfigured) {
        return [];
    }
    const colecao = getNomeColecaoEssenciais(perfil);
    try {
        const querySnapshot = await getDocs(collection(db, colecao));
        const essenciais = [];
        querySnapshot.forEach((docSnap) => {
            essenciais.push({
                id: docSnap.id,
                ...docSnap.data(),
            });
        });
        return essenciais;
    } catch (error) {
        console.error(`Erro ao buscar gastos essenciais (${colecao}) no Firestore:`, error);
        return [];
    }
}

export async function adicionarEssencialAPI(novoEssencial, perfil = "renato") {
    if (!isFirebaseConfigured) return null;
    const colecao = getNomeColecaoEssenciais(perfil);
    try {
        const payload = {
            ...novoEssencial,
            valor: parseCurrency(novoEssencial.valor),
        };
        const docRef = await addDoc(collection(db, colecao), payload);
        return { id: docRef.id, ...payload };
    } catch (error) {
        console.error(`Erro ao adicionar gasto essencial (${colecao}) no Firestore:`, error);
        return null;
    }
}

export async function atualizarEssencialAPI(id, dadosAtualizados, perfil = "renato") {
    if (!isFirebaseConfigured) return null;
    const colecao = getNomeColecaoEssenciais(perfil);
    try {
        const { id: _id, ...dados } = dadosAtualizados;
        if (dados.valor !== undefined) {
            dados.valor = parseCurrency(dados.valor);
        }
        const docRef = doc(db, colecao, id);
        await updateDoc(docRef, dados);
        return { id, ...dados };
    } catch (error) {
        console.error(`Erro ao atualizar gasto essencial (${colecao}) no Firestore:`, error);
        return null;
    }
}

export async function removerEssencialAPI(id, perfil = "renato") {
    if (!isFirebaseConfigured) return false;
    const colecao = getNomeColecaoEssenciais(perfil);
    try {
        const docRef = doc(db, colecao, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error(`Erro ao remover gasto essencial (${colecao}) no Firestore:`, error);
        return false;
    }
}
