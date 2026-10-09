import styled from "styled-components";

export default function ListaProximosMeses({ dados = [] }) {
    if (!Array.isArray(dados)) {
        console.warn("ListaProximosMeses recebeu dados inválidos:", dados);
        return null;
    }

    return (
        <Container>
            {dados.map((item, index) => (
                <Linha key={index}>
                    <Mes>{item.mes}</Mes>
                    <Valor positivo={item.valor >= 0}>
                        {item.valor < 0 ? "- " : ""}R${" "}
                        {Math.abs(item.valor).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </Valor>
                </Linha>
            ))}
        </Container>
    );
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
`;

const Linha = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const Mes = styled.span`
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textSecondary};
`;

const Valor = styled.span`
    font-weight: bold;
    color: ${({ positivo, theme }) =>
        positivo ? theme.colors.success : theme.colors.error};
`;
