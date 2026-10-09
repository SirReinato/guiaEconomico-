import { useForm } from "react-hook-form";
import styled from "styled-components";
import { Titulos } from "../Card";

import { useMes } from "../../context/MesContext";

export default function ModalReceita({ onClose, onSubmit, dataPadrao, valorPadrao, tipoPadrao = "Salario" }) {
    const { mesReferencia } = useMes() || {};

    const getDataInicial = () => {
        if (dataPadrao) return dataPadrao;
        if (mesReferencia) {
            const ano = mesReferencia.getFullYear();
            const mes = String(mesReferencia.getMonth() + 1).padStart(2, "0");
            const dia = "05"; // dia padrão comum para salário
            return `${ano}-${mes}-${dia}`;
        }
        return new Date().toISOString().split("T")[0];
    };

    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            data: getDataInicial(),
            valor: valorPadrao || "",
            tipo: tipoPadrao,
        },
    });

    const handleFormSubmit = (data) => {
        onSubmit(data);
        reset();
        onClose();
    };
    return (
        <Overlay>
            <ModalContent>
                <Header>
                    <Titulos className="titulo">Nova receita</Titulos>
                    <CloseButton onClick={onClose}>X</CloseButton>
                </Header>

                <Form onSubmit={handleSubmit(handleFormSubmit)}>
                    <label>Data</label>
                    <input
                        type="date"
                        {...register("data", { required: true })}
                    />

                    <label>Valor</label>
                    <input
                        type="text"
                        placeholder="R$ 0,00"
                        {...register("valor", { required: true })}
                    />

                    <label>Tipo</label>
                    <select {...register("tipo", { required: true })}>
                        <option value="Salario">Salário</option>
                        <option value="Outro">Ganho</option>
                        <option value="gastoNeguinha">PgNeguinha</option>
                    </select>
                    <Footer>
                        <button type="button" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit">Salvar</button>
                    </Footer>
                </Form>
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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background: linear-gradient(to right, #0c3b70, #00b3ff);
    padding: 24px;
    border-radius: 16px;
    width: 40%;
    max-width: 60%;
    border: 4px solid ${({ theme }) => theme.colors.secondary};
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    .titulo {
        color: ${({ theme }) => theme.colors.surface};
    }
`;

const CloseButton = styled.button`
    background: ${({ theme }) => theme.colors.surface};
    border: none;
    border-radius: 50%;
    padding: 4px 12px;
    color: ${({ theme }) => theme.colors.secondary};
    font-size: 2rem;
    cursor: pointer;
    &:hover {
        background: ${({ theme }) => theme.colors.secondary};
        color: ${({ theme }) => theme.colors.surface};
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;

    label {
        color: ${({ theme }) => theme.colors.surface};
        font-weight: bold;
        letter-spacing: 0.9px;
    }

    input,
    select {
        padding: 8px;
        border-radius: 6px;
        border: 1px solid #000;
        background-color: ${({ theme }) => theme.colors.background};
        color: ${({ theme }) => theme.colors.surface};
    }
    input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
    }
`;

const Footer = styled.div`
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    button {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        background-color: ${({ theme }) => theme.colors.surface};
        color: ${({ theme }) => theme.colors.secondary};
        &:hover {
            background: ${({ theme }) => theme.colors.primary};
            color: ${({ theme }) => theme.colors.surface};
        }
        &:first-child {
            background-color: ${({ theme }) => theme.colors.cardsBg};
        }
    }
`;
