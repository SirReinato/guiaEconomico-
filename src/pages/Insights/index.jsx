import { useState, useEffect, useMemo, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import { useMes } from "../../context/MesContext";
import { useSaldo } from "../../context/SaldoContext";
import { useResumoFinanceiro } from "../../hooks/useResumoFinanceiro";
import { getTaxaSelicAtual } from "../../services/selicService";
import { getReservaConfig, salvarReservaConfig } from "../../services/reservaService";
import { gerarProjecaoReserva } from "../../utils/reservaCalculos";
import { formatCurrency, parseCurrency } from "../../utils/currencyUtils";
import ModalAjusteReserva from "../../components/ModalAjusteReserva";
import { useProjecaoSaldo } from "../../hooks/useProjecaoSaldo";
import { useEssencial } from "../../context/EssencialContext";
import { useAuth } from "../../context/AuthContext";
import AcessoRestritoInsights from "../../components/AcessoRestritoInsights";

export default function Insights() {
    const { temAcessoInsights, perfilAtivo, isIngrid } = useAuth() || {};
    const { mesReferencia, nomeMesAno, voltarMes, avancarMes } = useMes() || {};
    const { getSalarioDoMes, getEntradasDoMes } = useSaldo() || {};
    const { saldoLiquido } = useResumoFinanceiro() || {};
    const { essenciais } = useEssencial() || {};
    const projecoesFuturas = useProjecaoSaldo(36);

    const [selicData, setSelicData] = useState({
        taxaAnual: 11.15,
        taxaMensal: 0.0093,
        dataConsulta: "",
    });
    const [carregandoSelic, setCarregandoSelic] = useState(false);

    const [configReserva, setConfigReserva] = useState({});
    const [modalAberto, setModalAberto] = useState(false);

    const [filtroVisual, setFiltroVisual] = useState("todos"); // "todos" | "historico" | "projecao" | "marcos"
    const [termoBusca, setTermoBusca] = useState("");

    // Modo de exibição: no mobile abre em 'cards' interativos por padrão, no desktop em 'tabela'
    const [modoExibicao, setModoExibicao] = useState(() => {
        if (typeof window !== "undefined" && window.innerWidth <= 768) {
            return "cards";
        }
        return "tabela";
    });

    const [cardExpandido, setCardExpandido] = useState(null);
    const [cardSlideAtivo, setCardSlideAtivo] = useState(0);

    const tabelaRef = useRef(null);
    const metricasCarouselRef = useRef(null);

    // 1. Carregar configuração manual salva (apenas para o proprietário autorizado)
    useEffect(() => {
        if (!temAcessoInsights) return;
        let isMounted = true;
        async function carregarConfig() {
            try {
                const config = await getReservaConfig(perfilAtivo || "renato");
                if (isMounted) {
                    setConfigReserva(config);
                }
            } catch (e) {
                console.error("Erro ao carregar config da reserva:", e);
            }
        }
        carregarConfig();
        return () => {
            isMounted = false;
        };
    }, [temAcessoInsights, perfilAtivo]);

    // 2. Carregar Selic oficial da API do BCB
    useEffect(() => {
        let isMounted = true;
        async function carregarSelic() {
            try {
                const dados = await getTaxaSelicAtual();
                if (isMounted && dados) {
                    setSelicData(dados);
                }
            } catch (e) {
                console.warn("Erro ao buscar Selic inicial:", e);
            }
        }
        carregarSelic();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleAtualizarSelic = async () => {
        setCarregandoSelic(true);
        try {
            const dados = await getTaxaSelicAtual(true);
            if (dados) {
                setSelicData(dados);
            }
        } catch (e) {
            console.error("Falha ao atualizar Selic:", e);
        } finally {
            setCarregandoSelic(false);
        }
    };

    const handleSalvarConfig = async (novoConfig) => {
        const atualizado = await salvarReservaConfig(novoConfig, perfilAtivo || "renato");
        setConfigReserva(atualizado);
    };

    // 3. Obter salário do mês atual (conforme inserido pelo usuário no sistema)
    const salarioAtual = useMemo(() => {
        const ref = mesReferencia || new Date();
        const ano = ref.getFullYear();
        const mes = ref.getMonth();

        const salarioDoContexto = getSalarioDoMes ? getSalarioDoMes(ano, mes) : null;
        if (salarioDoContexto && parseCurrency(salarioDoContexto) > 0) {
            return parseCurrency(salarioDoContexto);
        }

        const entradas = getEntradasDoMes ? parseCurrency(getEntradasDoMes(ref)) : 0;
        if (entradas > 0) {
            return entradas;
        }

        return 3000;
    }, [mesReferencia, getSalarioDoMes, getEntradasDoMes]);

    // Sobra do mês atual (salário - gastos)
    const sobraMesAtual = useMemo(() => {
        const sobra = parseFloat(saldoLiquido);
        return isNaN(sobra) ? null : sobra;
    }, [saldoLiquido]);

    // Despesas essenciais recorrentes base
    const totalEssenciais = useMemo(() => {
        return (essenciais || []).reduce(
            (acc, item) => acc + parseCurrency(item.valor),
            0
        );
    }, [essenciais]);

    // Mapa de projeção de saldo líquido dos próximos meses (chave YYYY-MM -> valor)
    const mapaProjecoes = useMemo(() => {
        const mapa = {};
        if (Array.isArray(projecoesFuturas)) {
            projecoesFuturas.forEach((p) => {
                if (p.chave) {
                    mapa[p.chave] = p.valor;
                }
            });
        }
        return mapa;
    }, [projecoesFuturas]);

    // 4. Executar cálculo de projeção matemática completa (apenas para o proprietário)
    const resultadoCalculo = useMemo(() => {
        if (!temAcessoInsights) {
            return {
                linhas: [],
                salario: 0,
                meta6Meses: 0,
                saldoAtual: 0,
                rendimentoAtual: 0,
                mesesProtegidosAtual: 0,
                porcentagemMeta6Meses: 0,
                linhaAtual: null,
                marcos: {},
                taxaSelicMensal: 0,
            };
        }
        return gerarProjecaoReserva({
            salarioMensal: salarioAtual,
            saldoSobraMes: sobraMesAtual,
            taxaSelicMensal: selicData.taxaMensal,
            configManual: configReserva,
            mesReferencia: mesReferencia || new Date(),
            mapaProjecoes,
            totalEssenciais,
            isIngrid,
        });
    }, [temAcessoInsights, salarioAtual, sobraMesAtual, selicData.taxaMensal, configReserva, mesReferencia, mapaProjecoes, totalEssenciais, isIngrid]);

    const {
        linhas,
        meta6Meses,
        saldoAtual,
        rendimentoAtual,
        mesesProtegidosAtual,
        porcentagemMeta6Meses,
        linhaAtual,
        marcos,
    } = resultadoCalculo;

    // 5. Filtragem de exibição
    const linhasExibidas = useMemo(() => {
        return linhas.filter((item) => {
            if (termoBusca.trim() !== "") {
                const termo = termoBusca.toLowerCase();
                const bateAno = item.data.includes(termo);
                const bateMes = item.mes.toLowerCase().includes(termo);
                const bateIdade = String(item.idade).includes(termo);
                if (!bateAno && !bateMes && !bateIdade) return false;
            }

            if (filtroVisual === "historico") {
                return item.ehHistorico;
            }
            if (filtroVisual === "projecao") {
                return !item.ehHistorico;
            }
            if (filtroVisual === "marcos") {
                return (
                    item.ehMesAtual ||
                    item.data === marcos.meta6Meses?.data ||
                    item.data === marcos.milhao1?.data ||
                    item.data === marcos.milhao2?.data ||
                    item.data === marcos.milhao3?.data ||
                    item.data === marcos.milhao5?.data ||
                    item.data === marcos.milhao10?.data ||
                    item.data.endsWith("-09-01") // Todo aniversário em setembro
                );
            }
            return true;
        });
    }, [linhas, filtroVisual, termoBusca, marcos]);

    // 6. Rolar para o item indicado (tabela ou card)
    const scrollToLinha = (dataStr) => {
        if (!dataStr) return;
        if (filtroVisual !== "todos") {
            setFiltroVisual("todos");
        }
        setTermoBusca("");

        // Se estiver no modo cards, expande o card do alvo para visualização imediata
        if (modoExibicao === "cards") {
            setCardExpandido(dataStr);
        }

        setTimeout(() => {
            const prefixo = modoExibicao === "cards" ? "card-" : "linha-";
            const el = document.getElementById(`${prefixo}${dataStr}`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("destaque-temporario");
                setTimeout(() => {
                    el.classList.remove("destaque-temporario");
                }, 2500);
            }
        }, 120);
    };

    // Rastreamento do swipe no carrossel de métricas mobile
    const handleScrollMetricas = () => {
        if (metricasCarouselRef.current) {
            const scrollLeft = metricasCarouselRef.current.scrollLeft;
            const width = metricasCarouselRef.current.offsetWidth;
            const index = Math.round(scrollLeft / (width * 0.85));
            setCardSlideAtivo(Math.min(3, Math.max(0, index)));
        }
    };

    const toggleCard = (data) => {
        setCardExpandido((prev) => (prev === data ? null : data));
    };

    // Se o usuário logado não for o proprietário autorizado, bloqueia a visualização da reserva
    if (!temAcessoInsights) {
        return <AcessoRestritoInsights />;
    }

    return (
        <ContainerInsights>
            {/* Header da Página com Seletor de Mês */}
            <HeaderSecao>
                <div>
                    <TituloPrincipal>Insights Financeiros</TituloPrincipal>
                    <SubtituloPrincipal>
                        Reserva de Emergência, Caixinha Nubank (100% CDI) e Projeção até os 100 Anos
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

            {/* Grid de Cards de Destaque (Carrossel Horizontal no Mobile) */}
            <CarrosselMetricasWrapper>
                <GridCardsMetricas
                    ref={metricasCarouselRef}
                    onScroll={handleScrollMetricas}
                >
                    {/* Card 1: Saldo na Caixinha */}
                    <CardMetrica $bordaCor="#820ad1">
                        <CardTop>
                            <CardRotulo>Saldo Caixinha Nubank</CardRotulo>
                            <BadgeNubank>100% CDI</BadgeNubank>
                        </CardTop>
                        <CardValor>{formatCurrency(saldoAtual)}</CardValor>
                        <CardRodape>
                            <CardDetalhe>
                                Rendimento no mês:{" "}
                                <TextoPositivo>
                                    + {formatCurrency(rendimentoAtual)}
                                </TextoPositivo>
                            </CardDetalhe>
                            <BotaoAjustarSaldo
                                type="button"
                                onClick={() => setModalAberto(true)}
                            >
                                ✏️ Ajustar Saldo Real
                            </BotaoAjustarSaldo>
                        </CardRodape>
                    </CardMetrica>

                    {/* Card 2: Reserva de Emergência 6 Meses */}
                    <CardMetrica $bordaCor="#10b981">
                        <CardTop>
                            <CardRotulo>Reserva de Emergência</CardRotulo>
                            <BadgeStatus $tipo={porcentagemMeta6Meses >= 100 ? "protegido" : "abaixo"}>
                                {porcentagemMeta6Meses >= 100 ? "Protegido 🛡️" : "Em Construção 🏗️"}
                            </BadgeStatus>
                        </CardTop>
                        <CardValor>
                            {mesesProtegidosAtual}{" "}
                            <SubTextoValor>/ 6 meses</SubTextoValor>
                        </CardValor>
                        <CardRodape>
                            <BarraProgressoContainer>
                                <BarraProgressoPreenchida
                                    $porcentagem={porcentagemMeta6Meses}
                                />
                            </BarraProgressoContainer>
                            <CardDetalhe>
                                Meta: <strong>{formatCurrency(meta6Meses)}</strong> ({porcentagemMeta6Meses}%)
                            </CardDetalhe>
                            {marcos.meta6Meses && (
                                <CardDetalhe>
                                    {marcos.meta6Meses.atingido ? (
                                        <span>✅ Atingido em <strong>{marcos.meta6Meses.mes}/{marcos.meta6Meses.data.slice(0, 4)}</strong></span>
                                    ) : (
                                        <span>Previsão: <strong>{marcos.meta6Meses.mes}/{marcos.meta6Meses.data.slice(0, 4)}</strong> ({marcos.meta6Meses.idade} anos)</span>
                                    )}
                                </CardDetalhe>
                            )}
                        </CardRodape>
                    </CardMetrica>

                    {/* Card 3: Taxa Selic / CDI Oficial */}
                    <CardMetrica $bordaCor="#00b3ff">
                        <CardTop>
                            <CardRotulo>Taxa Selic / CDI</CardRotulo>
                            <BadgeOficial>BCB SGS 432</BadgeOficial>
                        </CardTop>
                        <CardValor>
                            {selicData.taxaAnual}%{" "}
                            <SubTextoValor>a.a.</SubTextoValor>
                        </CardValor>
                        <CardRodape>
                            <CardDetalhe>
                                Mensal:{" "}
                                <strong>
                                    {(selicData.taxaMensal * 100).toFixed(2)}% a.m.
                                </strong>
                            </CardDetalhe>
                            <BotaoAtualizarTaxa
                                type="button"
                                onClick={handleAtualizarSelic}
                                disabled={carregandoSelic}
                            >
                                {carregandoSelic ? "Consultando..." : "🔄 Atualizar BCB"}
                            </BotaoAtualizarTaxa>
                        </CardRodape>
                    </CardMetrica>

                    {/* Card 4: Previsão do 1º Milhão */}
                    <CardMetrica $bordaCor="#c084fc">
                        <CardTop>
                            <CardRotulo>Previsão 1º Milhão</CardRotulo>
                            <BadgeMilhao>R$ 1.000.000</BadgeMilhao>
                        </CardTop>
                        <CardValor $cor="#c084fc">1º Milhão 🏆</CardValor>
                        <CardRodape>
                            {marcos.milhao1 ? (
                                <CardDetalhe>
                                    Atingido em{" "}
                                    <strong>
                                        {marcos.milhao1.mes}/{marcos.milhao1.data.slice(0, 4)}
                                    </strong>{" "}
                                    aos <strong>{marcos.milhao1.idade} anos</strong>!
                                </CardDetalhe>
                            ) : (
                                <CardDetalhe>Calculando projeção...</CardDetalhe>
                            )}
                        </CardRodape>
                    </CardMetrica>
                </GridCardsMetricas>

                {/* Indicadores de Swipe (Mobile Dots) */}
                <DotsMetricasMobile>
                    <Dot $ativo={cardSlideAtivo === 0} />
                    <Dot $ativo={cardSlideAtivo === 1} />
                    <Dot $ativo={cardSlideAtivo === 2} />
                    <Dot $ativo={cardSlideAtivo === 3} />
                </DotsMetricasMobile>
            </CarrosselMetricasWrapper>

            {/* Barra de Atalhos Rápidos para os Marcos */}
            <BarraAtalhos>
                <TituloAtalhos>Marcos & Navegação Rápida:</TituloAtalhos>
                <BotoesAtalhosGroup>
                    <BotaoAtalho
                        $tipo="atual"
                        onClick={() => scrollToLinha(linhaAtual?.data)}
                    >
                        📍 Mês Atual
                    </BotaoAtalho>

                    {marcos.meta6Meses && (
                        <BotaoAtalho
                            $tipo="protegido"
                            onClick={() => scrollToLinha(marcos.meta6Meses.data)}
                            title={
                                marcos.meta6Meses.atingido
                                    ? `Reserva de 6 meses atingida em ${marcos.meta6Meses.mes}/${marcos.meta6Meses.data.slice(0, 4)}`
                                    : `Previsão de atingir 6 meses em ${marcos.meta6Meses.mes}/${marcos.meta6Meses.data.slice(0, 4)} aos ${marcos.meta6Meses.idade} anos`
                            }
                        >
                            🛡️ 6 Meses {marcos.meta6Meses.atingido ? `(Atingido ${marcos.meta6Meses.data.slice(0, 7)})` : `(Previsão ${marcos.meta6Meses.data.slice(0, 7)} • ${marcos.meta6Meses.idade}a)`}
                        </BotaoAtalho>
                    )}

                    {marcos.milhao1 && (
                        <BotaoAtalho
                            $tipo="milhao"
                            onClick={() => scrollToLinha(marcos.milhao1.data)}
                        >
                            🏆 1º Milhão ({marcos.milhao1.data.slice(0, 4)} • {marcos.milhao1.idade}a)
                        </BotaoAtalho>
                    )}

                    {marcos.milhao2 && (
                        <BotaoAtalho
                            $tipo="multimilhao"
                            onClick={() => scrollToLinha(marcos.milhao2.data)}
                        >
                            💎 2 Milhões ({marcos.milhao2.data.slice(0, 4)} • {marcos.milhao2.idade}a)
                        </BotaoAtalho>
                    )}

                    {marcos.milhao5 && (
                        <BotaoAtalho
                            $tipo="multimilhao"
                            onClick={() => scrollToLinha(marcos.milhao5.data)}
                        >
                            💎 5 Milhões ({marcos.milhao5.data.slice(0, 4)} • {marcos.milhao5.idade}a)
                        </BotaoAtalho>
                    )}

                    <BotaoAtalho
                        $tipo="horizonte"
                        onClick={() => scrollToLinha("2097-09-01")}
                    >
                        💯 100 Anos (2097)
                    </BotaoAtalho>
                </BotoesAtalhosGroup>
            </BarraAtalhos>

            {/* Alternador de Modo de Visualização (Cards vs Tabela) + Filtros */}
            <ControlesTabela>
                <LinhaBotoesModo>
                    <SeletorModoExibicao>
                        <BotaoModo
                            $ativo={modoExibicao === "cards"}
                            onClick={() => setModoExibicao("cards")}
                        >
                            📱 Visão Cartões
                        </BotaoModo>
                        <BotaoModo
                            $ativo={modoExibicao === "tabela"}
                            onClick={() => setModoExibicao("tabela")}
                        >
                            📊 Visão Planilha
                        </BotaoModo>
                    </SeletorModoExibicao>

                    <FiltrosTabs>
                        <TabFiltro
                            $ativo={filtroVisual === "todos"}
                            onClick={() => setFiltroVisual("todos")}
                        >
                            Todos ({linhas.length})
                        </TabFiltro>
                        <TabFiltro
                            $ativo={filtroVisual === "historico"}
                            onClick={() => setFiltroVisual("historico")}
                        >
                            🏛️ Real
                        </TabFiltro>
                        <TabFiltro
                            $ativo={filtroVisual === "projecao"}
                            onClick={() => setFiltroVisual("projecao")}
                        >
                            🔮 Projeção
                        </TabFiltro>
                        <TabFiltro
                            $ativo={filtroVisual === "marcos"}
                            onClick={() => setFiltroVisual("marcos")}
                        >
                            ⭐ Marcos
                        </TabFiltro>
                    </FiltrosTabs>
                </LinhaBotoesModo>

                <CampoBusca
                    type="text"
                    placeholder="🔍 Buscar por ano, mês ou idade..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                />
            </ControlesTabela>

            {/* ================= VISUALIZAÇÃO: MODO CARTÕES INTERATIVOS (FEED MOBILE) ================= */}
            {modoExibicao === "cards" ? (
                <FeedCardsMobile>
                    {linhasExibidas.map((item) => {
                        const dataFormatadaBR = item.data.split("-").reverse().join("/");
                        const expandido = cardExpandido === item.data;
                        return (
                            <CardLinhaMobile
                                key={item.data}
                                id={`card-${item.data}`}
                                $ehMesAtual={item.ehMesAtual}
                                $tipoMeta={item.statusMeta?.tipo}
                                onClick={() => toggleCard(item.data)}
                            >
                                <CardHeaderMobile>
                                    <div>
                                        <DataMesMobile>
                                            <strong>{item.mes}</strong> {item.data.slice(0, 4)}
                                        </DataMesMobile>
                                        <SubinfoIdadeMobile>
                                            {item.idade.toFixed(1)} anos • {dataFormatadaBR}
                                        </SubinfoIdadeMobile>
                                    </div>

                                    <BadgesGroupMobile>
                                        {item.ehMesAtual && (
                                            <BadgeMesAtual>ATUAL</BadgeMesAtual>
                                        )}
                                        <BadgeMeta $status={item.statusMeta}>
                                            {item.statusMeta?.label}
                                        </BadgeMeta>
                                    </BadgesGroupMobile>
                                </CardHeaderMobile>

                                <CardBodyMobile>
                                    <BlocoSaldoMobile>
                                        <RotuloMobile>Saldo na Caixinha</RotuloMobile>
                                        <ValorSaldoMobile $tipoMeta={item.statusMeta?.tipo}>
                                            {formatCurrency(item.valorFinal)}
                                        </ValorSaldoMobile>
                                    </BlocoSaldoMobile>

                                    <GridPillsMobile>
                                        <PillItemMobile>
                                            <RotuloPill>Aporte / Poupança</RotuloPill>
                                            <ValorPill $negativo={item.poupanca < 0}>
                                                {item.poupanca > 0 ? "+" : ""}
                                                {formatCurrency(item.poupanca)}
                                            </ValorPill>
                                        </PillItemMobile>

                                        <PillItemMobile>
                                            <RotuloPill>Rendimento do Mês</RotuloPill>
                                            <ValorPill $negativo={false}>
                                                +{formatCurrency(item.rendimento)}
                                            </ValorPill>
                                        </PillItemMobile>
                                    </GridPillsMobile>
                                </CardBodyMobile>

                                {/* Gaveta de Detalhes Sanfona */}
                                {expandido && (
                                    <DetalhesGavetaMobile onClick={(e) => e.stopPropagation()}>
                                        <ItemDetalheMobile>
                                            <span>Saldo Inicial:</span>
                                            <strong>{formatCurrency(item.valorInicial)}</strong>
                                        </ItemDetalheMobile>
                                        <ItemDetalheMobile>
                                            <span>Taxa Selic / CDI:</span>
                                            <strong style={{ color: "#38bdf8" }}>
                                                {(item.taxa * 100).toFixed(2)}% a.m.
                                            </strong>
                                        </ItemDetalheMobile>
                                        <ItemDetalheMobile>
                                            <span>Meses Protegidos:</span>
                                            <strong>{item.mesesProtegidos.toFixed(1)}x de salário</strong>
                                        </ItemDetalheMobile>
                                        <ItemDetalheMobile>
                                            <span>Tempo Decorrido:</span>
                                            <strong>{item.anoDecorrido.toFixed(1)} anos</strong>
                                        </ItemDetalheMobile>
                                        <ItemDetalheMobile>
                                            <span>Origem dos Dados:</span>
                                            <BadgeOrigem $ehHistorico={item.ehHistorico}>
                                                {item.ehHistorico ? "🏛️ Planilha Real" : "🔮 Projeção Automática"}
                                            </BadgeOrigem>
                                        </ItemDetalheMobile>
                                    </DetalhesGavetaMobile>
                                )}

                                <BotaoExpandirMobile>
                                    {expandido ? "Menos Detalhes ▲" : "Mais Detalhes ▼"}
                                </BotaoExpandirMobile>
                            </CardLinhaMobile>
                        );
                    })}
                </FeedCardsMobile>
            ) : (
                /* ================= VISUALIZAÇÃO: TABELA COMPLETA (PLANILHA) ================= */
                <TabelaContainer ref={tabelaRef}>
                    <TabelaProjecao>
                        <thead>
                            <tr>
                                <Th>Data</Th>
                                <Th>Mês</Th>
                                <Th>Idade</Th>
                                <Th>Anos Decorridos</Th>
                                <Th>Saldo Inicial</Th>
                                <Th>Aporte / Poupança</Th>
                                <Th>Taxa a.m.</Th>
                                <Th>Rendimento</Th>
                                <Th>Saldo Final</Th>
                                <Th>Meses Protegidos</Th>
                                <Th>Status / Marco</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhasExibidas.map((item) => {
                                const dataFormatadaBR = item.data.split("-").reverse().join("/");
                                return (
                                    <TrLinha
                                        key={item.data}
                                        id={`linha-${item.data}`}
                                        $ehMesAtual={item.ehMesAtual}
                                        $tipoMeta={item.statusMeta?.tipo}
                                    >
                                        <Td>
                                            <DataWrapper>
                                                {dataFormatadaBR}
                                                {item.ehMesAtual && (
                                                    <BadgeMesAtual>ATUAL</BadgeMesAtual>
                                                )}
                                            </DataWrapper>
                                        </Td>
                                        <TdMes>{item.mes}</TdMes>
                                        <Td>{item.idade.toFixed(1)} anos</Td>
                                        <Td>{item.anoDecorrido.toFixed(1)}</Td>
                                        <TdValor>{formatCurrency(item.valorInicial)}</TdValor>
                                        <TdPoupanca $negativo={item.poupanca < 0}>
                                            {item.poupanca > 0 ? "+" : ""}
                                            {formatCurrency(item.poupanca)}
                                        </TdPoupanca>
                                        <TdTaxa>{(item.taxa * 100).toFixed(2)}%</TdTaxa>
                                        <TdRendimento>
                                            +{formatCurrency(item.rendimento)}
                                        </TdRendimento>
                                        <TdSaldoFinal $tipoMeta={item.statusMeta?.tipo}>
                                            {formatCurrency(item.valorFinal)}
                                        </TdSaldoFinal>
                                        <TdProtegido>
                                            {item.mesesProtegidos.toFixed(1)}x
                                        </TdProtegido>
                                        <Td>
                                            <BadgeMeta $status={item.statusMeta}>
                                                {item.statusMeta?.label}
                                            </BadgeMeta>
                                        </Td>
                                    </TrLinha>
                                );
                            })}
                        </tbody>
                    </TabelaProjecao>
                </TabelaContainer>
            )}

            {/* Modal de Ajuste de Saldo Real */}
            {modalAberto && (
                <ModalAjusteReserva
                    configAtual={configReserva}
                    selicOficial={selicData.taxaAnual}
                    onClose={() => setModalAberto(false)}
                    onSave={handleSalvarConfig}
                />
            )}
        </ContainerInsights>
    );
}

// ==================== STYLED COMPONENTS ====================

const pulseGlow = keyframes`
    0% {
        box-shadow: 0 0 8px rgba(130, 10, 209, 0.4), inset 0 0 8px rgba(0, 179, 255, 0.15);
    }
    50% {
        box-shadow: 0 0 18px rgba(130, 10, 209, 0.75), inset 0 0 14px rgba(0, 179, 255, 0.35);
    }
    100% {
        box-shadow: 0 0 8px rgba(130, 10, 209, 0.4), inset 0 0 8px rgba(0, 179, 255, 0.15);
    }
`;

const ContainerInsights = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px 8px;
    max-width: 1440px;
    margin: 0 auto;
    width: 100%;
    color: #e0e1dd;
    box-sizing: border-box;

    @media (min-width: 769px) {
        padding: 24px 20px;
        gap: 24px;
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
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #00b3ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    @media (min-width: 769px) {
        font-size: 1.85rem;
    }
`;

const SubtituloPrincipal = styled.p`
    font-size: 0.82rem;
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

const CarrosselMetricasWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const GridCardsMetricas = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px;

    @media (max-width: 768px) {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        gap: 12px;
        padding-bottom: 6px;
        -webkit-overflow-scrolling: touch;
        &::-webkit-scrollbar {
            display: none;
        }
        scrollbar-width: none;
    }
`;

const DotsMetricasMobile = styled.div`
    display: none;

    @media (max-width: 768px) {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin-top: 4px;
    }
`;

const Dot = styled.span`
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ $ativo }) => ($ativo ? "#820ad1" : "#1e293b")};
    transition: all 0.2s ease;
    ${({ $ativo }) => $ativo && "width: 18px; border-radius: 4px;"}
