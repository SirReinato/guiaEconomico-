import styled from "styled-components";
import { HeaderContainer } from "../Home";
import Card, { Titulos } from "../../components/Card";
import { useGastos } from "../../context/GastosContext";
import { useState, useMemo } from "react";
import { parseCurrency } from "../../utils/currencyUtils";
import { useMes } from "../../context/MesContext";
import { useResumoFinanceiro } from "../../hooks/useResumoFinanceiro";
import ModalEditarGasto from "../../components/ModalEditarGasto";
import ModalGerenciarCartoes from "../../components/ModalGerenciarCartoes";
import ModalFaturaItau from "../../components/ModalFaturaItau";
import ModalAjusteFaturaCartao from "../../components/ModalAjusteFaturaCartao";
import { useAuth } from "../../context/AuthContext";

export default function Cartoes() {
    const {
        getFaturaPorCartao,
        getGastosDoCiclo,
        atualizarGasto,
        removerGasto,
        cartoesAtivos,
        faturasItau,
        chaveMesAtual,
    } = useGastos();
    const {
        nomeMesAno,
        mesReferencia,
        estaPago,
        confirmarMesPago,
        avancarMes,
        voltarMes,
    } = useMes();
    const { isIngrid } = useAuth() || {};

    // estado para controlar ciclo ativo
    const [ciclo, setCiclo] = useState("atual");
    const [cartaoSelecionado, setCartaoSelecionado] = useState("todos");
    const [responsavelSelecionado, setResponsavelSelecionado] = useState("todos");
    const [gastoParaEditar, setGastoParaEditar] = useState(null);
    const [modalCartoesAberto, setModalCartoesAberto] = useState(false);
    const [modalItauAberto, setModalItauAberto] = useState(false);
    const [modalAjusteAberto, setModalAjusteAberto] = useState(false);

    const { saldoLiquido } = useResumoFinanceiro();
    const fatura = getFaturaPorCartao(ciclo, mesReferencia);

    // Mapeamento dinâmico dos cartões ativos para os cards superiores
    const listaCartoes = useMemo(() => {
        return (cartoesAtivos || []).map((c) => {
            const id = c.id || c.nome;
            const valor = fatura[id] !== undefined ? fatura[id] : fatura[c.nome] || 0;
            return {
                id,
                cartao: c.nome,
                cor: c.cor || "#820ad1",
                icone: c.icone || "💳",
                valor: valor.toFixed(2),
                integrado: !!c.integrado,
            };
        });
    }, [cartoesAtivos, fatura]);

    // Coleta todos os gastos do ciclo para os cartões ativos e FIXA ajustes no topo
    const todosGastosDoCiclo = useMemo(() => {
        const todos = [];
        (cartoesAtivos || []).forEach((c) => {
            const id = c.id || c.nome;
            const itens = getGastosDoCiclo(id, ciclo, mesReferencia) || [];
            todos.push(...itens);
        });

        return todos.sort((a, b) => {
            // Fixa ajustes de fatura NO TOPO da lista!
            const isAjusteA = a.origem === "ajuste_fatura";
            const isAjusteB = b.origem === "ajuste_fatura";
            if (isAjusteA && !isAjusteB) return -1;
            if (!isAjusteA && isAjusteB) return 1;

            const dataA = new Date(a.data?.includes("T") ? a.data : `${a.data}T12:00:00`);
            const dataB = new Date(b.data?.includes("T") ? b.data : `${b.data}T12:00:00`);
            return dataB - dataA;
        });
    }, [cartoesAtivos, getGastosDoCiclo, ciclo, mesReferencia]);

    // Gastos filtrados pelo cartão selecionado
    const gastosPorCartao = useMemo(() => {
        if (cartaoSelecionado === "todos") return todosGastosDoCiclo;
        return todosGastosDoCiclo.filter((g) => {
            const cNome = (g.cartao || "").toLowerCase();
            const alvo = cartaoSelecionado.toLowerCase();
            return (
                cNome === alvo ||
                (g.cartaoOriginal && alvo.includes("renato")) ||
                (cNome.includes("renato") && alvo.includes("renato"))
            );
        });
    }, [todosGastosDoCiclo, cartaoSelecionado]);

    // Auditoria dos responsáveis dentro do universo do cartão selecionado
    const auditoriaResponsavel = useMemo(() => {
        let totalGeral = 0;
        let totalMeu = 0;
        let totalMozi = 0;
        let totalDividido = 0;
        let qtdMeu = 0;
        let qtdMozi = 0;
        let qtdDividido = 0;

        gastosPorCartao.forEach((g) => {
            const v = g.valorCalculado !== undefined ? g.valorCalculado : parseCurrency(g.valor);
            const resp = g.responsavel || "meu";
            totalGeral += v;

            if (resp === "mozi") {
                totalMozi += v;
                qtdMozi += 1;
            } else if (resp === "dividido") {
                totalDividido += v;
                qtdDividido += 1;
            } else {
                totalMeu += v;
                qtdMeu += 1;
            }
        });

        return {
            todos: { count: gastosPorCartao.length, total: totalGeral },
            meu: { count: qtdMeu, total: totalMeu },
            mozi: { count: qtdMozi, total: totalMozi },
            dividido: { count: qtdDividido, total: totalDividido },
        };
    }, [gastosPorCartao]);

    // Gastos finais filtrados por cartão E por responsável
    const gastosFiltrados = useMemo(() => {
        if (responsavelSelecionado === "todos") return gastosPorCartao;
        return gastosPorCartao.filter((g) => {
            const resp = g.responsavel || "meu";
            return resp === responsavelSelecionado;
        });
    }, [gastosPorCartao, responsavelSelecionado]);

    const totalFiltrado = useMemo(() => {
        return gastosFiltrados.reduce((acc, g) => {
            const v = g.valorCalculado !== undefined ? g.valorCalculado : parseCurrency(g.valor);
            return acc + v;
        }, 0);
    }, [gastosFiltrados]);

    const contagens = useMemo(() => {
        const mapa = { todos: todosGastosDoCiclo.length };
        (cartoesAtivos || []).forEach((c) => {
            const id = c.id || c.nome;
            const qtd = (getGastosDoCiclo(id, ciclo, mesReferencia) || []).length;
            mapa[id] = qtd;
            mapa[c.nome] = qtd;
        });
        return mapa;
    }, [cartoesAtivos, getGastosDoCiclo, ciclo, mesReferencia, todosGastosDoCiclo.length]);

    const valorItauAtual = faturasItau?.[chaveMesAtual] || 0;

    return (
        <ContainerLista>
            <HeaderNavegacaoMes>
                <BotaoNavegacao onClick={voltarMes} title="Mês anterior">
                    ◀
                </BotaoNavegacao>
                <Titulos $titulo $tituloRoxo>
                    {nomeMesAno}
                </Titulos>
                <BotaoNavegacao onClick={avancarMes} title="Próximo mês">
                    ▶
                </BotaoNavegacao>
            </HeaderNavegacaoMes>

            <BarraStatusMes>
                {estaPago ? (
                    <BadgePago>✓ Todas as contas deste mês foram pagas</BadgePago>
                ) : (
                    <BotaoConfirmarPago onClick={() => confirmarMesPago(parseFloat(saldoLiquido))}>
                        ✓ Confirmar tudo pago e avançar mês
                    </BotaoConfirmarPago>
                )}
            </BarraStatusMes>

            {/* Linha de Ações: Ajustar para dar certinho, Gerenciar Cartões e Fatura Itaú */}
            <BarraAcoesTop>
                <BotaoAjustarFatura onClick={() => setModalAjusteAberto(true)}>
                    🎯 Ajustar para dar certinho
                </BotaoAjustarFatura>

                <BotaoGerenciarCartoes onClick={() => setModalCartoesAberto(true)}>
                    ⚙️ {isIngrid ? "+ Gerenciar Cartões" : "Gerenciar Cartões"}
                </BotaoGerenciarCartoes>

                <BotaoItauAcao onClick={() => setModalItauAberto(true)}>
                    💳 Fatura Itaú (R$ {valorItauAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </BotaoItauAcao>
            </BarraAcoesTop>

            {/* Filtro de ciclo */}
            <Filtro>
                <button
                    className={ciclo === "atual" ? "ativo" : ""}
                    onClick={() => setCiclo("atual")}
                >
                    Atual
                </button>
                <button
                    className={ciclo === "anterior" ? "ativo" : ""}
                    onClick={() => setCiclo("anterior")}
                >
                    Anterior
                </button>
                <button
                    className={ciclo === "proximo" ? "ativo" : ""}
                    onClick={() => setCiclo("proximo")}
                >
                    Próximo
                </button>
            </Filtro>

            <HeaderContainer>
                {listaCartoes.map((g) => {
                    const isSelecionado = cartaoSelecionado === g.cartao || cartaoSelecionado === g.id;
                    return (
                        <Card
                            key={g.id}
                            $bgAlert
                            $widthSm
                            $heightSm
                            $bgClaro
                            titulo={`${g.icone} ${g.cartao}`}
                            destaque={`R$ ${g.valor}`}
                            textTitulo={["Fatura", g.integrado ? "Tipo" : "Ciclo"]}
                            textDescricao={[
                                `Ciclo: ${ciclo}`,
                                g.integrado ? "Integrado" : "Manual",
                            ]}
                            onClick={() =>
                                setCartaoSelecionado(isSelecionado ? "todos" : g.id)
                            }
                            style={{
                                cursor: "pointer",
                                outline: isSelecionado ? `2px solid ${g.cor}` : "2px solid transparent",
                                boxShadow: isSelecionado ? `0 0 14px ${g.cor}77` : undefined,
                                transform: isSelecionado ? "scale(1.02)" : "scale(1)",
                                transition: "all 0.2s ease",
                            }}
                        />
                    );
                })}
            </HeaderContainer>

            {/* Barra de Botões para Filtrar Especificamente por Cartão */}
            <BarraFiltroCartoes>
                <BotaoFiltroCartao
                    $ativo={cartaoSelecionado === "todos"}
                    onClick={() => setCartaoSelecionado("todos")}
                >
                    💳 Todos ({contagens.todos})
                </BotaoFiltroCartao>
                {listaCartoes.map((c) => (
                    <BotaoFiltroCartao
                        key={c.id}
                        $cor={c.cor}
                        $ativo={cartaoSelecionado === c.id || cartaoSelecionado === c.cartao}
                        onClick={() => setCartaoSelecionado(c.id)}
                    >
                        <span>{c.icone}</span>
                        <span>{c.cartao}</span>
                        <BadgeContagem $ativo={cartaoSelecionado === c.id || cartaoSelecionado === c.cartao}>
                            {contagens[c.id] || 0}
                        </BadgeContagem>
                    </BotaoFiltroCartao>
                ))}
            </BarraFiltroCartoes>

            {/* Barra de Auditoria: Filtro por Responsável pelo Gasto */}
            <BarraFiltroResponsavel>
                <LabelFiltroSecao>Auditoria:</LabelFiltroSecao>
                <BotaoFiltroResponsavel
                    $tipo="todos"
                    $ativo={responsavelSelecionado === "todos"}
                    onClick={() => setResponsavelSelecionado("todos")}
                >
                    👥 Todos ({auditoriaResponsavel.todos.count})
                </BotaoFiltroResponsavel>
                <BotaoFiltroResponsavel
                    $tipo="meu"
                    $ativo={responsavelSelecionado === "meu"}
                    onClick={() => setResponsavelSelecionado("meu")}
                >
                    👤 {isIngrid ? "Pessoal" : "Meu"} ({auditoriaResponsavel.meu.count})
                </BotaoFiltroResponsavel>
                <BotaoFiltroResponsavel
                    $tipo="mozi"
                    $ativo={responsavelSelecionado === "mozi"}
                    onClick={() => setResponsavelSelecionado("mozi")}
                    title={isIngrid ? "Gastos 100% sob minha responsabilidade" : "Gastos 100% da Mozi a serem reembolsados"}
                >
                    💕 {isIngrid ? "100% Meu (Reembolso)" : "Mozi"} ({auditoriaResponsavel.mozi.count}
                    {auditoriaResponsavel.mozi.total > 0 &&
                        ` • R$ ${auditoriaResponsavel.mozi.total.toFixed(2)}`}
                    )
                </BotaoFiltroResponsavel>
                <BotaoFiltroResponsavel
                    $tipo="dividido"
                    $ativo={responsavelSelecionado === "dividido"}
                    onClick={() => setResponsavelSelecionado("dividido")}
                    title="Gastos divididos (50% cada)"
                >
                    🤝 Dividido ({auditoriaResponsavel.dividido.count}
                    {auditoriaResponsavel.dividido.total > 0 &&
                        ` • R$ ${(auditoriaResponsavel.dividido.total / 2).toFixed(2)} cada`}
                    )
                </BotaoFiltroResponsavel>
            </BarraFiltroResponsavel>

            {(cartaoSelecionado !== "todos" || responsavelSelecionado !== "todos") && (
                <InfoFiltroAtivo>
                    <span>
                        Filtrando:{" "}
                        {cartaoSelecionado !== "todos" && (
                            <>
                                Cartão: <strong>{cartaoSelecionado}</strong>
                            </>
                        )}
                        {cartaoSelecionado !== "todos" && responsavelSelecionado !== "todos" && " • "}
                        {responsavelSelecionado !== "todos" && (
                            <>
                                Responsável:{" "}
                                <strong>
                                    {responsavelSelecionado === "mozi"
                                        ? "💕 100% Mozi (Reembolsável)"
                                        : responsavelSelecionado === "dividido"
                                        ? "🤝 Dividido (50% cada)"
                                        : "👤 Meu"}
                                </strong>
                            </>
                        )}
                        {" "}• <strong>{gastosFiltrados.length}</strong> compras • Subtotal:{" "}
                        <strong>R$ {totalFiltrado.toFixed(2)}</strong>
                    </span>
                    <BotaoLimparFiltro
                        onClick={() => {
                            setCartaoSelecionado("todos");
                            setResponsavelSelecionado("todos");
                        }}
                    >
                        ✕ Limpar filtros
                    </BotaoLimparFiltro>
                </InfoFiltroAtivo>
            )}

            <ListaGastos>
                {gastosFiltrados.length > 0 ? (
                    gastosFiltrados.map((gasto) => {
                        const isAjuste = gasto.origem === "ajuste_fatura";
                        const valorExibicao =
                            gasto.valorCalculado !== undefined
                                ? gasto.valorCalculado
                                : parseCurrency(gasto.valor);

                        const ehGastoIntegrado =
                            gasto.cartao === "Cartões do Renato" ||
                            gasto.cartao === "Itaú" ||
                            gasto.id?.startsWith?.("itau-");

                        if (isAjuste) {
                            return (
                                <ItemGastoAjuste key={gasto.id}>
                                    <AjusteTopoLinha>
                                        <BadgeAjusteDestaque>
                                            🎯 Ajuste de Fatura
                                        </BadgeAjusteDestaque>
                                        <ValorAjusteDestaque $isPositivo={valorExibicao >= 0}>
                                            {valorExibicao > 0 ? `+ R$ ${valorExibicao.toFixed(2)}` : `- R$ ${Math.abs(valorExibicao).toFixed(2)}`}
                                        </ValorAjusteDestaque>
                                    </AjusteTopoLinha>
                                    <AjusteDetalhesLinha>
                                        <InfoMetaAjuste>
                                            <span className="badge-cartao">💳 {gasto.cartao}</span>
                                            <span className="badge-data">📅 {gasto.data}</span>
                                            <span className="badge-tipo">🏷️ {gasto.tipo}</span>
                                            <span className="desc">({gasto.descricao || "Ajuste para dar certinho"})</span>
                                        </InfoMetaAjuste>
                                        <BotaoReajustar onClick={() => setModalAjusteAberto(true)}>
                                            Reajustar
                                        </BotaoReajustar>
                                    </AjusteDetalhesLinha>
                                </ItemGastoAjuste>
                            );
                        }

                        return (
                            <ItemGasto key={gasto.id}>
                                {/* Visual Desktop em Colunas */}
                                <ItemGastoDesktop>
                                    <Coluna>{gasto.data}</Coluna>
                                    <Coluna>
                                        R$ {valorExibicao.toFixed(2)}
                                    </Coluna>
                                    <Coluna>{gasto.cartao}</Coluna>
                                    <Coluna tipo={gasto.tipo}>{gasto.tipo}</Coluna>
                                    <Coluna>
                                        {gasto.descricaoExibicao || gasto.categoria}
                                        {gasto.parcela ? ` (${gasto.parcela})` : ""}
                                        {gasto.responsavel === "mozi" && (
                                            <BadgeResponsavel $tipo="mozi">
                                                {isIngrid ? "💕 100% a Pagar" : "💕 Mozi"}
                                            </BadgeResponsavel>
                                        )}
                                        {gasto.responsavel === "dividido" && (
                                            <BadgeResponsavel $tipo="dividido">
                                                🤝 50% Dividido
                                            </BadgeResponsavel>
                                        )}
                                    </Coluna>
                                    {!ehGastoIntegrado ? (
                                        <BotaoEditar onClick={() => setGastoParaEditar(gasto)}>
                                            Editar
                                        </BotaoEditar>
                                    ) : gasto.cartao === "Itaú" ? (
                                        <BotaoEditar onClick={() => setModalItauAberto(true)}>
                                            Ajustar
                                        </BotaoEditar>
                                    ) : (
                                        <BadgeIntegradoItem>
                                            Integrado
                                        </BadgeIntegradoItem>
                                    )}
                                </ItemGastoDesktop>

                                {/* Visual Mobile Otimizado em 2 Linhas Fluidas */}
                                <ItemGastoMobile>
                                    <ItemMobileLinhaCima>
                                        <DescricaoMobile>
                                            <span className="categoria">
                                                {gasto.descricaoExibicao || gasto.categoria}
                                            </span>
                                            {gasto.parcela && <span className="parcela">({gasto.parcela})</span>}
                                        </DescricaoMobile>
                                        <ValorMobile>
                                            R$ {valorExibicao.toFixed(2)}
                                        </ValorMobile>
                                    </ItemMobileLinhaCima>

                                    <ItemMobileLinhaBaixo>
                                        <BadgesMobile>
                                            <span className="badge-item badge-cartao">{gasto.cartao}</span>
                                            <span className="badge-item badge-data">{gasto.data}</span>
                                            <span className={`badge-item badge-tipo tipo-${gasto.tipo?.toLowerCase()}`}>
                                                {gasto.tipo}
                                            </span>
                                            {gasto.responsavel === "mozi" && (
                                                <BadgeResponsavel $tipo="mozi">
                                                    {isIngrid ? "💕 100%" : "💕 Mozi"}
                                                </BadgeResponsavel>
                                            )}
                                            {gasto.responsavel === "dividido" && (
                                                <BadgeResponsavel $tipo="dividido">
                                                    🤝 50%
                                                </BadgeResponsavel>
                                            )}
                                        </BadgesMobile>

                                        {!ehGastoIntegrado ? (
                                            <BotaoEditarMobile onClick={() => setGastoParaEditar(gasto)}>
                                                Editar
                                            </BotaoEditarMobile>
                                        ) : gasto.cartao === "Itaú" ? (
                                            <BotaoEditarMobile onClick={() => setModalItauAberto(true)}>
                                                Ajustar
                                            </BotaoEditarMobile>
                                        ) : (
                                            <BadgeIntegradoItem>
                                                Integrado
                                            </BadgeIntegradoItem>
                                        )}
                                    </ItemMobileLinhaBaixo>
                                </ItemGastoMobile>
                            </ItemGasto>
                        );
                    })
                ) : (
                    <MensagemVazia>
                        Nenhum gasto encontrado
                        {cartaoSelecionado !== "todos" ? ` no cartão ${cartaoSelecionado}` : ""}
                        {responsavelSelecionado !== "todos"
                            ? ` para o responsável "${responsavelSelecionado}"`
                            : ""} neste período.
                    </MensagemVazia>
                )}
            </ListaGastos>

            {gastoParaEditar && (
                <ModalEditarGasto
                    gasto={gastoParaEditar}
                    onClose={() => setGastoParaEditar(null)}
                    onUpdate={atualizarGasto}
                    onDelete={removerGasto}
                />
            )}

            {modalCartoesAberto && (
                <ModalGerenciarCartoes
                    onClose={() => setModalCartoesAberto(false)}
                />
            )}

            {modalItauAberto && (
                <ModalFaturaItau
                    onClose={() => setModalItauAberto(false)}
                />
            )}

            {modalAjusteAberto && (
                <ModalAjusteFaturaCartao
                    cartaoInicial={cartaoSelecionado}
                    ciclo={ciclo}
                    onClose={() => setModalAjusteAberto(false)}
                />
            )}
        </ContainerLista>
    );
}

/* ===============================================================
   STYLED COMPONENTS - RESPONSIVIDADE TOTAL & DESIGN SYSTEM NEON
   =============================================================== */

const ContainerLista = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    gap: 8px;
    width: 100%;
    padding: 8px;
    border-radius: 16px;
    background-color: ${({ theme }) => theme.colors.cardsBg};
    box-sizing: border-box;

    @media (max-width: 768px) {
        height: auto;
        min-height: calc(100vh - 120px);
        padding: 8px 4px 80px 4px;
        background-color: transparent;
    }
`;

const BarraAcoesTop = styled.div`
    display: flex;
    gap: 10px;
    margin-bottom: 6px;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
`;

const BotaoAjustarFatura = styled.button`
    background: linear-gradient(135deg, rgba(130, 10, 209, 0.3), rgba(0, 179, 255, 0.3));
    border: 1px solid rgba(0, 179, 255, 0.55);
    color: #38bdf8;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 7px 16px;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 0 12px rgba(0, 179, 255, 0.25);
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &:hover {
        background: linear-gradient(135deg, rgba(130, 10, 209, 0.5), rgba(0, 179, 255, 0.5));
        color: #ffffff;
        transform: translateY(-1px);
        box-shadow: 0 0 18px rgba(0, 179, 255, 0.45);
    }

    &:active {
        transform: scale(0.98);
    }
`;

const BotaoGerenciarCartoes = styled.button`
    background: rgba(130, 10, 209, 0.15);
    border: 1px solid rgba(130, 10, 209, 0.4);
    color: #c084fc;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: rgba(130, 10, 209, 0.3);
        color: #fff;
        transform: translateY(-1px);
    }
`;

const BotaoItauAcao = styled.button`
    background: rgba(234, 88, 12, 0.15);
    border: 1px solid rgba(234, 88, 12, 0.4);
    color: #fdba74;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: rgba(234, 88, 12, 0.3);
        color: #fff;
        transform: translateY(-1px);
    }
