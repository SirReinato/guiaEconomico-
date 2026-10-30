import styled, { keyframes } from "styled-components";

export default function PlanoIA({
    plano,
    gerandoPlano,
    onGerarPlano,
}) {
    if (!plano) {
        return (
            <BannerSemPlano>
                <IconeIA>✨</IconeIA>
                <InfoSemPlano>
                    <TituloSemPlano>Consultoria Inteligente com IA</TituloSemPlano>
                    <TextoSemPlano>
                        Clique no botão abaixo para a IA analisar seus números, calcular a estratégia ideal sem te apertar financeiramente e gerar um plano passo a passo com alertas de custos ocultos.
                    </TextoSemPlano>
                </InfoSemPlano>
                <BotaoGerarIA
                    type="button"
                    onClick={onGerarPlano}
                    disabled={gerandoPlano}
                >
                    {gerandoPlano ? <Spinner /> : "✨"}
                    {gerandoPlano ? "Analisando..." : "Gerar Plano com IA"}
                </BotaoGerarIA>
            </BannerSemPlano>
        );
    }

    const {
        resumoExecutivo,
        cenarioRecomendadoNome,
        justificativaRecomendacao,
        passoAPasso = [],
        dicasEconomia = [],
        alertasRiscos = [],
        geradoPorIA,
        geradoEm,
    } = plano;

    const dataFormatada = geradoEm
        ? new Date(geradoEm).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : null;

    return (
        <PlanoContainer>
            <HeaderPlano>
                <TituloPlanoWrapper>
                    <TituloPlano>🧠 Plano Estratégico da IA</TituloPlano>
                    <BadgeTipoPlano $isIA={geradoPorIA}>
                        {geradoPorIA ? "✨ IA Ativa (Gemini)" : "💡 Heurística Especialista"}
                    </BadgeTipoPlano>
                    {dataFormatada && <DataPlano>Atualizado em {dataFormatada}</DataPlano>}
                </TituloPlanoWrapper>

                <BotaoRegenerar
                    type="button"
                    onClick={onGerarPlano}
                    disabled={gerandoPlano}
                    title="Atualizar análise com IA"
                >
                    {gerandoPlano ? <Spinner /> : "🔄"}
                    {gerandoPlano ? "Recalculando..." : "Regenerar Plano"}
                </BotaoRegenerar>
            </HeaderPlano>

            {/* Resumo Executivo & Recomendação */}
            <CardResumo>
                <TituloCardResumo>
                    🎯 Recomendação: <strong>{cenarioRecomendadoNome || "Estratégia Equilibrada"}</strong>
                </TituloCardResumo>
                <TextoResumo>{resumoExecutivo}</TextoResumo>
                {justificativaRecomendacao && (
                    <JustificativaBox>
                        💡 <strong>Por que essa opção?</strong> {justificativaRecomendacao}
                    </JustificativaBox>
                )}
            </CardResumo>

            {/* Passo a Passo Cronológico */}
            {passoAPasso.length > 0 && (
                <SecaoCronograma>
                    <TituloSubsecao>📋 Passo a Passo para Conquista</TituloSubsecao>
                    <TimelineContainer>
                        {passoAPasso.map((passo, idx) => (
                            <TimelineItem key={idx}>
                                <TimelineNumero>{idx + 1}</TimelineNumero>
                                <TimelineTexto>{passo}</TimelineTexto>
                            </TimelineItem>
                        ))}
                    </TimelineContainer>
                </SecaoCronograma>
            )}

            {/* Alertas de Custos Ocultos e Cuidados */}
            {alertasRiscos.length > 0 && (
                <SecaoAlertas>
                    <TituloSubsecao $cor="#f59e0b">⚠️ Custos Ocultos & Armadilhas a Evitar</TituloSubsecao>
                    <ListaAlertas>
                        {alertasRiscos.map((alerta, idx) => (
                            <ItemAlerta key={idx}>
                                <span>⚠️</span>
                                <p>{alerta}</p>
                            </ItemAlerta>
                        ))}
                    </ListaAlertas>
                </SecaoAlertas>
            )}

            {/* Dicas de Economia e Aceleração */}
            {dicasEconomia.length > 0 && (
                <SecaoDicas>
                    <TituloSubsecao $cor="#10b981">💡 Dicas para Acelerar a Meta</TituloSubsecao>
                    <ListaDicas>
                        {dicasEconomia.map((dica, idx) => (
                            <ItemDica key={idx}>
                                <span>✓</span>
                                <p>{dica}</p>
                            </ItemDica>
                        ))}
                    </ListaDicas>
                </SecaoDicas>
            )}
        </PlanoContainer>
    );
}

