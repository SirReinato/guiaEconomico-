import styled from "styled-components";
import { useState } from "react";
import Card from "../../components/Card";
import GraficoComparativo from "../../components/CardComparativo";
import { CardSaldoGrafico } from "../../components/CardSaldoGrafico";
import { useResumoFinanceiro } from "../../hooks/useResumoFinanceiro";
import { useSaldo } from "../../context/SaldoContext";
import { useResumoCartoes } from "../../hooks/useResumoCartoes";
import { useResumoEssenciais } from "../../hooks/useResumoEssencial";
import ModalEssencial from "../../components/ModalGastoEssencial";
import ModalReceita from "../../components/ModalReceita";
import ModalNovoGasto from "../../components/ModalNovoGasto";
import ModalAssinaturasCartao from "../../components/ModalAssinaturasCartao";
import { useShowModals } from "../../hooks/useShowModals";
import { useResumoEvitaveis } from "../../hooks/useResumoEvitaveis";
import ListaProximosMeses from "../../components/ListaProximosMeses";
import ListaGanhosMozi from "../../components/ListaGanhosMozi";
import CardGastosAbas from "../../components/CardGastosAbas";
import { useProjecaoSaldo } from "../../hooks/useProjecaoSaldo";
import { useEssencial } from "../../context/EssencialContext";
import { useMes } from "../../context/MesContext";
import { useGastos } from "../../context/GastosContext";

