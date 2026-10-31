import { useState } from "react";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import { Titulos } from "../Card";
import { parseCurrency } from "../../utils/currencyUtils";
import { CATEGORIAS_PADRAO } from "../../utils/categoriasGasto";
import { useGastos } from "../../context/GastosContext";
import { useAuth } from "../../context/AuthContext";

export default function ModalNovoGasto({ onClose, onSubmit, abaInicial = "gasto", cartaoPadrao }) {
    const { cartoesAtivos, adicionarAssinatura } = useGastos() || {};
    const { isIngrid } = useAuth() || {};

    const [abaAtiva, setAbaAtiva] = useState(abaInicial); // "gasto" | "assinatura"

    const cartoesDisponiveis = (cartoesAtivos || []).filter(
        (c) => !c.nome?.includes("Cartões do Renato") && !c.id?.includes("Cartões do Renato") &&
               !c.nome?.includes("Cartões da Ingrid") && !c.id?.includes("Cartões da Ingrid")
    );

    const cartaoInicial = cartaoPadrao || (cartoesDisponiveis.length > 0
        ? cartoesDisponiveis[0].nome || cartoesDisponiveis[0].id
        : "Nubank");

    // Form Gasto
    const { register, handleSubmit, reset, watch } = useForm({
        defaultValues: {
            parcelas: "1",
            responsavel: "meu",
            categoria: "Supermercado",
            categoriaPersonalizada: "",
            cartao: cartaoInicial,
        },
    });

    // Form Assinatura
    const {
        register: registerAssinatura,
        handleSubmit: handleSubmitAssinatura,
        reset: resetAssinatura,
        watch: watchAssinatura,
    } = useForm({
        defaultValues: {
            nome: "",
            valor: "",
            cartao: cartaoInicial,
            responsavel: "meu",
            tipo: "Desejo",
            categoria: "Assinaturas",
            dataInicio: new Date().toISOString().split("T")[0],
        },
    });

    const valorWatch = watch("valor");
    const parcelasWatch = watch("parcelas");
    const responsavelWatch = watch("responsavel");
    const categoriaWatch = watch("categoria");
    const numParcelas = parseInt(parcelasWatch, 10) || 1;
    const valorNumerico = parseCurrency(valorWatch);

    const valorAssinWatch = watchAssinatura("valor");
    const responsavelAssinWatch = watchAssinatura("responsavel");
    const valorAssinNumerico = parseCurrency(valorAssinWatch);

    const handleFormSubmitGasto = (data) => {
        let categoriaFinal = data.categoria;
        if (data.categoria === "OUTRO") {
            categoriaFinal = data.categoriaPersonalizada?.trim() || "Outros";
        }

        const payload = {
            ...data,
            categoria: categoriaFinal,
        };
        delete payload.categoriaPersonalizada;

        onSubmit(payload);
        reset();
        onClose();
    };

    const handleFormSubmitAssinatura = async (data) => {
        const payload = {
            nome: data.nome?.trim() || "Assinatura",
            valor: parseCurrency(data.valor),
            cartao: data.cartao,
            responsavel: data.responsavel || "meu",
            tipo: data.tipo || "Desejo",
            categoria: data.categoria?.trim() || "Assinaturas",
            dataInicio: data.dataInicio || new Date().toISOString().split("T")[0],
            inicioCiclo: (data.dataInicio || new Date().toISOString().split("T")[0]).substring(0, 7),
        };

        if (adicionarAssinatura) {
            await adicionarAssinatura(payload);
        }
        resetAssinatura();
        onClose();
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Titulos className="titulo">
                        {abaAtiva === "gasto" ? "Adicionar Novo Gasto" : "Nova Assinatura"}
                    </Titulos>
                    <CloseButton onClick={onClose} type="button">&times;</CloseButton>
                </Header>

                {/* Abas Alternadoras: Novo Gasto vs Nova Assinatura */}
                <AbasContainer>
                    <BotaoAba
                        type="button"
                        $ativo={abaAtiva === "gasto"}
                        onClick={() => setAbaAtiva("gasto")}
                    >
                        🛒 Novo Gasto
                    </BotaoAba>
                    <BotaoAba
                        type="button"
                        $ativo={abaAtiva === "assinatura"}
                        onClick={() => setAbaAtiva("assinatura")}
                    >
                        🔄 Nova Assinatura
                    </BotaoAba>
                </AbasContainer>

                {abaAtiva === "gasto" ? (
                    <Form onSubmit={handleSubmit(handleFormSubmitGasto)}>
                        <label>Data</label>
                        <input
                            type="date"
                            {...register("data", { required: true })}
                        />

                        <label>Valor Total</label>
                        <input
                            type="text"
                            placeholder="R$ 0,00"
                            {...register("valor", { required: true })}
                        />

                        <label>Responsável pelo Gasto</label>
                        <select {...register("responsavel")}>
                            <option value="meu">Meu (Próprio)</option>
                            {!isIngrid && (
                                <option value="mozi">Mozi (100% Reembolsável)</option>
                            )}
                            <option value="dividido">Dividido (50% cada)</option>
                        </select>

                        {!isIngrid && responsavelWatch === "mozi" && valorNumerico > 0 && (
                            <InfoMozi>
                                💕 R$ {valorNumerico.toFixed(2).replace(".", ",")}{" "}
                                será adicionado em Ganhos+ (Mozi)
                            </InfoMozi>
                        )}

                        {responsavelWatch === "dividido" && valorNumerico > 0 && (
                            <InfoMozi>
                                🤝 R${" "}
                                {(valorNumerico / 2)
                                    .toFixed(2)
                                    .replace(".", ",")}{" "}
                                para cada (50% dividido)
                            </InfoMozi>
                        )}

                        <label>Tipo</label>
                        <select {...register("tipo", { required: true })}>
                            <option value="Essencial">Essencial</option>
                            <option value="Desejo">Desejo</option>
                            <option value="Poupança">Poupança</option>
                            <option value="Educacao">Educação</option>
                        </select>

                        <label>Categoria</label>
                        <select {...register("categoria", { required: true })}>
                            {CATEGORIAS_PADRAO.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>

                        {categoriaWatch === "OUTRO" && (
                            <CampoPersonalizado>
                                <label>Nome da Categoria Personalizada</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Livros, Farmácia..."
                                    {...register("categoriaPersonalizada", {
                                        required: categoriaWatch === "OUTRO",
                                    })}
                                />
                            </CampoPersonalizado>
                        )}

                        <label>Cartão</label>
                        <select {...register("cartao", { required: true })}>
                            {cartoesDisponiveis.map((c) => (
                                <option key={c.id || c.nome} value={c.nome || c.id}>
                                    {c.icone} {c.nome}
                                </option>
                            ))}
                        </select>

                        <label>Parcelas</label>
                        <select {...register("parcelas")}>
                            <option value="1">À vista (1x)</option>
                            <option value="2">2x</option>
                            <option value="3">3x</option>
                            <option value="4">4x</option>
                            <option value="5">5x</option>
                            <option value="6">6x</option>
                            <option value="7">7x</option>
                            <option value="8">8x</option>
                            <option value="9">9x</option>
                            <option value="10">10x</option>
                            <option value="11">11x</option>
                            <option value="12">12x</option>
                        </select>

                        {numParcelas > 1 && valorNumerico > 0 && (
                            <InfoParcelas>
                                Serão lançadas {numParcelas} parcelas de ~R${" "}
                                {(valorNumerico / numParcelas)
                                    .toFixed(2)
                                    .replace(".", ",")}{" "}
                                nos próximos meses.
                            </InfoParcelas>
                        )}

                        <Footer>
                            <button type="button" onClick={onClose}>
                                Cancelar
                            </button>
                            <button type="submit">Salvar Gasto</button>
                        </Footer>
                    </Form>
                ) : (
                    /* Formulário de Assinatura Recorrente */
                    <Form onSubmit={handleSubmitAssinatura(handleFormSubmitAssinatura)}>
                        <InfoAssinaturaAviso>
                            🔄 <strong>Cobrança Recorrente Automática:</strong> Esta assinatura será incluída todo mês na fatura deste cartão até você decidir cancelar.
                        </InfoAssinaturaAviso>

                        <label>Nome do Serviço / Assinatura</label>
                        <input
                            type="text"
                            placeholder="Ex: Netflix, Spotify, iCloud, Academia..."
                            {...registerAssinatura("nome", { required: true })}
                            autoFocus
                        />

                        <label>Valor Mensal (R$)</label>
                        <input
                            type="text"
                            placeholder="Ex: 55,90"
                            {...registerAssinatura("valor", { required: true })}
                        />

                        <label>Cobrar em qual Cartão?</label>
                        <select {...registerAssinatura("cartao", { required: true })}>
                            {cartoesDisponiveis.map((c) => (
                                <option key={c.id || c.nome} value={c.nome || c.id}>
                                    {c.icone} {c.nome}
                                </option>
                            ))}
                        </select>

                        <label>Data de Início / Dia da Cobrança</label>
                        <input
                            type="date"
                            {...registerAssinatura("dataInicio", { required: true })}
                        />

                        <label>Responsável pelo Pagamento</label>
                        <select {...registerAssinatura("responsavel")}>
                            <option value="meu">Meu (100% Próprio)</option>
                            {!isIngrid && (
                                <option value="mozi">Mozi (100% Reembolsável)</option>
                            )}
                            <option value="dividido">Dividido (50% cada)</option>
                        </select>

                        {!isIngrid && responsavelAssinWatch === "mozi" && valorAssinNumerico > 0 && (
                            <InfoMozi>
                                💕 R$ {valorAssinNumerico.toFixed(2).replace(".", ",")}/mês{" "}
                                entra em Ganhos+ (Mozi)
                            </InfoMozi>
                        )}

                        {responsavelAssinWatch === "dividido" && valorAssinNumerico > 0 && (
                            <InfoMozi>
                                🤝 R${" "}
                                {(valorAssinNumerico / 2)
                                    .toFixed(2)
                                    .replace(".", ",")}{" "}
                                para cada todo mês (50% dividido)
                            </InfoMozi>
                        )}

                        <LinhaDuplaCampos>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                                <label>Classificação</label>
                                <select {...registerAssinatura("tipo")}>
                                    <option value="Desejo">Desejo (Lazer/Streaming)</option>
                                    <option value="Essencial">Essencial (Fixo)</option>
                                    <option value="Educacao">Educação</option>
                                    <option value="Poupança">Poupança</option>
                                </select>
                            </div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                                <label>Categoria</label>
                                <input
                                    type="text"
                                    placeholder="Assinaturas / Streaming"
                                    {...registerAssinatura("categoria")}
                                />
                            </div>
                        </LinhaDuplaCampos>

                        <Footer>
                            <button type="button" onClick={onClose}>
                                Cancelar
                            </button>
                            <BotaoSalvarAssinatura type="submit">
                                Ativar Assinatura 🔄
                            </BotaoSalvarAssinatura>
                        </Footer>
                    </Form>
                )}
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
    overscroll-behavior: contain;
`;

const ModalContent = styled.div`
    background: linear-gradient(135deg, #0c3b70, #0077b6);
    padding: 22px 20px;
    border-radius: 18px;
    width: min(94vw, 480px);
    max-height: 90dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 2px solid ${({ theme }) => theme.colors.secondary || "#00b3ff"};
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
    box-sizing: border-box;

    scrollbar-width: thin;
    scrollbar-color: #00b3ff transparent;

    @media (max-width: 480px) {
        padding: 16px 14px;
        border-radius: 16px;
    }
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

const AbasContainer = styled.div`
    display: flex;
    background: rgba(0, 0, 0, 0.35);
    padding: 3px;
    border-radius: 10px;
    gap: 4px;
    margin-top: 12px;
`;

const BotaoAba = styled.button`
    flex: 1;
    padding: 8px 10px;
    border-radius: 8px;
    border: none;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    background: ${({ $ativo }) =>
        $ativo ? "linear-gradient(135deg, #00b3ff, #0077b6)" : "transparent"};
    color: ${({ $ativo }) => ($ativo ? "#ffffff" : "#94a3b8")};
    transition: all 0.2s;

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

        &:focus {
            outline: none;
            border-color: #00b3ff;
        }
    }

    input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
    }
`;

const LinhaDuplaCampos = styled.div`
    display: flex;
    gap: 10px;

    @media (max-width: 480px) {
        flex-direction: column;
    }
`;

const InfoAssinaturaAviso = styled.div`
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #6ee7b7;
    font-size: 0.8rem;
    padding: 8px 12px;
    border-radius: 8px;
    line-height: 1.4;
`;

const Footer = styled.div`
    margin-top: 18px;
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

const BotaoSalvarAssinatura = styled.button`
    background: linear-gradient(135deg, #10b981, #059669) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);

    &:hover {
        background: linear-gradient(135deg, #059669, #047857) !important;
        transform: translateY(-1px);
    }
`;

const InfoParcelas = styled.div`
    color: #e0f2fe;
    font-size: 0.85rem;
    font-weight: 600;
    background: rgba(0, 0, 0, 0.25);
    padding: 8px 12px;
    border-radius: 6px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.15);
`;

const InfoMozi = styled.div`
    color: #fdf2f8;
    background: linear-gradient(135deg, rgba(219, 39, 119, 0.3), rgba(147, 51, 234, 0.3));
    font-size: 0.85rem;
    font-weight: 600;
    padding: 8px 12px;
    border-radius: 6px;
    text-align: center;
    border: 1px solid rgba(244, 114, 182, 0.4);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const CampoPersonalizado = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: rgba(0, 0, 0, 0.25);
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px dashed #00b3ff;

    label {
        font-size: 0.85em;
        color: #e0f2fe;
    }

    input {
        background-color: ${({ theme }) => theme.colors.background};
        color: ${({ theme }) => theme.colors.surface};
        border: 1px solid #00b3ff;
        border-radius: 6px;
        padding: 8px;
        font-size: 16px;

        &:focus {
            outline: none;
            box-shadow: 0 0 8px rgba(0, 179, 255, 0.7);
        }
    }
`;
