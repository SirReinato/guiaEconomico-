import styled from "styled-components";

export default function Logo({ size = 80, showText = true, direction = "column" }) {
    return (
        <LogoWrapper $direction={direction}>
            <IconContainer $size={size}>
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                >
                    <defs>
                        {/* Gradiente Principal: Roxo Neon para Azul Ciano */}
                        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#820ad1" />
                            <stop offset="50%" stopColor="#64109c" />
                            <stop offset="100%" stopColor="#00b3ff" />
                        </linearGradient>

                        {/* Gradiente da Linha de Crescimento */}
                        <linearGradient id="trendGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#820ad1" />
                            <stop offset="70%" stopColor="#00b3ff" />
                            <stop offset="100%" stopColor="#ffffff" />
                        </linearGradient>

                        {/* Brilho Neon */}
                        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow
                                dx="0"
                                dy="0"
                                stdDeviation="2.5"
                                floodColor="#00b3ff"
                                floodOpacity="0.8"
                            />
                        </filter>
                    </defs>

                    {/* Fundo do emblema: Squircle moderno com borda em gradiente */}
                    <rect
                        x="6"
                        y="6"
                        width="88"
                        height="88"
                        rx="26"
                        fill="url(#brandGrad)"
                    />
                    <rect
                        x="8.5"
                        y="8.5"
                        width="83"
                        height="83"
                        rx="23.5"
                        fill="#060f1a"
                    />

                    {/* Círculo interior sutil de bússola/radar */}
                    <circle
                        cx="50"
                        cy="50"
                        r="32"
                        stroke="rgba(0, 179, 255, 0.15)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                    />

                    {/* Barras financeiras estilizadas ascendentes */}
                    <rect
                        x="27"
                        y="58"
                        width="7"
                        height="18"
                        rx="3.5"
                        fill="#820ad1"
                        opacity="0.6"
                    />
                    <rect
                        x="39"
                        y="48"
                        width="7"
                        height="28"
                        rx="3.5"
                        fill="#64109c"
                        opacity="0.85"
                    />
                    <rect
                        x="51"
                        y="38"
                        width="7"
                        height="38"
                        rx="3.5"
                        fill="#00b3ff"
                        opacity="0.9"
                    />
                    <rect
                        x="63"
                        y="28"
                        width="7"
                        height="48"
                        rx="3.5"
                        fill="#00b3ff"
                    />

                    {/* Linha de tendência com flecha apontando para o topo (Crescimento/Guia) */}
                    <path
                        d="M26 52 L39 42 L51 47 L68 22"
                        stroke="url(#trendGrad)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#neonGlow)"
                    />
                    <path
                        d="M59 22 H68 V31"
                        stroke="#ffffff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#neonGlow)"
                    />

                    {/* Ponto de luz / Estrela Guia no ápice do gráfico */}
                    <circle
                        cx="68"
                        cy="22"
                        r="3"
                        fill="#ffffff"
                        filter="url(#neonGlow)"
                    />

                    {/* Detalhe de moeda/cifrão sutil no topo esquerdo */}
                    <text
                        x="24"
                        y="28"
                        fill="rgba(0, 179, 255, 0.8)"
                        fontSize="13"
                        fontWeight="900"
                        fontFamily="'Segoe UI', Roboto, sans-serif"
                    >
                        $
                    </text>
                </svg>
            </IconContainer>

            {showText && (
                <TextContainer $direction={direction}>
                    <BrandName>
                        GUIA<BrandHighlight>ECONÔMICO</BrandHighlight>
                    </BrandName>
                    <BrandTagline>DASHBOARD FINANCEIRO</BrandTagline>
                </TextContainer>
            )}
        </LogoWrapper>
    );
}

const LogoWrapper = styled.div`
    display: flex;
    flex-direction: ${({ $direction }) => $direction};
    align-items: center;
    justify-content: center;
    gap: ${({ $direction }) => ($direction === "row" ? "12px" : "8px")};
    cursor: pointer;
    transition: transform 0.25s ease;
    user-select: none;

    &:hover {
        transform: scale(1.04);
    }
`;

const IconContainer = styled.div`
    width: ${({ $size }) => `${$size}px`};
    height: ${({ $size }) => `${$size}px`};
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 16px rgba(130, 10, 209, 0.45));
    transition: filter 0.3s ease;

    ${LogoWrapper}:hover & {
        filter: drop-shadow(0 0 22px rgba(0, 179, 255, 0.7));
    }
`;

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: ${({ $direction }) => ($direction === "row" ? "flex-start" : "center")};
    text-align: ${({ $direction }) => ($direction === "row" ? "left" : "center")};
`;

const BrandName = styled.div`
    font-size: 1rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    background: linear-gradient(to right, #820ad1, #00b3ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
    line-height: 1.2;
`;

const BrandHighlight = styled.span`
    color: #ffffff;
    -webkit-text-fill-color: #ffffff;
    font-weight: 300;
    letter-spacing: 0.16em;
    margin-left: 3px;
`;

const BrandTagline = styled.div`
    font-size: 0.55rem;
    letter-spacing: 0.25em;
    color: ${({ theme }) => theme.colors.textSecondary || "#777777"};
    font-weight: 600;
    margin-top: 2px;

    @media (max-width: 768px) {
        display: none;
    }
`;
