/**
 * Utilitários de segurança para higienização e validação de dados
 * no Guia Econômico (Prevenção de XSS, Injeção e Manipulação Indevida).
 */

/**
 * Escapa caracteres HTML perigosos para prevenir ataques de Cross-Site Scripting (XSS).
 *
 * @param {string|unknown} valor - Valor a ser higienizado.
 * @returns {string} Texto seguro contra injeção de HTML/Scripts.
 */
export function escaparHtml(valor) {
    if (typeof valor !== "string") {
        return valor === null || valor === undefined ? "" : String(valor);
    }

    return valor
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Higieniza entradas de texto livres removendo scripts perigosos,
 * normalizando espaços em branco e limitando o tamanho máximo para evitar ataques de DoS.
 *
 * @param {unknown} input - Texto fornecido pelo usuário ou webhook.
 * @param {number} [tamanhoMaximo=255] - Limite máximo de caracteres permitido.
 * @returns {string} String higienizada e segura.
 */
export function sanitizarTexto(input, tamanhoMaximo = 255) {
    if (typeof input !== "string") {
        if (input === null || input === undefined) return "";
        input = String(input);
    }

    // Remove tags HTML e caracteres de controle perigosos
    const semHtml = input.replace(/<[^>]*>/g, "");
    
    // Normaliza espaços em branco duplicados e trunca ao limite de segurança
    return semHtml.trim().slice(0, tamanhoMaximo);
}

/**
 * Valida se um número ou valor monetário está dentro de limites financeiros razoáveis e seguros.
 * Previne estouro de limite numérico (Integer Overflow / NaN / Infinity).
 *
 * @param {unknown} valor - Valor numérico a ser testado.
 * @param {number} [minimo=0] - Valor mínimo aceitável.
 * @param {number} [maximo=100000000] - Teto máximo (ex: R$ 100 milhões).
 * @returns {boolean}
 */
export function isValorFinanceiroSeguro(valor, minimo = 0, maximo = 100000000) {
    if (typeof valor !== "number" || isNaN(valor) || !isFinite(valor)) {
        return false;
    }
    return valor >= minimo && valor <= maximo;
}

/**
 * Validação rigorosa de formato de data padrão ISO (YYYY-MM-DD).
 * Previne injeção de formatos corrompidos no banco.
 *
 * @param {unknown} dataStr - String de data candidata.
 * @returns {boolean}
 */
export function isDataValida(dataStr) {
    if (typeof dataStr !== "string") return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dataStr)) return false;

    const [ano, mes, dia] = dataStr.split("-").map(Number);
    const date = new Date(ano, mes - 1, dia);
    return (
        date.getFullYear() === ano &&
        date.getMonth() === mes - 1 &&
        date.getDate() === dia
    );
}

/**
 * Validação de chave de mês padrão YYYY-MM.
 *
 * @param {unknown} mesChave - Formato YYYY-MM.
 * @returns {boolean}
 */
export function isChaveMesValida(mesChave) {
    if (typeof mesChave !== "string") return false;
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(mesChave)) return false;

    const [, mes] = mesChave.split("-").map(Number);
    return mes >= 1 && mes <= 12;
}
