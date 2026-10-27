import { useState } from "react";
import styled from "styled-components";
import { Titulos } from "../Card";
import { useGastos } from "../../context/GastosContext";

const CORES_SUGERIDAS = [
    { nome: "Azul Ciano", cor: "#00b3ff", icone: "🔵" },
    { nome: "Roxo", cor: "#820ad1", icone: "🟣" },
    { nome: "Rosa Neon", cor: "#ec4899", icone: "🌸" },
    { nome: "Verde Esmeralda", cor: "#10b981", icone: "🟢" },
    { nome: "Laranja", cor: "#f97316", icone: "🟠" },
    { nome: "Vermelho", cor: "#ef4444", icone: "🔴" },
    { nome: "Dourado", cor: "#eab308", icone: "🟡" },
];

export default function ModalGerenciarCartoes({ onClose }) {
    const { cartoesAtivos, adicionarCartaoPersonalizado, removerCartaoPersonalizado } = useGastos();

    const [nome, setNome] = useState("");
    const [diaFechamento, setDiaFechamento] = useState("30");
    const [corSelecionada, setCorSelecionada] = useState(CORES_SUGERIDAS[0]);
    const [salvando, setSalvando] = useState(false);

    const handleAdicionar = async (e) => {
        e.preventDefault();
        if (!nome.trim()) return;

        setSalvando(true);
        try {
            await adicionarCartaoPersonalizado({
                nome: nome.trim(),
                diaFechamento: parseInt(diaFechamento, 10) || 30,
                cor: corSelecionada.cor,
                icone: corSelecionada.icone,
            });
            setNome("");
            setDiaFechamento("30");
        } catch (err) {
            console.error("Erro ao adicionar cartão:", err);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Titulos className="titulo">Gerenciar Meus Cartões</Titulos>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                </Header>

                <SecaoForm>
                    <Subtitulo>Adicionar Novo Cartão</Subtitulo>
                    <Form onSubmit={handleAdicionar}>
                        <LinhaCampos>
                            <Campo>
                                <label>Nome do Cartão</label>
                                <input
                                    type="text"
                                    placeholder="Ex: C6 Bank, Santander, Nubank..."
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    required
                                />
                            </Campo>
                            <CampoPeq>
                                <label>Dia Fechamento</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={diaFechamento}
                                    onChange={(e) => setDiaFechamento(e.target.value)}
                                    required
                                />
                            </CampoPeq>
                        </LinhaCampos>

                        <label>Escolha a Cor / Ícone</label>
                        <SeletorCores>
                            {CORES_SUGERIDAS.map((c) => (
                                <BotaoCor
                                    type="button"
                                    key={c.cor}
                                    $cor={c.cor}
                                    $ativo={corSelecionada.cor === c.cor}
                                    onClick={() => setCorSelecionada(c)}
                                    title={c.nome}
                                >
                                    {c.icone}
                                </BotaoCor>
                            ))}
                        </SeletorCores>

                        <BotaoAdicionar type="submit" disabled={salvando}>
                            {salvando ? "Adicionando..." : "➕ Adicionar Cartão"}
                        </BotaoAdicionar>
                    </Form>
                </SecaoForm>

                <SecaoLista>
                    <Subtitulo>Cartões Disponíveis no Perfil</Subtitulo>
                    <ListaCartoes>
                        {cartoesAtivos.map((c) => (
                            <ItemCartao key={c.id}>
                                <InfoItem>
                                    <IconeDot $cor={c.cor}>{c.icone || "💳"}</IconeDot>
                                    <div>
                                        <strong>{c.nome}</strong>
                                        <p>
                                            {c.integrado
                                                ? "Cartão Integrado com o Renato"
                                                : `Fecha todo dia ${c.diaFechamento || 30}`}
                                        </p>
                                    </div>
                                </InfoItem>
                                {!c.integrado && (
                                    <BotaoExcluir
                                        type="button"
                                        onClick={() => removerCartaoPersonalizado(c.id)}
                                        title="Remover Cartão"
                                    >
                                        🗑️
                                    </BotaoExcluir>
                                )}
                            </ItemCartao>
                        ))}
                    </ListaCartoes>
                </SecaoLista>

                <Footer>
                    <button type="button" onClick={onClose}>
                        Concluir
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

const Subtitulo = styled.h4`
    font-size: 0.95rem;
    color: #f1f5f9;
    margin: 14px 0 10px 0;
    font-weight: 700;
`;

const SecaoForm = styled.div`
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;

    label {
        font-size: 0.85rem;
        color: #cbd5e1;
        font-weight: 600;
    }
`;

const LinhaCampos = styled.div`
    display: flex;
    gap: 12px;
`;

const Campo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

    input {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 9px 12px;
        color: #ffffff;
        font-size: 0.95rem;

        &:focus {
            outline: none;
            border-color: #00b3ff;
        }
    }
`;

const CampoPeq = styled.div`
    width: 110px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    input {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 9px 12px;
        color: #ffffff;
        font-size: 0.95rem;
        text-align: center;

        &:focus {
            outline: none;
            border-color: #00b3ff;
        }
    }
`;

const SeletorCores = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`;

const BotaoCor = styled.button`
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: ${({ $cor }) => $cor}20;
    border: 2px solid ${({ $ativo, $cor }) => ($ativo ? $cor : "rgba(255,255,255,0.1)")};
    cursor: pointer;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
        transform: scale(1.08);
    }
`;

const BotaoAdicionar = styled.button`
    background: linear-gradient(135deg, #0d6efd, #00b3ff);
    color: white;
    border: none;
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    margin-top: 6px;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.9;
    }
`;

const SecaoLista = styled.div`
    margin-top: 10px;
`;

const ListaCartoes = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
`;

const ItemCartao = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    padding: 10px 14px;
    border-radius: 10px;
`;

const InfoItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;

    strong {
        font-size: 0.92rem;
        color: #f8fafc;
        display: block;
    }

    p {
        font-size: 0.78rem;
        color: #94a3b8;
        margin: 2px 0 0 0;
    }
`;

const IconeDot = styled.span`
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: ${({ $cor }) => $cor}25;
    border: 1px solid ${({ $cor }) => $cor}50;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
`;

const BotaoExcluir = styled.button`
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    padding: 4px;
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }
`;

const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 18px;

    button {
        background: #1e293b;
        border: 1px solid #475569;
        color: #f1f5f9;
        padding: 8px 20px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;

        &:hover {
            background: #334155;
        }
    }
`;
