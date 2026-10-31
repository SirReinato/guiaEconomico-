import { useState, useMemo } from "react";
import styled from "styled-components";
import { Titulos } from "../Card";
import { useGastos } from "../../context/GastosContext";
import { useMes } from "../../context/MesContext";
import { formatCurrency, parseCurrency } from "../../utils/currencyUtils";
import { useAuth } from "../../context/AuthContext";

export default function ModalAssinaturasCartao({
    cartaoFiltro = "",
    onClose,
    onAbrirNovaAssinatura,
}) {
    const {
        assinaturas,
        cartoesAtivos,
        cancelarAssinatura,
        reativarAssinatura,
        removerAssinatura,
        chaveMesAtual,
        isAssinaturaValidaNoCiclo,
    } = useGastos() || {};
    const { nomeMesAno } = useMes() || {};
    const { isIngrid } = useAuth() || {};

    const [cartaoSelecionado, setCartaoSelecionado] = useState(cartaoFiltro || "todos");
    const [excluindoId, setExcluindoId] = useState(null);
    const [loadingId, setLoadingId] = useState(null);

    const cartoesDisponiveis = useMemo(() => {
        return (cartoesAtivos || []).filter(
            (c) => !c.nome?.includes("Cartões do Renato") && !c.id?.includes("Cartões do Renato") &&
                   !c.nome?.includes("Cartões da Ingrid") && !c.id?.includes("Cartões da Ingrid")
        );
    }, [cartoesAtivos]);

    const assinaturasFiltradas = useMemo(() => {
        if (!assinaturas) return [];
        if (cartaoSelecionado === "todos") return assinaturas;
        return assinaturas.filter((a) => {
            const cNome = (a.cartao || "").toLowerCase();
            const alvo = cartaoSelecionado.toLowerCase();
            return cNome === alvo;
        });
    }, [assinaturas, cartaoSelecionado]);

    const totalAtivas = useMemo(() => {
        return assinaturasFiltradas.reduce((acc, a) => {
            const ehValida = isAssinaturaValidaNoCiclo
                ? isAssinaturaValidaNoCiclo(a, chaveMesAtual)
                : a.ativa;
            if (!ehValida) return acc;
            const v = parseCurrency(a.valor);
            return acc + v;
        }, 0);
    }, [assinaturasFiltradas, isAssinaturaValidaNoCiclo, chaveMesAtual]);

    const handleCancelar = async (id) => {
        setLoadingId(id);
        try {
            await cancelarAssinatura(id, chaveMesAtual);
        } finally {
            setLoadingId(null);
        }
    };

    const handleReativar = async (id) => {
        setLoadingId(id);
        try {
            await reativarAssinatura(id);
        } finally {
            setLoadingId(null);
        }
    };

    const handleExcluir = async (id) => {
        if (excluindoId !== id) {
            setExcluindoId(id);
            return;
        }
        setLoadingId(id);
        try {
            await removerAssinatura(id);
        } finally {
            setLoadingId(null);
            setExcluindoId(null);
        }
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <div>
                        <Titulos className="titulo">🔄 Assinaturas no Cartão</Titulos>
                        <Subinfo>
                            {nomeMesAno} • Cobranças fixas recorrentes
                        </Subinfo>
                    </div>
                    <CloseButton onClick={onClose} type="button">&times;</CloseButton>
                </Header>

                {/* Filtro por Cartão */}
                <BarraFiltroCartoes>
                    <BotaoFiltro
                        type="button"
                        $ativo={cartaoSelecionado === "todos"}
                        onClick={() => setCartaoSelecionado("todos")}
                    >
                        💳 Todos ({assinaturas?.length || 0})
                    </BotaoFiltro>
                    {cartoesDisponiveis.map((c) => {
                        const id = c.id || c.nome;
                        const qtd = (assinaturas || []).filter(
                            (a) => (a.cartao || "").toLowerCase() === id.toLowerCase()
                        ).length;
                        return (
                            <BotaoFiltro
                                key={id}
                                type="button"
                                $cor={c.cor}
                                $ativo={cartaoSelecionado === id}
                                onClick={() => setCartaoSelecionado(id)}
                            >
                                <span>{c.icone || "💳"}</span>
                                <span>{c.nome}</span>
                                <span className="qtd">({qtd})</span>
                            </BotaoFiltro>
                        );
                    })}
                </BarraFiltroCartoes>

                {/* Resumo do Total Recorrente */}
                <CardTotalRecorrente>
                    <div className="texto">
                        <span className="label">Total Mensal Ativo</span>
                        <span className="cartao-label">
                            {cartaoSelecionado === "todos"
                                ? "Em todos os cartões"
                                : `No cartão ${cartaoSelecionado}`}
                        </span>
                    </div>
                    <span className="valor">{formatCurrency(totalAtivas)}/mês</span>
                </CardTotalRecorrente>

                {/* Botão de Adicionar Nova Assinatura */}
                <BotaoNovaAssinatura
                    type="button"
                    onClick={() => {
                        onClose();
                        if (onAbrirNovaAssinatura) {
                            onAbrirNovaAssinatura(cartaoSelecionado !== "todos" ? cartaoSelecionado : null);
                        }
                    }}
                >
                    ➕ Adicionar Nova Assinatura
                </BotaoNovaAssinatura>

                {/* Lista de Assinaturas */}
                <ListaAssinaturas>
                    {assinaturasFiltradas.length > 0 ? (
                        assinaturasFiltradas.map((item) => {
                            const vNum = parseCurrency(item.valor);
                            const ehValidaCiclo = isAssinaturaValidaNoCiclo
                                ? isAssinaturaValidaNoCiclo(item, chaveMesAtual)
                                : item.ativa;

                            return (
                                <ItemAssinatura key={item.id} $ativa={ehValidaCiclo}>
                                    <LinhaCima>
                                        <InfoAssinatura>
                                            <span className="nome">{item.nome}</span>
                                            <span className="cartao">💳 {item.cartao}</span>
                                        </InfoAssinatura>
                                        <ValorAssinatura $ativa={ehValidaCiclo}>
                                            {formatCurrency(vNum)}
                                            <span className="mensal">/mês</span>
                                        </ValorAssinatura>
                                    </LinhaCima>

                                    <LinhaBaixo>
                                        <BadgesContainer>
                                            <span className="badge badge-tipo">
                                                🏷️ {item.tipo || "Desejo"}
                                            </span>
                                            <span className="badge badge-categoria">
                                                {item.categoria || "Assinaturas"}
                                            </span>
                                            {item.responsavel === "mozi" && (
                                                <span className="badge badge-resp mozi">
                                                    {isIngrid ? "💕 100% Meu" : "💕 100% Mozi"}
                                                </span>
                                            )}
                                            {item.responsavel === "dividido" && (
                                                <span className="badge badge-resp dividido">
                                                    🤝 50% Dividido
                                                </span>
                                            )}
                                            {ehValidaCiclo ? (
                                                <span className="badge badge-status ativa">
                                                    ✓ Ativa na fatura
                                                </span>
                                            ) : (
                                                <span className="badge badge-status cancelada">
                                                    🚫 Cancelada a partir de {item.canceladaAPartirDe || "hoje"}
                                                </span>
                                            )}
                                        </BadgesContainer>

                                        <AcoesContainer>
                                            {ehValidaCiclo ? (
                                                <BotaoCancelar
                                                    type="button"
                                                    disabled={loadingId === item.id}
                                                    onClick={() => handleCancelar(item.id)}
                                                    title="Cancela da fatura atual em diante mantendo o histórico nos meses passados"
                                                >
                                                    {loadingId === item.id ? "Cancelando..." : "Cancelar ✕"}
                                                </BotaoCancelar>
                                            ) : (
                                                <BotaoReativar
                                                    type="button"
                                                    disabled={loadingId === item.id}
                                                    onClick={() => handleReativar(item.id)}
                                                >
                                                    {loadingId === item.id ? "Reativando..." : "Reativar 🔄"}
                                                </BotaoReativar>
                                            )}

                                            <BotaoExcluir
                                                type="button"
                                                $confirmando={excluindoId === item.id}
                                                disabled={loadingId === item.id}
                                                onClick={() => handleExcluir(item.id)}
                                                title="Exclui completamente o registro histórico"
                                            >
                                                {excluindoId === item.id ? "Confirmar 🗑️" : "🗑️"}
                                            </BotaoExcluir>
                                        </AcoesContainer>
                                    </LinhaBaixo>
                                </ItemAssinatura>
                            );
                        })
                    ) : (
                        <MensagemVazia>
                            Nenhuma assinatura cadastrada
                            {cartaoSelecionado !== "todos" ? ` no cartão ${cartaoSelecionado}` : ""}.
                        </MensagemVazia>
                    )}
                </ListaAssinaturas>

                <Footer>
                    <BotaoFechar type="button" onClick={onClose}>
                        Fechar
                    </BotaoFechar>
                </Footer>
            </ModalContent>
        </Overlay>
    );
}

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
    overscroll-behavior: contain;