`;

const ListaGastos = styled.div`
    width: 100%;
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-sizing: border-box;
    overflow-y: auto;
    padding-right: 4px;

    scrollbar-width: thin;
    scrollbar-color: #820ad1 transparent;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: #820ad1;
        border-radius: 8px;
    }

    @media (max-width: 768px) {
        overflow-y: visible;
        padding-right: 0;
    }
`;

const ItemGasto = styled.div`
    background-color: ${({ theme }) => theme.colors.cardItemBg || "#0d1b2a"};
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: transform 0.15s ease, border-color 0.15s ease;

    &:hover {
        border-color: rgba(130, 10, 209, 0.4);
    }
`;

const ItemGastoDesktop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    width: 100%;
    box-sizing: border-box;

    @media (max-width: 680px) {
        display: none;
    }
`;

const ItemGastoMobile = styled.div`
    display: none;
    flex-direction: column;
    padding: 12px 14px;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;

    @media (max-width: 680px) {
        display: flex;
    }
`;

const ItemMobileLinhaCima = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
`;

const DescricaoMobile = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    .categoria {
        font-weight: 700;
        font-size: 0.92rem;
        color: #ffffff;
        word-break: break-word;
    }

    .parcela {
        font-size: 0.75rem;
        color: #94a3b8;
    }
`;

