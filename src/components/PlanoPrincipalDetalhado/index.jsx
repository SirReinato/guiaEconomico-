import { useState, useMemo } from "react";
import styled from "styled-components";
import { formatCurrency } from "../../utils/currencyUtils";
import { gerarLinhaDoTempoCenario } from "../../utils/metasCalculos";

export default function PlanoPrincipalDetalhado({
    cenario,
    meta,
    contextoFinanceiro,
    onTrocarCenario,
}) {
    const [modoExibicao, setModoExibicao] = useState("tabela"); // "tabela" | "cards"
    const [filtroTexto, setFiltroTexto] = useState("");
    const [expandido, setExpandido] = useState(false);

    const valorAlvo = meta?.valorMax || meta?.valorMin || 30000;
    const saldoInicial = meta?.valorJaGuardado || 0;
    const taxaSelicMensal = contextoFinanceiro?.taxaSelicMensal || 0.93;

    // Linha do tempo calculada mês a mês
    const linhaDoTempo = useMemo(() => {
        if (!cenario) return [];
        return gerarLinhaDoTempoCenario({
            cenario,
            valorAlvo,
            saldoInicial,
            taxaSelicMensal,
            dataInicio: new Date(),
        });
    }, [cenario, valorAlvo, saldoInicial, taxaSelicMensal]);

    // Linhas filtradas para busca
    const linhasFiltradas = useMemo(() => {
        if (!filtroTexto.trim()) return linhaDoTempo;
        const termo = filtroTexto.toLowerCase();
        return linhaDoTempo.filter((item) => {
            return (
                String(item.numeroMes).includes(termo) ||
                (item.dataExibicao && item.dataExibicao.toLowerCase().includes(termo)) ||
                (item.tempoDecorrido && item.tempoDecorrido.toLowerCase().includes(termo)) ||
                (item.evento && item.evento.toLowerCase().includes(termo))
            );
        });
    }, [linhaDoTempo, filtroTexto]);

    if (!cenario) return null;

    const totalMeses = linhaDoTempo.length > 0 ? linhaDoTempo[linhaDoTempo.length - 1].numeroMes : 0;
    const linhasExibidas = expandido || linhasFiltradas.length <= 12 ? linhasFiltradas : linhasFiltradas.slice(0, 12);

    const prazoFormatado = cenario.prazoFormatado || {
        textoCompleto: `${cenario.tempoMesesMedio || cenario.prazoParcelas || cenario.meses} meses`,
        anosTexto: "",
        dataEstimadaStr: "",
    };

    const aporteOuParcela = cenario.parcela || cenario.aporteMensal || cenario.aporteFasePoupanca || 0;
    const jurosOuRendimento = cenario.tipo === "avista"
        ? { rotulo: "Rendimento Ganho (CDI)", valor: cenario.rendimentoGanhoMedio || 0, positivo: true }
        : { rotulo: "Juros / Taxas Totais", valor: cenario.jurosTotal || cenario.taxaAdmTotal || 0, positivo: false };

    return (
        <CardPrincipalContainer>
            {/* Topo do Plano com Badge de Seleção */}
            <HeaderPlano>
                <InfoPlano>
                    <BadgePlanoPrincipal>
                        ⭐ SEU PLANO PRINCIPAL ADOTADO
                    </BadgePlanoPrincipal>
                    <TituloPlano>{cenario.titulo}</TituloPlano>
                    <SubtituloPlano>
                        Todo o seu planejamento financeiro está alinhado a esta estratégia. Você pode simular e adotar outro cenário a qualquer momento.
                    </SubtituloPlano>
                </InfoPlano>

                {onTrocarCenario && (
                    <BotaoTrocarCenario type="button" onClick={onTrocarCenario}>
                        🔄 Alternar para Outro Cenário
                    </BotaoTrocarCenario>
                )}
            </HeaderPlano>

            {/* Grid de Métricas Principais (Estilo Insights) */}
            <GridMetricas>
                <MetricaCard>
                    <MetricaRotulo>Aporte / Parcela Mensal</MetricaRotulo>
                    <MetricaValor $cor="#10b981">{formatCurrency(aporteOuParcela)}/mês</MetricaValor>
                    <MetricaSub>
                        Consome {cenario.seguranca?.percentualRenda}% da renda líquida
                    </MetricaSub>
                </MetricaCard>

                <MetricaCard>
                    <MetricaRotulo>Prazo & Data de Conquista</MetricaRotulo>
                    <MetricaValor style={{ color: "#38bdf8", fontSize: "1.15rem" }}>
                        {prazoFormatado.textoCompleto}
                    </MetricaValor>
                    <MetricaSub>
                        {cenario.tipo === "avista" ? "Acúmulo CDI sem juros" : "Parcelamento planejado"}
                    </MetricaSub>
                </MetricaCard>

                <MetricaCard>
                    <MetricaRotulo>Folga Mensal Livre</MetricaRotulo>
                    <MetricaValor $cor="#a855f7">
                        {formatCurrency(cenario.seguranca?.sobraAposParcela || 0)}
                    </MetricaValor>
                    <MetricaSub>Livre no orçamento todo mês</MetricaSub>
                </MetricaCard>

                <MetricaCard>
                    <MetricaRotulo>{jurosOuRendimento.rotulo}</MetricaRotulo>
                    <MetricaValor $cor={jurosOuRendimento.positivo ? "#10b981" : "#f59e0b"}>
                        {jurosOuRendimento.positivo ? `+${formatCurrency(jurosOuRendimento.valor)}` : formatCurrency(jurosOuRendimento.valor)}
                    </MetricaValor>
                    <MetricaSub>
                        {jurosOuRendimento.positivo ? "Ganhos em juros compostos" : "Custo total de encargos"}
                    </MetricaSub>
                </MetricaCard>

                <MetricaCard>
                    <MetricaRotulo>Status de Segurança</MetricaRotulo>
                    <StatusWrapper $cor={cenario.seguranca?.cor}>
                        <span>{cenario.seguranca?.icone}</span>
                        <div>
                            <strong>{cenario.seguranca?.rotulo}</strong>
                            <p>{cenario.seguranca?.motivo}</p>
                        </div>
                    </StatusWrapper>
                </MetricaCard>
            </GridMetricas>

            {/* Barra de Controles da Linha do Tempo (Estilo Insights) */}
            <BarraControles>
                <TituloLinhaTempo>
                    📅 Linha do Tempo Mês a Mês ({totalMeses} {totalMeses === 1 ? "mês" : "meses"})
                </TituloLinhaTempo>

                <ControlesDireita>
                    <CampoBusca
                        type="text"
                        placeholder="Buscar mês, ano ou evento..."
                        value={filtroTexto}
                        onChange={(e) => setFiltroTexto(e.target.value)}
                    />

                    <GrupoBotoesModo>
                        <BotaoModo
                            $ativo={modoExibicao === "tabela"}
                            onClick={() => setModoExibicao("tabela")}
                            title="Visão Tabela"
                        >
                            📊 Tabela
                        </BotaoModo>
                        <BotaoModo
                            $ativo={modoExibicao === "cards"}
                            onClick={() => setModoExibicao("cards")}
                            title="Visão Cards"
                        >
                            📱 Cards
                        </BotaoModo>
                    </GrupoBotoesModo>
                </ControlesDireita>
            </BarraControles>

            {/* Visualização da Linha do Tempo: MODO TABELA */}
            {modoExibicao === "tabela" && (
                <TabelaWrapper>
                    <TabelaEstilizada>
                        <thead>
                            <tr>
                                <th>Mês</th>
                                <th>Data Prevista</th>
                                <th>Tempo Decorrido</th>
                                <th>Aporte / Parcela</th>
                                <th>Rendimento CDI</th>
                                <th>Saldo Acumulado</th>
                                <th>Progresso (%)</th>
                                <th>Marco do Plano</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhasExibidas.map((linha) => (
                                <LinhaTabela
                                    key={linha.numeroMes}
                                    $ehConquista={linha.ehMesConquista}
                                >
                                    <td style={{ fontWeight: "700" }}>#{linha.numeroMes}</td>
                                    <td>{linha.dataExibicao}</td>
                                    <td style={{ color: "#94a3b8" }}>{linha.tempoDecorrido}</td>
                                    <td style={{ color: "#10b981", fontWeight: "600" }}>
                                        {formatCurrency(linha.aporteMes)}
                                    </td>
                                    <td style={{ color: linha.rendimentoMes > 0 ? "#38bdf8" : "#64748b" }}>
                                        {linha.rendimentoMes > 0 ? `+${formatCurrency(linha.rendimentoMes)}` : "—"}
                                    </td>
                                    <td style={{ fontWeight: "700", color: "#f8fafc" }}>
                                        {formatCurrency(linha.saldoAcumulado)}
                                    </td>
                                    <td>
                                        <BarraProgressoWrapper>
                                            <BarraProgressoFundo>
                                                <BarraProgressoPreenchida
                                                    $pct={linha.percentualMeta}
                                                    $ehConquista={linha.ehMesConquista}
                                                />
                                            </BarraProgressoFundo>
                                            <BarraProgressoTexto>{linha.percentualMeta}%</BarraProgressoTexto>
                                        </BarraProgressoWrapper>
                                    </td>
                                    <td>
                                        {linha.ehMesConquista ? (
                                            <BadgeConquista>
                                                🎉 {linha.evento}
                                            </BadgeConquista>
                                        ) : (
                                            <TextoEvento>{linha.evento}</TextoEvento>
                                        )}
                                    </td>
                                </LinhaTabela>
                            ))}
                        </tbody>
                    </TabelaEstilizada>
                </TabelaWrapper>
            )}

            {/* Visualização da Linha do Tempo: MODO CARDS */}
            {modoExibicao === "cards" && (
                <GridCardsLinhaTempo>
                    {linhasExibidas.map((linha) => (
                        <CardMesLinhaTempo
                            key={linha.numeroMes}
                            $ehConquista={linha.ehMesConquista}
                        >
                            <HeaderCardMes>
                                <MesNumero>Mês #{linha.numeroMes}</MesNumero>
                                <MesData>{linha.dataExibicao}</MesData>
                            </HeaderCardMes>

                            <TempoDecorridoBadge>
                                ⏳ {linha.tempoDecorrido}
                            </TempoDecorridoBadge>

                            <LinhaCardMesItem>
                                <span>Aporte:</span>
                                <strong>{formatCurrency(linha.aporteMes)}</strong>
                            </LinhaCardMesItem>

                            {linha.rendimentoMes > 0 && (
                                <LinhaCardMesItem>
                                    <span>Rendimento CDI:</span>
                                    <strong style={{ color: "#38bdf8" }}>+{formatCurrency(linha.rendimentoMes)}</strong>
                                </LinhaCardMesItem>
                            )}

                            <LinhaCardMesItem>
                                <span>Saldo Acumulado:</span>
                                <strong style={{ color: "#10b981", fontSize: "1rem" }}>
                                    {formatCurrency(linha.saldoAcumulado)}
                                </strong>
                            </LinhaCardMesItem>

                            <BarraProgressoWrapper style={{ marginTop: "6px" }}>
                                <BarraProgressoFundo>
                                    <BarraProgressoPreenchida
                                        $pct={linha.percentualMeta}
                                        $ehConquista={linha.ehMesConquista}
                                    />
                                </BarraProgressoFundo>
                                <BarraProgressoTexto>{linha.percentualMeta}%</BarraProgressoTexto>
                            </BarraProgressoWrapper>

                            <EventoCardMes $ehConquista={linha.ehMesConquista}>
                                {linha.evento}
                            </EventoCardMes>
                        </CardMesLinhaTempo>
                    ))}
                </GridCardsLinhaTempo>
            )}

            {/* Botão de Expandir / Recolher se tiver mais de 12 meses */}
            {linhasFiltradas.length > 12 && !filtroTexto && (
                <FooterExpansao>
                    <BotaoExpandir
                        type="button"
                        onClick={() => setExpandido(!expandido)}
                    >
                        {expandido
                            ? `▲ Mostrar apenas os primeiros 12 meses`
                            : `▼ Exibir cronograma completo com todos os ${linhasFiltradas.length} meses`}
                    </BotaoExpandir>
                </FooterExpansao>
            )}
        </CardPrincipalContainer>
    );
}

