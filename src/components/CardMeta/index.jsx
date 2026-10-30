import styled from "styled-components";
import { formatCurrency } from "../../utils/currencyUtils";
import { TAXAS_PADRAO_CATEGORIA, formatarPrazoMesesEAnos } from "../../utils/metasCalculos";

export default function CardMeta({
    meta,
    metas = [],
    onSelectMeta,
    onEditMeta,
    onDeleteMeta,
    onOpenNovaMeta,
}) {
    if (!meta) {
        return (
            <CardVazio>
                <IconeVazio>🎯</IconeVazio>
                <TituloVazio>Nenhuma meta futura cadastrada</TituloVazio>
                <DescricaoVazio>
                    Defina um objetivo financeiro (como um carro, imóvel, viagem ou eletrônico) para a IA e o sistema simularem o melhor plano para você conquistar sem se apertar.
                </DescricaoVazio>
                <BotaoNovaMeta onClick={onOpenNovaMeta}>
                    + Cadastrar Primeira Meta
                </BotaoNovaMeta>
            </CardVazio>
        );
    }

    const {
        nome,
        categoria = "veiculo",
        valorMin = 0,
        valorMax = 0,
        valorJaGuardado = 0,
        prazoDesejadoMeses,
    } = meta;

    const padraoCat = TAXAS_PADRAO_CATEGORIA[categoria] || TAXAS_PADRAO_CATEGORIA.outro;
    const medio = (valorMin + valorMax) / 2 || valorMin || 1;
    const percentualProgresso = Math.min(100, Math.round((valorJaGuardado / medio) * 100));
    const faltaValorMin = Math.max(0, valorMin - valorJaGuardado);

    return (
        <CardContainer>
            <HeaderMetas>
                <SeletorWrapper>
                    <IconeGrande>{padraoCat.icone || "🎯"}</IconeGrande>
                    <InfoMeta>
                        {metas.length > 1 ? (
                            <SelectMeta
                                value={meta.id}
                                onChange={(e) => onSelectMeta(e.target.value)}
                            >
                                {metas.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.nome} ({formatCurrency(m.valorMin)})
                                    </option>
                                ))}
                            </SelectMeta>
                        ) : (
                            <NomeMeta>{nome}</NomeMeta>
                        )}
                        <SubtituloMeta>
                            {padraoCat.nome} {prazoDesejadoMeses ? `• Prazo alvo: ${formatarPrazoMesesEAnos(prazoDesejadoMeses).textoCompleto}` : ""}
                        </SubtituloMeta>
                    </InfoMeta>
                </SeletorWrapper>

                <AcoesHeader>
                    <BotaoAcao onClick={() => onEditMeta(meta)} title="Editar meta">
                        ✏️ Editar
                    </BotaoAcao>
                    <BotaoAcao $perigo onClick={() => onDeleteMeta(meta.id)} title="Excluir meta">
                        🗑️ Excluir
                    </BotaoAcao>
                    <BotaoNovaMetaPequeno onClick={onOpenNovaMeta}>
                        + Nova
                    </BotaoNovaMetaPequeno>
                </AcoesHeader>
            </HeaderMetas>

            <GridValores>
                <ItemValor>
                    <RotuloValor>Faixa Alvo</RotuloValor>
                    <DestaqueValor>
                        {formatCurrency(valorMin)} {valorMax > valorMin ? `a ${formatCurrency(valorMax)}` : ""}
                    </DestaqueValor>
                    <NotaValor>Média: {formatCurrency(medio)}</NotaValor>
                </ItemValor>

                <ItemValor>
                    <RotuloValor>Já Guardado</RotuloValor>
                    <DestaqueValor $cor="#10b981">
                        {formatCurrency(valorJaGuardado)}
                    </DestaqueValor>
                    <NotaValor>{percentualProgresso}% do valor médio</NotaValor>
                </ItemValor>

                <ItemValor>
                    <RotuloValor>Falta p/ Mínimo</RotuloValor>
                    <DestaqueValor $cor="#38bdf8">
                        {faltaValorMin === 0 ? "🎉 Meta Mínima Atingida!" : formatCurrency(faltaValorMin)}
                    </DestaqueValor>
                    <NotaValor>
                        {faltaValorMin > 0 ? "Valor inicial de compra à vista" : "Pronto para negociar"}
                    </NotaValor>
                </ItemValor>
            </GridValores>

            <ProgressoSection>
                <BarraProgressoFundo>
                    <BarraProgressoPreenchida $porcentagem={percentualProgresso} />
                </BarraProgressoFundo>
            </ProgressoSection>
        </CardContainer>
    );
}

