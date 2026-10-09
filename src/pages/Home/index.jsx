import styled from "styled-components";
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
import { useShowModals } from "../../hooks/useShowModals";
import { useResumoEvitaveis } from "../../hooks/useResumoEvitaveis";
import ListaProximosMeses from "../../components/ListaProximosMeses";
import ListaGanhosMozi from "../../components/ListaGanhosMozi";
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
    const { nomeCartao, valorPorCartao, valorTotal } = useResumoCartoes();
    const { totalGeralGastos } = useResumoFinanceiro();

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

    const { saldoLiquido } = useResumoFinanceiro();
    const saldoFormatado = `R$ ${saldoLiquido}`;
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

    return (
        <ContainerGeralHome>
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
                    destaque={totalGeralGastos}
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
                    onClick={() => setShowModalGasto(true)}
                />
                <Card
                    $bgAlert
                    titulo={`Financeiro (${nomeMesAno})`}
                    destaque="50/30/20"
                >
                    <GraficoComparativo />
                </Card>
                <Card
                    $bgAlert
                    titulo="Essenciais"
                    destaque={`R$ ${totalEssenciaisMes}`}
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
                ></Card>
            </ContainerMainCards>
            {showModalGasto && (
                <ModalNovoGasto
                    onClose={() => setShowModalGasto(false)}
                    onSubmit={adicionarGasto}
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
        padding-bottom: 32px;
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
        gap: 16px;
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
`;

const MesLabelHome = styled.span`
    font-size: 1.05rem;
    font-weight: 700;
    color: #f1f5f9;
    text-transform: capitalize;
    min-width: 140px;
    text-align: center;
    letter-spacing: 0.5px;
`;