const ValorMobile = styled.div`
    font-size: 1.05rem;
    font-weight: 800;
    color: #ffffff;
    white-space: nowrap;
`;

const ItemMobileLinhaBaixo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const BadgesMobile = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;

    .badge-item {
        font-size: 0.72rem;
        padding: 2px 6px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.05);
        color: #cbd5e1;
    }

    .badge-cartao {
        color: #c084fc;
        font-weight: 600;
    }

    .badge-data {
        color: #94a3b8;
    }

    .badge-tipo {
        font-weight: 600;
        &.tipo-essencial {
            color: #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
        }
        &.tipo-desejo {
            color: #f9c74f;
            background: rgba(249, 199, 79, 0.1);
        }
        &.tipo-poupança,
        &.tipo-poupanca {
            color: #43aa8b;
            background: rgba(67, 170, 139, 0.1);
        }
    }
`;

const BotaoEditarMobile = styled.button`
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #e2e8f0;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 0.78rem;
    cursor: pointer;
    font-weight: 600;

    &:active {
        background: rgba(130, 10, 209, 0.3);
    }
`;

/* Item Destaque para Ajuste de Fatura (Fixado no Topo) */
const ItemGastoAjuste = styled.div`
    background: linear-gradient(135deg, rgba(130, 10, 209, 0.18), rgba(0, 179, 255, 0.12));
    border: 1px solid rgba(0, 179, 255, 0.45);
    box-shadow: 0 0 16px rgba(0, 179, 255, 0.15);
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: all 0.2s ease;

    &:hover {
        border-color: rgba(0, 179, 255, 0.7);
        box-shadow: 0 0 20px rgba(0, 179, 255, 0.25);
    }
