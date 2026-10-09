import { useState, useMemo } from "react";
import styled from "styled-components";
import { useSaldo } from "../../context/SaldoContext";
import { useMes } from "../../context/MesContext";
import { formatCurrency, parseCurrency } from "../../utils/currencyUtils";
import ModalReceita from "../../components/ModalReceita";
import ModalEditarReceita from "../../components/ModalEditarReceita";

export default function Saldos() {
    const { saldo, adicionarReceita, atualizarReceita, removerReceita, getSalarioDoMes } =
        useSaldo();
    const { mesReferencia, nomeMesAno, voltarMes, avancarMes } = useMes() || {};

    const [modalNovaReceitaAberto, setModalNovaReceitaAberto] = useState(false);
    const [receitaParaEditar, setReceitaParaEditar] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState("todos"); // "todos" | "Salario" | "Outro"

    const dataRef = mesReferencia || new Date();
    const ano = dataRef.getFullYear();
    const mes = dataRef.getMonth();

    // 1. Filtrar receitas do mês selecionado
    const receitasDoMes = useMemo(() => {
        return (saldo || []).filter((item) => {
            if (!item.data) return false;
            const dataItem = new Date(
                item.data.includes("T") ? item.data : `${item.data}T12:00:00`
            );
            return dataItem.getMonth() === mes && dataItem.getFullYear() === ano;
        });
    }, [saldo, mes, ano]);

    // 2. Cálculos consolidados do mês
    const { totalReceitas, totalSalario, totalExtras, temSalarioLancado } = useMemo(() => {
        let total = 0;
        let sal = 0;
        let ext = 0;
        let achouSalario = false;

        receitasDoMes.forEach((item) => {
            const val = parseCurrency(item.valor);
            total += val;
            const tipoLower = (item.tipo || "").toLowerCase();
            if (tipoLower.includes("salari") || tipoLower.includes("salário")) {
                sal += val;
                achouSalario = true;
            } else {
                ext += val;
            }
        });

        // Salário do mês (ajustado ou herdado do mês anterior)
        const salarioConfig = parseCurrency(getSalarioDoMes ? getSalarioDoMes(ano, mes) : 0);

        // Se não houver salário lançado no mês, usa a base herdada do mês anterior
        if (!achouSalario && salarioConfig > 0) {
            sal = salarioConfig;
            total += salarioConfig;
        }

        return {
            totalReceitas: total,
            totalSalario: sal,
            totalExtras: ext,
            temSalarioLancado: achouSalario,
            salarioBaseHerdado: !achouSalario ? salarioConfig : 0,
        };
    }, [receitasDoMes, getSalarioDoMes, ano, mes]);

    // 3. Filtrar itens exibidos
    const receitasExibidas = useMemo(() => {
        if (filtroTipo === "todos") return receitasDoMes;
        return receitasDoMes.filter((item) => {
            const tipoLower = (item.tipo || "").toLowerCase();
            if (filtroTipo === "Salario") {
                return tipoLower.includes("salari") || tipoLower.includes("salário");
            }
            return !tipoLower.includes("salari") && !tipoLower.includes("salário");
        });
    }, [receitasDoMes, filtroTipo]);

    return (
        <ContainerSaldos>
            {/* Header com Navegação do Mês */}
            <HeaderSecao>
                <div>
                    <TituloPrincipal>Saldos & Receitas</TituloPrincipal>
                    <SubtituloPrincipal>
                        Gestão e histórico de entradas financeiras, salários e ganhos extras
                    </SubtituloPrincipal>
                </div>

                <HeaderNavegacaoMes>
                    <BotaoNavegacao onClick={voltarMes} title="Mês anterior">
                        ◀
                    </BotaoNavegacao>
                    <NomeMesLabel>{nomeMesAno}</NomeMesLabel>
                    <BotaoNavegacao onClick={avancarMes} title="Próximo mês">
                        ▶
                    </BotaoNavegacao>
                </HeaderNavegacaoMes>
            </HeaderSecao>

            {/* Cards de Métricas */}
            <GridCardsMetricas>
                <CardMetrica $bordaCor="#10b981">
                    <CardTop>
                        <CardRotulo>Total de Entradas do Mês</CardRotulo>
                        <BadgeVerde>Receitas</BadgeVerde>
                    </CardTop>
                    <CardValor $cor="#10b981">{formatCurrency(totalReceitas)}</CardValor>
                    <CardRodape>
                        <CardDetalhe>
                            {receitasDoMes.length} {receitasDoMes.length === 1 ? "registro" : "registros"} neste mês
                        </CardDetalhe>
                        <BotaoAdicionarReceita
                            type="button"
                            onClick={() => setModalNovaReceitaAberto(true)}
                        >
                            ➕ Nova Receita
                        </BotaoAdicionarReceita>
                    </CardRodape>
                </CardMetrica>

                <CardMetrica $bordaCor="#00b3ff">
                    <CardTop>
                        <CardRotulo>Salário Base</CardRotulo>
                        {temSalarioLancado ? (
                            <BadgeAzul>Confirmado</BadgeAzul>
                        ) : (
                            <BadgeProjetado>Projetado do anterior</BadgeProjetado>
                        )}
                    </CardTop>
                    <CardValor>{formatCurrency(totalSalario)}</CardValor>
                    <CardRodape>
                        <CardDetalhe>
                            {temSalarioLancado
                                ? "Lançamento registrado para este mês"
                                : "Base do mês anterior (ajuste ao receber)"}
                        </CardDetalhe>
                        {!temSalarioLancado && totalSalario > 0 && (
                            <BotaoRegistrarSalario
                                type="button"
                                onClick={() => setModalNovaReceitaAberto(true)}
                                title="Confirmar ou ajustar o valor recebido deste mês"
                            >
                                ✍️ Ajustar
                            </BotaoRegistrarSalario>
                        )}
                    </CardRodape>
                </CardMetrica>

                <CardMetrica $bordaCor="#820ad1">
                    <CardTop>
                        <CardRotulo>Ganhos Extras / Outros</CardRotulo>
                        <BadgeRoxo>Variável</BadgeRoxo>
                    </CardTop>
                    <CardValor $cor="#c084fc">{formatCurrency(totalExtras)}</CardValor>
                    <CardRodape>
                        <CardDetalhe>
                            Freelas, reembolsos e rendimentos adicionais
                        </CardDetalhe>
                    </CardRodape>
                </CardMetrica>
            </GridCardsMetricas>

            {/* Controles e Filtros da Lista */}
            <ControlesLista>
                <FiltrosTabs>
                    <TabFiltro
                        $ativo={filtroTipo === "todos"}
                        onClick={() => setFiltroTipo("todos")}
                    >
                        Todas as Entradas ({receitasDoMes.length})
                    </TabFiltro>
                    <TabFiltro
                        $ativo={filtroTipo === "Salario"}
                        onClick={() => setFiltroTipo("Salario")}
                    >
                        💼 Apenas Salários
                    </TabFiltro>
                    <TabFiltro
                        $ativo={filtroTipo === "Outro"}
                        onClick={() => setFiltroTipo("Outro")}
                    >
                        📈 Ganhos Extras
                    </TabFiltro>
                </FiltrosTabs>
            </ControlesLista>

            {/* Lista / Tabela de Receitas Editáveis */}
            <TabelaContainer>
                {receitasExibidas.length > 0 ? (
                    <TabelaReceitas>
                        <thead>
                            <tr>
                                <Th>Data</Th>
                                <Th>Descrição / Origem</Th>
                                <Th>Tipo</Th>
                                <Th>Valor</Th>
                                <Th style={{ textAlign: "right" }}>Ações</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {receitasExibidas.map((item) => {
                                const dataBR = item.data?.includes("-")
                                    ? item.data.split("-").reverse().join("/")
                                    : item.data;
                                return (
                                    <TrItem key={item.id}>
                                        <TdData>{dataBR}</TdData>
                                        <TdDescricao>
                                            {item.descricao || item.nome || "Entrada de Saldo"}
                                        </TdDescricao>
                                        <Td>
                                            <BadgeTipo $tipo={item.tipo}>
                                                {formatarTipoLabel(item.tipo)}
                                            </BadgeTipo>
                                        </Td>
                                        <TdValor>
                                            +{formatCurrency(item.valor)}
                                        </TdValor>
                                        <TdAcoes>
                                            <BotaoEditar
                                                type="button"
                                                onClick={() => setReceitaParaEditar(item)}
                                            >
                                                ✏️ Editar
                                            </BotaoEditar>
                                        </TdAcoes>
                                    </TrItem>
                                );
                            })}
                        </tbody>
                    </TabelaReceitas>
                ) : (
                    <EmptyState>
                        <EmptyIcon>💰</EmptyIcon>
                        <EmptyTitulo>Nenhuma receita registrada em {nomeMesAno}</EmptyTitulo>
                        <EmptySubtitulo>
                            Adicione seu salário ou ganhos adicionais para calcular seus saldos corretamente.
                        </EmptySubtitulo>
                        <BotaoAdicionarEmpty onClick={() => setModalNovaReceitaAberto(true)}>
                            ➕ Adicionar Primeira Receita
                        </BotaoAdicionarEmpty>
                    </EmptyState>
                )}
            </TabelaContainer>

            {/* Modal de Criação de Receita */}
            {modalNovaReceitaAberto && (
                <ModalReceita
                    onClose={() => setModalNovaReceitaAberto(false)}
                    onSubmit={async (nova) => {
                        await adicionarReceita(nova);
                        setModalNovaReceitaAberto(false);
                    }}
                />
            )}

            {/* Modal de Edição de Receita */}
            {receitaParaEditar && (
                <ModalEditarReceita
                    receita={receitaParaEditar}
                    onClose={() => setReceitaParaEditar(null)}
                    onUpdate={atualizarReceita}
                    onDelete={removerReceita}
                />
            )}
        </ContainerSaldos>
    );
}

