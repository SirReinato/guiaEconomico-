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

function getNomeColecaoSaldo(perfil = "renato") {
    return perfil === "ingrid" ? "saldo_ingrid" : "saldo";
}

function getDocConfigSalarios(perfil = "renato") {
    return perfil === "ingrid"
        ? ["configuracoes", "salarios_ingrid"]
        : ["configuracoes", "salarios_ajustados"];
}

export async function getSaldo(perfil = "renato") {
    if (!isFirebaseConfigured) {
        return [];
    }
    const colecao = getNomeColecaoSaldo(perfil);
    try {
        const querySnapshot = await getDocs(collection(db, colecao));
        const receitas = [];
        querySnapshot.forEach((docSnap) => {
            receitas.push({
                id: docSnap.id,
                ...docSnap.data(),
            });
        });
        return receitas;
    } catch (error) {
        console.error(`Erro ao buscar saldo/receitas (${colecao}) no Firestore:`, error);
        return [];
    }
}

export async function adicionarReceitaAPI(novaReceita, perfil = "renato") {
    if (!isFirebaseConfigured) return null;
    const colecao = getNomeColecaoSaldo(perfil);
    try {
        const payload = {
            ...novaReceita,
            valor: parseCurrency(novaReceita.valor),
        };
        const docRef = await addDoc(collection(db, colecao), payload);
        return { id: docRef.id, ...payload };
    } catch (error) {
        console.error(`Erro ao adicionar receita (${colecao}) no Firestore:`, error);
        return null;
    }
}

export async function atualizarReceitaAPI(id, dadosAtualizados, perfil = "renato") {
    if (!isFirebaseConfigured) return null;
    const colecao = getNomeColecaoSaldo(perfil);
    try {
        const { id: _id, ...dados } = dadosAtualizados;
        if (dados.valor !== undefined) {
            dados.valor = parseCurrency(dados.valor);
        }
        const docRef = doc(db, colecao, id);
        await updateDoc(docRef, dados);
        return { id, ...dados };
    } catch (error) {
        console.error(`Erro ao atualizar receita (${colecao}) no Firestore:`, error);
        return null;
    }
}

export async function removerReceitaAPI(id, perfil = "renato") {
    if (!isFirebaseConfigured) return false;
    const colecao = getNomeColecaoSaldo(perfil);
    try {
        const docRef = doc(db, colecao, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error(`Erro ao remover receita (${colecao}) no Firestore:`, error);
        return false;
    }
}

export async function getSalariosAjustadosAPI(perfil = "renato") {
    if (!isFirebaseConfigured) return {};
    const docPath = getDocConfigSalarios(perfil);
    try {
        const docRef = doc(db, docPath[0], docPath[1]);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data().salarios || {};
        }
        return {};
    } catch (error) {
        console.warn(`Erro ao buscar salários ajustados (${docPath.join("/")}) no Firestore:`, error);
        return {};
    }
}

export async function salvarSalariosAjustadosAPI(salarios, perfil = "renato") {
    if (!isFirebaseConfigured) return;
    const docPath = getDocConfigSalarios(perfil);
    try {
        const docRef = doc(db, docPath[0], docPath[1]);
        await setDoc(docRef, { salarios, atualizadoEm: new Date().toISOString() }, { merge: true });
    } catch (error) {
        console.error(`Erro ao salvar salários ajustados (${docPath.join("/")}) no Firestore:`, error);
    }
}
