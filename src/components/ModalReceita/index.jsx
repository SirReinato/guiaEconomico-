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
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Titulos className="titulo">Nova receita</Titulos>
                    <CloseButton onClick={onClose} type="button">&times;</CloseButton>
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
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1100;
    backdrop-filter: blur(4px);
    padding: 12px;
    box-sizing: border-box;
`;

const ModalContent = styled.div`
    background: linear-gradient(135deg, #0c3b70, #0077b6);
    padding: 22px 20px;
    border-radius: 18px;
    width: min(94vw, 440px);
    max-height: 90dvh;
    overflow-y: auto;
    border: 2px solid ${({ theme }) => theme.colors.secondary || "#00b3ff"};
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
    box-sizing: border-box;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    .titulo {
        color: ${({ theme }) => theme.colors.surface};
        font-size: 1.25rem;
    }
`;

const CloseButton = styled.button`
    background: transparent;
    border: none;
    color: ${({ theme }) => theme.colors.surface};
    font-size: 1.8rem;
    cursor: pointer;
    line-height: 1;
    padding: 0 6px;
    transition: all 0.2s;
    &:hover {
        transform: scale(1.15);
        color: #ff6b6b;
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
        font-size: 0.85rem;
        letter-spacing: 0.5px;
    }

    input,
    select {
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background-color: ${({ theme }) => theme.colors.background || "#040812"};
        color: ${({ theme }) => theme.colors.surface || "#ffffff"};
        font-size: 16px;
        box-sizing: border-box;
    }

    input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
    }
`;

const Footer = styled.div`
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    button {
        padding: 10px 18px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        background-color: ${({ theme }) => theme.colors.surface};
        color: ${({ theme }) => theme.colors.secondary};
        transition: all 0.2s;

        &:hover {
            background: ${({ theme }) => theme.colors.primary};
            color: ${({ theme }) => theme.colors.surface};
        }
        &:first-child {
            background-color: rgba(255, 255, 255, 0.15);
            color: #ffffff;
        }
    }
`;