`;

const CardMetrica = styled.div`
    background: #0d121f;
    border: 1px solid #1e293b;
    border-top: 3px solid ${({ $bordaCor }) => $bordaCor || "#820ad1"};
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 14px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    @media (max-width: 768px) {
        min-width: 82vw;
        scroll-snap-align: center;
        flex-shrink: 0;
        box-sizing: border-box;
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
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
    font-size: 1.65rem;
    font-weight: 800;
    color: ${({ $cor }) => $cor || "#f8fafc"};
    line-height: 1.15;
`;

const SubTextoValor = styled.span`
    font-size: 0.95rem;
    font-weight: 500;
    color: #64748b;
`;

const CardRodape = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const CardDetalhe = styled.div`
    font-size: 0.8rem;
    color: #94a3b8;

    strong {
        color: #f1f5f9;
    }
`;

const TextoPositivo = styled.span`
    color: #34d399;
    font-weight: 600;
`;

const BadgeNubank = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    color: #c084fc;
    background: rgba(130, 10, 209, 0.2);
    border: 1px solid rgba(130, 10, 209, 0.4);
    border-radius: 6px;
    padding: 3px 8px;
`;

const BadgeOficial = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 6px;
    padding: 3px 8px;
`;

const BadgeMilhao = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.35);
    border-radius: 6px;
    padding: 3px 8px;
`;

const BadgeStatus = styled.span`
    font-size: 0.72rem;
    font-weight: 700;
    border-radius: 6px;
    padding: 3px 8px;
    ${({ $tipo }) =>
        $tipo === "protegido"
            ? `
        color: #34d399;
        background: rgba(52, 211, 153, 0.15);
        border: 1px solid rgba(52, 211, 153, 0.4);
    `
            : `
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.15);
        border: 1px solid rgba(251, 191, 36, 0.4);
    `}
`;