const CardPrincipalContainer = styled.section`
    background: linear-gradient(145deg, #18132b, #120e22);
    border: 2px solid #820ad1;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(130, 10, 209, 0.25);
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    overflow: hidden;

    &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #820ad1, #00b3ff, #10b981);
    }
`;

const HeaderPlano = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
`;

const InfoPlano = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 800px;
`;

const BadgePlanoPrincipal = styled.span`
    align-self: flex-start;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #0f172a;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 4px 12px;
    border-radius: 999px;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 10px rgba(245, 158, 11, 0.4);
`;

const TituloPlano = styled.h3`
    font-size: 1.4rem;
    font-weight: 800;
    color: #fff;
    margin: 4px 0 0 0;
`;

const SubtituloPlano = styled.p`
    font-size: 0.88rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.4;
`;

const BotaoTrocarCenario = styled.button`
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #e2e8f0;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        transform: translateY(-1px);
    }
`;

const GridMetricas = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
`;

const MetricaCard = styled.div`
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const MetricaRotulo = styled.span`
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.5px;
`;

const MetricaValor = styled.span`
    font-size: 1.3rem;
    font-weight: 800;
    color: ${({ $cor }) => $cor || "#f8fafc"};
    line-height: 1.2;
`;

const MetricaSub = styled.span`
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 2px;
`;