const spin = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #fff;
    border-radius: 50%;
    animation: ${spin} 0.7s linear infinite;
`;

const BannerSemPlano = styled.div`
    background: linear-gradient(135deg, rgba(130, 10, 209, 0.2), rgba(0, 179, 255, 0.15));
    border: 1px dashed rgba(0, 179, 255, 0.4);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
`;

const IconeIA = styled.div`
    font-size: 2.2rem;
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: rgba(0, 179, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
`;

const InfoSemPlano = styled.div`
    flex: 1;
    min-width: 240px;
`;

const TituloSemPlano = styled.h4`
    font-size: 1.15rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 4px 0;
`;

const TextoSemPlano = styled.p`
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.4;
`;

const BotaoGerarIA = styled.button`
    background: linear-gradient(135deg, #820ad1, #00b3ff);
    border: none;
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(0, 179, 255, 0.3);
    transition: transform 0.2s, opacity 0.2s;
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    &:hover:not(:disabled) {
        transform: translateY(-2px);
    }
`;

const PlanoContainer = styled.div`
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(130, 10, 209, 0.35);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
`;

const HeaderPlano = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 12px;
`;

const TituloPlanoWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
`;

const TituloPlano = styled.h3`
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
`;

const BadgeTipoPlano = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    background: ${({ $isIA }) => ($isIA ? "rgba(0, 179, 255, 0.2)" : "rgba(130, 10, 209, 0.2)")};
    color: ${({ $isIA }) => ($isIA ? "#38bdf8" : "#c084fc")};
    border: 1px solid ${({ $isIA }) => ($isIA ? "rgba(0, 179, 255, 0.4)" : "rgba(130, 10, 209, 0.4)")};
`;

const DataPlano = styled.span`
    font-size: 0.75rem;
    color: #64748b;
`;

const BotaoRegenerar = styled.button`
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #cbd5e1;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
    }
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const CardResumo = styled.div`
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
    border: 1px solid rgba(0, 179, 255, 0.25);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const TituloCardResumo = styled.h4`
    font-size: 1.1rem;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0;
    strong {
        color: #38bdf8;
    }
`;

const TextoResumo = styled.p`
    font-size: 0.9rem;
    color: #cbd5e1;
    line-height: 1.5;
    margin: 0;
`;

const JustificativaBox = styled.div`
    background: rgba(0, 179, 255, 0.08);
    border-left: 3px solid #00b3ff;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    color: #94a3b8;
    line-height: 1.4;
    strong {
        color: #e2e8f0;
    }
`;

const SecaoCronograma = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const TituloSubsecao = styled.h5`
    font-size: 0.95rem;
    font-weight: 700;
    color: ${({ $cor }) => $cor || "#fff"};
    margin: 0;
`;

const TimelineContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const TimelineItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    padding: 8px 12px;
`;

const TimelineNumero = styled.div`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #820ad1, #00b3ff);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const TimelineTexto = styled.p`
    font-size: 0.85rem;
    color: #e2e8f0;
    margin: 0;
    line-height: 1.4;
`;

const SecaoAlertas = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const ListaAlertas = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const ItemAlerta = styled.div`
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    p {
        font-size: 0.83rem;
        color: #fde68a;
        margin: 0;
        line-height: 1.4;
    }
`;

const SecaoDicas = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const ListaDicas = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const ItemDica = styled.div`
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    span {
        color: #10b981;
        font-weight: bold;
    }
    p {
        font-size: 0.83rem;
        color: #a7f3d0;
        margin: 0;
        line-height: 1.4;
    }
`;
