import { useState } from "react";
import styled from "styled-components";

export default function ListaProximosMeses({ dados = [] }) {
    const [expandido, setExpandido] = useState(false);

    if (!Array.isArray(dados) || dados.length === 0) {
        return null;
    }

    return (
        <Container>
            <BotaoExpandirMobile
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setExpandido(!expandido);
                }}
            >
                {expandido ? "Ocultar meses anteriores ▲" : "Ver meses anteriores ▼"}
            </BotaoExpandirMobile>

            <ConteudoLista $expandido={expandido}>
                {dados.map((item, index) => (
                    <Linha key={index}>
                        <Mes>{item.mes}</Mes>
                        <Valor $positivo={item.valor >= 0}>
                            {item.valor < 0 ? "- " : ""}R${" "}
                            {Math.abs(item.valor).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </Valor>
                    </Linha>
                ))}
            </ConteudoLista>
        </Container>
    );
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 8px;
    width: 100%;
`;

const BotaoExpandirMobile = styled.button`
    display: none;
    background: transparent;
    border: none;
    color: #38bdf8;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 0 2px 0;
    text-align: left;
    transition: color 0.15s ease;

    &:hover {
        color: #00b3ff;
        text-decoration: underline;
    }

    @media (max-width: 768px) {
        display: inline-block;
    }
`;

const ConteudoLista = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;

    @media (max-width: 768px) {
        display: ${({ $expandido }) => ($expandido ? "flex" : "none")};
        animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const Linha = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);

    &:last-child {
        border-bottom: none;
    }
`;

const Mes = styled.span`
    font-size: 0.95em;
    font-weight: 500;
    color: #94a3b8;
    text-align: left;
`;

const Valor = styled.span`
    font-size: 0.95em;
    font-weight: 600;
    text-align: right;
    font-family: 'Roboto', sans-serif;
    color: ${({ $positivo, theme }) =>
        $positivo ? theme.colors.success || "#10b981" : theme.colors.error || "#ef4444"};
`;