`;

const AjusteTopoLinha = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
`;

const BadgeAjusteDestaque = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #820ad1, #0284c7);
    color: #ffffff;
    font-size: 0.8rem;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 20px;
    letter-spacing: 0.02em;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const ValorAjusteDestaque = styled.span`
    font-size: 1.15rem;
    font-weight: 900;
    color: ${({ $isPositivo }) => ($isPositivo ? "#38bdf8" : "#fb7185")};
    text-shadow: 0 0 10px ${({ $isPositivo }) => ($isPositivo ? "rgba(56, 189, 248, 0.4)" : "rgba(251, 113, 133, 0.4)")};
`;

const AjusteDetalhesLinha = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: #cbd5e1;
`;

const InfoMetaAjuste = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;

    .desc {
        color: #94a3b8;
        font-style: italic;
    }
`;

const BotaoReajustar = styled.button`
    background: rgba(0, 179, 255, 0.2);
    border: 1px solid rgba(0, 179, 255, 0.5);
    color: #e0f2fe;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #0284c7;
        color: #ffffff;
    }
`;

const Coluna = styled.div`
    flex: 1;
    font-size: 0.85em;
    font-weight: ${({ tipo }) => (tipo ? "bold" : "normal")};
    color: ${({ tipo }) => {
        if (tipo === "Essencial") return "#ff6b6b";
        if (tipo === "Desejo") return "#f9c74f";
        if (tipo === "Poupança") return "#43aa8b";
        return "#ffffff";
    }};
`;