export default function Home() {
    const {
        destaque: destaqueEvitaveis,
        nomesEvitaveis,
        valoresEvitaveis,
    } = useResumoEvitaveis();
    const { nomes, valores } = useResumoEssenciais();
    const {
        nomeCartao,
        valorPorCartao,
        valorTotal,
        cartoesDetalhes = [],
    } = useResumoCartoes();

    const {
        showModalGasto,
        setShowModalGasto,
        showModalSaldo,
        setShowModalSaldo,
        showModalEssencial,
        setShowModalEssencial,
        adicionarGasto,
        adicionarReceita,
        adicionarEssencial,
    } = useShowModals();

    const [modalAssinaturasAberto, setModalAssinaturasAberto] = useState(false);
    const [cartaoSelecionadoAssinatura, setCartaoSelecionadoAssinatura] = useState(null);
    const [abaInicialModalGasto, setAbaInicialModalGasto] = useState("gasto");
    const [cartaoPadraoModalGasto, setCartaoPadraoModalGasto] = useState(null);

    const { saldoLiquido, totalGeralGastos } = useResumoFinanceiro();
    const saldoNum = parseFloat(saldoLiquido) || 0;
    const isSaldoNegativo = saldoNum < 0;
    const saldoFormatado = isSaldoNegativo
        ? `- R$ ${Math.abs(saldoNum).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })}`
        : `R$ ${saldoNum.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })}`;

    const despesasNum = parseFloat(totalGeralGastos) || 0;
    const despesasFormatadas = `R$ ${despesasNum.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    const { getEntradasDoMes } = useSaldo();
    const { getGanhosMozi } = useGastos();
    const { totalGeral: ganhosMoziTotal = 0 } = getGanhosMozi
        ? getGanhosMozi()
        : {};
    const valorEntradasBase = parseFloat(getEntradasDoMes()) || 0;
    const totalEntradasComGanhos = valorEntradasBase + ganhosMoziTotal;
    const entradasFormatadas = `R$ ${totalEntradasComGanhos.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    const dadosProximosMeses = useProjecaoSaldo(3);

    const { mesReferencia, nomeMesAno, voltarMes, avancarMes } = useMes() || {};
    const dataRef = mesReferencia || new Date();

    const { getTotalEssenciais } = useEssencial();
    const totalEssenciaisMes = getTotalEssenciais(
        dataRef.getFullYear(),
        dataRef.getMonth()
    );
    const totalEssenciaisNum =
        typeof totalEssenciaisMes === "number"
            ? totalEssenciaisMes
            : parseFloat(totalEssenciaisMes) || 0;
    const totalEssenciaisFormatados = `R$ ${totalEssenciaisNum.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    // Badges de assinaturas para cada linha de cartão
    const badgesLinhasCartoes = cartoesDetalhes.map((c) =>
        c.qtdAssinaturas > 0 ? `🔄 ${c.qtdAssinaturas}` : null
    );

    const handleCliqueLinhaCartao = (index) => {
        const item = cartoesDetalhes[index];
        if (item) {
            setCartaoSelecionadoAssinatura(item.nome || item.id);
            setModalAssinaturasAberto(true);
        }
    };

    const handleAbrirNovoGastoOuAssinatura = () => {
        setAbaInicialModalGasto("gasto");
        setCartaoPadraoModalGasto(null);
        setShowModalGasto(true);
    };

    const handleAbrirNovaAssinaturaDeCartao = (cartao) => {
        setAbaInicialModalGasto("assinatura");
        setCartaoPadraoModalGasto(cartao);
        setShowModalGasto(true);
    };

    return (
        <ContainerGeralHome>
            {/* Seletor de Data: No mobile sem caixa de fundo, texto centralizado com setas simples */}
            <BarraMesNavegacaoHome>
                <BotaoMesNav onClick={voltarMes} title="Mês anterior">
                    ◀
                </BotaoMesNav>
                <MesLabelHome>{nomeMesAno}</MesLabelHome>
                <BotaoMesNav onClick={avancarMes} title="Próximo mês">
                    ▶
                </BotaoMesNav>
            </BarraMesNavegacaoHome>

            <HeaderContainer>
                <Card
                    $widthSm
                    $heightSm
                    $bgAlert
                    $isNegative={isSaldoNegativo}
                    titulo="Saldo"
                    destaque={saldoFormatado}
                    onClick={() => setShowModalSaldo(true)}
                >
                    <ListaProximosMeses dados={dadosProximosMeses} />
                </Card>
                <Card
                    $widthSm
                    $heightSm
                    $bgAlert
                    titulo="Entradas"
                    destaque={entradasFormatadas}
                >
                    <ListaGanhosMozi />
                </Card>
                <Card
                    $widthSm
                    $heightSm
                    $bgAlert
                    titulo="Despesas"
                    destaque={despesasFormatadas}
                >
                    <CardSaldoGrafico />
                </Card>
            </HeaderContainer>

            <ContainerMainCards>
                <Card
                    $bgAlert
                    titulo="Cartões"
                    destaque={valorTotal}
                    textTitulo={nomeCartao}
                    textDescricao={valorPorCartao}
                    badgesLinhas={badgesLinhasCartoes}
                    onLinhaClick={handleCliqueLinhaCartao}
                    onClick={handleAbrirNovoGastoOuAssinatura}
                />
                <Card
                    $bgAlert
                    titulo={`Financeiro (${nomeMesAno})`}
                    destaque="50/30/20"
                >
                    <GraficoComparativo />
                </Card>

                {/* No Desktop: cartões separados */}
                <DesktopCardsGroup>
                    <Card
                        $bgAlert
                        titulo="Essenciais"
                        destaque={totalEssenciaisFormatados}
                        textTitulo={nomes}
                        textDescricao={valores}
                        onClick={() => setShowModalEssencial(true)}
                    />

                    <Card
                        $bgAlert
                        titulo="Evitáveis"
                        destaque={destaqueEvitaveis}
                        textTitulo={nomesEvitaveis}
                        textDescricao={valoresEvitaveis}
                    />
                </DesktopCardsGroup>

                {/* No Mobile: Cartão unificado em Abas ("Essenciais" | "Evitáveis") */}
                <MobileCardAbasWrapper>
                    <CardGastosAbas
                        totalEssenciaisFormatados={totalEssenciaisFormatados}
                        destaqueEvitaveis={destaqueEvitaveis}
                        nomesEssenciais={nomes}
                        valoresEssenciais={valores}
                        nomesEvitaveis={nomesEvitaveis}
                        valoresEvitaveis={valoresEvitaveis}
                        onAbrirModalEssencial={() => setShowModalEssencial(true)}
                    />
                </MobileCardAbasWrapper>
            </ContainerMainCards>

            {showModalGasto && (
                <ModalNovoGasto
                    abaInicial={abaInicialModalGasto}
                    cartaoPadrao={cartaoPadraoModalGasto}
                    onClose={() => setShowModalGasto(false)}
                    onSubmit={adicionarGasto}
                />
            )}
            {modalAssinaturasAberto && (
                <ModalAssinaturasCartao
                    cartaoFiltro={cartaoSelecionadoAssinatura}
                    onClose={() => setModalAssinaturasAberto(false)}
                    onAbrirNovaAssinatura={handleAbrirNovaAssinaturaDeCartao}
                />
            )}
            {showModalSaldo && (
                <ModalReceita
                    onClose={() => setShowModalSaldo(false)}
                    onSubmit={adicionarReceita}
                />
            )}
            {showModalEssencial && (
                <ModalEssencial
                    onClose={() => setShowModalEssencial(false)}
                    onSubmit={adicionarEssencial}
                />
            )}
        </ContainerGeralHome>
    );
}

const ContainerGeralHome = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    box-sizing: border-box;
    height: 100%;

    @media (max-width: 768px) {
        height: auto;
        min-height: 100%;
        padding-bottom: 24px;
        gap: 12px;
    }
`;

export const HeaderContainer = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 25%;

    @media (max-width: 768px) {
        height: auto;
        flex-direction: column;
        gap: 12px;
    }
`;

const ContainerMainCards = styled.div`
    width: 100%;
    flex-wrap: wrap;
    display: flex;
    justify-content: space-between;
    align-items: center;
    row-gap: 16px;
    height: 75%;

    @media (max-width: 768px) {
        height: auto;
        flex-direction: column;
        gap: 14px;
    }
`;

const DesktopCardsGroup = styled.div`
    display: contents;

    @media (max-width: 768px) {
        display: none;
    }
`;

const MobileCardAbasWrapper = styled.div`
    display: none;

    @media (max-width: 768px) {
        display: block;
        width: 100%;
    }
`;

const BarraMesNavegacaoHome = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: #0d121f;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 6px 18px;
    margin-bottom: 4px;

    @media (max-width: 768px) {
        background: transparent;
        border: none;
        padding: 2px 0;
        margin-bottom: 6px;
        gap: 10px;
    }
`;

const BotaoMesNav = styled.button`
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.95rem;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.15s ease;

    &:hover {
        background: #1e293b;
        color: #00b3ff;
    }

    @media (max-width: 768px) {
        padding: 4px 8px;
        font-size: 0.85rem;
        color: #00b3ff;

        &:hover {
            background: transparent;
            color: #ffffff;
        }
    }
`;

const MesLabelHome = styled.span`
    font-size: 1.05rem;
    font-weight: 700;
    color: #f1f5f9;
    text-transform: capitalize;
    min-width: 140px;
    text-align: center;
    letter-spacing: 0.5px;

    @media (max-width: 768px) {
        font-size: 0.98rem;
        min-width: auto;
    }
`;
