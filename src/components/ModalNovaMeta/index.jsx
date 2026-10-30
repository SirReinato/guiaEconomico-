import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import { parseCurrency, formatCurrency } from "../../utils/currencyUtils";
import { TAXAS_PADRAO_CATEGORIA } from "../../utils/metasCalculos";

export default function ModalNovaMeta({ onClose, onSave, metaEditando = null, dadosInsight = null }) {
    const isEdicao = Boolean(metaEditando && metaEditando.id);
    const [mostrarAvancadas, setMostrarAvancadas] = useState(false);
    const [insightAplicado, setInsightAplicado] = useState(false);

    const { register, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            nome: metaEditando?.nome || "",
            categoria: metaEditando?.categoria || "veiculo",
            valorMin: metaEditando?.valorMin ? formatCurrency(metaEditando.valorMin).replace("R$", "").trim() : "",
            valorMax: metaEditando?.valorMax ? formatCurrency(metaEditando.valorMax).replace("R$", "").trim() : "",
            valorJaGuardado: metaEditando?.valorJaGuardado ? formatCurrency(metaEditando.valorJaGuardado).replace("R$", "").trim() : "0,00",
            prazoDesejadoMeses: metaEditando?.prazoDesejadoMeses || "",
            aceitaFinanciamento: metaEditando?.aceitaFinanciamento !== undefined ? metaEditando.aceitaFinanciamento : true,
            aceitaConsorcio: metaEditando?.aceitaConsorcio !== undefined ? metaEditando.aceitaConsorcio : true,
            taxaFinanciamentoMensal: metaEditando?.premissas?.taxaFinanciamentoMensal || TAXAS_PADRAO_CATEGORIA[metaEditando?.categoria || "veiculo"]?.taxaFinanciamentoMensal || 1.79,
            taxaAdmConsorcioTotal: metaEditando?.premissas?.taxaAdmConsorcioTotal || TAXAS_PADRAO_CATEGORIA[metaEditando?.categoria || "veiculo"]?.taxaAdmConsorcioTotal || 15.0,
        },
    });

    const categoriaSelecionada = watch("categoria");
    const padraoCat = TAXAS_PADRAO_CATEGORIA[categoriaSelecionada] || TAXAS_PADRAO_CATEGORIA.outro;

    // Atualiza taxas padrão ao mudar de categoria, se for criação nova
    useEffect(() => {
        if (!isEdicao && padraoCat) {
            setValue("taxaFinanciamentoMensal", padraoCat.taxaFinanciamentoMensal);
            setValue("taxaAdmConsorcioTotal", padraoCat.taxaAdmConsorcioTotal);
        }
    }, [categoriaSelecionada, isEdicao, padraoCat, setValue]);

    const handleAplicarDadosInsight = () => {
        if (!dadosInsight) return;
        if (dadosInsight.reservaAtual !== undefined) {
            setValue("valorJaGuardado", formatCurrency(dadosInsight.reservaAtual).replace("R$", "").trim());
        }
        const vMin = parseCurrency(watch("valorMin"));
        if (vMin > 0 && dadosInsight.sobraReal > 0 && !watch("prazoDesejadoMeses")) {
            const falta = Math.max(0, vMin - (dadosInsight.reservaAtual || 0));
            const mesesSugeridos = Math.ceil(falta / (dadosInsight.sobraReal * 0.7));
            if (mesesSugeridos > 0 && mesesSugeridos <= 360) {
                setValue("prazoDesejadoMeses", mesesSugeridos);
            }
        }
        setInsightAplicado(true);
        setTimeout(() => setInsightAplicado(false), 5000);
    };

    const onSubmit = (dados) => {
        const vMin = parseCurrency(dados.valorMin);
        const vMax = parseCurrency(dados.valorMax) || vMin;
        const vJaGuardado = parseCurrency(dados.valorJaGuardado) || 0;

        const payload = {
            nome: dados.nome.trim(),
            categoria: dados.categoria,
            valorMin: vMin,
            valorMax: vMax >= vMin ? vMax : vMin,
            valorJaGuardado: vJaGuardado,
            prazoDesejadoMeses: dados.prazoDesejadoMeses ? parseInt(dados.prazoDesejadoMeses, 10) : null,
            aceitaFinanciamento: Boolean(dados.aceitaFinanciamento),
            aceitaConsorcio: Boolean(dados.aceitaConsorcio),
            premissas: {
                taxaFinanciamentoMensal: Number(dados.taxaFinanciamentoMensal) || padraoCat.taxaFinanciamentoMensal,
                taxaAdmConsorcioTotal: Number(dados.taxaAdmConsorcioTotal) || padraoCat.taxaAdmConsorcioTotal,
            },
        };

        onSave(payload);
        onClose();
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <Header>
                    <TituloModal>
                        {isEdicao ? "✏️ Editar Meta Futura" : "🎯 Nova Meta Futura"}
                    </TituloModal>
                    <BotaoFechar type="button" onClick={onClose}>
                        &times;
                    </BotaoFechar>
                </Header>

                <Form onSubmit={handleSubmit(onSubmit)}>
                    {dadosInsight && (
                        <CardSugestaoInsight>
                            <TopoInsight>
                                <InfoTopoInsight>
                                    <IconeRaio>💡</IconeRaio>
                                    <div>
                                        <TituloSugestao>Usar Valores Atuais do Insight</TituloSugestao>
                                        <SubtituloSugestao>Preenche com a reserva acumulada e capacidade do mês vigente</SubtituloSugestao>
                                    </div>
                                </InfoTopoInsight>
                                <BotaoPuxarInsight type="button" onClick={handleAplicarDadosInsight}>
                                    ⚡ Aplicar Valores do Mês
                                </BotaoPuxarInsight>
                            </TopoInsight>

                            <GridValoresInsight>
                                <ItemInsight>
                                    <span>Reserva Atual (Mês Vigente):</span>
                                    <strong style={{ color: "#38bdf8" }}>{formatCurrency(dadosInsight.reservaAtual || 0)}</strong>
                                </ItemInsight>
                                <ItemInsight>
                                    <span>Sobra Estimada Livre:</span>
                                    <strong style={{ color: "#10b981" }}>{formatCurrency(dadosInsight.sobraReal || 0)}/mês</strong>
                                </ItemInsight>
                                <ItemInsight>
                                    <span>Taxa Selic / CDI:</span>
                                    <strong style={{ color: "#a855f7" }}>{dadosInsight.taxaSelicMensal || 0.93}% a.m.</strong>
                                </ItemInsight>
                            </GridValoresInsight>

                            {insightAplicado && (
                                <AlertaSucessoInsight>
                                    ✅ Valores do mês vigente aplicados! O campo "Já guardado" foi preenchido com {formatCurrency(dadosInsight.reservaAtual || 0)}.
                                </AlertaSucessoInsight>
                            )}
                        </CardSugestaoInsight>
                    )}

                    <Campo>
                        <Label>Nome do Bem / Objetivo *</Label>
                        <Input
                            type="text"
                            placeholder="Ex: Carro Sedan, Viagem Santiago, Reforma"
                            {...register("nome", { required: true })}
                        />
                    </Campo>

                    <Campo>
                        <Label>Categoria</Label>
                        <Select {...register("categoria")}>
                            <option value="veiculo">🚗 Veículo (Carro / Moto)</option>
                            <option value="imovel">🏠 Imóvel (Casa / Apartamento / Terreno)</option>
                            <option value="viagem">✈️ Viagem & Férias</option>
                            <option value="eletronico">💻 Eletrônicos & Equipamentos</option>
                            <option value="outro">🎯 Outro Bem / Objetivo</option>
                        </Select>
                        {padraoCat?.custosExtras && (
                            <DicaCategoria>💡 {padraoCat.custosExtras}</DicaCategoria>
                        )}
                    </Campo>

                    <LinhaDupla>
                        <Campo>
                            <Label>Valor Mínimo (R$) *</Label>
                            <Input
                                type="text"
                                placeholder="Ex: 30.000,00"
                                {...register("valorMin", { required: true })}
                            />
                        </Campo>

                        <Campo>
                            <Label>Valor Máximo (R$)</Label>
                            <Input
                                type="text"
                                placeholder="Ex: 40.000,00"
                                {...register("valorMax")}
                            />
                        </Campo>
                    </LinhaDupla>

                    <LinhaDupla>
                        <Campo>
                            <Label>Já guardado p/ essa meta (R$)</Label>
                            <Input
                                type="text"
                                placeholder="0,00"
                                {...register("valorJaGuardado")}
                            />
                        </Campo>

                        <Campo>
                            <Label>Prazo Desejado (meses)</Label>
                            <Input
                                type="number"
                                placeholder="Opcional (ex: 24)"
                                min="1"
                                max="360"
                                {...register("prazoDesejadoMeses")}
                            />
                        </Campo>
                    </LinhaDupla>

                    <OpcoesLinha>
                        <CheckboxLabel>
                            <input type="checkbox" {...register("aceitaFinanciamento")} />
                            <span>Simular opções com Financiamento</span>
                        </CheckboxLabel>

                        <CheckboxLabel>
                            <input type="checkbox" {...register("aceitaConsorcio")} />
                            <span>Simular opções com Consórcio</span>
                        </CheckboxLabel>
                    </OpcoesLinha>

                    <BotaoAlternarAvancadas
                        type="button"
                        onClick={() => setMostrarAvancadas(!mostrarAvancadas)}
                    >
                        {mostrarAvancadas ? "▲ Ocultar Taxas Avançadas" : "⚙️ Personalizar Taxas de Juros e Consórcio"}
                    </BotaoAlternarAvancadas>

                    {mostrarAvancadas && (
                        <SecaoAvancada>
                            <LinhaDupla>
                                <Campo>
                                    <Label>Taxa Financiamento (% a.m.)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register("taxaFinanciamentoMensal")}
                                    />
                                    <SubDica>Padrão de mercado: {padraoCat.taxaFinanciamentoMensal}% a.m.</SubDica>
                                </Campo>

                                <Campo>
                                    <Label>Taxa Adm Consórcio Total (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        {...register("taxaAdmConsorcioTotal")}
                                    />
                                    <SubDica>Padrão: {padraoCat.taxaAdmConsorcioTotal}% no prazo total</SubDica>
                                </Campo>
                            </LinhaDupla>
                        </SecaoAvancada>
                    )}

                    <Acoes>
                        <BotaoCancelar type="button" onClick={onClose}>
                            Cancelar
                        </BotaoCancelar>
                        <BotaoSalvar type="submit">
                            {isEdicao ? "Salvar Alterações" : "Criar Meta"}
                        </BotaoSalvar>
                    </Acoes>
                </Form>
            </ModalContainer>
        </Overlay>
    );
}

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 16px;
`;

const ModalContainer = styled.div`
    background: #0f172a;
    border: 1px solid rgba(130, 10, 209, 0.3);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(130, 10, 209, 0.2);
    border-radius: 16px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    color: #f8fafc;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const TituloModal = styled.h3`
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #00b3ff, #820ad1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;

