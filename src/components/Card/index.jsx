import styled from "styled-components";

export default function Card({
    children,
    titulo,
    destaque,
    $bgAlert,
    $isNegative,
    textTitulo,
    textDescricao,
    $bgClaro,
    $titulo,
    $tituloRoxo,
    onClick,
    ...props
}) {
    const ehNegativo =
        $isNegative !== undefined
            ? $isNegative
            : typeof destaque === "string" && destaque.includes("-");

    return (
        <Container
            {...props}
            $bgClaro={$bgClaro}
            $isNegative={ehNegativo}
            $temClique={Boolean(onClick)}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (onClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onClick(e);
                }
            }}
        >
            <HeaderCard>
                <Titulos
                    $titulo={$titulo}
                    $tituloRoxo={$tituloRoxo}
                    $isNegative={ehNegativo}
                >
                    {titulo}
                </Titulos>
                {destaque && (
                    <Destaque $bgAlert={$bgAlert} $isNegative={ehNegativo}>
                        {destaque}
                    </Destaque>
                )}
            </HeaderCard>
            {(textTitulo || textDescricao) && (
                <CardCorpoDescricao>
                    {Array.isArray(textTitulo) && Array.isArray(textDescricao) ? (
                        textTitulo.map((tituloItem, index) => (
                            <LinhaDescricao key={index}>
                                <TextTitulo>{tituloItem}</TextTitulo>
                                <TextDescricao>
                                    {textDescricao[index]}
                                </TextDescricao>
                            </LinhaDescricao>
                        ))
                    ) : (
                        <LinhaDescricao>
                            <TextTitulo>{textTitulo}</TextTitulo>
                            <TextDescricao>{textDescricao}</TextDescricao>
                        </LinhaDescricao>
                    )}
                </CardCorpoDescricao>
            )}
            {children && <CardCorpoConteudo>{children}</CardCorpoConteudo>}
        </Container>
    );
}

const Container = styled.div`
    width: ${(props) => (props.$widthSm ? "32%" : "48%")};
    height: ${(props) => (props.$heightSm ? "100%" : "45%")};
    background-color: ${(props) =>
        props.$bgClaro
            ? props.theme.colors.background
            : props.theme.colors.cardsBg};
    border-radius: 18px;

    padding: ${(props) =>
        props.$heightSm
            ? "14px 18px"
            : props.$padding || "22px 24px"};
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: ${({ theme }) => theme.colors.textPrimary};
    transition: transform 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;

    cursor: ${(props) => (props.$temClique ? "pointer" : "default")};
    border: ${(props) =>
        props.$isNegative
            ? "1px solid rgba(239, 68, 68, 0.45)"
            : "1px solid rgba(255, 255, 255, 0.05)"};
    box-shadow: ${(props) =>
        props.$isNegative
            ? "0 4px 14px rgba(239, 68, 68, 0.15)"
            : "0 4px 12px rgba(0, 0, 0, 0.18)"};
    text-align: left;

    &:hover {
        ${(props) => props.$temClique && "transform: translateY(-1.5px);"}
    }

    @media (max-width: 768px) {
        width: 100%;
        height: auto;
        min-height: ${(props) => (props.$heightSm ? "auto" : "200px")};
        padding: ${(props) => (props.$heightSm ? "14px 16px" : "18px 18px")};
        border-radius: 16px;
    }
`;

const HeaderCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    gap: 8px;
    width: 100%;
    min-width: 0;

    @media (max-width: 480px) {
        gap: 6px;
    }
`;

export const Titulos = styled.h2`
    font-size: ${(props) => (props.$titulo ? "2.2em" : "1.5em")};
    letter-spacing: 0.04em;
    font-weight: bold;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    ${(props) =>
        props.$isNegative
            ? `
      color: #ef4444;
    `
            : props.$tituloRoxo
            ? `
      background: linear-gradient(to right, #820ad1, #00b3ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    `
            : `
      color: #00b3ff;
    `}

    @media (max-width: 768px) {
        font-size: ${(props) => (props.$titulo ? "1.6em" : "1.25em")};
        white-space: normal;
        word-break: break-word;
    }
`;

const Destaque = styled.h2`
    padding: 7px 13px;
    border-radius: 10px;
    font-size: 1.35em;
    font-family: "Bebas Neue", sans-serif;
    letter-spacing: 0.12em;
    white-space: nowrap;
    flex-shrink: 0;
    margin: 0;
    /* Suavização das pílulas de valor: fundo com alta transparência e cor neon */
    background: ${({ $isNegative, $bgAlert }) =>
        $isNegative
            ? "rgba(239, 68, 68, 0.15)"
            : $bgAlert
            ? "rgba(130, 10, 209, 0.15)"
            : "transparent"};
    color: ${({ $isNegative }) =>
        $isNegative ? "#ef4444" : "#00d2ff"};
    border: ${({ $isNegative, $bgAlert }) =>
        $isNegative
            ? "1px solid rgba(239, 68, 68, 0.35)"
            : $bgAlert
            ? "1px solid rgba(0, 179, 255, 0.25)"
            : "none"};
    box-shadow: ${({ $isNegative }) =>
        $isNegative ? "0 0 10px rgba(239, 68, 68, 0.15)" : "none"};

    @media (max-width: 480px) {
        font-size: 1.15em;
        padding: 5px 9px;
    }

    @media (min-width: 769px) {
        padding: 9px 15px;
        border-radius: 12px;
        font-size: 1.45em;
        background: ${({ $isNegative, $bgAlert }) =>
            $isNegative
                ? "rgba(239, 68, 68, 0.2)"
                : $bgAlert
                ? "rgba(130, 10, 209, 0.2)"
                : "transparent"};
        color: ${({ $isNegative }) =>
            $isNegative ? "#ffffff" : "#00d2ff"};
        border: ${({ $isNegative, $bgAlert }) =>
            $isNegative
                ? "1px solid rgba(239, 68, 68, 0.4)"
                : $bgAlert
                ? "1px solid rgba(0, 179, 255, 0.3)"
                : "none"};
    }
`;

const CardCorpoDescricao = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-top: 14px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 6px;

    /* Barra de rolagem estilizada e discreta */
    scrollbar-width: thin;
    scrollbar-color: rgba(130, 10, 209, 0.5) transparent;

    &::-webkit-scrollbar {
        width: 5px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(130, 10, 209, 0.4);
        border-radius: 6px;
        transition: background 0.2s;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #820ad1;
    }
`;

const CardCorpoConteudo = styled.div`
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;

    scrollbar-width: thin;
    scrollbar-color: rgba(130, 10, 209, 0.5) transparent;

    &::-webkit-scrollbar {
        width: 5px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(130, 10, 209, 0.4);
        border-radius: 6px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #820ad1;
    }
`;

const LinhaDescricao = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);

    &:last-child {
        border-bottom: none;
    }
`;

const TextTitulo = styled.h3`
    font-size: 1.05em;
    letter-spacing: 0.05em;
    font-weight: 500;
    text-align: left;
    color: #e2e8f0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 12px;
    margin: 0;
`;

const TextDescricao = styled.p`
    font-size: 1.05em;
    letter-spacing: 0.05em;
    color: #00b3ff;
    text-align: right;
    font-weight: 600;
    white-space: nowrap;
    font-family: 'Roboto', sans-serif;
    margin: 0;
`;
