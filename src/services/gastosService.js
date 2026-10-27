import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    query,
    where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config/firebase";
import { parseCurrency } from "../utils/formatters";

function getNomeColecaoGastos(perfil = "renato") {
    return perfil === "ingrid" ? "gastos_ingrid" : "gastos";
}

export async function getGastos(perfil = "renato") {
    if (!isFirebaseConfigured) {
        return [];
    }
    const colecao = getNomeColecaoGastos(perfil);
    try {
        const querySnapshot = await getDocs(collection(db, colecao));
        const gastos = [];
        querySnapshot.forEach((docSnap) => {
            gastos.push({
                id: docSnap.id,
                ...docSnap.data(),
            });
        });
        return gastos;
    } catch (error) {
        console.error(`Erro ao buscar gastos (${colecao}) no Firestore:`, error);
        return [];
    }
}

export async function adicionarGastoAPI(novoGasto, perfil = "renato") {
    if (!isFirebaseConfigured) return null;
    const colecao = getNomeColecaoGastos(perfil);
    try {
        const payload = {
            ...novoGasto,
            valor: parseCurrency(novoGasto.valor),
        };
        const docRef = await addDoc(collection(db, colecao), payload);
        return { id: docRef.id, ...payload };
    } catch (error) {
        console.error(`Erro ao adicionar gasto (${colecao}) no Firestore:`, error);
        return null;
    }
}

export async function atualizarGastoAPI(id, dadosAtualizados, perfil = "renato") {
    if (!isFirebaseConfigured) return null;
    const colecao = getNomeColecaoGastos(perfil);
    try {
        const { id: _id, ...dados } = dadosAtualizados;
        if (dados.valor !== undefined) {
            dados.valor = parseCurrency(dados.valor);
        }
        const docRef = doc(db, colecao, id);
        await updateDoc(docRef, dados);
        return { id, ...dados };
    } catch (error) {
        console.error(`Erro ao atualizar gasto (${colecao}) no Firestore:`, error);
        return null;
    }
}

export async function removerGastoAPI(id, perfil = "renato") {
    if (!isFirebaseConfigured) return false;
    const colecao = getNomeColecaoGastos(perfil);
    try {
        const docRef = doc(db, colecao, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error(`Erro ao remover gasto (${colecao}) no Firestore:`, error);
        return false;
    }
}

/**
 * Busca da coleção do Renato os gastos onde o responsável é "mozi" ou "dividido".
 * O perfil da Ingrid consome essa função para saber em tempo real o que foi gasto nos cartões dele.
 */
export async function getGastosReembolsoMoziAPI() {
    if (!isFirebaseConfigured) return [];
    try {
        // Coleção padrão 'gastos' é a do Renato
        const q = query(
            collection(db, "gastos"),
            where("responsavel", "in", ["mozi", "dividido"])
        );
        const querySnapshot = await getDocs(q);
        const reembolsos = [];
        querySnapshot.forEach((docSnap) => {
            reembolsos.push({
                id: docSnap.id,
                origem: "renato",
                ...docSnap.data(),
            });
        });
        return reembolsos;
    } catch (error) {
        console.warn("Erro ao buscar gastos de reembolso Mozi no Firestore:", error);
        return [];
    }
}

/**
 * Cartões personalizados de um perfil (ex: cartões da Ingrid)
 */
export async function getCartoesPersonalizadosAPI(perfil = "ingrid") {
    if (!isFirebaseConfigured) return [];
    try {
        const docPath = perfil === "ingrid" ? ["configuracoes", "cartoes_ingrid"] : ["configuracoes", "cartoes_renato"];
        const docRef = doc(db, docPath[0], docPath[1]);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data().cartoes || [];
        }
        return [];
    } catch (error) {
        console.warn("Erro ao buscar cartões personalizados:", error);
        return [];
    }
}

export async function salvarCartoesPersonalizadosAPI(cartoes, perfil = "ingrid") {
    if (!isFirebaseConfigured) return cartoes;
    try {
        const docPath = perfil === "ingrid" ? ["configuracoes", "cartoes_ingrid"] : ["configuracoes", "cartoes_renato"];
        const docRef = doc(db, docPath[0], docPath[1]);
        await setDoc(docRef, { cartoes, atualizadoEm: new Date().toISOString() }, { merge: true });
        return cartoes;
    } catch (error) {
        console.error("Erro ao salvar cartões personalizados:", error);
        return cartoes;
    }
}

/**
 * Integração Fatura do Cartão Itaú (Uso da Ingrid, lançado pelo Renato ou por ela)
 * Chave por mês: "YYYY-MM"
 */
const DOC_FATURA_ITAU = ["configuracoes", "fatura_itau_ingrid"];

export async function getFaturasItauAPI() {
    if (!isFirebaseConfigured) return {};
    try {
        const docRef = doc(db, DOC_FATURA_ITAU[0], DOC_FATURA_ITAU[1]);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data().faturas || {};
        }
        return {};
    } catch (error) {
        console.warn("Erro ao buscar faturas Itaú:", error);
        return {};
    }
}

export async function salvarFaturaItauMesAPI(chaveMes, valor) {
    if (!isFirebaseConfigured) return;
    try {
        const faturasAtuais = await getFaturasItauAPI();
        const atualizado = {
            ...faturasAtuais,
            [chaveMes]: parseCurrency(valor),
        };
        const docRef = doc(db, DOC_FATURA_ITAU[0], DOC_FATURA_ITAU[1]);
        await setDoc(docRef, { faturas: atualizado, atualizadoEm: new Date().toISOString() }, { merge: true });
        return atualizado;
    } catch (error) {
        console.error("Erro ao salvar fatura Itaú:", error);
    }
}