const BotaoEditar = styled.button`
    background-color: transparent;
    border: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textPrimary};
    padding: 4px 8px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.8em;

    &:hover {
        background-color: ${({ theme }) => theme.colors.hoverBg || "#1a2636"};
    }
`;

const BadgeIntegradoItem = styled.span`
    font-size: 0.72rem;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 3px 6px;
    border-radius: 6px;
`;

const Filtro = styled.div`
    display: flex;
    gap: 12px;
    margin: 12px 0;

    button {
        padding: 6px 12px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        background-color: ${({ theme }) => theme.colors.cardsBg};
        color: ${({ theme }) => theme.colors.textPrimary};
        font-weight: bold;

        &.ativo {
            background-color: ${({ theme }) => theme.colors.primary};
            color: ${({ theme }) => theme.colors.surface};
        }
    }
`;

const HeaderNavegacaoMes = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 4px;
`;

const BotaoNavegacao = styled.button`
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #00b3ff;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;

    &:hover {
        background: #00b3ff;
        color: #ffffff;
        transform: scale(1.1);
    }
`;

const BarraStatusMes = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
`;

const BotaoConfirmarPago = styled.button`
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    border: none;
    padding: 8px 18px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.9em;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
    }
`;

const BadgePago = styled.div`
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 6px 14px;
    border-radius: 16px;
    font-weight: bold;
    font-size: 0.85em;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const BadgeResponsavel = styled.span`
    font-size: 0.75em;
    padding: 2px 6px;
    border-radius: 6px;
    margin-left: 6px;
    font-weight: bold;
    display: inline-block;
    ${({ $tipo }) =>
        $tipo === "mozi"
            ? `
        background: rgba(236, 72, 153, 0.2);
        color: #f472b6;
        border: 1px solid rgba(236, 72, 153, 0.4);
    `
            : `
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.4);
    `}