const BarraProgressoContainer = styled.div`
    width: 100%;
    height: 6px;
    background: #1e293b;
    border-radius: 999px;
    overflow: hidden;
`;

const BarraProgressoPreenchida = styled.div`
    height: 100%;
    width: ${({ $porcentagem }) => Math.min(100, $porcentagem)}%;
    background: linear-gradient(90deg, #10b981 0%, #00b3ff 100%);
    border-radius: 999px;
    transition: width 0.4s ease;
`;

const BotaoAjustarSaldo = styled.button`
    background: rgba(130, 10, 209, 0.15);
    border: 1px solid rgba(130, 10, 209, 0.4);
    color: #d8b4fe;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease;

    &:hover {
        background: rgba(130, 10, 209, 0.3);
        color: #ffffff;
    }
`;

const BotaoAtualizarTaxa = styled.button`
    background: rgba(0, 179, 255, 0.12);
    border: 1px solid rgba(0, 179, 255, 0.35);
    color: #7dd3fc;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
        background: rgba(0, 179, 255, 0.25);
        color: #ffffff;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const BarraAtalhos = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    background: #0d121f;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 12px 18px;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        padding: 10px 12px;
    }
`;

const TituloAtalhos = styled.span`
    font-size: 0.82rem;
    font-weight: 600;
    color: #94a3b8;
`;