const CardContainer = styled.div`
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
    border: 1px solid rgba(130, 10, 209, 0.35);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    gap: 18px;
`;

const HeaderMetas = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
`;

const SeletorWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
`;

const IconeGrande = styled.div`
    font-size: 2.4rem;
    width: 54px;
    height: 54px;
    border-radius: 14px;
    background: rgba(130, 10, 209, 0.2);
    border: 1px solid rgba(130, 10, 209, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
`;

const InfoMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const NomeMeta = styled.h2`
    font-size: 1.4rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
`;

const SelectMeta = styled.select`
    background: #1e293b;
    border: 1px solid rgba(0, 179, 255, 0.4);
    color: #fff;
    font-size: 1.25rem;
    font-weight: 700;
    border-radius: 8px;
    padding: 4px 8px;
    outline: none;
    cursor: pointer;
    &:focus {
        border-color: #00b3ff;
    }
    option {
        background: #0f172a;
        color: #fff;
    }
`;

const SubtituloMeta = styled.span`
    font-size: 0.85rem;
    color: #94a3b8;
`;

const AcoesHeader = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const BotaoAcao = styled.button`
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid ${({ $perigo }) => ($perigo ? "rgba(239, 68, 68, 0.4)" : "rgba(255, 255, 255, 0.15)")};
    color: ${({ $perigo }) => ($perigo ? "#fca5a5" : "#cbd5e1")};
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
        background: ${({ $perigo }) => ($perigo ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.12)")};
        color: #fff;
    }
`;

const BotaoNovaMetaPequeno = styled.button`
    background: linear-gradient(135deg, #820ad1, #00b3ff);
    border: none;
    color: #fff;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s;
    &:hover {
        transform: translateY(-1px);
    }
`;

const GridValores = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
`;

const ItemValor = styled.div`
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const RotuloValor = styled.span`
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #94a3b8;
    font-weight: 600;
`;

const DestaqueValor = styled.span`
    font-size: 1.15rem;
    font-weight: 700;
    color: ${({ $cor }) => $cor || "#fff"};
`;

const NotaValor = styled.span`
    font-size: 0.75rem;
    color: #64748b;
`;

const ProgressoSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const BarraProgressoFundo = styled.div`
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    overflow: hidden;
`;

const BarraProgressoPreenchida = styled.div`
    height: 100%;
    width: ${({ $porcentagem }) => `${$porcentagem}%`};
    background: linear-gradient(90deg, #820ad1, #00b3ff, #10b981);
    border-radius: 999px;
    transition: width 0.5s ease-out;
`;

const CardVazio = styled.div`
    background: rgba(15, 23, 42, 0.8);
    border: 2px dashed rgba(130, 10, 209, 0.4);
    border-radius: 16px;
    padding: 36px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 600px;
    margin: 0 auto;
`;

const IconeVazio = styled.div`
    font-size: 3rem;
`;

const TituloVazio = styled.h3`
    font-size: 1.3rem;
    color: #fff;
    margin: 0;
`;

const DescricaoVazio = styled.p`
    font-size: 0.9rem;
    color: #94a3b8;
    max-width: 480px;
    margin: 0;
    line-height: 1.5;
`;

const BotaoNovaMeta = styled.button`
    background: linear-gradient(135deg, #820ad1, #00b3ff);
    border: none;
    color: #fff;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    margin-top: 8px;
    box-shadow: 0 4px 20px rgba(0, 179, 255, 0.3);
    transition: transform 0.2s;
    &:hover {
        transform: translateY(-2px);
    }
`;
