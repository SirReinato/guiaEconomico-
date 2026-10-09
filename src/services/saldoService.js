import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config/firebase";
import { parseCurrency } from "../utils/formatters";

const COLECAO = "saldo";

export async function getSaldo() {
    if (!isFirebaseConfigured) {
        return [];
    }
    try {
        const querySnapshot = await getDocs(collection(db, COLECAO));
        const receitas = [];
        querySnapshot.forEach((docSnap) => {
            receitas.push({
                id: docSnap.id,
                ...docSnap.data(),
            });
        });
        return receitas;
    } catch (error) {
        console.error("Erro ao buscar saldo/receitas no Firestore:", error);
        return [];
    }
}

export async function adicionarReceitaAPI(novaReceita) {
    if (!isFirebaseConfigured) return null;
    try {
        const payload = {
            ...novaReceita,
            valor: parseCurrency(novaReceita.valor),
        };
        const docRef = await addDoc(collection(db, COLECAO), payload);
        return { id: docRef.id, ...payload };
    } catch (error) {
        console.error("Erro ao adicionar receita no Firestore:", error);
        return null;
    }
}

export async function atualizarReceitaAPI(id, dadosAtualizados) {
    if (!isFirebaseConfigured) return null;
    try {
        const { id: _id, ...dados } = dadosAtualizados;
        if (dados.valor !== undefined) {
            dados.valor = parseCurrency(dados.valor);
        }
        const docRef = doc(db, COLECAO, id);
        await updateDoc(docRef, dados);
        return { id, ...dados };
    } catch (error) {
        console.error("Erro ao atualizar receita no Firestore:", error);
        return null;
    }
}

export async function removerReceitaAPI(id) {
    if (!isFirebaseConfigured) return false;
    try {
        const docRef = doc(db, COLECAO, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Erro ao remover receita no Firestore:", error);
        return false;
    }
}

const CONFIG_SALARIOS_DOC = ["configuracoes", "salarios_ajustados"];

export async function getSalariosAjustadosAPI() {
    if (!isFirebaseConfigured) return {};
    try {
        const docRef = doc(db, CONFIG_SALARIOS_DOC[0], CONFIG_SALARIOS_DOC[1]);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data().salarios || {};
        }
        return {};
    } catch (error) {
        console.warn("Erro ao buscar salários ajustados no Firestore:", error);
        return {};
    }
}

export async function salvarSalariosAjustadosAPI(salarios) {
    if (!isFirebaseConfigured) return;
    try {
        const docRef = doc(db, CONFIG_SALARIOS_DOC[0], CONFIG_SALARIOS_DOC[1]);
        await setDoc(docRef, { salarios, atualizadoEm: new Date().toISOString() }, { merge: true });
    } catch (error) {
        console.warn("Erro ao salvar salários ajustados no Firestore:", error);
    }
}
