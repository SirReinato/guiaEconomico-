import { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { Titulos } from "../Card";
import { useGastos } from "../../context/GastosContext";
import { useMes } from "../../context/MesContext";
import { parseCurrency, formatCurrency } from "../../utils/currencyUtils";

export default function ModalAjusteFaturaCartao({
    cartaoInicial = "",
    ciclo = "atual",
    onClose,
}) {
    const {
        cartoesAtivos,
        getGastosDoCiclo,
        getAjusteFaturaCartao,
        salvarAjusteFaturaCartao,
    } = useGastos();
    const { nomeMesAno } = useMes() || {};

    // Filtra apenas cartões não integrados (Itaú e Cartões do Renato têm fluxos separados)
    const cartoesElegiveis = useMemo(() => {
        return (cartoesAtivos || []).filter((c) => !c.integrado);
    }, [cartoesAtivos]);

    // Seleção de cartão
    const [cartaoSelecionado, setCartaoSelecionado] = useState(() => {
        if (cartaoInicial && cartaoInicial !== "todos") {
            const achou = cartoesElegiveis.find(
                (c) => c.id === cartaoInicial || c.nome === cartaoInicial
            );
            if (achou) return achou.id || achou.nome;
        }
        return cartoesElegiveis[0]?.id || cartoesElegiveis[0]?.nome || "Nubank";
    });

    // Modo de cálculo: "faturaReal" (calculadora reversa) ou "valorDireto"
    const [modo, setModo] = useState("faturaReal");

    // Estados do Modo Fatura Real
    const [faturaRealInput, setFaturaRealInput] = useState("");

    // Estados do Modo Valor Direto
    const [sinalDireto, setSinalDireto] = useState("+"); // "+" ou "-"
    const [valorDiretoInput, setValorDiretoInput] = useState("");

    // Metadados do ajuste
    const [tipo, setTipo] = useState("Essencial");
    const [descricao, setDescricao] = useState("Ajuste de fatura para bater certinho");
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");

    // Ajuste já existente no banco de dados para este cartão e ciclo
    const ajusteExistente = useMemo(() => {
        if (!cartaoSelecionado) return null;
        return getAjusteFaturaCartao(cartaoSelecionado, ciclo);
    }, [cartaoSelecionado, ciclo, getAjusteFaturaCartao]);

    // Gastos do ciclo excluindo o ajuste já existente, para obter o subtotal base
    const subtotalBase = useMemo(() => {
        if (!cartaoSelecionado) return 0;
        const itens = getGastosDoCiclo(cartaoSelecionado, ciclo) || [];
        return itens
            .filter((g) => g.origem !== "ajuste_fatura")
            .reduce((acc, g) => {
                const val = g.valorCalculado !== undefined ? g.valorCalculado : parseCurrency(g.valor);
                return acc + val;
            }, 0);
    }, [cartaoSelecionado, ciclo, getGastosDoCiclo]);

    // Inicializa valores ao carregar ou trocar de cartão
    useEffect(() => {
        if (ajusteExistente) {
            const v = parseCurrency(ajusteExistente.valor);
            const totalComAjuste = subtotalBase + v;
            setFaturaRealInput(totalComAjuste.toFixed(2).replace(".", ","));

            if (v < 0) {
                setSinalDireto("-");
                setValorDiretoInput(Math.abs(v).toFixed(2).replace(".", ","));
            } else {
                setSinalDireto("+");
                setValorDiretoInput(v.toFixed(2).replace(".", ","));
            }

            if (ajusteExistente.tipo) setTipo(ajusteExistente.tipo);
            if (ajusteExistente.descricao) setDescricao(ajusteExistente.descricao);
        } else {
            // Sem ajuste anterior: inicializa com o subtotal atual
            setFaturaRealInput(subtotalBase > 0 ? subtotalBase.toFixed(2).replace(".", ",") : "");
            setSinalDireto("+");
            setValorDiretoInput("");
            setDescricao("Ajuste de fatura para bater certinho");
        }
    }, [ajusteExistente, subtotalBase]);

    // Cálculo do ajuste resultante conforme o modo selecionado
    const valorAjusteCalculado = useMemo(() => {
        if (modo === "faturaReal") {
            const faturaAlvo = parseCurrency(faturaRealInput);
            if (!faturaRealInput || isNaN(faturaAlvo)) return 0;
            // Diferença = fatura desejada - subtotal dos lançamentos manuais
            return Number((faturaAlvo - subtotalBase).toFixed(2));
        } else {
            const v = parseCurrency(valorDiretoInput);
            if (!valorDiretoInput || isNaN(v)) return 0;
            return Number((sinalDireto === "-" ? -v : v).toFixed(2));
        }
    }, [modo, faturaRealInput, valorDiretoInput, sinalDireto, subtotalBase]);

    // Novo total final da fatura com o ajuste aplicado
    const totalFinalFatura = useMemo(() => {
        return Number((subtotalBase + valorAjusteCalculado).toFixed(2));
    }, [subtotalBase, valorAjusteCalculado]);

    const handleSalvar = async (e) => {
        e.preventDefault();
        setErro("");
        setSalvando(true);
        try {
            const res = await salvarAjusteFaturaCartao({
                cartao: cartaoSelecionado,
                ciclo,
                valorAjuste: valorAjusteCalculado,
                tipo,
                descricao,
            });
            if (res) {
                onClose();
            } else {
                setErro("Erro de permissão no Firestore. Publique o arquivo firestore.rules no Console do Firebase para permitir valores negativos em ajustes.");
            }
        } catch (err) {
            console.error("Erro ao salvar ajuste de fatura:", err);
            setErro(err?.message || "Erro ao salvar o ajuste de fatura.");
        } finally {
            setSalvando(false);
        }
    };

    const handleRemover = async () => {
        if (!ajusteExistente) return;
        setErro("");
        setSalvando(true);
        try {
            const res = await salvarAjusteFaturaCartao({
                cartao: cartaoSelecionado,
                ciclo,
                valorAjuste: 0,
            });
            if (res) {
                onClose();
            } else {
                setErro("Não foi possível remover o ajuste.");
            }
        } catch (err) {
            console.error("Erro ao remover ajuste:", err);
            setErro(err?.message || "Erro ao remover ajuste.");
        } finally {
            setSalvando(false);
        }
    };

    const cartaoObjeto = cartoesElegiveis.find((c) => (c.id || c.nome) === cartaoSelecionado);

    return (
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <TituloGrupo>
                        <Titulos className="titulo">🎯 Ajustar Fatura</Titulos>
                        <Subtitulo>
                            {nomeMesAno} • Ciclo {ciclo.toUpperCase()}
                        </Subtitulo>
                    </TituloGrupo>
                    <CloseButton onClick={onClose} aria-label="Fechar">&times;</CloseButton>
                </Header>

                <Form onSubmit={handleSalvar}>
                    {/* Seletor de Cartão */}
                    <GrupoCampo>
                        <Label>Escolha o Cartão:</Label>
                        <ListaCartoesSeletor>
                            {cartoesElegiveis.map((c) => {
                                const id = c.id || c.nome;
                                const isAtivo = cartaoSelecionado === id;
                                return (
                                    <BotaoSeletorCartao
                                        key={id}
                                        type="button"
                                        $ativo={isAtivo}
                                        $cor={c.cor}
                                        onClick={() => setCartaoSelecionado(id)}
                                    >
                                        <span>{c.icone || "💳"}</span>
                                        <span>{c.nome}</span>
                                    </BotaoSeletorCartao>
                                );
                            })}
                        </ListaCartoesSeletor>
                    </GrupoCampo>

                    {/* Resumo Base Atual */}
                    <PainelSubtotalBase $corCartao={cartaoObjeto?.cor}>
                        <div className="info">
                            <span className="label">Lançamentos atuais no cartão:</span>
                            <span className="valor">{formatCurrency(subtotalBase)}</span>
                        </div>
                        {ajusteExistente && (
                            <div className="info-ajuste-ativo">
                                <span>Ajuste ativo no momento:</span>
                                <strong>
                                    {parseCurrency(ajusteExistente.valor) > 0 ? "+" : ""}
                                    {formatCurrency(parseCurrency(ajusteExistente.valor))}
                                </strong>
                            </div>
                        )}
                    </PainelSubtotalBase>

                    {/* Alternador de Modo */}
                    <AbasModo>
                        <BotaoModo
                            type="button"
                            $ativo={modo === "faturaReal"}
                            onClick={() => setModo("faturaReal")}
                        >
                            🪄 Valor Real da Fatura
                        </BotaoModo>
                        <BotaoModo
                            type="button"
                            $ativo={modo === "valorDireto"}
                            onClick={() => setModo("valorDireto")}
                        >
                            ➕/➖ Valor do Ajuste
                        </BotaoModo>
                    </AbasModo>

                    {/* Modo 1: Informar o valor total real da fatura */}
                    {modo === "faturaReal" ? (
                        <GrupoCampo>
                            <Label>Quanto está dando no app do banco?</Label>
                            <InputGrande
                                type="text"
                                placeholder="Ex: 104,25"
                                value={faturaRealInput}
                                onChange={(e) => setFaturaRealInput(e.target.value)}
                                autoFocus
                            />
                            <AjudaTexto>
                                O sistema compara com o subtotal atual e calcula a diferença sozinho.
                            </AjudaTexto>
                        </GrupoCampo>
                    ) : (
                        /* Modo 2: Informar o valor direto com sinal */
                        <GrupoCampo>
                            <Label>Valor exato do ajuste:</Label>
                            <LinhaSinalEValor>
                                <ToggleSinal>
                                    <BotaoSinal
                                        type="button"
                                        $ativo={sinalDireto === "+"}
                                        $sinal="+"
                                        onClick={() => setSinalDireto("+")}
                                    >
                                        + Somar
                                    </BotaoSinal>
                                    <BotaoSinal
                                        type="button"
                                        $ativo={sinalDireto === "-"}
                                        $sinal="-"
                                        onClick={() => setSinalDireto("-")}
                                    >
                                        - Descontar
                                    </BotaoSinal>
                                </ToggleSinal>
                                <InputValorDireto
                                    type="text"
                                    placeholder="0,00"
                                    value={valorDiretoInput}
                                    onChange={(e) => setValorDiretoInput(e.target.value)}
                                    autoFocus
                                />
                            </LinhaSinalEValor>
                        </GrupoCampo>
                    )}

                    {/* Card de Demonstração em Tempo Real */}
                    <CardDemonstracao $isNegativo={valorAjusteCalculado < 0}>
                        <LinhaDemonstracao>
                            <span>Lançamentos no app:</span>
                            <span>{formatCurrency(subtotalBase)}</span>
                        </LinhaDemonstracao>
                        <LinhaDemonstracao className="destaque-ajuste">
                            <span>Ajuste aplicado ({valorAjusteCalculado >= 0 ? "soma" : "desconto"}):</span>
                            <strong>
                                {valorAjusteCalculado > 0 ? "+" : ""}
                                {formatCurrency(valorAjusteCalculado)}
                            </strong>
                        </LinhaDemonstracao>
                        <SeparadorDemo />
                        <LinhaDemonstracao className="total-final">
                            <span>Total exato da fatura:</span>
                            <span className="valor-total">{formatCurrency(totalFinalFatura)}</span>
                        </LinhaDemonstracao>
                    </CardDemonstracao>

                    {/* Metadados Adicionais */}
                    <LinhaDupla>
                        <GrupoCampo>
                            <Label>Classificação:</Label>
                            <SelectTipo value={tipo} onChange={(e) => setTipo(e.target.value)}>
                                <option value="Essencial">Essencial</option>
                                <option value="Desejo">Desejo</option>
                                <option value="Poupança">Poupança</option>
                            </SelectTipo>
                        </GrupoCampo>
                        <GrupoCampo>
                            <Label>Descrição / Motivo:</Label>
                            <InputDescricao
                                type="text"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Ajuste de fatura"
                            />
                        </GrupoCampo>
                    </LinhaDupla>

                    {erro && (
                        <MensagemErro>
                            <span>⚠️</span>
                            <div>{erro}</div>
                        </MensagemErro>
                    )}

                    <Footer>
                        {ajusteExistente && (
                            <BotaoRemover type="button" onClick={handleRemover} disabled={salvando}>
                                🗑️ Remover Ajuste
                            </BotaoRemover>
                        )}
                        <BotoesAcaoDireita>
                            <BotaoCancelar type="button" onClick={onClose} disabled={salvando}>
                                Cancelar
                            </BotaoCancelar>
                            <BotaoSalvar type="submit" disabled={salvando || valorAjusteCalculado === 0}>
                                {salvando ? "Salvando..." : "Salvar Ajuste"}
                            </BotaoSalvar>
                        </BotoesAcaoDireita>
                    </Footer>
                </Form>
            </ModalContent>
        </Overlay>
    );
}

/* ===============================================================
   STYLED COMPONENTS - TEMA NEON E RESPONSIVIDADE TOTAL MOBILE
   =============================================================== */

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(4, 8, 18, 0.78);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1200;
    backdrop-filter: blur(6px);
    padding: 12px;
    box-sizing: border-box;
`;

const ModalContent = styled.div`
    background: #0d121f;
    border: 1px solid rgba(130, 10, 209, 0.45);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(130, 10, 209, 0.2);
    border-radius: 20px;
    width: min(94vw, 480px);
    max-height: 92dvh;
    overflow-y: auto;
    padding: 22px 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 16px;

    scrollbar-width: thin;
    scrollbar-color: #820ad1 transparent;

    @media (max-width: 480px) {
        padding: 16px 14px;
        border-radius: 16px;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 12px;

    .titulo {
        font-size: 1.25rem;
        color: #c084fc;
        margin: 0;
    }
`;

const TituloGrupo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const Subtitulo = styled.span`
    font-size: 0.78rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.8rem;
    cursor: pointer;
    line-height: 1;
    padding: 0 4px;
    transition: color 0.2s;

    &:hover {
        color: #ffffff;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const GrupoCampo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
`;

const Label = styled.label`
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;

const ListaCartoesSeletor = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`;

const BotaoSeletorCartao = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 12px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid
        ${({ $ativo, $cor }) =>
            $ativo ? $cor || "#820ad1" : "rgba(255, 255, 255, 0.12)"};
    background: ${({ $ativo, $cor }) =>
        $ativo
            ? `linear-gradient(135deg, ${$cor ? `${$cor}44` : "rgba(130, 10, 209, 0.4)"}, rgba(13, 18, 31, 0.8))`
            : "rgba(255, 255, 255, 0.04)"};
    color: ${({ $ativo }) => ($ativo ? "#ffffff" : "#94a3b8")};
    transition: all 0.2s;

    &:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.08);
    }
`;

const PainelSubtotalBase = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed ${({ $corCartao }) => $corCartao || "rgba(130, 10, 209, 0.4)"};
    border-radius: 12px;

    .info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        color: #cbd5e1;

        .valor {
            font-weight: 700;
            color: #ffffff;
        }
    }

    .info-ajuste-ativo {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.78rem;
        color: #c084fc;
        padding-top: 4px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
`;

const AbasModo = styled.div`
    display: flex;
    background: rgba(0, 0, 0, 0.35);
    padding: 3px;
    border-radius: 10px;
    gap: 4px;
`;

const BotaoModo = styled.button`
    flex: 1;
    padding: 8px 10px;
    border-radius: 8px;
    border: none;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    background: ${({ $ativo }) =>
        $ativo ? "linear-gradient(135deg, #820ad1, #6b21a8)" : "transparent"};
    color: ${({ $ativo }) => ($ativo ? "#ffffff" : "#94a3b8")};
    transition: all 0.2s;

    &:hover {
        color: #ffffff;
    }
`;

const InputGrande = styled.input`
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(130, 10, 209, 0.4);
    background: rgba(0, 0, 0, 0.4);
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 700;
    box-sizing: border-box;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: #c084fc;
        box-shadow: 0 0 12px rgba(192, 132, 252, 0.3);
    }
`;

const AjudaTexto = styled.span`
    font-size: 0.74rem;
    color: #94a3b8;
`;

const LinhaSinalEValor = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const ToggleSinal = styled.div`
    display: flex;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 10px;
    padding: 2px;
`;

const BotaoSinal = styled.button`
    border: none;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    background: ${({ $ativo, $sinal }) =>
        !$ativo
            ? "transparent"
            : $sinal === "+"
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "linear-gradient(135deg, #f43f5e, #e11d48)"};
    color: ${({ $ativo }) => ($ativo ? "#ffffff" : "#94a3b8")};
    transition: all 0.2s;
`;

const InputValorDireto = styled.input`
    flex: 1;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(130, 10, 209, 0.4);
    background: rgba(0, 0, 0, 0.4);
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 700;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #c084fc;
        box-shadow: 0 0 12px rgba(192, 132, 252, 0.3);
    }
`;

const CardDemonstracao = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid
        ${({ $isNegativo }) =>
            $isNegativo ? "rgba(244, 63, 94, 0.35)" : "rgba(16, 185, 129, 0.35)"};
`;

const LinhaDemonstracao = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.84rem;
    color: #cbd5e1;

    &.destaque-ajuste {
        color: #e2e8f0;
        strong {
            font-size: 0.95rem;
            color: #38bdf8;
        }
    }

    &.total-final {
        font-weight: 700;
        font-size: 0.95rem;
        color: #ffffff;

        .valor-total {
            font-size: 1.15rem;
            color: #4ade80;
        }
    }
`;

const SeparadorDemo = styled.div`
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 2px 0;
`;

const LinhaDupla = styled.div`
    display: flex;
    gap: 10px;

    @media (max-width: 480px) {
        flex-direction: column;
    }
`;

const SelectTipo = styled.select`
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.4);
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 500;
    box-sizing: border-box;

    option {
        background: #0d121f;
        color: #ffffff;
    }
