import { useState } from "react";
import styled from "styled-components";
import { formatCurrency } from "../../utils/currencyUtils";

export default function CenariosMeta({
    cenarios,
    contextoFinanceiro,
    cenarioAdotadoId = null,
    onAdotarCenario = null,
}) {
    const [abaAtiva, setAbaAtiva] = useState("recomendacao"); // "recomendacao" | "avista" | "financiamento" | "hibrido" | "consorcio"

    if (!cenarios) return null;

    const { aVista = [], financiamento = [], hibrido = [], consorcio = [], recomendacaoRapida } = cenarios;
    const { salario, sobraReal } = contextoFinanceiro || {};

    return (
        <Container>
            <HeaderSecao>
                <TituloSecao>📊 Simulação de Cenários Financeiros</TituloSecao>
                <SubtituloSecao>
                    Comparativo matemático real entre poupar, financiar ou consórcio com travas de segurança baseadas na sua renda (R$ {salario?.toLocaleString("pt-BR")}) e sobra mensal (R$ {sobraReal?.toLocaleString("pt-BR")}).
                </SubtituloSecao>
            </HeaderSecao>

            <TabsContainer>
                <TabButton
                    $ativo={abaAtiva === "recomendacao"}
                    onClick={() => setAbaAtiva("recomendacao")}
                >
                    💎 Recomendação
                </TabButton>
                <TabButton
                    $ativo={abaAtiva === "avista"}
                    onClick={() => setAbaAtiva("avista")}
                >
                    💵 À Vista ({aVista.length})
                </TabButton>
                {financiamento.length > 0 && (
                    <TabButton
                        $ativo={abaAtiva === "financiamento"}
                        onClick={() => setAbaAtiva("financiamento")}
                    >
                        🚗 Financiamento ({financiamento.length})
                    </TabButton>
                )}
                {hibrido.length > 0 && (
                    <TabButton
                        $ativo={abaAtiva === "hibrido"}
                        onClick={() => setAbaAtiva("hibrido")}
                    >
                        ⚡ Híbrido Inteligente ({hibrido.length})
                    </TabButton>
                )}
                {consorcio.length > 0 && (
                    <TabButton
                        $ativo={abaAtiva === "consorcio"}
                        onClick={() => setAbaAtiva("consorcio")}
                    >
                        🤝 Consórcio ({consorcio.length})
                    </TabButton>
                )}
            </TabsContainer>

            {/* ABA: RECOMENDAÇÃO RÁPIDA */}
            {abaAtiva === "recomendacao" && recomendacaoRapida && (
                <CenarioDestaqueCard>
                    <TopoCardDestaque>
                        <BadgeDestaque>🏆 Melhor Estratégia "Sem Aperto"</BadgeDestaque>
                        {recomendacaoRapida.id === cenarioAdotadoId ? (
                            <BadgeAdotadoAtivo>⭐ Plano Principal Ativo</BadgeAdotadoAtivo>
                        ) : onAdotarCenario ? (
                            <BotaoAdotarPrincipal
                                type="button"
                                onClick={() => onAdotarCenario(recomendacaoRapida.id)}
                            >
                                🎯 Adotar este Cenário como Plano Principal
                            </BotaoAdotarPrincipal>
                        ) : null}
                    </TopoCardDestaque>
                    <TituloCardDestaque>{recomendacaoRapida.titulo}</TituloCardDestaque>

                    <GridMetricasDestaque>
                        <MetricaBox>
                            <MetricaLabel>Parcela / Aporte Mensal</MetricaLabel>
                            <MetricaValor $cor="#10b981">
                                {formatCurrency(recomendacaoRapida.parcela || recomendacaoRapida.aporteMensal)}
                            </MetricaValor>
                            <MetricaSub>
                                Consome {recomendacaoRapida.seguranca?.percentualRenda}% da renda
                            </MetricaSub>
                        </MetricaBox>

                        <MetricaBox>
                            <MetricaLabel>Prazo & Data de Conquista</MetricaLabel>
                            <MetricaValor style={{ color: "#38bdf8", fontSize: "1.1rem" }}>
                                {recomendacaoRapida.prazoFormatado?.textoCompleto || `${recomendacaoRapida.tempoMesesMedio || recomendacaoRapida.prazoParcelas || recomendacaoRapida.meses} meses`}
                            </MetricaValor>
                            <MetricaSub>
                                {recomendacaoRapida.tipo === "avista" ? "Poupança rendendo CDI" : "Parcelas fixas"}
                            </MetricaSub>
                        </MetricaBox>

                        <MetricaBox>
                            <MetricaLabel>Folga Mensal Restante</MetricaLabel>
                            <MetricaValor $cor="#38bdf8">
                                {formatCurrency(recomendacaoRapida.seguranca?.sobraAposParcela)}
                            </MetricaValor>
                            <MetricaSub>Livre p/ lazer ou reserva</MetricaSub>
                        </MetricaBox>

                        <MetricaBox>
                            <MetricaLabel>Juros / Taxas Totais</MetricaLabel>
                            <MetricaValor $cor={recomendacaoRapida.jurosTotal ? "#f59e0b" : "#10b981"}>
                                {recomendacaoRapida.jurosTotal ? formatCurrency(recomendacaoRapida.jurosTotal) : "R$ 0,00 (Zero Juros)"}
                            </MetricaValor>
                            <MetricaSub>
                                {recomendacaoRapida.tipo === "avista" ? "100% de economia" : "Custo do crédito"}
                            </MetricaSub>
                        </MetricaBox>
                    </GridMetricasDestaque>

                    <StatusSeguranca $cor={recomendacaoRapida.seguranca?.cor}>
                        <span>{recomendacaoRapida.seguranca?.icone}</span>
                        <div>
                            <strong>{recomendacaoRapida.seguranca?.rotulo}: </strong>
                            {recomendacaoRapida.seguranca?.motivo}
                        </div>
                    </StatusSeguranca>
                </CenarioDestaqueCard>
            )}

            {/* ABA: À VISTA */}
            {abaAtiva === "avista" && (
                <GridCenarios>
                    {aVista.map((cen) => (
                        <CardOpcao key={cen.id} $isAdotado={cen.id === cenarioAdotadoId}>
                            <HeaderCardOpcao>
                                <TituloOpcao>{cen.titulo}</TituloOpcao>
                                <BadgeSeguranca $cor={cen.seguranca.cor}>
                                    {cen.seguranca.icone} {cen.seguranca.rotulo}
                                </BadgeSeguranca>
                            </HeaderCardOpcao>

                            <LinhaInfo>
                                <span>Aporte Mensal:</span>
                                <strong>{formatCurrency(cen.aporteMensal)}/mês</strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Prazo Estimado (Médio):</span>
                                <strong style={{ color: "#00b3ff" }}>
                                    {cen.prazoFormatado?.textoCompleto || `${cen.tempoMesesMedio} meses`}
                                </strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Faixa de Tempo:</span>
                                <span>{cen.tempoMesesMin}m (mínimo) a {cen.tempoMesesMax}m (máximo)</span>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Rendimento Ganho (CDI):</span>
                                <strong style={{ color: "#10b981" }}>+{formatCurrency(cen.rendimentoGanhoMedio)}</strong>
                            </LinhaInfo>

                            <DescricaoOpcao>{cen.descricao}</DescricaoOpcao>

                            <RodapeAcaoCard>
                                {cen.id === cenarioAdotadoId ? (
                                    <BadgeAdotadoAtivo>⭐ Plano Principal Ativo</BadgeAdotadoAtivo>
                                ) : onAdotarCenario ? (
                                    <BotaoAdotarOpcao
                                        type="button"
                                        onClick={() => onAdotarCenario(cen.id)}
                                    >
                                        🎯 Adotar este Cenário como Principal
                                    </BotaoAdotarOpcao>
                                ) : null}
                            </RodapeAcaoCard>
                        </CardOpcao>
                    ))}
                </GridCenarios>
            )}

            {/* ABA: FINANCIAMENTO */}
            {abaAtiva === "financiamento" && (
                <GridCenarios>
                    {financiamento.map((cen) => (
                        <CardOpcao key={cen.id} $isAdotado={cen.id === cenarioAdotadoId}>
                            <HeaderCardOpcao>
                                <div>
                                    <TituloOpcao>{cen.titulo}</TituloOpcao>
                                    {cen.destaque && <TagDestaque>{cen.destaque}</TagDestaque>}
                                </div>
                                <BadgeSeguranca $cor={cen.seguranca.cor}>
                                    {cen.seguranca.icone} {cen.seguranca.rotulo}
                                </BadgeSeguranca>
                            </HeaderCardOpcao>

                            <LinhaInfo>
                                <span>Valor da Entrada ({cen.percentualEntrada}%):</span>
                                <strong>{formatCurrency(cen.valorEntrada)}</strong>
                            </LinhaInfo>

                            {cen.mesesParaEntrada > 0 && (
                                <LinhaInfo>
                                    <span>Tempo para Juntar Entrada:</span>
                                    <span style={{ color: "#f59e0b" }}>
                                        {cen.prazoEntradaFormatado?.textoCompleto || `${cen.mesesParaEntrada} meses`} (guardando {formatCurrency(cen.aporteParaEntrada)}/mês)
                                    </span>
                                </LinhaInfo>
                            )}

                            <LinhaInfo>
                                <span>Parcela Fixa ({cen.prazoParcelas}x):</span>
                                <strong style={{ color: cen.seguranca.cor, fontSize: "1.05rem" }}>
                                    {formatCurrency(cen.parcela)}/mês
                                </strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Prazo Total até Quitação:</span>
                                <strong style={{ color: "#38bdf8" }}>
                                    {cen.prazoFormatado?.textoCompleto || `${cen.mesesTotalConquista} meses`}
                                </strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Comprometimento Renda:</span>
                                <span>{cen.seguranca.percentualRenda}% da renda</span>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Juros Totais Pagos:</span>
                                <strong style={{ color: "#ef4444" }}>+{formatCurrency(cen.jurosTotal)}</strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Custo Total com Entrada:</span>
                                <strong>{formatCurrency(cen.totalPago)}</strong>
                            </LinhaInfo>

                            <DescricaoOpcao>{cen.seguranca.motivo}</DescricaoOpcao>

                            <RodapeAcaoCard>
                                {cen.id === cenarioAdotadoId ? (
                                    <BadgeAdotadoAtivo>⭐ Plano Principal Ativo</BadgeAdotadoAtivo>
                                ) : onAdotarCenario ? (
                                    <BotaoAdotarOpcao
                                        type="button"
                                        onClick={() => onAdotarCenario(cen.id)}
                                    >
                                        🎯 Adotar este Cenário como Principal
                                    </BotaoAdotarOpcao>
                                ) : null}
                            </RodapeAcaoCard>
                        </CardOpcao>
                    ))}
                </GridCenarios>
            )}

            {/* ABA: HÍBRIDO INTELIGENTE */}
            {abaAtiva === "hibrido" && (
                <GridCenarios>
                    {hibrido.map((cen) => (
                        <CardOpcao key={cen.id} $isAdotado={cen.id === cenarioAdotadoId}>
                            <HeaderCardOpcao>
                                <TituloOpcao>{cen.titulo}</TituloOpcao>
                                <BadgeSeguranca $cor={cen.seguranca.cor}>
                                    {cen.seguranca.icone} {cen.seguranca.rotulo}
                                </BadgeSeguranca>
                            </HeaderCardOpcao>

                            <LinhaInfo>
                                <span>1ª Fase (Poupar):</span>
                                <strong>
                                    {cen.prazoFase1Formatado?.anosTexto || `${cen.mesesPoupando} meses`} guardando {formatCurrency(cen.aporteFasePoupanca)}/mês
                                </strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Entrada Acumulada:</span>
                                <strong style={{ color: "#10b981" }}>{formatCurrency(cen.entradaAlcancada)}</strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>2ª Fase (Financiamento):</span>
                                <strong>{cen.prazoFinanciamento}x leves de {formatCurrency(cen.parcelaFinanciamento)}/mês</strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Prazo Total até Quitação:</span>
                                <strong style={{ color: "#38bdf8" }}>
                                    {cen.prazoFormatado?.textoCompleto || `${cen.mesesTotalConquista} meses`}
                                </strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Juros Totais (Reduzidos):</span>
                                <strong style={{ color: "#f59e0b" }}>+{formatCurrency(cen.jurosTotal)}</strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Custo Total Final:</span>
                                <strong>{formatCurrency(cen.totalPago)}</strong>
                            </LinhaInfo>

                            <DescricaoOpcao>{cen.descricao}</DescricaoOpcao>

                            <RodapeAcaoCard>
                                {cen.id === cenarioAdotadoId ? (
                                    <BadgeAdotadoAtivo>⭐ Plano Principal Ativo</BadgeAdotadoAtivo>
                                ) : onAdotarCenario ? (
                                    <BotaoAdotarOpcao
                                        type="button"
                                        onClick={() => onAdotarCenario(cen.id)}
                                    >
                                        🎯 Adotar este Cenário como Principal
                                    </BotaoAdotarOpcao>
                                ) : null}
                            </RodapeAcaoCard>
                        </CardOpcao>
                    ))}
                </GridCenarios>
            )}

            {/* ABA: CONSÓRCIO */}
            {abaAtiva === "consorcio" && (
                <GridCenarios>
                    {consorcio.map((cen) => (
                        <CardOpcao key={cen.id} $isAdotado={cen.id === cenarioAdotadoId}>
                            <HeaderCardOpcao>
                                <TituloOpcao>{cen.titulo}</TituloOpcao>
                                <BadgeSeguranca $cor={cen.seguranca.cor}>
                                    {cen.seguranca.icone} {cen.seguranca.rotulo}
                                </BadgeSeguranca>
                            </HeaderCardOpcao>

                            <LinhaInfo>
                                <span>Parcela do Consórcio:</span>
                                <strong style={{ color: "#00b3ff", fontSize: "1.05rem" }}>
                                    {formatCurrency(cen.parcela)}/mês
                                </strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Prazo Total do Grupo:</span>
                                <strong style={{ color: "#38bdf8" }}>
                                    {cen.prazoFormatado?.textoCompleto || `${cen.meses} meses`}
                                </strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Taxa de Administração Total:</span>
                                <span>{cen.taxaAdmPercentual}% ({formatCurrency(cen.taxaAdmTotal)})</span>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Custo Total do Bem:</span>
                                <strong>{formatCurrency(cen.totalPago)}</strong>
                            </LinhaInfo>

                            <LinhaInfo>
                                <span>Comprometimento Renda:</span>
                                <span>{cen.seguranca.percentualRenda}% da renda</span>
                            </LinhaInfo>

                            <DescricaoOpcao style={{ borderLeft: "3px solid #eab308" }}>
                                💡 <strong>Estratégia:</strong> {cen.estrategiaLance}
                            </DescricaoOpcao>

                            <RodapeAcaoCard>
                                {cen.id === cenarioAdotadoId ? (
                                    <BadgeAdotadoAtivo>⭐ Plano Principal Ativo</BadgeAdotadoAtivo>
                                ) : onAdotarCenario ? (
                                    <BotaoAdotarOpcao
                                        type="button"
                                        onClick={() => onAdotarCenario(cen.id)}
                                    >
                                        🎯 Adotar este Cenário como Principal
                                    </BotaoAdotarOpcao>
                                ) : null}
                            </RodapeAcaoCard>
                        </CardOpcao>
                    ))}
                </GridCenarios>
            )}
        </Container>
    );
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const HeaderSecao = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const TituloSecao = styled.h3`
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
`;

const SubtituloSecao = styled.p`
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.4;
`;

const TabsContainer = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 8px;
`;

const TabButton = styled.button`
    background: ${({ $ativo }) => ($ativo ? "rgba(0, 179, 255, 0.15)" : "rgba(255, 255, 255, 0.04)")};
    border: 1px solid ${({ $ativo }) => ($ativo ? "#00b3ff" : "rgba(255, 255, 255, 0.1)")};
    color: ${({ $ativo }) => ($ativo ? "#38bdf8" : "#94a3b8")};
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
        background: rgba(0, 179, 255, 0.1);
        color: #fff;
    }
