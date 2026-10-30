import { useState, useEffect } from "react";
import styled from "styled-components";
import { Titulos } from "../Card";
import { useGastos } from "../../context/GastosContext";
import { useMes } from "../../context/MesContext";

export default function ModalFaturaItau({ onClose }) {
    const { faturasItau, salvarFaturaItauMes, chaveMesAtual } = useGastos();
    const { nomeMesAno } = useMes() || {};

    const [valorInput, setValorInput] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        const valorExistente = faturasItau[chaveMesAtual];
        if (valorExistente !== undefined && valorExistente !== null) {
            setValorInput(
                Number(valorExistente).toFixed(2).replace(".", ",")
            );
        } else {
            setValorInput("");
        }
    }, [faturasItau, chaveMesAtual]);

    const handleSalvar = async (e) => {
        e.preventDefault();
        setSalvando(true);
        try {
            await salvarFaturaItauMes(chaveMesAtual, valorInput);
            onClose();
        } catch (err) {
            console.error("Erro ao salvar fatura Itaú:", err);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Titulos className="titulo">Fatura Cartão Itaú (Ingrid)</Titulos>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                </Header>

                <Descricao>
                    Informe o valor total da fatura do <strong>Itaú</strong> para{" "}
                    <span className="destaque-mes">{nomeMesAno}</span>. Esse valor
                    aparece diretamente no painel da Ingrid como fatura do cartão dela e
                    <strong> não altera suas despesas pessoais</strong>.
                </Descricao>

                <Form onSubmit={handleSalvar}>
                    <label>Valor Total da Fatura (R$)</label>
                    <input
                        type="text"
                        placeholder="R$ 0,00"
                        value={valorInput}
                        onChange={(e) => setValorInput(e.target.value)}
                        required
                        autoFocus
                    />

                    <Footer>
                        <button type="button" onClick={onClose} disabled={salvando}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar Fatura"}
                        </button>
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
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1100;
    backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
    background: #0d121f;
    padding: 24px;
    border-radius: 18px;
    width: 440px;
    max-width: 90vw;
    border: 1px solid rgba(234, 88, 12, 0.4);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    box-sizing: border-box;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 12px;

    .titulo {
        font-size: 1.3em;
        color: #ea580c;
    }
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.8rem;
    cursor: pointer;
    line-height: 1;

    &:hover {
        color: #ffffff;
    }
`;

const Descricao = styled.p`
    font-size: 0.88rem;
    color: #94a3b8;
    line-height: 1.4;
    margin: 14px 0 16px 0;

    .destaque-mes {
        color: #00b3ff;
        font-weight: bold;
    }

    strong {
        color: #f1f5f9;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;

    label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #cbd5e1;
    }

    input {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 10px 14px;
        color: #f8fafc;
        font-size: 1.15rem;
        font-weight: bold;

        &:focus {
            outline: none;
            border-color: #ea580c;
        }
    }
`;

const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 14px;

    button {
        padding: 9px 18px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }

    button[type="button"] {
        background: transparent;
        border: 1px solid #475569;
        color: #94a3b8;

        &:hover {
            background: #1e293b;
            color: #ffffff;
        }
    }

    button[type="submit"] {
        background: linear-gradient(135deg, #ea580c, #f97316);
        border: none;
        color: #ffffff;

        &:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
    }
`;
