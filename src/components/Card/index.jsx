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
                <Destaque $bgAlert={$bgAlert} $isNegative={ehNegativo}>
                    {destaque}
                </Destaque>
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
    border-radius: 16px;

    padding: ${(props) =>
        props.$heightSm
            ? "8px 16px"
            : props.$padding || "18px 24px"};
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: ${({ theme }) => theme.colors.textPrimary};
    transition: transform 0.2s;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;

    cursor: ${(props) => (props.$temClique ? "pointer" : "default")};
    border: ${(props) =>
        props.$isNegative
            ? "1px solid rgba(239, 68, 68, 0.45)"
            : "none"};
    box-shadow: ${(props) =>
        props.$isNegative
            ? "0 4px 14px rgba(239, 68, 68, 0.15)"
            : "0 4px 6px rgba(0, 0, 0, 0.1)"};
    text-align: left;

    &:hover {
        ${(props) => props.$temClique && "transform: translateY(-1.5px);"}
    }

    @media (max-width: 768px) {
        width: 100%;
        height: ${(props) => (props.$heightSm ? "auto" : "280px")};
        min-height: ${(props) => (props.$heightSm ? "auto" : "260px")};
    }
`;

const HeaderCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
`;

export const Titulos = styled.h2`
    font-size: ${(props) => (props.$titulo ? "2.5em" : "1.8em")};
    letter-spacing: 0.08em;
    font-weight: bold;
    white-space: nowrap;
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
`;

const Destaque = styled.h2`
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 1.5em;
    font-family: "Bebas Neue", sans-serif;
    letter-spacing: 0.15em;
    white-space: nowrap;
    flex-shrink: 0;
    background: ${({ $isNegative, $bgAlert }) =>
        $isNegative
            ? "linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)"
            : $bgAlert
            ? "linear-gradient(to right, #820ad1, #00b3ff)"
            : "transparent"};
    color: ${({ theme, $isNegative }) =>
        $isNegative ? "#ffffff" : theme.colors.valor};
    box-shadow: ${({ $isNegative }) =>
        $isNegative ? "0 0 16px rgba(239, 68, 68, 0.45)" : "none"};
    border: ${({ $isNegative }) =>
        $isNegative ? "1px solid rgba(254, 202, 202, 0.35)" : "none"};
`;

const CardCorpoDescricao = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-top: 12px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 6px;

    /* Barra de rolagem estilizada e discreta: visível somente se houver overflow */
    scrollbar-width: thin;
    scrollbar-color: rgba(130, 10, 209, 0.5) transparent;

    &::-webkit-scrollbar {
        width: 6px;
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
        width: 6px;
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
    padding: 2px 0;
    flex-shrink: 0;
`;

const TextTitulo = styled.h3`
    font-size: 1.2em;
    letter-spacing: 0.1em;
    font-weight: bold;
`;

const TextDescricao = styled.p`
    font-size: 1.1em;
    letter-spacing: 0.1em;
    color: ${({ theme }) => theme.colors.border};
`;