`;

const CenarioDestaqueCard = styled.div`
    background: linear-gradient(135deg, rgba(130, 10, 209, 0.15), rgba(0, 179, 255, 0.12));
    border: 1px solid rgba(0, 179, 255, 0.4);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const BadgeDestaque = styled.span`
    align-self: flex-start;
    background: linear-gradient(90deg, #820ad1, #00b3ff);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 10px;
    border-radius: 6px;
`;

const TituloCardDestaque = styled.h4`
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
`;

const GridMetricasDestaque = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
`;

const MetricaBox = styled.div`
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;
`;

const MetricaLabel = styled.span`
    font-size: 0.75rem;
    color: #94a3b8;
`;

const MetricaValor = styled.span`
    font-size: 1.25rem;
    font-weight: 700;
    color: ${({ $cor }) => $cor || "#fff"};
`;

const MetricaSub = styled.span`
    font-size: 0.72rem;
    color: #64748b;
`;

const StatusSeguranca = styled.div`
    background: rgba(15, 23, 42, 0.8);
    border-left: 4px solid ${({ $cor }) => $cor || "#10b981"};
    border-radius: 6px;
    padding: 10px 14px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.85rem;
    color: #e2e8f0;
    line-height: 1.4;
    span {
        font-size: 1.1rem;
    }
