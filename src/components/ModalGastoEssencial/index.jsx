import { useState, useEffect } from "react";
import styled from "styled-components";
import { Titulos } from "../Card";
import { useEssencial } from "../../context/EssencialContext";
import { parseCurrency } from "../../utils/currencyUtils";

const TIPOS_SUGERIDOS = [
    "Aluguel",
    "Água",
    "Energia / Luz",
    "Internet",
    "Supermercado",
    "Manutenção",
    "Pós-graduação",
    "Anuidade OAB",
    "Plano de Saúde",
    "Outro (Personalizado)",
];

export default function ModalEssencial({ onClose }) {
    const { essenciais, atualizarEssencial, adicionarEssencial, removerEssencial } = useEssencial();

    const [tipoSelecionado, setTipoSelecionado] = useState(TIPOS_SUGERIDOS[0]);
    const [nomePersonalizado, setNomePersonalizado] = useState("");
    const [valorInput, setValorInput] = useState("");
    const [salvando, setSalvando] = useState(false);

    // Pré-preenche o valor quando seleciona um tipo existente
    useEffect(() => {
        if (!tipoSelecionado || tipoSelecionado === "Outro (Personalizado)") return;

        const item = essenciais.find(
            (e) => e.tipo?.toLowerCase() === tipoSelecionado.toLowerCase()
        );

        if (item && item.valor !== undefined) {
            setValorInput(
                String(item.valor).includes(",")
                    ? String(item.valor)
                    : Number(item.valor).toFixed(2).replace(".", ",")
            );
        } else {
            setValorInput("");
        }
    }, [tipoSelecionado, essenciais]);

    const handleSalvar = async (e) => {
        e.preventDefault();
        const nomeFinal =
            tipoSelecionado === "Outro (Personalizado)"
                ? nomePersonalizado.trim()
                : tipoSelecionado;

        if (!nomeFinal) return;

        setSalvando(true);
        try {
            const itemExistente = essenciais.find(
                (item) => item.tipo?.toLowerCase() === nomeFinal.toLowerCase()
            );

            if (itemExistente) {
                await atualizarEssencial(itemExistente.id, {
                    ...itemExistente,
                    tipo: nomeFinal,
                    valor: valorInput,
                    data: new Date().toISOString().split("T")[0],
                });
            } else {
                await adicionarEssencial({
                    tipo: nomeFinal,
                    valor: valorInput,
                    data: new Date().toISOString().split("T")[0],
                });
            }
            setValorInput("");
            setNomePersonalizado("");
            onClose();
        } catch (err) {
            console.error("Erro ao salvar gasto essencial:", err);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Titulos className="titulo">Gastos Essenciais</Titulos>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                </Header>

                <Form onSubmit={handleSalvar}>
                    <label>Tipo do Gasto Essencial</label>
                    <select
                        value={tipoSelecionado}
                        onChange={(e) => setTipoSelecionado(e.target.value)}
                    >
                        {TIPOS_SUGERIDOS.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>

                    {tipoSelecionado === "Outro (Personalizado)" && (
                        <div>
                            <label>Nome do Gasto Personalizado</label>
                            <input
                                type="text"
                                placeholder="Ex: Anuidade OAB, Escritório, Academia..."
                                value={nomePersonalizado}
                                onChange={(e) => setNomePersonalizado(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    )}

                    <label>Valor Mensal (R$)</label>
                    <input
                        type="text"
                        placeholder="R$ 0,00"
                        value={valorInput}
                        onChange={(e) => setValorInput(e.target.value)}
                        required
                    />

                    <BotaoSalvar type="submit" disabled={salvando}>
                        {salvando ? "Salvando..." : "Salvar Gasto Essencial"}
                    </BotaoSalvar>
                </Form>

                {essenciais && essenciais.length > 0 && (
                    <ListaCadastrados>
                        <Subtitulo>Essenciais Cadastrados ({essenciais.length})</Subtitulo>
                        <ItensContainer>
                            {essenciais.map((item) => (
                                <LinhaItem key={item.id}>
                                    <Nome>{item.tipo}</Nome>
                                    <Direita>
                                        <Valor>
                                            R${" "}
                                            {parseCurrency(item.valor).toLocaleString("pt-BR", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </Valor>
                                        <BotaoRemover
                                            type="button"
                                            onClick={() => removerEssencial(item.id)}
                                            title="Excluir gasto essencial"
                                        >
                                            🗑️
                                        </BotaoRemover>
                                    </Direita>
                                </LinhaItem>
                            ))}
                        </ItensContainer>
                    </ListaCadastrados>
                )}

                <Footer>
                    <button type="button" onClick={onClose}>
                        Fechar
                    </button>
                </Footer>
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
    width: 480px;
    max-width: 92vw;
    max-height: 85vh;
    overflow-y: auto;
    border: 1px solid rgba(0, 179, 255, 0.3);
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
        font-size: 1.35em;
        color: #00b3ff;
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

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 14px;

    label {
        font-size: 0.85rem;
        color: #cbd5e1;
        font-weight: 600;
        margin-bottom: 2px;
        display: block;
    }

    select,
    input {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 9px 12px;
        color: #ffffff;
        font-size: 0.95rem;
        width: 100%;
        box-sizing: border-box;

        &:focus {
            outline: none;
            border-color: #00b3ff;
        }
    }
`;

const BotaoSalvar = styled.button`
    background: linear-gradient(135deg, #0d6efd, #00b3ff);
    color: white;
    border: none;
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    margin-top: 4px;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.9;
    }
`;

const ListaCadastrados = styled.div`
    margin-top: 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 14px;
`;

const Subtitulo = styled.h4`
    font-size: 0.88rem;
    color: #94a3b8;
    margin-bottom: 8px;
    font-weight: 600;
`;

const ItensContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 150px;
    overflow-y: auto;
`;

const LinhaItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    padding: 8px 12px;
    border-radius: 8px;
`;

const Nome = styled.span`
    color: #f1f5f9;
    font-size: 0.9rem;
    font-weight: 500;
`;

const Direita = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const Valor = styled.span`
    color: #00b3ff;
    font-weight: bold;
    font-size: 0.95rem;
    font-family: "Roboto", sans-serif;
`;

const BotaoRemover = styled.button`
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.7;

    &:hover {
        opacity: 1;
    }
`;

const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;

    button {
        background: #1e293b;
        border: 1px solid #475569;
        color: #f1f5f9;
        padding: 8px 18px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;

        &:hover {
            background: #334155;
        }
    }
`;