`;

const BarraFiltroCartoes = styled.div`
    display: flex;
    gap: 8px;
    margin: 10px 0 4px 0;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
`;

const BotaoFiltroCartao = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid
        ${({ $ativo, $cor, theme }) =>
            $ativo
                ? $cor || theme.colors.primary || "#820ad1"
                : "rgba(255, 255, 255, 0.12)"};
    background: ${({ $ativo, $cor }) =>
        $ativo
            ? $cor
                ? `linear-gradient(135deg, ${$cor}dd, ${$cor})`
                : "linear-gradient(135deg, #820ad1, #6200ea)"
            : "rgba(255, 255, 255, 0.05)"};
    color: ${({ $ativo, $cor }) => {
        if (!$ativo) return "#cbd5e1";
        if ($cor === "#eab308") return "#1e1e1e";
        return "#ffffff";
    }};
    box-shadow: ${({ $ativo, $cor }) =>
        $ativo
            ? `0 4px 12px ${$cor ? `${$cor}55` : "rgba(130, 10, 209, 0.4)"}`
            : "none"};

    &:hover {
        transform: translateY(-1px);
        background: ${({ $ativo }) =>
            $ativo
                ? undefined
                : "rgba(255, 255, 255, 0.1)"};
        color: #ffffff;
    }

    &:active {
        transform: scale(0.98);
    }
`;