const StatusWrapper = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 4px;

    span {
        font-size: 1.2rem;
    }

    strong {
        font-size: 0.85rem;
        color: ${({ $cor }) => $cor || "#10b981"};
        display: block;
    }

    p {
        margin: 2px 0 0 0;
        font-size: 0.72rem;
        color: #94a3b8;
        line-height: 1.3;
    }
`;

const BarraControles = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const TituloLinhaTempo = styled.h4`
    margin: 0;
    font-size: 1.05rem;
    color: #e2e8f0;
    font-weight: 700;
`;

const ControlesDireita = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
`;

const CampoBusca = styled.input`
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #fff;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.82rem;
    min-width: 180px;

    &:focus {
        outline: none;
        border-color: #00b3ff;
    }
`;

const GrupoBotoesModo = styled.div`
    display: flex;
    background: rgba(15, 23, 42, 0.8);
    border-radius: 8px;
    padding: 2px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const BotaoModo = styled.button`
    background: ${({ $ativo }) => ($ativo ? "rgba(0, 179, 255, 0.25)" : "transparent")};
    color: ${({ $ativo }) => ($ativo ? "#00b3ff" : "#94a3b8")};
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        color: #fff;
    }
`;

const TabelaWrapper = styled.div`
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(15, 23, 42, 0.4);
`;

const TabelaEstilizada = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    text-align: left;

    thead {
        background: rgba(30, 41, 59, 0.7);
        th {
            padding: 12px 14px;
            color: #94a3b8;
            font-weight: 700;
            white-space: nowrap;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
    }

    tbody td {
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        white-space: nowrap;
    }
`;