const BotaoFechar = styled.button`
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
    &:hover {
        color: #fff;
    }
`;

const Form = styled.form`
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const Campo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
`;

const LinhaDupla = styled.div`
    display: flex;
    gap: 12px;
    @media (max-width: 480px) {
        flex-direction: column;
    }
`;

const Label = styled.label`
    font-size: 0.85rem;
    font-weight: 600;
    color: #cbd5e1;
`;

const Input = styled.input`
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 10px 14px;
    color: #fff;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
    &:focus {
        border-color: #00b3ff;
        box-shadow: 0 0 0 2px rgba(0, 179, 255, 0.2);
    }
`;

const Select = styled.select`
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 10px 14px;
    color: #fff;
    font-size: 0.95rem;
    outline: none;
    &:focus {
        border-color: #00b3ff;
    }
    option {
        background: #0f172a;
        color: #fff;
    }
`;

const DicaCategoria = styled.span`
    font-size: 0.76rem;
    color: #94a3b8;
    line-height: 1.3;
    margin-top: 2px;
`;

const SubDica = styled.span`
    font-size: 0.72rem;
    color: #64748b;
`;

const OpcoesLinha = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
`;

const CheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.88rem;
    color: #cbd5e1;
    cursor: pointer;
    input[type="checkbox"] {
        accent-color: #00b3ff;
        width: 16px;
        height: 16px;
    }
`;