const BotoesAtalhosGroup = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    @media (max-width: 768px) {
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 4px;
        -webkit-overflow-scrolling: touch;
        &::-webkit-scrollbar {
            display: none;
        }
    }
`;

const BotaoAtalho = styled.button`
    font-size: 0.78rem;
    font-weight: 600;
    border-radius: 8px;
    padding: 6px 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;

    ${({ $tipo }) => {
        switch ($tipo) {
            case "atual":
                return css`
                    background: rgba(130, 10, 209, 0.2);
                    border: 1px solid #820ad1;
                    color: #d8b4fe;
                    &:hover { background: #820ad1; color: #fff; }
                `;
            case "protegido":
                return css`
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid #10b981;
                    color: #6ee7b7;
                    &:hover { background: #10b981; color: #fff; }
                `;
            case "milhao":
                return css`
                    background: rgba(192, 132, 252, 0.18);
                    border: 1px solid #9333ea;
                    color: #e9d5ff;
                    &:hover { background: #9333ea; color: #fff; }
                `;
            case "multimilhao":
                return css`
                    background: rgba(56, 189, 248, 0.15);
                    border: 1px solid #0284c7;
                    color: #bae6fd;
                    &:hover { background: #0284c7; color: #fff; }
                `;
            default:
                return css`
                    background: #1e293b;
                    border: 1px solid #334155;
                    color: #cbd5e1;
                    &:hover { background: #334155; color: #fff; }
                `;
        }
    }}
