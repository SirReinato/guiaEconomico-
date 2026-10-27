import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "../config/firebase";
import { isEmailAutorizado } from "../utils/permissoes";

function getDocPathReserva(perfil = "renato") {
    return perfil === "ingrid"
        ? ["configuracoes", "reserva_ingrid"]
        : ["configuracoes", "reserva"];
}

function getStorageKeyReserva(perfil = "renato") {
    return perfil === "ingrid" ? "guia_reserva_config_ingrid" : "guia_reserva_config";
}

/**
 * Retorna as configurações e ajustes manuais da Reserva de Emergência por perfil.
 */
export async function getReservaConfig(perfil = "renato") {
    if (auth?.currentUser && !isEmailAutorizado(auth.currentUser.email)) {
        return {};
    }
    const storageKey = getStorageKeyReserva(perfil);
    let localConfig = null;
    try {
        const salvo = localStorage.getItem(storageKey);
        if (salvo) {
            localConfig = JSON.parse(salvo);
        }
    } catch (e) {
        console.warn("Erro ao ler configuração local da reserva:", e);
    }

    if (!isFirebaseConfigured) {
        return localConfig || {};
    }

    const docPath = getDocPathReserva(perfil);
    try {
        const docRef = doc(db, docPath[0], docPath[1]);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const configMesclada = { ...localConfig, ...data };
            localStorage.setItem(storageKey, JSON.stringify(configMesclada));
            return configMesclada;
        }
    } catch (error) {
        console.warn(`Erro ao buscar configuração da reserva (${docPath.join("/")}) no Firestore:`, error);
    }

    return localConfig || {};
}

/**
 * Salva os ajustes manuais da Reserva de Emergência no Firestore e no cache local.
 */
export async function salvarReservaConfig(config, perfil = "renato") {
    if (auth?.currentUser && !isEmailAutorizado(auth.currentUser.email)) {
        console.warn("Acesso negado: usuário não autorizado.");
        return null;
    }

    const storageKey = getStorageKeyReserva(perfil);
    const payload = {
        ...config,
        atualizadoEm: new Date().toISOString(),
    };

    try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
        console.warn("Erro ao gravar configuração local da reserva:", e);
    }

    if (!isFirebaseConfigured) {
        return payload;
    }

    const docPath = getDocPathReserva(perfil);
    try {
        const docRef = doc(db, docPath[0], docPath[1]);
        await setDoc(docRef, payload, { merge: true });
        return payload;
    } catch (error) {
        console.error(`Erro ao salvar configuração da reserva (${docPath.join("/")}) no Firestore:`, error);
        return payload;
    }
}

/**
 * Registra o aporte (ou retirada) realizado no fechamento de um mês confirmado.
 */
export async function salvarAporteMesConfirmado(chaveMes, valorSobra, perfil = "renato") {
    const configAtual = await getReservaConfig(perfil);
    const aportesAtuais = configAtual.aportesConfirmados || {};

    const novosAportes = {
        ...aportesAtuais,
        [chaveMes]: {
            sobra: Number(valorSobra),
            dataConfirmacao: new Date().toISOString(),
        },
    };

    return await salvarReservaConfig({
        ...configAtual,
        aportesConfirmados: novosAportes,
    }, perfil);
}
