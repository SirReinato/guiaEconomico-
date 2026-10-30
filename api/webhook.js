import crypto from "crypto";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { parseNotification } from "../src/utils/notificationParser.js";

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

function getDbInstance() {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    return { app, db, auth };
}

/**
 * Comparação em tempo constante para evitar ataques de temporização (Timing Attacks).
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeCompare(a, b) {
    if (typeof a !== "string" || typeof b !== "string") {
        return false;
    }
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
        return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Higieniza entradas do payload para prevenir injeção ou sobrecarga de memória.
 *
 * @param {unknown} val
 * @param {number} maxLen
 * @returns {string}
 */
function sanitizarEntrada(val, maxLen = 300) {
    if (typeof val !== "string") {
        return "";
    }
    return val.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

export default async function handler(req, res) {
    // Cabeçalhos de Segurança HTTP defensivos
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-webhook-token");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // Health check via GET
    if (req.method === "GET") {
        return res.status(200).json({
            status: "online",
            mensagem: "Webhook do Guia Econômico operacional e protegido.",
            timestamp: new Date().toISOString(),
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido. Utilize POST." });
    }

    // 1. Validação Obrigatória do Token de Segurança (Fail-Safe Defaults)
    const webhookSecret = process.env.WEBHOOK_SECRET || process.env.VITE_WEBHOOK_SECRET;
    if (!webhookSecret || typeof webhookSecret !== "string" || webhookSecret.trim().length === 0) {
        console.error("Segurança: WEBHOOK_SECRET não configurado nas variáveis de ambiente do servidor.");
        return res.status(500).json({
            error: "Falha de configuração de segurança do webhook: segredo ausente no servidor.",
        });
    }

    // Extrai o token de cabeçalhos seguros preferencialmente, com fallbacks controlados
    const authHeader = req.headers["authorization"];
    let bearerToken = null;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        bearerToken = authHeader.slice(7).trim();
    }

    const tokenRecebido =
        bearerToken ||
        req.headers["x-webhook-token"] ||
        req.body?.token ||
        req.body?.secret ||
        req.query?.token;

    if (!tokenRecebido || !timingSafeCompare(String(tokenRecebido), webhookSecret.trim())) {
        console.warn("Segurança: Tentativa de acesso ao webhook com token ausente ou inválido.");
        return res.status(401).json({ error: "Token de segurança inválido ou não fornecido." });
    }

    // 2. Extração e sanitização dos dados da notificação (Prevenção de payload bombs)
    const body = req.body || {};
    const payload = {
        banco: sanitizarEntrada(body.banco || body.app || "", 100),
        texto: sanitizarEntrada(body.texto || body.text || body.message || "", 500),
        titulo: sanitizarEntrada(body.titulo || body.title || "", 200),
    };

    if (!payload.texto && !payload.titulo) {
        return res.status(400).json({
            error: "Payload incompleto: é necessário fornecer o texto ou título da notificação.",
        });
    }

    const gastoFormatado = parseNotification(payload);

    if (!gastoFormatado || typeof gastoFormatado.valor !== "number" || isNaN(gastoFormatado.valor)) {
        return res.status(400).json({
            error: "Não foi possível extrair uma compra válida a partir do texto recebido.",
            payloadRecebido: payload,
        });
    }

    // Garante que o gasto não contenha valores absurdos ou campos corrompidos
    if (gastoFormatado.valor <= 0 || gastoFormatado.valor > 1000000) {
        return res.status(400).json({
            error: "Valor do gasto fora dos limites de segurança aceitáveis.",
        });
    }

    // 3. Gravação no Firebase Firestore
    try {
        const { db, auth } = getDbInstance();

        // Se houver credenciais dedicadas para automação no servidor, autentica
        const webhookEmail = process.env.WEBHOOK_AUTH_EMAIL;
        const webhookPassword = process.env.WEBHOOK_AUTH_PASSWORD;
        if (webhookEmail && webhookPassword && !auth.currentUser) {
            try {
                await signInWithEmailAndPassword(auth, webhookEmail, webhookPassword);
            } catch (authErr) {
                console.warn("Aviso na autenticação do webhook bot:", authErr.message);
            }
        }

        const docRef = await addDoc(collection(db, "gastos"), {
            ...gastoFormatado,
            origemCaptura: "webhook-macrodroid",
            criadoEm: new Date().toISOString(),
        });

        return res.status(200).json({
            success: true,
            mensagem: "Gasto registrado com sucesso no Guia Econômico!",
            gasto: {
                id: docRef.id,
                ...gastoFormatado,
            },
        });
    } catch (error) {
        console.error("Erro ao gravar gasto no Firestore via webhook:", error);
        return res.status(500).json({
            error: "Falha ao gravar no banco de dados.",
            detalhes: error.message,
        });
    }
}