`;

const ControlesTabela = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const LinhaBotoesModo = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;

    @media (max-width: 768px) {
        justify-content: space-between;
        width: 100%;
    }
`;

const SeletorModoExibicao = styled.div`
    display: flex;
    background: #0d121f;
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 3px;
`;

const BotaoModo = styled.button`
    background: ${({ $ativo }) => ($ativo ? "#820ad1" : "transparent")};
    color: ${({ $ativo }) => ($ativo ? "#ffffff" : "#94a3b8")};
    border: none;
    border-radius: 7px;
    padding: 6px 12px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
`;

const FiltrosTabs = styled.div`
    display: flex;
    gap: 4px;
    background: #0d121f;
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 3px;
    overflow-x: auto;
`;

const TabFiltro = styled.button`
    background: ${({ $ativo }) => ($ativo ? "#1e293b" : "transparent")};
    color: ${({ $ativo }) => ($ativo ? "#f8fafc" : "#94a3b8")};
    border: none;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;

    &:hover {
        color: #f1f5f9;
    }
`;

const CampoBusca = styled.input`
    background: #0d121f;
    border: 1px solid #1e293b;
    color: #f8fafc;
    font-size: 0.85rem;
    padding: 8px 14px;
    border-radius: 10px;
    outline: none;
    width: 260px;
    transition: all 0.2s ease;

    @media (max-width: 768px) {
        width: 100%;
        box-sizing: border-box;
    }

    &:focus {
        border-color: #820ad1;
        box-shadow: 0 0 0 2px rgba(130, 10, 209, 0.2);
    }

    &::placeholder {
        color: #64748b;
    }
`;