const LinhaTabela = styled.tr`
    background: ${({ $ehConquista }) =>
        $ehConquista ? "rgba(16, 185, 129, 0.12)" : "transparent"};
    transition: background 0.15s;

    &:hover {
        background: rgba(255, 255, 255, 0.04);
    }
`;

const BarraProgressoWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 120px;
`;

const BarraProgressoFundo = styled.div`
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    overflow: hidden;
`;

const BarraProgressoPreenchida = styled.div`
    height: 100%;
    width: ${({ $pct }) => Math.min(100, Math.max(0, $pct))}%;
    background: ${({ $ehConquista }) =>
        $ehConquista
            ? "linear-gradient(90deg, #10b981, #34d399)"
            : "linear-gradient(90deg, #820ad1, #00b3ff)"};
    border-radius: 999px;
`;

const BarraProgressoTexto = styled.span`
    font-size: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
    min-width: 32px;
`;

const BadgeConquista = styled.span`
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(52, 211, 153, 0.2));
    border: 1px solid #10b981;
    color: #34d399;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.78rem;
`;

const TextoEvento = styled.span`
    color: #cbd5e1;
    font-size: 0.8rem;
`;

const GridCardsLinhaTempo = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
`;

const CardMesLinhaTempo = styled.div`
    background: ${({ $ehConquista }) =>
        $ehConquista
            ? "linear-gradient(145deg, rgba(16, 185, 129, 0.18), rgba(15, 23, 42, 0.8))"
            : "rgba(15, 23, 42, 0.6)"};
    border: 1px solid
        ${({ $ehConquista }) => ($ehConquista ? "#10b981" : "rgba(255, 255, 255, 0.08)")};
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const HeaderCardMes = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const MesNumero = styled.span`
    font-weight: 800;
    color: #fff;
    font-size: 0.95rem;
`;

const MesData = styled.span`
    font-size: 0.78rem;
    color: #94a3b8;
`;

const TempoDecorridoBadge = styled.div`
    font-size: 0.75rem;
    color: #00b3ff;
    font-weight: 600;
`;

const LinhaCardMesItem = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #cbd5e1;
`;

const EventoCardMes = styled.div`
    font-size: 0.75rem;
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
    color: ${({ $ehConquista }) => ($ehConquista ? "#34d399" : "#94a3b8")};
    font-weight: ${({ $ehConquista }) => ($ehConquista ? "700" : "500")};
`;

const FooterExpansao = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 8px;
`;

const BotaoExpandir = styled.button`
    background: rgba(0, 179, 255, 0.1);
    border: 1px solid rgba(0, 179, 255, 0.3);
    color: #38bdf8;
    padding: 8px 20px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(0, 179, 255, 0.2);
        color: #fff;
    }
`;
