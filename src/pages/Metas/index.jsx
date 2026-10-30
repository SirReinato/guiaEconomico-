import { useState } from "react";
import styled from "styled-components";
import { useAuth } from "../../context/AuthContext";
import { useMetas } from "../../hooks/useMetas";
import { usePlanoMeta } from "../../hooks/usePlanoMeta";
import AcessoRestritoInsights from "../../components/AcessoRestritoInsights";
import CardMeta from "../../components/CardMeta";
import CenariosMeta from "../../components/CenariosMeta";
import PlanoIA from "../../components/PlanoIA";
import GraficoEvolucaoMeta from "../../components/GraficoEvolucaoMeta";
import ModalNovaMeta from "../../components/ModalNovaMeta";
import { formatCurrency } from "../../utils/currencyUtils";

export default function Metas() {
    const { temAcessoInsights } = useAuth() || {};

    const [modalAberto, setModalAberto] = useState(false);
    const [metaParaEditar, setMetaParaEditar] = useState(null);

    const {
        metas,
        metaAtiva,
        setMetaAtivaId,
        carregando,
        gerandoPlano,
        criarMeta,
        editarMeta,
        excluirMeta,
        gerarPlanoIA,
    } = useMetas();

    const { contextoFinanceiro, cenarios } = usePlanoMeta(metaAtiva);

    // Se o usuário não tiver permissão de acesso a Insights/Metas restritas
    if (!temAcessoInsights) {
        return <AcessoRestritoInsights />;
    }

    const handleAbrirCriacao = () => {
        setMetaParaEditar(null);
        setModalAberto(true);
    };

    const handleAbrirEdicao = (meta) => {
        setMetaParaEditar(meta);
        setModalAberto(true);
    };

    const handleSalvarMeta = async (dados) => {
        if (metaParaEditar && metaParaEditar.id) {
            await editarMeta(metaParaEditar.id, dados);
        } else {
            await criarMeta(dados);
        }
        setModalAberto(false);
        setMetaParaEditar(null);
    };

    const handleExcluirMeta = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta meta financeira?")) {
            await excluirMeta(id);
        }
    };

    const handleGerarPlanoIA = async () => {
        if (!metaAtiva || !cenarios) return;
        await gerarPlanoIA(metaAtiva, contextoFinanceiro, cenarios);
    };

    return (
        <PaginaContainer>
            {/* Topo com indicador financeiro do perfil */}
            <HeaderPagina>
                <TitulosWrapper>
                    <TituloPrincipal>🎯 Metas Futuras & Planejador IA</TituloPrincipal>
                    <SubtituloPrincipal>
                        Simule a compra de bens de médio e longo prazo com IA, descobrindo o melhor caminho (à vista, híbrido, financiamento ou consórcio) sem sufocar seu orçamento mensal.
                    </SubtituloPrincipal>
                </TitulosWrapper>

                <ResumoFinanceiroBadge>
                    <ResumoItem>
                        <ResumoLabel>Renda Líquida</ResumoLabel>
                        <ResumoValor>{formatCurrency(contextoFinanceiro.salario)}</ResumoValor>
                    </ResumoItem>
                    <ResumoItem>
                        <ResumoLabel>Sobra Livre Est.</ResumoLabel>
                        <ResumoValor $cor="#10b981">
                            {formatCurrency(contextoFinanceiro.sobraReal)}
                        </ResumoValor>
                    </ResumoItem>
                    <ResumoItem>
                        <ResumoLabel>Reserva Atual</ResumoLabel>
                        <ResumoValor $cor="#38bdf8">
                            {formatCurrency(contextoFinanceiro.reservaAtual)}
                        </ResumoValor>
                    </ResumoItem>
                </ResumoFinanceiroBadge>
            </HeaderPagina>

            {carregando ? (
                <CarregandoContainer>
                    <SpinnerGrande />
                    <p>Carregando suas metas financeiras...</p>
                </CarregandoContainer>
            ) : (
                <>
                    {/* Card da Meta Ativa (ou Card Vazio para criar) */}
                    <CardMeta
                        meta={metaAtiva}
                        metas={metas}
                        onSelectMeta={setMetaAtivaId}
                        onEditMeta={handleAbrirEdicao}
                        onDeleteMeta={handleExcluirMeta}
                        onOpenNovaMeta={handleAbrirCriacao}
                    />

                    {metaAtiva && (
                        <>
                            {/* Plano de Consultoria IA */}
                            <PlanoIA
                                plano={metaAtiva.planoIA}
                                gerandoPlano={gerandoPlano}
                                onGerarPlano={handleGerarPlanoIA}
                            />

                            {/* Cenários Pré-Calculados (Tabs: À Vista, Financiamento, Híbrido, Consórcio) */}
                            <CenariosMeta
                                cenarios={cenarios}
                                contextoFinanceiro={contextoFinanceiro}
                            />

                            {/* Gráfico de Evolução Patrimonial vs Meta */}
                            <GraficoEvolucaoMeta
                                cenarios={cenarios}
                            />
                        </>
                    )}
                </>
            )}

            {/* Modal de Criação / Edição de Meta */}
            {modalAberto && (
                <ModalNovaMeta
                    onClose={() => setModalAberto(false)}
                    onSave={handleSalvarMeta}
                    metaEditando={metaParaEditar}
                />
            )}
        </PaginaContainer>
    );
}

const PaginaContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding-bottom: 40px;
`;

const HeaderPagina = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 16px;
`;

const TitulosWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 280px;
`;

const TituloPrincipal = styled.h1`
    font-size: 1.6rem;
    font-weight: 800;
    color: #fff;
    margin: 0;
    background: linear-gradient(135deg, #fff, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;

const SubtituloPrincipal = styled.p`
    font-size: 0.88rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.4;
    max-width: 680px;
`;

const ResumoFinanceiroBadge = styled.div`
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 8px 14px;
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
`;

const ResumoItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const ResumoLabel = styled.span`
    font-size: 0.68rem;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.5px;
`;

const ResumoValor = styled.span`
    font-size: 0.95rem;
    font-weight: 700;
    color: ${({ $cor }) => $cor || "#fff"};
`;

const CarregandoContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 14px;
    color: #94a3b8;
`;

const SpinnerGrande = styled.div`
    width: 38px;
    height: 38px;
    border: 3px solid rgba(130, 10, 209, 0.2);
    border-top: 3px solid #00b3ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
