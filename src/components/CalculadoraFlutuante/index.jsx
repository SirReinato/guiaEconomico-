import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";

const OPERADORES = ["+", "-", "×", "÷"];

function calcularOperacao(a, b, op) {
    const numA = Number(a);
    const numB = Number(b);
    if (!Number.isFinite(numA) || !Number.isFinite(numB)) return 0;

    switch (op) {
        case "+":
            return numA + numB;
        case "-":
            return numA - numB;
        case "×":
            return numA * numB;
        case "÷":
            return numB === 0 ? NaN : numA / numB;
        default:
            return numB;
    }
}

function formatarDisplay(valor) {
    if (Number.isNaN(valor)) return "Erro";
    const arredondado = Math.round(valor * 1e10) / 1e10;
    return String(arredondado).replace(".", ",");
}

/**
 * Calculadora flutuante global (disponível em todas as páginas via Outlet).
 */
export default function CalculadoraFlutuante() {
    const [aberta, setAberta] = useState(false);
    const [display, setDisplay] = useState("0");
    const [acumulador, setAcumulador] = useState(null);
    const [operador, setOperador] = useState(null);
    const [aguardandoNovoNumero, setAguardandoNovoNumero] = useState(false);
    const [copiado, setCopiado] = useState(false);

    const limparTudo = useCallback(() => {
        setDisplay("0");
        setAcumulador(null);
        setOperador(null);
        setAguardandoNovoNumero(false);
    }, []);

    const digitarNumero = useCallback(
        (digito) => {
            if (display === "Erro") {
                setDisplay(digito);
                setAguardandoNovoNumero(false);
                return;
            }
            if (aguardandoNovoNumero) {
                setDisplay(digito);
                setAguardandoNovoNumero(false);
            } else {
                setDisplay((prev) => (prev === "0" ? digito : prev + digito));
            }
        },
        [aguardandoNovoNumero, display]
    );

    const digitarDecimal = useCallback(() => {
        if (aguardandoNovoNumero || display === "Erro") {
            setDisplay("0,");
            setAguardandoNovoNumero(false);
            return;
        }
        if (!display.includes(",")) {
            setDisplay((prev) => prev + ",");
        }
    }, [aguardandoNovoNumero, display]);

    const apagarUltimo = useCallback(() => {
        if (aguardandoNovoNumero || display === "Erro") {
            setDisplay("0");
            setAguardandoNovoNumero(false);
            return;
        }
        setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
    }, [aguardandoNovoNumero, display]);

    const aplicarPorcentagem = useCallback(() => {
        const atual = parseFloat(display.replace(",", "."));
        if (!Number.isFinite(atual)) return;
        const resultado =
            acumulador !== null && operador
                ? (acumulador * atual) / 100
                : atual / 100;
        setDisplay(formatarDisplay(resultado));
    }, [acumulador, display, operador]);

    const selecionarOperador = useCallback(
        (proximoOp) => {
            const atual = parseFloat(display.replace(",", "."));
            if (!Number.isFinite(atual)) return;

            if (acumulador === null) {
                setAcumulador(atual);
            } else if (operador && !aguardandoNovoNumero) {
                const resultado = calcularOperacao(acumulador, atual, operador);
                setAcumulador(Number.isNaN(resultado) ? null : resultado);
                setDisplay(formatarDisplay(resultado));
            }

            setOperador(proximoOp);
            setAguardandoNovoNumero(true);
        },
        [acumulador, aguardandoNovoNumero, display, operador]
    );

    const calcularIgual = useCallback(() => {
        if (acumulador === null || !operador) return;
        const atual = parseFloat(display.replace(",", "."));
        if (!Number.isFinite(atual)) return;

        const resultado = calcularOperacao(acumulador, atual, operador);
        setDisplay(formatarDisplay(resultado));
        setAcumulador(null);
        setOperador(null);
        setAguardandoNovoNumero(true);
    }, [acumulador, display, operador]);

    const copiarResultado = async () => {
        try {
            await navigator.clipboard.writeText(display);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
        } catch {
            // Ignora erro caso clipboard não esteja disponível
        }
    };

    useEffect(() => {
        if (!aberta) return;

        const handleKeyDown = (e) => {
            const tag = e.target?.tagName?.toLowerCase();
            if (tag === "input" || tag === "textarea") return;

            if (e.key >= "0" && e.key <= "9") {
                e.preventDefault();
                digitarNumero(e.key);
            } else if (e.key === "," || e.key === ".") {
                e.preventDefault();
                digitarDecimal();
            } else if (e.key === "+" || e.key === "-") {
                e.preventDefault();
                selecionarOperador(e.key);
            } else if (e.key === "*") {
                e.preventDefault();
                selecionarOperador("×");
            } else if (e.key === "/") {
                e.preventDefault();
                selecionarOperador("÷");
            } else if (e.key === "%") {
                e.preventDefault();
                aplicarPorcentagem();
            } else if (e.key === "Enter" || e.key === "=") {
                e.preventDefault();
                calcularIgual();
            } else if (e.key === "Backspace") {
                e.preventDefault();
                apagarUltimo();
            } else if (e.key === "Escape") {
                setAberta(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        aberta,
        apagarUltimo,
        aplicarPorcentagem,
        calcularIgual,
        digitarDecimal,
        digitarNumero,
        selecionarOperador,
    ]);

    const botoes = [
        { label: "C", tipo: "acao", onClick: limparTudo },
        { label: "⌫", tipo: "acao", onClick: apagarUltimo },
        { label: "%", tipo: "acao", onClick: aplicarPorcentagem },
        { label: "÷", tipo: "op", onClick: () => selecionarOperador("÷") },

        { label: "7", tipo: "num", onClick: () => digitarNumero("7") },
        { label: "8", tipo: "num", onClick: () => digitarNumero("8") },
        { label: "9", tipo: "num", onClick: () => digitarNumero("9") },
        { label: "×", tipo: "op", onClick: () => selecionarOperador("×") },

        { label: "4", tipo: "num", onClick: () => digitarNumero("4") },
        { label: "5", tipo: "num", onClick: () => digitarNumero("5") },
        { label: "6", tipo: "num", onClick: () => digitarNumero("6") },
        { label: "-", tipo: "op", onClick: () => selecionarOperador("-") },

        { label: "1", tipo: "num", onClick: () => digitarNumero("1") },
        { label: "2", tipo: "num", onClick: () => digitarNumero("2") },
        { label: "3", tipo: "num", onClick: () => digitarNumero("3") },
        { label: "+", tipo: "op", onClick: () => selecionarOperador("+") },

        { label: "0", tipo: "num", largo: true, onClick: () => digitarNumero("0") },
        { label: ",", tipo: "num", onClick: digitarDecimal },
        { label: "=", tipo: "igual", onClick: calcularIgual },
    ];

    return (
        <Wrapper>
            {aberta && (
                <PainelCalc role="dialog" aria-label="Calculadora Rápida">
                    <CabecalhoCalc>
                        <TituloCalc>Calculadora</TituloCalc>
                        <AcoesTopoCalc>
                            <BotaoCopiar type="button" onClick={copiarResultado} title="Copiar valor">
                                {copiado ? "Copiado!" : "Copiar"}
                            </BotaoCopiar>
                            <BotaoFechar type="button" onClick={() => setAberta(false)} title="Fechar">
                                &times;
                            </BotaoFechar>
                        </AcoesTopoCalc>
                    </CabecalhoCalc>

                    <VisorCalc>
                        <ExpressaoAnterior>
                            {acumulador !== null && operador
                                ? `${formatarDisplay(acumulador)} ${operador}`
                                : "\u00A0"}
                        </ExpressaoAnterior>
                        <ValorPrincipal title={display}>{display}</ValorPrincipal>
                    </VisorCalc>

                    <TecladoGrid>
                        {botoes.map((btn) => (
                            <Tecla
                                key={btn.label}
                                type="button"
                                $tipo={btn.tipo}
                                $largo={btn.largo}
                                $ativo={OPERADORES.includes(btn.label) && operador === btn.label}
                                onClick={btn.onClick}
                            >
                                {btn.label}
                            </Tecla>
                        ))}
                    </TecladoGrid>
                </PainelCalc>
            )}

            <BotaoFlutuante
                type="button"
                onClick={() => setAberta((prev) => !prev)}
                $aberta={aberta}
                title={aberta ? "Fechar calculadora" : "Abrir calculadora"}
                aria-label="Abrir calculadora"
            >
                {aberta ? "✕" : "🧮"}
            </BotaoFlutuante>
        </Wrapper>
    );
}

const Wrapper = styled.div`
    position: fixed;
    right: 22px;
    bottom: 22px;
    z-index: 1050;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;

    @media (max-width: 768px) {
        right: 14px;
        bottom: calc(82px + env(safe-area-inset-bottom, 0px));
    }
`;

const BotaoFlutuante = styled.button`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid rgba(56, 189, 248, 0.45);
    background: ${({ $aberta }) =>
        $aberta
            ? "#1e293b"
            : "linear-gradient(135deg, rgba(130, 10, 209, 0.92) 0%, rgba(0, 179, 255, 0.92) 100%)"};
    color: #ffffff;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    transition: transform 0.15s ease, box-shadow 0.15s ease;

    &:hover {
        transform: translateY(-2px) scale(1.04);
        box-shadow: 0 12px 28px rgba(0, 179, 255, 0.35);
    }

    &:active {
        transform: scale(0.96);
    }
`;

const PainelCalc = styled.div`
    width: 264px;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.65);
`;

const CabecalhoCalc = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
`;

const TituloCalc = styled.span`
    font-size: 0.78rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.6px;
`;

const AcoesTopoCalc = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const BotaoCopiar = styled.button`
    background: rgba(56, 189, 248, 0.14);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;

    &:hover {
        background: rgba(56, 189, 248, 0.25);
    }
`;

const BotaoFechar = styled.button`
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;

    &:hover {
        color: #f8fafc;
    }
`;

const VisorCalc = styled.div`
    background: #020617;
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 10px 12px;
    margin-bottom: 12px;
    text-align: right;
    overflow: hidden;
`;

const ExpressaoAnterior = styled.div`
    font-size: 0.74rem;
    color: #64748b;
    font-family: monospace;
    min-height: 16px;
`;

const ValorPrincipal = styled.div`
    font-size: 1.45rem;
    font-weight: 700;
    color: #f8fafc;
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const TecladoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
`;

const Tecla = styled.button`
    grid-column: ${({ $largo }) => ($largo ? "span 2" : "span 1")};
    height: 40px;
    border-radius: 9px;
    border: 1px solid
        ${({ $tipo, $ativo }) =>
            $ativo
                ? "#38bdf8"
                : $tipo === "op"
                ? "rgba(56, 189, 248, 0.28)"
                : $tipo === "igual"
                ? "transparent"
                : "#1e293b"};
    background: ${({ $tipo, $ativo }) =>
        $ativo
            ? "rgba(56, 189, 248, 0.28)"
            : $tipo === "igual"
            ? "linear-gradient(135deg, #820ad1 0%, #00b3ff 100%)"
            : $tipo === "op"
            ? "rgba(56, 189, 248, 0.12)"
            : $tipo === "acao"
            ? "#1e293b"
            : "#0b1220"};
    color: ${({ $tipo }) =>
        $tipo === "op" ? "#38bdf8" : $tipo === "acao" ? "#cbd5e1" : "#f8fafc"};
    font-size: 0.98rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.12s ease, transform 0.08s ease;

    &:hover {
        filter: brightness(1.15);
    }

    &:active {
        transform: scale(0.95);
    }
`;
