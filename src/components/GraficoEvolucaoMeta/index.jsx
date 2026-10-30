import { useMemo } from "react";
import styled from "styled-components";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "../../utils/currencyUtils";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function GraficoEvolucaoMeta({ cenarios }) {
    const dadosGrafico = useMemo(() => {
        if (!cenarios || !cenarios.aVista || cenarios.aVista.length === 0) return null;

        const { min, max, medio, jaGuardado } = cenarios.metaValores;
        const cenarioModerado = cenarios.aVista[1] || cenarios.aVista[0];
        const aporte = cenarioModerado?.aporteMensal || 500;
        const taxaSelic = (cenarios.taxasAplicadas?.selicRendimento || 0.93) / 100;

        const maxMeses = Math.min(36, Math.max(12, cenarioModerado?.tempoMesesMax || 24));
        const labels = [];
        const dadosSaldo = [];
        const dadosLinhaMeta = [];

        let saldoAcumulado = jaGuardado;
        for (let m = 0; m <= maxMeses; m++) {
            labels.push(m === 0 ? "Início" : `Mês ${m}`);
            dadosSaldo.push(Math.round(saldoAcumulado));
            dadosLinhaMeta.push(medio);

            const rendimento = saldoAcumulado * taxaSelic;
            saldoAcumulado += rendimento + aporte;
        }

        return {
            labels,
            datasets: [
                {
                    label: "Acúmulo com CDI (Moderado)",
                    data: dadosSaldo,
                    borderColor: "#00b3ff",
                    backgroundColor: "rgba(0, 179, 255, 0.15)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: (ctx) => (ctx.dataIndex % 6 === 0 ? 4 : 0),
                    pointBackgroundColor: "#00b3ff",
                },
                {
                    label: `Meta Média (${formatCurrency(medio)})`,
                    data: dadosLinhaMeta,
                    borderColor: "#10b981",
                    borderWidth: 2,
                    borderDash: [6, 6],
                    fill: false,
                    pointRadius: 0,
                },
            ],
            valoresFaixa: { min, max, medio },
        };
    }, [cenarios]);

    if (!dadosGrafico) return null;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: "top",
                labels: {
                    color: "#94a3b8",
                    font: { size: 11 },
                    boxWidth: 12,
                },
            },
            tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                    label: (context) => {
                        const val = context.parsed.y;
                        return ` ${context.dataset.label}: ${formatCurrency(val)}`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { color: "rgba(255, 255, 255, 0.05)" },
                ticks: { color: "#64748b", font: { size: 10 } },
            },
            y: {
                grid: { color: "rgba(255, 255, 255, 0.05)" },
                ticks: {
                    color: "#64748b",
                    font: { size: 10 },
                    callback: (value) => `R$ ${(value / 1000).toFixed(0)}k`,
                },
            },
        },
    };

    return (
        <GraficoContainer>
            <HeaderGrafico>
                <TituloGrafico>📈 Curva de Acúmulo & Ponto de Compra</TituloGrafico>
                <SubGrafico>
                    Projeção de evolução do seu patrimônio com aportes mensais rendendo ~100% CDI vs o valor médio do bem.
                </SubGrafico>
            </HeaderGrafico>
            <CanvasWrapper>
                <Line data={dadosGrafico} options={options} />
            </CanvasWrapper>
        </GraficoContainer>
    );
}

const GraficoContainer = styled.div`
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const HeaderGrafico = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const TituloGrafico = styled.h4`
    font-size: 1.05rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
`;

const SubGrafico = styled.span`
    font-size: 0.8rem;
    color: #94a3b8;
`;

const CanvasWrapper = styled.div`
    position: relative;
    height: 240px;
    width: 100%;
`;