function formatarTipoLabel(tipo = "") {
    const t = tipo.toLowerCase();
    if (t.includes("salari") || t.includes("salário")) return "💼 Salário";
    if (t.includes("neguinha")) return "💕 PgNeguinha";
    if (t.includes("invest")) return "💰 Investimento";
    return "📈 Ganho / Extra";
}

// ==================== STYLED COMPONENTS ====================

const ContainerSaldos = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px 20px;
    max-width: 1440px;
    margin: 0 auto;
    width: 100%;
    color: #e0e1dd;
    box-sizing: border-box;

    @media (max-width: 768px) {
        padding: 16px 8px;
        gap: 18px;
    }
`;

const HeaderSecao = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const TituloPrincipal = styled.h1`
    font-size: 1.85rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #10b981 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    @media (max-width: 768px) {
        font-size: 1.5rem;
    }
`;

const SubtituloPrincipal = styled.p`
    font-size: 0.9rem;
    color: #94a3b8;
    margin: 4px 0 0 0;
`;

const HeaderNavegacaoMes = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: #0d121f;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 6px 14px;
`;

const BotaoNavegacao = styled.button`
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1rem;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.15s ease;

    &:hover {
        background: #1e293b;
        color: #f8fafc;
    }
`;

const NomeMesLabel = styled.span`
    font-size: 1rem;
    font-weight: 700;
    color: #f1f5f9;
    text-transform: capitalize;
    min-width: 120px;
    text-align: center;
`;

