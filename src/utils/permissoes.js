/**
 * E-mails oficiais com acesso ao Guia Econômico.
 */
export const EMAIL_RENATO = "renatofranca2881@gmail.com";
export const EMAIL_INGRID = "ingridfadvogada@gmail.com";

export const EMAILS_PROPRIETARIOS_PADRAO = [
    EMAIL_RENATO,
    EMAIL_INGRID,
];

/**
 * Retorna o identificador do perfil baseado no e-mail:
 * - "renato": dados originais e histórico
 * - "ingrid": dados próprios iniciando do zero + integrações
 *
 * @param {string|null|undefined} userEmail
 * @returns {"renato"|"ingrid"}
 */
export function getPerfilUsuario(userEmail) {
    if (!userEmail || typeof userEmail !== "string") return "renato";
    const emailNormalizado = userEmail.trim().toLowerCase();
    if (emailNormalizado === EMAIL_INGRID.toLowerCase()) {
        return "ingrid";
    }
    return "renato";
}

/**
 * Retorna se o e-mail tem permissão de acesso ao dashboard.
 *
 * @param {string|null|undefined} userEmail
 * @returns {boolean}
 */
export function isEmailAutorizado(userEmail) {
    if (!userEmail || typeof userEmail !== "string") return false;
    const emailNormalizado = userEmail.trim().toLowerCase();

    const env = (typeof import.meta !== "undefined" && import.meta?.env) || {};
    const envEmails = [
        env.VITE_OWNER_EMAIL,
        env.VITE_INSIGHTS_ALLOWED_EMAILS,
        env.VITE_ALLOWED_EMAIL,
    ]
        .filter(Boolean)
        .flatMap((item) =>
            item.split(",").map((e) => e.trim().toLowerCase())
        );

    const autorizados = new Set([
        ...EMAILS_PROPRIETARIOS_PADRAO.map((e) => e.toLowerCase()),
        ...envEmails,
    ]);

    return autorizados.has(emailNormalizado);
}

/**
 * Verifica se um determinado e-mail possui permissão para visualizar
 * e editar os Insights Financeiros e a Reserva de Emergência.
 *
 * @param {string|null|undefined} userEmail
 * @returns {boolean}
 */
export function isProprietarioInsights(userEmail) {
    return isEmailAutorizado(userEmail);
}