`;

const InputDescricao = styled.input`
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.4);
    color: #ffffff;
    font-size: 0.85rem;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #820ad1;
    }
`;

const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-top: 6px;
    flex-wrap: wrap;

    @media (max-width: 480px) {
        flex-direction: column-reverse;
        width: 100%;
    }
`;

const BotoesAcaoDireita = styled.div`
    display: flex;
    gap: 8px;
    margin-left: auto;

    @media (max-width: 480px) {
        width: 100%;
        justify-content: space-between;
    }
`;

const BotaoCancelar = styled.button`
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #cbd5e1;
    padding: 9px 16px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
    }

    @media (max-width: 480px) {
        flex: 1;
    }
`;

const BotaoSalvar = styled.button`
    background: linear-gradient(135deg, #820ad1, #6200ea);
    border: none;
    color: #ffffff;
    padding: 9px 18px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(130, 10, 209, 0.35);
    transition: all 0.2s;

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(130, 10, 209, 0.5);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 480px) {
        flex: 1.5;
    }
`;

const BotaoRemover = styled.button`
    background: rgba(244, 63, 94, 0.15);
    border: 1px solid rgba(244, 63, 94, 0.4);
    color: #f43f5e;
    padding: 9px 14px;
    border-radius: 10px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background: rgba(244, 63, 94, 0.25);
        color: #ffffff;
    }

    @media (max-width: 480px) {
        width: 100%;
    }
`;

const MensagemErro = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: rgba(244, 63, 94, 0.12);
    border: 1px solid rgba(244, 63, 94, 0.35);
    color: #fda4af;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 0.8rem;
    line-height: 1.4;
`;