const GridCardsMetricas = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 18px;
`;

const CardMetrica = styled.div`
    background: #0d121f;
    border: 1px solid #1e293b;
    border-top: 3px solid ${({ $bordaCor }) => $bordaCor || "#10b981"};
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 14px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    transition: transform 0.2s ease;

    &:hover {
        transform: translateY(-2px);
    }
`;

const CardTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const CardRotulo = styled.span`
    font-size: 0.85rem;
    font-weight: 600;
    color: #94a3b8;
`;

const CardValor = styled.div`
    font-size: 1.75rem;
    font-weight: 800;
    color: ${({ $cor }) => $cor || "#f8fafc"};
    line-height: 1.15;
    font-family: monospace;
`;

const CardRodape = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
`;

const CardDetalhe = styled.div`
    font-size: 0.8rem;
    color: #94a3b8;
`;

const BadgeVerde = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    color: #34d399;
    background: rgba(52, 211, 153, 0.15);
    border: 1px solid rgba(52, 211, 153, 0.35);
    border-radius: 6px;
    padding: 3px 8px;
`;

const BadgeAzul = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 6px;
    padding: 3px 8px;
`;

const BadgeProjetado = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.35);
    border-radius: 6px;
    padding: 3px 8px;
`;

const BotaoRegistrarSalario = styled.button`
    background: rgba(0, 179, 255, 0.15);
    border: 1px solid rgba(0, 179, 255, 0.4);
    color: #7dd3fc;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #00b3ff;
        color: #ffffff;
    }