`;

const ModalContent = styled.div`
    background: #0d121f;
    border: 1px solid rgba(16, 185, 129, 0.45);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(16, 185, 129, 0.2);
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
    scrollbar-color: #10b981 transparent;

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
        color: #6ee7b7;
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

const BarraFiltroCartoes = styled.div`
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
`;

const BotaoFiltro = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    border: 1px solid
        ${({ $ativo, $cor }) =>
            $ativo ? $cor || "#10b981" : "rgba(255, 255, 255, 0.12)"};
    background: ${({ $ativo, $cor }) =>
        $ativo
            ? `linear-gradient(135deg, ${$cor ? `${$cor}44` : "rgba(16, 185, 129, 0.4)"}, rgba(13, 18, 31, 0.8))`
            : "rgba(255, 255, 255, 0.04)"};
    color: ${({ $ativo }) => ($ativo ? "#ffffff" : "#94a3b8")};
    transition: all 0.2s;

    .qtd {
        opacity: 0.8;
        font-size: 0.75rem;
    }
`;

const CardTotalRecorrente = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.25));
    border: 1px solid rgba(16, 185, 129, 0.35);
    border-radius: 14px;

    .texto {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .label {
            font-size: 0.78rem;
            color: #94a3b8;
            text-transform: uppercase;
            font-weight: 600;
        }

        .cartao-label {
            font-size: 0.88rem;
            color: #e2e8f0;
            font-weight: 700;
        }
    }

    .valor {
        font-size: 1.25rem;
        font-weight: 800;
        color: #34d399;
    }
`;

