import { useState, useMemo, useEffect } from "react";
import styled from "styled-components";
import { Titulos } from "../Card";
import { useGastos } from "../../context/GastosContext";
import { useMes } from "../../context/MesContext";
import { formatCurrency, parseCurrency } from "../../utils/currencyUtils";
import { useAuth } from "../../context/AuthContext";

export default function ModalApertouFatura({
    cartaoInicial = "",
    ciclo = "atual",
    onClose,
}) {
    const {
        cartoesAtivos,
        getGastosDoCiclo,
        salvarParcelamentoFatura,
        cancelarParcelamentoFatura,
        getAcordoAtivoCartaoCiclo,
        chaveMesAtual,
    } = useGastos() || {};
    const { nomeMesAno, mesReferencia } = useMes() || {};
    const { isIngrid } = useAuth() || {};

    const parceiroNome = isIngrid ? "Renato" : "Mulher (Mozi)";

    // Cartões disponíveis para parcelamento
    const cartoesDisponiveis = useMemo(() => {
        return (cartoesAtivos || []).filter(
            (c) => !c.nome?.includes("Cartões do Renato (A Pagar)") &&
                   !c.nome?.includes("Cartões da Ingrid (A Pagar)")
        );
    }, [cartoesAtivos]);

    const [cartaoSelecionado, setCartaoSelecionado] = useState(() => {
        if (cartaoInicial && cartaoInicial !== "todos") {
            const achou = cartoesDisponiveis.find(
                (c) => c.id === cartaoInicial || c.nome === cartaoInicial
            );
            if (achou) return achou.id || achou.nome;
        }
        return cartoesDisponiveis[0]?.id || cartoesDisponiveis[0]?.nome || "Nubank";
    });

    // Acordo ativo existente para este cartão e ciclo
    const acordoAtivo = useMemo(() => {
        if (!cartaoSelecionado || !getAcordoAtivoCartaoCiclo) return null;
        return getAcordoAtivoCartaoCiclo(cartaoSelecionado, ciclo, mesReferencia);
    }, [cartaoSelecionado, ciclo, mesReferencia, getAcordoAtivoCartaoCiclo]);

    // Subtotal dos gastos originais deste ciclo
    const subtotalFaturaOriginal = useMemo(() => {
        if (!cartaoSelecionado) return 0;
        const itens = getGastosDoCiclo(cartaoSelecionado, ciclo, mesReferencia) || [];
        return itens
            .filter((g) => g.origem !== "apertou_fatura_entrada" && g.origem !== "apertou_fatura_parcela")
            .reduce((acc, g) => {
                const v = g.valorCalculado !== undefined ? g.valorCalculado : parseCurrency(g.valor);
                return acc + v;
            }, 0);
    }, [cartaoSelecionado, ciclo, mesReferencia, getGastosDoCiclo]);

    // Estados do Bloco 1: Entrada
    const [valorEntradaInput, setValorEntradaInput] = useState("");
    const [dataEntrada, setDataEntrada] = useState(() => new Date().toISOString().split("T")[0]);
    const [tipoDivisaoEntrada, setTipoDivisaoEntrada] = useState("meu"); // "meu" | "mozi" | "dividido"
    const [modoDivididoEntrada, setModoDivididoEntrada] = useState("50_50"); // "50_50" | "personalizado"
    const [entradaMeuPersonalizada, setEntradaMeuPersonalizada] = useState("");
    const [entradaMoziPersonalizada, setEntradaMoziPersonalizada] = useState("");

    // Estados do Bloco 2: Parcelas
    const [qtdParcelas, setQtdParcelas] = useState("8");
    const [valorParcelaInput, setValorParcelaInput] = useState("");
    const [tipoDivisaoParcela, setTipoDivisaoParcela] = useState("meu"); // "meu" | "mozi" | "dividido"
    const [modoDivididoParcela, setModoDivididoParcela] = useState("50_50"); // "50_50" | "personalizado"
    const [parcelaMeuPersonalizada, setParcelaMeuPersonalizada] = useState("");
    const [parcelaMoziPersonalizada, setParcelaMoziPersonalizada] = useState("");

    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");

    // Preenche com valores do acordo existente se já houver
    useEffect(() => {
        if (acordoAtivo) {
            setValorEntradaInput(String(acordoAtivo.valorEntradaTotal).replace(".", ","));
            if (acordoAtivo.dataEntrada) setDataEntrada(acordoAtivo.dataEntrada);
            if (acordoAtivo.divisaoEntrada?.tipo) {
                setTipoDivisaoEntrada(acordoAtivo.divisaoEntrada.tipo);
                if (acordoAtivo.divisaoEntrada.tipo === "dividido") {
                    setModoDivididoEntrada("personalizado");
                    setEntradaMeuPersonalizada(String(acordoAtivo.divisaoEntrada.valorMeu || "").replace(".", ","));
                    setEntradaMoziPersonalizada(String(acordoAtivo.divisaoEntrada.valorMozi || "").replace(".", ","));
                }
            }

            setQtdParcelas(String(acordoAtivo.qtdParcelas || 8));
            setValorParcelaInput(String(acordoAtivo.valorParcelaTotal || "").replace(".", ","));
            if (acordoAtivo.divisaoParcela?.tipo) {
                setTipoDivisaoParcela(acordoAtivo.divisaoParcela.tipo);
                if (acordoAtivo.divisaoParcela.tipo === "dividido") {
                    setModoDivididoParcela("personalizado");
                    setParcelaMeuPersonalizada(String(acordoAtivo.divisaoParcela.valorMeu || "").replace(".", ","));
                    setParcelaMoziPersonalizada(String(acordoAtivo.divisaoParcela.valorMozi || "").replace(".", ","));
                }
            }
        }
    }, [acordoAtivo]);

    // Cálculos da Entrada
    const valorEntradaNum = parseCurrency(valorEntradaInput);

    const divisaoEntradaCalculada = useMemo(() => {
        if (tipoDivisaoEntrada === "meu") {
            return { tipo: "meu", valorMeu: valorEntradaNum, valorMozi: 0 };
        }
        if (tipoDivisaoEntrada === "mozi") {
            return { tipo: "mozi", valorMeu: 0, valorMozi: valorEntradaNum };
        }
        if (modoDivididoEntrada === "50_50") {
            const metade = Math.round((valorEntradaNum / 2) * 100) / 100;
            const resto = Number((valorEntradaNum - metade).toFixed(2));
            return { tipo: "dividido", valorMeu: metade, valorMozi: resto };
        }
        // Personalizado
        const meu = parseCurrency(entradaMeuPersonalizada);
        const mozi = parseCurrency(entradaMoziPersonalizada);
        return { tipo: "dividido", valorMeu: meu, valorMozi: mozi };
    }, [tipoDivisaoEntrada, modoDivididoEntrada, valorEntradaNum, entradaMeuPersonalizada, entradaMoziPersonalizada]);

    // Cálculos da Parcela
    const valorParcelaNum = parseCurrency(valorParcelaInput);
    const numParcelasInt = parseInt(qtdParcelas, 10) || 1;
    const totalFinanciamentoParcelas = valorParcelaNum * numParcelasInt;
    const totalGeralAcordo = valorEntradaNum + totalFinanciamentoParcelas;

    const divisaoParcelaCalculada = useMemo(() => {
        if (tipoDivisaoParcela === "meu") {
            return { tipo: "meu", valorMeu: valorParcelaNum, valorMozi: 0 };
        }
        if (tipoDivisaoParcela === "mozi") {
            return { tipo: "mozi", valorMeu: 0, valorMozi: valorParcelaNum };
        }
        if (modoDivididoParcela === "50_50") {
            const metade = Math.round((valorParcelaNum / 2) * 100) / 100;
            const resto = Number((valorParcelaNum - metade).toFixed(2));
            return { tipo: "dividido", valorMeu: metade, valorMozi: resto };
        }
        // Personalizado
        const meu = parseCurrency(parcelaMeuPersonalizada);
        const mozi = parseCurrency(parcelaMoziPersonalizada);
        return { tipo: "dividido", valorMeu: meu, valorMozi: mozi };
    }, [tipoDivisaoParcela, modoDivididoParcela, valorParcelaNum, parcelaMeuPersonalizada, parcelaMoziPersonalizada]);

    const handleSalvarAcordo = async (e) => {
        e.preventDefault();
        setErro("");

        if (valorEntradaNum <= 0) {
            setErro("Por favor, informe o valor da entrada.");
            return;
        }
        if (numParcelasInt < 1 || valorParcelaNum <= 0) {
            setErro("Por favor, informe a quantidade e o valor das parcelas.");
            return;
        }

        // Valida soma personalizada na entrada se aplicável
        if (tipoDivisaoEntrada === "dividido" && modoDivididoEntrada === "personalizado") {
            const somaEntrada = divisaoEntradaCalculada.valorMeu + divisaoEntradaCalculada.valorMozi;
            if (Math.abs(somaEntrada - valorEntradaNum) > 0.05) {
                setErro(`A soma da entrada personalizada (R$ ${somaEntrada.toFixed(2)}) deve ser igual ao valor total da entrada (R$ ${valorEntradaNum.toFixed(2)}).`);
                return;
            }
        }

        // Valida soma personalizada nas parcelas se aplicável
        if (tipoDivisaoParcela === "dividido" && modoDivididoParcela === "personalizado") {
            const somaParcela = divisaoParcelaCalculada.valorMeu + divisaoParcelaCalculada.valorMozi;
            if (Math.abs(somaParcela - valorParcelaNum) > 0.05) {
                setErro(`A soma da parcela personalizada (R$ ${somaParcela.toFixed(2)}) deve ser igual ao valor de cada parcela (R$ ${valorParcelaNum.toFixed(2)}).`);
                return;
            }
        }

        setSalvando(true);
        try {
            await salvarParcelamentoFatura({
                cartao: cartaoSelecionado,
                ciclo,
                valorEntradaTotal: valorEntradaNum,
                dataEntrada,
                divisaoEntrada: divisaoEntradaCalculada,
                qtdParcelas: numParcelasInt,
                valorParcelaTotal: valorParcelaNum,
                divisaoParcela: divisaoParcelaCalculada,
            });
            onClose();
        } catch (err) {
            console.error("Erro ao salvar parcelamento da fatura:", err);
            setErro(err?.message || "Erro ao salvar o parcelamento da fatura.");
        } finally {
            setSalvando(false);
        }
    };

    const handleCancelarAcordo = async () => {
        if (!acordoAtivo) return;
        setSalvando(true);
        try {
            await cancelarParcelamentoFatura(acordoAtivo.id, cartaoSelecionado, chaveMesAtual);
            onClose();
        } catch (err) {
            console.error("Erro ao cancelar parcelamento:", err);
            setErro("Erro ao desfazer parcelamento.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <div>
                        <Titulos className="titulo">🚨 Apertou a Fatura</Titulos>
                        <Subinfo>
                            {nomeMesAno} • Parcelamento de fatura com entrada
                        </Subinfo>
                    </div>
                    <CloseButton onClick={onClose} type="button">&times;</CloseButton>
                </Header>

                <Form onSubmit={handleSalvarAcordo}>
                    {/* Seletor de Cartão */}
                    <GrupoCampo>
                        <Label>Cartão que será parcelado:</Label>
                        <ListaCartoesSeletor>
                            {cartoesDisponiveis.map((c) => {
                                const id = c.id || c.nome;
                                return (
                                    <BotaoSeletorCartao
                                        key={id}
                                        type="button"
                                        $ativo={cartaoSelecionado === id}
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

                    {/* Resumo da Fatura Atual */}
                    <PainelFaturaAtual>
                        <div className="info-linha">
                            <span>Gastos lançados no cartão antes do parcelamento:</span>
                            <span className="valor-original">{formatCurrency(subtotalFaturaOriginal)}</span>
                        </div>
                        <span className="ajuda">
                            Ao confirmar, o valor deste mês será <strong>substituído pela Entrada</strong>, e as parcelas cairão direto nos próximos meses.
                        </span>
                    </PainelFaturaAtual>

                    {/* BLOCO 1: ENTRADA */}
                    <SecaoBloco>
                        <TituloSecao>
                            <span>1️⃣ Valor da Entrada</span>
                            <small>(Substitui a mensalidade deste mês)</small>
                        </TituloSecao>

                        <LinhaDupla>
                            <div style={{ flex: 1.2 }}>
                                <Label>Valor da Entrada (R$):</Label>
                                <InputDestaque
                                    type="text"
                                    placeholder="Ex: 868,23"
                                    value={valorEntradaInput}
                                    onChange={(e) => {
                                        setValorEntradaInput(e.target.value);
                                        const v = parseCurrency(e.target.value);
                                        if (modoDivididoEntrada === "personalizado" && v > 0) {
                                            const metade = (v / 2).toFixed(2).replace(".", ",");
                                            setEntradaMeuPersonalizada(metade);
                                            setEntradaMoziPersonalizada(metade);
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                            <div style={{ flex: 0.8 }}>
                                <Label>Data da Entrada:</Label>
                                <InputComum
                                    type="date"
                                    value={dataEntrada}
                                    onChange={(e) => setDataEntrada(e.target.value)}
                                />
                            </div>
                        </LinhaDupla>

                        <Label style={{ marginTop: 8 }}>De quem é a responsabilidade da Entrada?</Label>
                        <OpcoesDivisao>
                            <BotaoOpcao
                                type="button"
                                $ativo={tipoDivisaoEntrada === "meu"}
                                onClick={() => setTipoDivisaoEntrada("meu")}
                            >
                                👤 100% {isIngrid ? "Pessoal" : "Meu"}
                            </BotaoOpcao>
                            <BotaoOpcao
                                type="button"
                                $ativo={tipoDivisaoEntrada === "mozi"}
                                onClick={() => setTipoDivisaoEntrada("mozi")}
                            >
                                💕 100% {parceiroNome}
                            </BotaoOpcao>
                            <BotaoOpcao
                                type="button"
                                $ativo={tipoDivisaoEntrada === "dividido"}
                                onClick={() => setTipoDivisaoEntrada("dividido")}
                            >
                                🤝 Dividido
                            </BotaoOpcao>
                        </OpcoesDivisao>

                        {tipoDivisaoEntrada === "dividido" && (
                            <PainelDetalheDivisao>
                                <ModosDivididoToggle>
                                    <BotaoModoDividido
                                        type="button"
                                        $ativo={modoDivididoEntrada === "50_50"}
                                        onClick={() => setModoDivididoEntrada("50_50")}
                                    >
                                        ⚖️ 50% para cada
                                    </BotaoModoDividido>
                                    <BotaoModoDividido
                                        type="button"
                                        $ativo={modoDivididoEntrada === "personalizado"}
                                        onClick={() => {
                                            setModoDivididoEntrada("personalizado");
                                            if (valorEntradaNum > 0) {
                                                const metade = (valorEntradaNum / 2).toFixed(2).replace(".", ",");
                                                setEntradaMeuPersonalizada(metade);
                                                setEntradaMoziPersonalizada(metade);
                                            }
                                        }}
                                    >
                                        ✏️ Definir valor de cada
                                    </BotaoModoDividido>
                                </ModosDivididoToggle>

                                {modoDivididoEntrada === "50_50" ? (
                                    <ResumoValoresDivididos>
                                        <div>
                                            <span>Minha parte (50%):</span>
                                            <strong>{formatCurrency(divisaoEntradaCalculada.valorMeu)}</strong>
                                        </div>
                                        <div>
                                            <span>Parte {parceiroNome} (50%):</span>
                                            <strong>{formatCurrency(divisaoEntradaCalculada.valorMozi)}</strong>
                                        </div>
                                    </ResumoValoresDivididos>
                                ) : (
                                    <LinhaDupla style={{ marginTop: 8 }}>
                                        <div>
                                            <Label>Minha parte (R$):</Label>
                                            <InputComum
                                                type="text"
                                                value={entradaMeuPersonalizada}
                                                onChange={(e) => {
                                                    setEntradaMeuPersonalizada(e.target.value);
                                                    const meuV = parseCurrency(e.target.value);
                                                    if (valorEntradaNum > 0) {
                                                        const resto = Math.max(0, valorEntradaNum - meuV);
                                                        setEntradaMoziPersonalizada(resto.toFixed(2).replace(".", ","));
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label>Parte {parceiroNome} (R$):</Label>
                                            <InputComum
                                                type="text"
                                                value={entradaMoziPersonalizada}
                                                onChange={(e) => {
                                                    setEntradaMoziPersonalizada(e.target.value);
                                                    const moziV = parseCurrency(e.target.value);
                                                    if (valorEntradaNum > 0) {
                                                        const resto = Math.max(0, valorEntradaNum - moziV);
                                                        setEntradaMeuPersonalizada(resto.toFixed(2).replace(".", ","));
                                                    }
                                                }}
                                            />
                                        </div>
                                    </LinhaDupla>
                                )}
                            </PainelDetalheDivisao>
                        )}
                    </SecaoBloco>

                    {/* BLOCO 2: PARCELAS (X VEZES DE R$ Y) */}
                    <SecaoBloco>
                        <TituloSecao>
                            <span>2️⃣ Parcelas dos Próximos Meses</span>
                            <small>(X vezes de R$ Y)</small>
                        </TituloSecao>

                        <LinhaDupla>
                            <div style={{ flex: 0.8 }}>
                                <Label>Parcelas:</Label>
                                <SelectComum
                                    value={qtdParcelas}
                                    onChange={(e) => setQtdParcelas(e.target.value)}
                                >
                                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 24, 36].map((n) => (
                                        <option key={n} value={n}>
                                            {n}x parcelas
                                        </option>
                                    ))}
                                </SelectComum>
                            </div>
                            <div style={{ flex: 1.2 }}>
                                <Label>Valor de cada parcela (R$):</Label>
                                <InputDestaque
                                    type="text"
                                    placeholder="Ex: 942,21"
                                    value={valorParcelaInput}
                                    onChange={(e) => {
                                        setValorParcelaInput(e.target.value);
                                        const v = parseCurrency(e.target.value);
                                        if (modoDivididoParcela === "personalizado" && v > 0) {
                                            const metade = (v / 2).toFixed(2).replace(".", ",");
                                            setParcelaMeuPersonalizada(metade);
                                            setParcelaMoziPersonalizada(metade);
                                        }
                                    }}
                                />
                            </div>
                        </LinhaDupla>

                        <Label style={{ marginTop: 8 }}>De quem é a responsabilidade das Parcelas?</Label>
                        <OpcoesDivisao>
                            <BotaoOpcao
                                type="button"
                                $ativo={tipoDivisaoParcela === "meu"}
                                onClick={() => setTipoDivisaoParcela === "meu"}
                            >
                                👤 100% {isIngrid ? "Pessoal" : "Meu"}
                            </BotaoOpcao>
                            <BotaoOpcao
                                type="button"
                                $ativo={tipoDivisaoParcela === "mozi"}
                                onClick={() => setTipoDivisaoParcela("mozi")}
                            >
                                💕 100% {parceiroNome}
                            </BotaoOpcao>
                            <BotaoOpcao
                                type="button"
                                $ativo={tipoDivisaoParcela === "dividido"}
                                onClick={() => setTipoDivisaoParcela("dividido")}
                            >
                                🤝 Dividido
                            </BotaoOpcao>
                        </OpcoesDivisao>

                        {tipoDivisaoParcela === "dividido" && (
                            <PainelDetalheDivisao>
                                <ModosDivididoToggle>
                                    <BotaoModoDividido
                                        type="button"
                                        $ativo={modoDivididoParcela === "50_50"}
                                        onClick={() => setModoDivididoParcela("50_50")}
                                    >
                                        ⚖️ 50% por mês para cada
                                    </BotaoModoDividido>
                                    <BotaoModoDividido
                                        type="button"
                                        $ativo={modoDivididoParcela === "personalizado"}
                                        onClick={() => {
                                            setModoDivididoParcela("personalizado");
                                            if (valorParcelaNum > 0) {
                                                const metade = (valorParcelaNum / 2).toFixed(2).replace(".", ",");
                                                setParcelaMeuPersonalizada(metade);
                                                setParcelaMoziPersonalizada(metade);
                                            }
                                        }}
                                    >
                                        ✏️ Definir valor de cada por parcela
                                    </BotaoModoDividido>
                                </ModosDivididoToggle>

                                {modoDivididoParcela === "50_50" ? (
                                    <ResumoValoresDivididos>
                                        <div>
                                            <span>Minha parcela (50%):</span>
                                            <strong>{formatCurrency(divisaoParcelaCalculada.valorMeu)}/mês</strong>
                                        </div>
                                        <div>
                                            <span>Parcela {parceiroNome} (50%):</span>
                                            <strong>{formatCurrency(divisaoParcelaCalculada.valorMozi)}/mês</strong>
                                        </div>
                                    </ResumoValoresDivididos>
                                ) : (
                                    <LinhaDupla style={{ marginTop: 8 }}>
                                        <div>
                                            <Label>Minha parcela (R$):</Label>
                                            <InputComum
                                                type="text"
                                                value={parcelaMeuPersonalizada}
                                                onChange={(e) => {
                                                    setParcelaMeuPersonalizada(e.target.value);
                                                    const meuV = parseCurrency(e.target.value);
                                                    if (valorParcelaNum > 0) {
                                                        const resto = Math.max(0, valorParcelaNum - meuV);
                                                        setParcelaMoziPersonalizada(resto.toFixed(2).replace(".", ","));
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label>Parcela {parceiroNome} (R$):</Label>
                                            <InputComum
                                                type="text"
                                                value={parcelaMoziPersonalizada}
                                                onChange={(e) => {
                                                    setParcelaMoziPersonalizada(e.target.value);
                                                    const moziV = parseCurrency(e.target.value);
                                                    if (valorParcelaNum > 0) {
                                                        const resto = Math.max(0, valorParcelaNum - moziV);
                                                        setParcelaMeuPersonalizada(resto.toFixed(2).replace(".", ","));
                                                    }
                                                }}
                                            />
                                        </div>
                                    </LinhaDupla>
                                )}
                            </PainelDetalheDivisao>
                        )}
                    </SecaoBloco>

                    {/* BLOCO 3: PAINEL DE CONFERÊNCIA BANCÁRIO */}
                    <CardComprovante>
                        <div className="titulo-comp">📄 Resumo do Parcelamento</div>
                        <LinhaComp>
                            <span>Fatura deste mês ({cartaoSelecionado}):</span>
                            <strong>Entrada de {formatCurrency(valorEntradaNum)}</strong>
                        </LinhaComp>
                        {tipoDivisaoEntrada === "dividido" && (
                            <SublinhaComp>
                                ↳ 2 linhas explícitas no topo: Minha parte ({formatCurrency(divisaoEntradaCalculada.valorMeu)}) + {parceiroNome} ({formatCurrency(divisaoEntradaCalculada.valorMozi)})
                            </SublinhaComp>
                        )}
                        <LinhaComp>
                            <span>Próximos {numParcelasInt} meses:</span>
                            <strong>{numParcelasInt}x de {formatCurrency(valorParcelaNum)}</strong>
                        </LinhaComp>
                        {tipoDivisaoParcela === "dividido" && (
                            <SublinhaComp>
                                ↳ Por mês: Minha parte ({formatCurrency(divisaoParcelaCalculada.valorMeu)}) + {parceiroNome} ({formatCurrency(divisaoParcelaCalculada.valorMozi)})
                            </SublinhaComp>
                        )}
                        <DivisorComp />
                        <LinhaComp className="total">
                            <span>Total Geral do Financiamento:</span>
                            <span className="destaque-total">{formatCurrency(totalGeralAcordo)}</span>
                        </LinhaComp>
                    </CardComprovante>

                    {erro && (
                        <MensagemErro>
                            <span>⚠️</span>
                            <div>{erro}</div>
                        </MensagemErro>
                    )}

                    <Footer>
                        {acordoAtivo && (
                            <BotaoRemover type="button" onClick={handleCancelarAcordo} disabled={salvando}>
                                🗑️ Desfazer Acordo
                            </BotaoRemover>
                        )}
                        <BotoesAcaoDireita>
                            <BotaoCancelar type="button" onClick={onClose} disabled={salvando}>
                                Cancelar
                            </BotaoCancelar>
                            <BotaoConfirmar type="submit" disabled={salvando || valorEntradaNum <= 0 || valorParcelaNum <= 0}>
                                {salvando ? "Processando..." : "Confirmar Parcelamento 🚨"}
                            </BotaoConfirmar>
                        </BotoesAcaoDireita>
                    </Footer>
                </Form>
            </ModalContent>
        </Overlay>
    );
}

/* ===============================================================
   STYLED COMPONENTS - RESPONSIVIDADE TOTAL & DESIGN SYSTEM NEON
   =============================================================== */

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(4, 8, 18, 0.82);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1200;
    backdrop-filter: blur(6px);
    padding: 12px;
    box-sizing: border-box;
    overscroll-behavior: contain;
`;

const ModalContent = styled.div`
    background: #0d121f;
    border: 1px solid rgba(239, 68, 68, 0.45);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(239, 68, 68, 0.2);
    border-radius: 20px;
    width: min(94vw, 540px);
    max-height: 92dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 22px 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 14px;

    scrollbar-width: thin;
    scrollbar-color: #ef4444 transparent;

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
    padding-bottom: 10px;

    .titulo {
        font-size: 1.25rem;
        color: #f87171;
        margin: 0;
    }
`;

const Subinfo = styled.div`
    font-size: 0.78rem;
    color: #94a3b8;
    margin-top: 2px;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.8rem;
    cursor: pointer;
    line-height: 1;
    padding: 0 4px;

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
    font-size: 0.78rem;
    font-weight: 600;
    color: #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;

const ListaCartoesSeletor = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

const BotaoSeletorCartao = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid
        ${({ $ativo, $cor }) =>
            $ativo ? $cor || "#ef4444" : "rgba(255, 255, 255, 0.12)"};
    background: ${({ $ativo, $cor }) =>
        $ativo
            ? `linear-gradient(135deg, ${$cor ? `${$cor}44` : "rgba(239, 68, 68, 0.4)"}, rgba(13, 18, 31, 0.8))`
            : "rgba(255, 255, 255, 0.04)"};
    color: ${({ $ativo }) => ($ativo ? "#ffffff" : "#94a3b8")};
    transition: all 0.2s;
`;

const PainelFaturaAtual = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(239, 68, 68, 0.4);
    border-radius: 12px;

    .info-linha {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        color: #cbd5e1;

        .valor-original {
            font-weight: 700;
            color: #f87171;
            font-size: 1rem;
        }
    }

    .ajuda {
        font-size: 0.74rem;
        color: #94a3b8;
        line-height: 1.35;
    }
`;

const SecaoBloco = styled.div`
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const TituloSecao = styled.div`
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 0.92rem;
    font-weight: 700;
    color: #f1f5f9;

    small {
        font-size: 0.75rem;
        font-weight: normal;
        color: #94a3b8;
    }
`;

const LinhaDupla = styled.div`
    display: flex;
    gap: 10px;

    @media (max-width: 480px) {
        flex-direction: column;
    }
`;

const InputDestaque = styled.input`
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(239, 68, 68, 0.4);
    background: rgba(0, 0, 0, 0.4);
    color: #ffffff;
    font-size: 1.05rem;
    font-weight: 700;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #f87171;
        box-shadow: 0 0 10px rgba(248, 113, 113, 0.3);
    }
`;

const InputComum = styled.input`
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.4);
    color: #ffffff;
    font-size: 0.9rem;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #00b3ff;
    }
`;

const SelectComum = styled.select`
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.4);
    color: #ffffff;
    font-size: 0.9rem;
    box-sizing: border-box;

    option {
        background: #0d121f;
        color: #ffffff;
    }
`;

const OpcoesDivisao = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

const BotaoOpcao = styled.button`
    flex: 1;
    min-width: 90px;
    padding: 8px 10px;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid
        ${({ $ativo }) => ($ativo ? "#f87171" : "rgba(255, 255, 255, 0.1)")};
    background: ${({ $ativo }) =>
        $ativo ? "rgba(239, 68, 68, 0.25)" : "rgba(0, 0, 0, 0.3)"};
    color: ${({ $ativo }) => ($ativo ? "#ffffff" : "#94a3b8")};
    transition: all 0.15s;
`;

const PainelDetalheDivisao = styled.div`
    background: rgba(0, 0, 0, 0.35);
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 10px;
    margin-top: 6px;
`;

const ModosDivididoToggle = styled.div`
    display: flex;
    gap: 4px;
    background: rgba(255, 255, 255, 0.04);
    padding: 3px;
    border-radius: 8px;
`;

const BotaoModoDividido = styled.button`
    flex: 1;
    padding: 6px 8px;
    border-radius: 6px;
    border: none;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    background: ${({ $ativo }) =>
        $ativo ? "rgba(0, 179, 255, 0.3)" : "transparent"};
    color: ${({ $ativo }) => ($ativo ? "#38bdf8" : "#94a3b8")};
`;

const ResumoValoresDivididos = styled.div`
    display: flex;
    justify-content: space-around;
    padding: 8px 4px 4px 4px;
    font-size: 0.82rem;
    color: #cbd5e1;

    strong {
        color: #38bdf8;
        margin-left: 6px;
    }
`;

const CardComprovante = styled.div`
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(13, 18, 31, 0.85));
    border: 1px solid rgba(239, 68, 68, 0.35);
    border-radius: 14px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .titulo-comp {
        font-size: 0.82rem;
        font-weight: 700;
        color: #f87171;
        text-transform: uppercase;
        margin-bottom: 2px;
    }
`;

const LinhaComp = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
    color: #cbd5e1;

    strong {
        color: #ffffff;
    }

    &.total {
        font-size: 0.95rem;
        font-weight: 700;
        color: #ffffff;

        .destaque-total {
            font-size: 1.15rem;
            color: #4ade80;
        }
    }
`;

const SublinhaComp = styled.div`
    font-size: 0.74rem;
    color: #94a3b8;
    padding-left: 8px;
`;

const DivisorComp = styled.div`
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin: 4px 0;
`;

const MensagemErro = styled.div`
    display: flex;
    gap: 8px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 0.8rem;
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

    @media (max-width: 480px) {
        flex: 1;
    }
`;

const BotaoConfirmar = styled.button`
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: none;
    color: #ffffff;
    padding: 9px 18px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5);
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
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #f87171;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;

    @media (max-width: 480px) {
        width: 100%;
    }
`;