`;

const BadgeRoxo = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    color: #c084fc;
    background: rgba(192, 132, 252, 0.15);
    border: 1px solid rgba(192, 132, 252, 0.35);
    border-radius: 6px;
    padding: 3px 8px;
`;

const BotaoAdicionarReceita = styled.button`
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #6ee7b7;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #10b981;
        color: #ffffff;
    }
`;

const ControlesLista = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
`;

const FiltrosTabs = styled.div`
    display: flex;
    gap: 6px;
    background: #0d121f;
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 4px;
    overflow-x: auto;
`;

const TabFiltro = styled.button`
    background: ${({ $ativo }) => ($ativo ? "#1e293b" : "transparent")};
    color: ${({ $ativo }) => ($ativo ? "#f8fafc" : "#94a3b8")};
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;

    &:hover {
        color: #f1f5f9;
    }
`;

const TabelaContainer = styled.div`
    width: 100%;
    overflow-x: auto;
    background: #0d121f;
    border: 1px solid #1e293b;
    border-radius: 14px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const TabelaReceitas = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
    text-align: left;
    white-space: nowrap;

    th, td {
        padding: 14px 18px;
    }
`;

const Th = styled.th`
    background: #131b2e;
    color: #94a3b8;
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #1e293b;
`;

const TrItem = styled.tr`
    border-bottom: 1px solid #141b2d;
    transition: background 0.15s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.02);
    }
`;

const Td = styled.td`
    color: #cbd5e1;
`;

const TdData = styled.td`
    font-family: monospace;
    color: #f1f5f9;
    font-weight: 600;
`;

const TdDescricao = styled.td`
    font-weight: 600;
    color: #f8fafc;
`;

const TdValor = styled.td`
    font-family: monospace;
    font-weight: 700;
    font-size: 0.95rem;
    color: #34d399;
`;

const TdAcoes = styled.td`
    text-align: right;
`;

const BadgeTipo = styled.span`
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #cbd5e1;
`;

const BotaoEditar = styled.button`
    background: rgba(0, 179, 255, 0.12);
    border: 1px solid rgba(0, 179, 255, 0.35);
    color: #7dd3fc;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #00b3ff;
        color: #ffffff;
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
    text-align: center;
    gap: 12px;
`;

const EmptyIcon = styled.div`
    font-size: 3rem;
`;

const EmptyTitulo = styled.h3`
    font-size: 1.15rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
`;

const EmptySubtitulo = styled.p`
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0;
    max-width: 400px;
`;

const BotaoAdicionarEmpty = styled.button`
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    color: white;
    font-weight: 700;
    font-size: 0.88rem;
    padding: 10px 20px;
    border-radius: 10px;
    cursor: pointer;
    margin-top: 8px;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
    transition: all 0.15s ease;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45);
    }
`;