const BotaoNovaAssinatura = styled.button`
    width: 100%;
    padding: 10px 14px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 12px;
    color: #ffffff;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    transition: all 0.2s;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.45);
    }
`;

const ListaAssinaturas = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 4px;
    scrollbar-width: thin;
`;

const ItemAssinatura = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 12px;
    background: ${({ $ativa }) =>
        $ativa ? "rgba(16, 185, 129, 0.06)" : "rgba(255, 255, 255, 0.02)"};
    border: 1px solid
        ${({ $ativa }) =>
            $ativa ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.08)"};
    opacity: ${({ $ativa }) => ($ativa ? 1 : 0.65)};
    transition: all 0.2s;
`;

const LinhaCima = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
`;

const InfoAssinatura = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;

    .nome {
        font-size: 0.95rem;
        font-weight: 700;
        color: #ffffff;
    }

    .cartao {
        font-size: 0.75rem;
        color: #94a3b8;
    }
`;

const ValorAssinatura = styled.div`
    font-size: 1.05rem;
    font-weight: 800;
    color: ${({ $ativa }) => ($ativa ? "#34d399" : "#94a3b8")};
    white-space: nowrap;

    .mensal {
        font-size: 0.75rem;
        font-weight: normal;
        color: #94a3b8;
    }
`;

const LinhaBaixo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const BadgesContainer = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;

    .badge {
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.06);
        color: #cbd5e1;
    }

    .badge-status.ativa {
        color: #34d399;
        background: rgba(16, 185, 129, 0.15);
    }

    .badge-status.cancelada {
        color: #f87171;
        background: rgba(239, 68, 68, 0.15);
    }

    .badge-resp.mozi {
        color: #f472b6;
        background: rgba(244, 114, 182, 0.15);
    }

    .badge-resp.dividido {
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.15);
    }
`;

const AcoesContainer = styled.div`
    display: flex;
    gap: 6px;
    margin-left: auto;
`;

const BotaoCancelar = styled.button`
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #f87171;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.74rem;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.3);
        color: #ffffff;
    }
`;

const BotaoReativar = styled.button`
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #34d399;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.74rem;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) {
        background: rgba(16, 185, 129, 0.3);
        color: #ffffff;
    }
`;

const BotaoExcluir = styled.button`
    background: ${({ $confirmando }) =>
        $confirmando ? "#ef4444" : "rgba(255, 255, 255, 0.05)"};
    border: 1px solid
        ${({ $confirmando }) =>
            $confirmando ? "#ef4444" : "rgba(255, 255, 255, 0.12)"};
    color: ${({ $confirmando }) => ($confirmando ? "#ffffff" : "#94a3b8")};
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.74rem;
    cursor: pointer;

    &:hover:not(:disabled) {
        color: #ef4444;
    }
`;

const MensagemVazia = styled.div`
    text-align: center;
    color: #64748b;
    font-size: 0.85rem;
    padding: 24px 0;
`;

const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
`;

const BotaoFechar = styled.button`
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #e2e8f0;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background: rgba(255, 255, 255, 0.15);
    }
`;
