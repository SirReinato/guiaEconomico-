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
        const payload = { ...dadosAtualizados };
        if (dadosAtualizados.valor !== undefined) {
            payload.valor = parseCurrency(dadosAtualizados.valor);
        }
        delete payload.id;
        const docRef = doc(db, colecao, id);
        await updateDoc(docRef, payload);
        return { id, ...payload };
    } catch (error) {
        console.error(`Erro ao atualizar gasto (${colecao}) no Firestore:`, error);
        return null;
    }
}

export async function removerGastoAPI(id, perfil = "renato") {
    if (!isFirebaseConfigured) return false;
    const colecao = getNomeColecaoGastos(perfil);
    try {
        await deleteDoc(doc(db, colecao, id));
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
 * Busca da coleção da Ingrid os gastos onde o responsável é "mozi" ou "dividido".
 * O perfil do Renato consome essa função para saber em tempo real o que ela gastou e dividiu com ele.
 */
export async function getGastosReembolsoIngridAPI() {
    if (!isFirebaseConfigured) return [];
    try {
        const q = query(
            collection(db, "gastos_ingrid"),
            where("responsavel", "in", ["mozi", "dividido"])
        );
        const querySnapshot = await getDocs(q);
        const reembolsos = [];
        querySnapshot.forEach((docSnap) => {
            reembolsos.push({
                id: docSnap.id,
                origem: "ingrid",
                ...docSnap.data(),
            });
        });
        return reembolsos;
    } catch (error) {
        console.warn("Erro ao buscar gastos de reembolso Ingrid no Firestore:", error);
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

/**
 * Acordos de parcelamento de fatura ("Apertou a Fatura")
 */
export async function getParcelamentosFaturaAPI(perfil = "renato") {
    if (!isFirebaseConfigured) return {};
    try {
        const docNome = perfil === "ingrid" ? "parcelamentos_fatura_ingrid" : "parcelamentos_fatura_renato";
        const docRef = doc(db, "configuracoes", docNome);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data().acordos || {};
        }
        return {};
    } catch (error) {
        console.warn(`Erro ao buscar parcelamentos de fatura (${perfil}):`, error);
        return {};
    }
}

export async function salvarParcelamentosFaturaAPI(acordos, perfil = "renato") {
    if (!isFirebaseConfigured) return acordos;
    try {
        const docNome = perfil === "ingrid" ? "parcelamentos_fatura_ingrid" : "parcelamentos_fatura_renato";
        const docRef = doc(db, "configuracoes", docNome);
        await setDoc(docRef, { acordos, atualizadoEm: new Date().toISOString() }, { merge: true });
        return acordos;
    } catch (error) {
        console.error(`Erro ao salvar parcelamentos de fatura (${perfil}):`, error);
        return acordos;
    }
}

/**
 * Exclui todos os lançamentos gerados por um parcelamento de fatura específico
 */
export async function removerGastosPorParcelamentoAPI(parcelamentoId, perfil = "renato") {
    if (!isFirebaseConfigured || !parcelamentoId) return false;
    const colecao = getNomeColecaoGastos(perfil);
    try {
        const q = query(
            collection(db, colecao),
            where("parcelamentoId", "==", parcelamentoId)
        );
        const snap = await getDocs(q);
        const deletes = snap.docs.map((docSnap) => deleteDoc(doc(db, colecao, docSnap.id)));
        await Promise.all(deletes);
        return true;
    } catch (error) {
        console.error(`Erro ao remover gastos do parcelamento ${parcelamentoId}:`, error);
        return false;
    }
}

/**
 * Remove do Firestore lançamentos de parcelamento cujos acordos não existem mais (parcelas órfãs)
 */
export async function removerGastosOrfaosParcelamentoAPI(idsAcordosValidos = [], perfil = "renato") {
    if (!isFirebaseConfigured) return false;
    const colecao = getNomeColecaoGastos(perfil);
    try {
        const q = query(
            collection(db, colecao),
            where("origem", "==", "apertou_fatura_parcela")
        );
        const snap = await getDocs(q);
        const orfaos = snap.docs.filter((docSnap) => {
            const data = docSnap.data();
            return !data.parcelamentoId || !idsAcordosValidos.includes(data.parcelamentoId);
        });
        if (orfaos.length > 0) {
            const deletes = orfaos.map((docSnap) => deleteDoc(doc(db, colecao, docSnap.id)));
            await Promise.all(deletes);
            console.log(`Limpou ${orfaos.length} parcelas órfãs de parcelamento de fatura em ${colecao}.`);
        }
        return true;
    } catch (error) {
        console.warn("Erro ao limpar gastos órfãos de parcelamento:", error);
        return false;
    }
}