const BadgeContagem = styled.span`
    font-size: 0.8em;
    padding: 2px 7px;
    border-radius: 12px;
    background: ${({ $ativo }) =>
        $ativo ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.12)"};
    color: inherit;
    font-weight: bold;
`;

const InfoFiltroAtivo = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 16px;
    background: rgba(130, 10, 209, 0.12);
    border: 1px solid rgba(130, 10, 209, 0.3);
    border-radius: 10px;
    font-size: 0.85em;
    color: #e2e8f0;
    margin-top: 4px;

    @media (max-width: 600px) {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
    }
`;

const BotaoLimparFiltro = styled.button`
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #e2e8f0;
    font-size: 0.8em;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }
`;

const MensagemVazia = styled.div`
    color: #94a3b8;
    text-align: center;
    padding: 32px 16px;
    font-size: 0.9em;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
    width: 100%;
`;

const BarraFiltroResponsavel = styled.div`
    display: flex;
    gap: 8px;
    margin: 4px 0 8px 0;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
`;

const LabelFiltroSecao = styled.span`
    font-size: 0.75em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-right: 4px;

    @media (max-width: 600px) {
        width: 100%;
        text-align: center;
        margin-bottom: 2px;
    }
`;

const BotaoFiltroResponsavel = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 16px;
    font-size: 0.8em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid
        ${({ $ativo, $tipo }) => {
            if (!$ativo) return "rgba(255, 255, 255, 0.12)";
            if ($tipo === "mozi") return "#ec4899";
            if ($tipo === "dividido") return "#3b82f6";
            if ($tipo === "meu") return "#10b981";
            return "#820ad1";
        }};
    background: ${({ $ativo, $tipo }) => {
        if (!$ativo) return "rgba(255, 255, 255, 0.04)";
        if ($tipo === "mozi") return "linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(219, 39, 119, 0.5))";
        if ($tipo === "dividido") return "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.5))";
        if ($tipo === "meu") return "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.5))";
        return "linear-gradient(135deg, rgba(130, 10, 209, 0.4), rgba(98, 0, 234, 0.5))";
    }};
    color: ${({ $ativo, $tipo }) => {
        if (!$ativo) return "#cbd5e1";
        if ($tipo === "mozi") return "#f472b6";
        if ($tipo === "dividido") return "#60a5fa";
        if ($tipo === "meu") return "#34d399";
        return "#ffffff";
    }};
    box-shadow: ${({ $ativo }) =>
        $ativo ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "none"};

    &:hover {
        transform: translateY(-1px);
        background: ${({ $ativo }) =>
            $ativo ? undefined : "rgba(255, 255, 255, 0.08)"};
        color: #ffffff;
    }

    &:active {
        transform: scale(0.98);
    }
`;
