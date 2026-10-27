import { useState, useEffect } from "react";
import styled from "styled-components";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";
import { useResumoComparativo } from "../../hooks/useResumoComparativoGrafico";
import { parseCurrency } from "../../utils/currencyUtils";

// Registrar os componentes e o plugin
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

export default function GraficoComparativo() {
    const { percentuais, totais = [0, 0, 0], salario = 0 } =
        useResumoComparativo() || {};

    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth <= 768 : false
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const atual = percentuais || [0, 0, 0];
    const ideal = [50, 30, 20];

    const getColor = (atualVal, idealVal) => {
        const diff = atualVal - idealVal;
        return diff > 5 ? "#ef4444" : "#10b981";
    };

    const atualColors = atual.map((valor, i) =>
        getColor(parseCurrency(valor), ideal[i])
    );

    const data = {
        labels: ["Essencial", "Desejos", "Poupança"],
        datasets: [
            {
                label: "Ideal",
                data: ideal,
                backgroundColor: "rgba(59, 130, 246, 0.85)",
                hoverBackgroundColor: "#3b82f6",
                borderRadius: 6,
                borderSkipped: false,
                categoryPercentage: 0.75,
                barPercentage: 0.85,
            },
            {
                label: "Atual",
                data: atual,
                backgroundColor: atualColors,
                hoverBackgroundColor: atualColors,
                borderRadius: 6,
                borderSkipped: false,
                categoryPercentage: 0.75,
                barPercentage: 0.85,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "nearest",
            axis: "x",
            intersect: false,
        },
        layout: {
            padding: {
                top: isMobile ? 8 : 30,
                bottom: 4,
                left: 4,
                right: 4,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grace: isMobile ? "10%" : "25%",
                ticks: {
                    color: "#64748b",
                    font: { size: 10 },
                    callback: (value) => `${value}%`,
                },
                grid: {
                    color: "rgba(255, 255, 255, 0.05)",
                },
                border: {
                    display: false,
                },
            },
            x: {
                grid: { display: false },
                border: {
                    display: false,
                },
                ticks: {
                    color: "#e2e8f0",
                    font: { size: isMobile ? 11 : 12, weight: "bold" },
                },
            },
        },
        plugins: {
            legend: {
                display: false, // Desativada aqui para usar a Legenda Minimalista no topo
            },
            tooltip: {
                enabled: true,
                backgroundColor: "#0f172a",
                titleColor: "#f8fafc",
                bodyColor: "#cbd5e1",
                borderColor: "rgba(0, 179, 255, 0.3)",
                borderWidth: 1,
                padding: 10,
                boxPadding: 4,
                usePointStyle: true,
                callbacks: {
                    label: (context) => {
                        const isAtual = context.dataset.label === "Atual";
                        const idx = context.dataIndex;
                        const valorReal = isAtual
                            ? (totais[idx] || 0)
                            : (salario * ((ideal[idx] || 0) / 100));

                        const realFormatado = valorReal.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        });

                        return ` ${context.dataset.label}: R$ ${realFormatado} (${context.raw}%)`;
                    },
                },
            },
            datalabels: {
                // No mobile removemos rótulos densos para despoluir; no desktop mantemos
                display: !isMobile,
                color: "#f8fafc",
                anchor: "end",
                align: "top",
                offset: 2,
                font: {
                    weight: "bold",
                    size: 10,
                },
                textAlign: "center",
                formatter: (value, context) => {
                    const isAtual = context.dataset.label === "Atual";
                    const idx = context.dataIndex;
                    const valorReal = isAtual
                        ? (totais[idx] || 0)
                        : (salario * ((ideal[idx] || 0) / 100));

                    const casasDecimais = valorReal % 1 === 0 ? 0 : 2;
                    const realFormatado = valorReal.toLocaleString("pt-BR", {
                        minimumFractionDigits: casasDecimais,
                        maximumFractionDigits: 2,
                    });

                    return [`R$ ${realFormatado}`, `${value}%`];
                },
            },
        },
    };

    return (
        <ContainerGrafico>
            <TopLegendaContainer>
                <ItemLegenda>
                    <CorDot $cor="rgba(59, 130, 246, 0.85)" />
                    <span>Ideal</span>
                </ItemLegenda>
                <ItemLegenda>
                    <CorDot $cor="#10b981" />
                    <span>Atual</span>
                </ItemLegenda>
            </TopLegendaContainer>
            <BarWrapper>
                <Bar data={data} options={options} />
            </BarWrapper>
        </ContainerGrafico>
    );
}

const ContainerGrafico = styled.div`
    width: 100%;
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: 160px;
    margin-top: 4px;
`;

const TopLegendaContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 14px;
    padding: 2px 4px 6px 4px;
    flex-shrink: 0;

    @media (max-width: 768px) {
        gap: 10px;
        padding-bottom: 4px;
    }
`;

const ItemLegenda = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 500;
    color: #94a3b8;
`;

const CorDot = styled.span`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ $cor }) => $cor || "#3b82f6"};
    display: inline-block;
`;

const BarWrapper = styled.div`
    width: 100%;
    flex: 1;
    position: relative;
    min-height: 140px;
`;