// ==================== STYLES DO FEED MOBILE (MODO CARTÕES) ====================

const FeedCardsMobile = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
`;

const CardLinhaMobile = styled.div`
    background: #0d121f;
    border: 1px solid #1e293b;
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;

    ${({ $ehMesAtual }) =>
        $ehMesAtual &&
        css`
            background: rgba(130, 10, 209, 0.16) !important;
            border-color: #820ad1;
            animation: ${pulseGlow} 2.5s infinite ease-in-out;
        `}

    &.destaque-temporario {
        background: rgba(0, 179, 255, 0.25) !important;
        border-color: #00b3ff;
    }

    &:active {
        transform: scale(0.99);
    }
`;

const CardHeaderMobile = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
`;

const DataMesMobile = styled.div`
    font-size: 1.05rem;
    color: #f8fafc;
    text-transform: capitalize;

    strong {
        color: #ffffff;
    }
`;

const SubinfoIdadeMobile = styled.div`
    font-size: 0.74rem;
    color: #94a3b8;
    margin-top: 2px;
`;

const BadgesGroupMobile = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const CardBodyMobile = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 0;
    border-top: 1px solid #182238;
    border-bottom: 1px solid #182238;
`;

const BlocoSaldoMobile = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
`;

const RotuloMobile = styled.span`
    font-size: 0.78rem;
    color: #94a3b8;
    font-weight: 500;
`;