const BotaoAlternarAvancadas = styled.button`
    background: none;
    border: none;
    color: #38bdf8;
    font-size: 0.82rem;
    cursor: pointer;
    text-align: left;
    padding: 4px 0;
    transition: opacity 0.2s;
    &:hover {
        opacity: 0.8;
    }
`;

const SecaoAvancada = styled.div`
    background: rgba(30, 41, 59, 0.5);
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    padding: 12px;
`;

const Acoes = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
`;

const BotaoCancelar = styled.button`
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #cbd5e1;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
    }
`;

const BotaoSalvar = styled.button`
    background: linear-gradient(135deg, #820ad1, #00b3ff);
    border: none;
    color: #fff;
    padding: 10px 22px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(0, 179, 255, 0.4);
    }
`;

const CardSugestaoInsight = styled.div`
    background: linear-gradient(135deg, rgba(130, 10, 209, 0.12), rgba(0, 179, 255, 0.1));
    border: 1px solid rgba(0, 179, 255, 0.35);
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 6px;
`;

const TopoInsight = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
`;

const InfoTopoInsight = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const IconeRaio = styled.span`
    font-size: 1.4rem;
`;

const TituloSugestao = styled.h4`
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #e2e8f0;
`;

const SubtituloSugestao = styled.p`
    margin: 2px 0 0 0;
    font-size: 0.78rem;
    color: #94a3b8;
`;

const BotaoPuxarInsight = styled.button`
    background: linear-gradient(135deg, #0284c7, #820ad1);
    color: #fff;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        opacity: 0.95;
        transform: scale(1.02);
        box-shadow: 0 2px 10px rgba(2, 132, 199, 0.4);
    }
`;

const GridValoresInsight = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 10px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 10px 12px;
`;

const ItemInsight = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    span {
        font-size: 0.72rem;
        color: #94a3b8;
    }
    strong {
        font-size: 0.88rem;
        color: #f1f5f9;
        font-weight: 700;
    }
`;

const AlertaSucessoInsight = styled.div`
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34d399;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
`;
