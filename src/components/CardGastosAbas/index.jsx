import { useState } from "react";
import styled from "styled-components";

export default function CardGastosAbas({
    totalEssenciaisFormatados,
    destaqueEvitaveis,
    nomesEssenciais = [],
    valoresEssenciais = [],
    nomesEvitaveis = [],
    valoresEvitaveis = [],
    onAbrirModalEssencial,
}) {
    const [abaAtiva, setAbaAtiva] = useState("essenciais");

    const ehEssenciais = abaAtiva === "essenciais";
    const destaqueAtual = ehEssenciais ? totalEssenciaisFormatados : destaqueEvitaveis;
    const nomesAtuais = ehEssenciais ? nomesEssenciais : nomesEvitaveis;
    const valoresAtuais = ehEssenciais ? valoresEssenciais : valoresEvitaveis;

    return (
        <CardContainer>
            <HeaderCard>
                <AbasSelector>
                    <BotaoAba
                        type="button"
                        $ativo={ehEssenciais}
                        onClick={() => setAbaAtiva("essenciais")}
                    >
                        Essenciais
                    </BotaoAba>
                    <BotaoAba
                        type="button"
                        $ativo={!ehEssenciais}
                        onClick={() => setAbaAtiva("evitaveis")}
                    >
                        Evitáveis
                    </BotaoAba>
                </AbasSelector>

                {destaqueAtual && (
                    <DestaqueValor>
                        {destaqueAtual}
                    </DestaqueValor>
                )}
            </HeaderCard>

            {ehEssenciais && onAbrirModalEssencial && (
                <AcaoLinha>
                    <BotaoAdicionar onClick={onAbrirModalEssencial}>
                        ⚙️ Gerenciar Gastos Essenciais
                    </BotaoAdicionar>
                </AcaoLinha>
            )}

            <CorpoLista>
                {Array.isArray(nomesAtuais) && nomesAtuais.length > 0 ? (
                    nomesAtuais.map((nome, index) => (
                        <LinhaItem key={index}>
                            <ItemNome>{nome}</ItemNome>
                            <ItemValor>{valoresAtuais[index]}</ItemValor>
                        </LinhaItem>
                    ))
                ) : (
                    <ListaVazia>Nenhum item registrado</ListaVazia>
                )}
            </CorpoLista>
        </CardContainer>
    );
}

const CardContainer = styled.div`
    width: 100%;
    background-color: ${({ theme }) => theme.colors.cardsBg || "#060f1a"};
    border-radius: 18px;
    padding: 20px 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    min-height: 240px;

    @media (max-width: 768px) {
        padding: 16px 16px;
        border-radius: 16px;
        min-height: auto;
    }
`;

const HeaderCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    gap: 10px;

    @media (max-width: 480px) {
        gap: 8px;
    }
`;

const AbasSelector = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.04);
    padding: 3px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.06);
`;

const BotaoAba = styled.button`
    background: ${({ $ativo }) =>
        $ativo ? "rgba(0, 179, 255, 0.16)" : "transparent"};
    border: ${({ $ativo }) =>
        $ativo ? "1px solid rgba(0, 179, 255, 0.4)" : "1px solid transparent"};
    color: ${({ $ativo }) => ($ativo ? "#00d2ff" : "#94a3b8")};
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 1.05em;
    font-family: inherit;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
        color: #ffffff;
    }

    @media (max-width: 480px) {
        font-size: 0.9em;
        padding: 5px 8px;
    }
`;

const DestaqueValor = styled.h2`
    padding: 7px 13px;
    border-radius: 10px;
    font-size: 1.35em;
    font-family: "Bebas Neue", sans-serif;
    letter-spacing: 0.12em;
    white-space: nowrap;
    flex-shrink: 0;
    margin: 0;
    background: rgba(130, 10, 209, 0.15);
    color: #00d2ff;
    border: 1px solid rgba(0, 179, 255, 0.25);
    box-shadow: 0 0 10px rgba(130, 10, 209, 0.15);

    @media (max-width: 480px) {
        font-size: 1.15em;
        padding: 5px 9px;
    }
`;

const AcaoLinha = styled.div`
    margin-top: 10px;
`;

const BotaoAdicionar = styled.button`
    background: transparent;
    border: none;
    color: #38bdf8;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    padding: 2px 0;
    text-align: left;
    transition: color 0.15s ease;

    &:hover {
        color: #00b3ff;
        text-decoration: underline;
    }
`;

const CorpoLista = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-top: 12px;
    flex: 1;
    min-height: 0;
    max-height: 220px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 6px;

    scrollbar-width: thin;
    scrollbar-color: rgba(130, 10, 209, 0.5) transparent;

    &::-webkit-scrollbar {
        width: 5px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(130, 10, 209, 0.4);
        border-radius: 6px;
    }

    @media (max-width: 768px) {
        max-height: 280px;
    }
`;

const LinhaItem = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);

    &:last-child {
        border-bottom: none;
    }
`;

const ItemNome = styled.h3`
    font-size: 1.05em;
    letter-spacing: 0.05em;
    font-weight: 500;
    text-align: left;
    color: #e2e8f0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 12px;
    margin: 0;

    @media (max-width: 480px) {
        font-size: 0.92em;
    }
`;

const ItemValor = styled.p`
    font-size: 1.05em;
    letter-spacing: 0.05em;
    color: #00b3ff;
    text-align: right;
    font-weight: 600;
    white-space: nowrap;
    font-family: 'Roboto', sans-serif;
    margin: 0;

    @media (max-width: 480px) {
        font-size: 0.92em;
    }
`;

const ListaVazia = styled.p`
    color: #64748b;
    font-size: 0.9em;
    text-align: center;
    padding: 16px 0;
    margin: 0;
`;