const ValorSaldoMobile = styled.span`
    font-size: 1.45rem;
    font-weight: 800;
    font-family: monospace;

    ${({ $tipoMeta }) => {
        switch ($tipoMeta) {
            case "multimilhao":
                return "color: #38bdf8;";
            case "milhao":
                return "color: #c084fc;";
            case "protegido":
                return "color: #34d399;";
            default:
                return "color: #fbbf24;";
        }
    }}
`;

const GridPillsMobile = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
`;

const PillItemMobile = styled.div`
    background: #131b2e;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const RotuloPill = styled.span`
    font-size: 0.68rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
`;

const ValorPill = styled.span`
    font-size: 0.88rem;
    font-weight: 700;
    font-family: monospace;
    color: ${({ $negativo }) => ($negativo ? "#f87171" : "#34d399")};
`;

const DetalhesGavetaMobile = styled.div`
    background: #090e1a;
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: fadeIn 0.18s ease-out;

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

const ItemDetalheMobile = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;

    span {
        color: #94a3b8;
    }

    strong {
        color: #f1f5f9;
        font-family: monospace;
    }
`;

const BadgeOrigem = styled.span`
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    background: ${({ $ehHistorico }) => ($ehHistorico ? "rgba(148, 163, 184, 0.15)" : "rgba(0, 179, 255, 0.15)")};
    color: ${({ $ehHistorico }) => ($ehHistorico ? "#94a3b8" : "#38bdf8")};
    border: 1px solid ${({ $ehHistorico }) => ($ehHistorico ? "rgba(148, 163, 184, 0.3)" : "rgba(0, 179, 255, 0.3)")};