`;

const GridCenarios = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 14px;
`;

const CardOpcao = styled.div`
    background: ${({ $isAdotado }) =>
        $isAdotado
            ? "linear-gradient(145deg, rgba(130, 10, 209, 0.25), rgba(15, 23, 42, 0.9))"
            : "rgba(15, 23, 42, 0.8)"};
    border: 1px solid
        ${({ $isAdotado }) => ($isAdotado ? "#820ad1" : "rgba(255, 255, 255, 0.08)")};
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: ${({ $isAdotado }) => ($isAdotado ? "0 4px 20px rgba(130, 10, 209, 0.35)" : "none")};
    transition: transform 0.2s, border-color 0.2s;
    &:hover {
        border-color: rgba(0, 179, 255, 0.4);
        transform: translateY(-2px);
    }
`;

const HeaderCardOpcao = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
`;

const TituloOpcao = styled.h5`
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
`;

const TagDestaque = styled.span`
    display: inline-block;
    background: rgba(0, 179, 255, 0.2);
    color: #38bdf8;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 3px;
`;

const BadgeSeguranca = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    background: ${({ $cor }) => `${$cor}22`};
    color: ${({ $cor }) => $cor};
    border: 1px solid ${({ $cor }) => `${$cor}55`};
    white-space: nowrap;
`;

const LinhaInfo = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    color: #94a3b8;
    strong {
        color: #f8fafc;
    }
`;

const DescricaoOpcao = styled.p`
    font-size: 0.78rem;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    padding: 8px;
    margin: 4px 0 0 0;
    line-height: 1.4;
`;

const TopoCardDestaque = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
`;

const BadgeAdotadoAtivo = styled.span`
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #0f172a;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 5px 12px;
    border-radius: 999px;
    letter-spacing: 0.3px;
    box-shadow: 0 2px 10px rgba(245, 158, 11, 0.35);
`;

const BotaoAdotarPrincipal = styled.button`
    background: linear-gradient(135deg, #0284c7, #820ad1);
    border: none;
    color: #fff;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
    }
`;

const RodapeAcaoCard = styled.div`
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: flex-end;
`;

const BotaoAdotarOpcao = styled.button`
    width: 100%;
    background: rgba(0, 179, 255, 0.12);
    border: 1px solid rgba(0, 179, 255, 0.3);
    color: #38bdf8;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: linear-gradient(135deg, #820ad1, #00b3ff);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 4px 12px rgba(0, 179, 255, 0.3);
    }
`;