`;

const BotaoExpandirMobile = styled.div`
    text-align: center;
    font-size: 0.72rem;
    font-weight: 600;
    color: #94a3b8;
    padding-top: 2px;
`;

// ==================== STYLES DA TABELA DESKTOP ====================

const TabelaContainer = styled.div`
    width: 100%;
    overflow-x: auto;
    background: #0d121f;
    border: 1px solid #1e293b;
    border-radius: 14px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

    &::-webkit-scrollbar {
        height: 8px;
    }
    &::-webkit-scrollbar-track {
        background: #0b0f19;
    }
    &::-webkit-scrollbar-thumb {
        background: #1e293b;
        border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover {
        background: #334155;
    }
`;

const TabelaProjecao = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84rem;
    text-align: left;
    white-space: nowrap;

    th, td {
        padding: 12px 16px;
    }
`;

const Th = styled.th`
    background: #131b2e;
    color: #94a3b8;
    font-weight: 700;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #1e293b;
    position: sticky;
    top: 0;
    z-index: 10;
`;

const TrLinha = styled.tr`
    border-bottom: 1px solid #141b2d;
    transition: background 0.15s ease;
    content-visibility: auto;
    contain-intrinsic-size: 45px;

    ${({ $ehMesAtual }) =>
        $ehMesAtual &&
        css`
            background: rgba(130, 10, 209, 0.18) !important;
            outline: 2px solid #820ad1;
            outline-offset: -2px;
            animation: ${pulseGlow} 2.5s infinite ease-in-out;
        `}

    &.destaque-temporario {
        background: rgba(0, 179, 255, 0.25) !important;
        outline: 2px solid #00b3ff;
    }

    &:hover {
        background: rgba(255, 255, 255, 0.03);
    }
`;

const Td = styled.td`
    color: #cbd5e1;
`;

const DataWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: monospace;
    font-size: 0.88rem;
    color: #f1f5f9;
`;

const BadgeMesAtual = styled.span`
    background: linear-gradient(135deg, #820ad1 0%, #00b3ff 100%);
    color: #ffffff;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.5px;
`;

const TdMes = styled.td`
    text-transform: capitalize;
    font-weight: 600;
    color: #e2e8f0;
`;

const TdValor = styled.td`
    font-family: monospace;
    color: #94a3b8;
`;

const TdPoupanca = styled.td`
    font-family: monospace;
    font-weight: 600;
    color: ${({ $negativo }) => ($negativo ? "#f87171" : "#34d399")};
`;

const TdTaxa = styled.td`
    font-family: monospace;
    color: #38bdf8;
`;

const TdRendimento = styled.td`
    font-family: monospace;
    font-weight: 600;
    color: #34d399;
`;

const TdSaldoFinal = styled.td`
    font-family: monospace;
    font-weight: 700;
    font-size: 0.9rem;
    ${({ $tipoMeta }) => {
        switch ($tipoMeta) {
            case "multimilhao":
                return "color: #38bdf8;";
            case "milhao":
                return "color: #c084fc;";
            case "protegido":
                return "color: #34d399;";
            default:
                return "color: #fbbf24;";
        }
    }}
`;

const TdProtegido = styled.td`
    font-family: monospace;
    font-weight: 600;
    color: #94a3b8;
`;

const BadgeMeta = styled.span`
    display: inline-block;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 4px 9px;
    border-radius: 6px;
    white-space: nowrap;
    color: ${({ $status }) => $status?.corTexto || "#94a3b8"};
    background: ${({ $status }) => $status?.corFundo || "transparent"};
    border: 1px solid ${({ $status }) => $status?.corBorda || "transparent"};
`;