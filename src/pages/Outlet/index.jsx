import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import styled from "styled-components";
import ModalNovoGasto from "../../components/ModalNovoGasto";
import ModalReceita from "../../components/ModalReceita";
import ModalEssencial from "../../components/ModalGastoEssencial";
import { useShowModals } from "../../hooks/useShowModals";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Logo";

export default function ContainerGeral() {
    const {
        showModalGasto,
        setShowModalGasto,
        showModalSaldo,
        setShowModalSaldo,
        showModalEssencial,
        setShowModalEssencial,
        adicionarGasto,
        adicionarReceita,
        adicionarEssencial,
    } = useShowModals();

    const { user, logout, temAcessoInsights, nomePerfil, isIngrid } = useAuth();
    const location = useLocation();

    const [menuAcoesAberto, setMenuAcoesAberto] = useState(false);
    const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);

    const fecharMenusMobile = () => {
        setMenuAcoesAberto(false);
        setMenuUsuarioAberto(false);
    };

    return (
        <>
            <Container>
                {/* Header Mobile Superior */}
                <MobileTopBar>
                    <Link to="/" onClick={fecharMenusMobile} style={{ textDecoration: "none" }}>
                        <Logo size={28} showText={true} direction="row" />
                    </Link>

                    <MobileUserArea>
                        <MobileUserAvatarButton
                            onClick={() => setMenuUsuarioAberto(!menuUsuarioAberto)}
                            title="Perfil do Usuário"
                        >
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || "Usuário"}
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <span>
                                    {(user?.displayName || user?.email || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                </span>
                            )}
                        </MobileUserAvatarButton>

                        {menuUsuarioAberto && (
                            <>
                                <MenuBackdrop onClick={() => setMenuUsuarioAberto(false)} />
                                <MenuDropdownUsuario>
                                    <UserNameDropdown>
                                        {user?.displayName || "Usuário"}
                                    </UserNameDropdown>
                                    <BadgePerfilDropdown $isIngrid={isIngrid}>
                                        {nomePerfil || (isIngrid ? "Perfil: Ingrid" : "Perfil: Renato")}
                                    </BadgePerfilDropdown>
                                    <UserEmailDropdown>{user?.email}</UserEmailDropdown>
                                    <LinkConfigMobile
                                        to="/metas"
                                        onClick={fecharMenusMobile}
                                    >
                                        🎯 Metas Futuras
                                    </LinkConfigMobile>
                                    <LinkConfigMobile
                                        to="/configuracoes"
                                        onClick={fecharMenusMobile}
                                    >
                                        ⚙️ Configurações
                                    </LinkConfigMobile>
                                    <BotaoSairDropdown onClick={logout}>
                                        Sair da Conta 🚪
                                    </BotaoSairDropdown>
                                </MenuDropdownUsuario>
                            </>
                        )}
                    </MobileUserArea>
                </MobileTopBar>

                {/* Sidebar Desktop */}
                <NavContainer>
                    <NavCardContainer>
                        <Link to="/" style={{ textDecoration: "none" }}>
                            <Logo size={72} showText={true} />
                        </Link>
                        <StyledButton onClick={() => setShowModalSaldo(true)}>
                            ➕ Receita
                        </StyledButton>
                        <StyledButton onClick={() => setShowModalGasto(true)}>
                            📉 Novo Gasto
                        </StyledButton>
                        <StyledLink to="/gastos-cartao">
                            📁 Gastos por Cartão
                        </StyledLink>
                        <StyledButton onClick={() => setShowModalEssencial(true)}>
                            📉 Gastos Essenciais
                        </StyledButton>
                        <StyledLink to="/saldos">
                            💰 Saldos
                        </StyledLink>
                        <StyledLink to="/insights">
                            {temAcessoInsights ? "🧠 Insights Financeiros" : "🔒 Insights (Restrito)"}
                        </StyledLink>
                        <StyledLink to="/metas">
                            {temAcessoInsights ? "🎯 Metas Futuras" : "🔒 Metas (Restrito)"}
                        </StyledLink>
                        <StyledLink to="/configuracoes">
                            ⚙️ Configurações
                        </StyledLink>

                        {user && (
                            <UserCard>
                                {user.photoURL ? (
                                    <UserAvatar
                                        src={user.photoURL}
                                        alt={user.displayName || "Usuário"}
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <UserAvatarPlaceholder>
                                        {(user.displayName || user.email || "U")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </UserAvatarPlaceholder>
                                )}
                                <UserInfo>
                                    <UserName>
                                        {user.displayName || "Usuário"}
                                    </UserName>
                                    <BadgePerfilDesktop $isIngrid={isIngrid}>
                                        {nomePerfil || (isIngrid ? "Perfil: Ingrid" : "Perfil: Renato")}
                                    </BadgePerfilDesktop>
                                    <UserEmail>{user.email}</UserEmail>
                                </UserInfo>
                                <BotaoSair onClick={logout}>
                                    Sair 🚪
                                </BotaoSair>
                            </UserCard>
                        )}
                    </NavCardContainer>
                </NavContainer>

                <MainContainer>
                    <Outlet />
                </MainContainer>

                <Footer>
                    <p className="textFooter">Desenvolvido by SirReinato</p>
                </Footer>

                {/* Barra de Navegação Inferior Nativa no Mobile */}
                <MobileBottomNav>
                    <BottomNavItem
                        to="/"
                        $ativo={location.pathname === "/"}
                        onClick={fecharMenusMobile}
                    >
                        <BottomNavIcon>🏠</BottomNavIcon>
                        <BottomNavText>Início</BottomNavText>
                    </BottomNavItem>

                    <BottomNavItem
                        to="/gastos-cartao"
                        $ativo={location.pathname === "/gastos-cartao"}
                        onClick={fecharMenusMobile}
                    >
                        <BottomNavIcon>💳</BottomNavIcon>
                        <BottomNavText>Cartões</BottomNavText>
                    </BottomNavItem>

                    {/* Botão Central de Ação Flutuante */}
                    <BottomNavAddButton
                        type="button"
                        onClick={() => setMenuAcoesAberto(!menuAcoesAberto)}
                        title="Adicionar lançamento"
                    >
                        <span>+</span>
                    </BottomNavAddButton>

                    <BottomNavItem
                        to="/insights"
                        $ativo={location.pathname === "/insights"}
                        onClick={fecharMenusMobile}
                    >
                        <BottomNavIcon>{temAcessoInsights ? "🧠" : "🔒"}</BottomNavIcon>
                        <BottomNavText>{temAcessoInsights ? "Insights" : "Restrito"}</BottomNavText>
                    </BottomNavItem>

                    <BottomNavItem
                        to="/saldos"
                        $ativo={location.pathname === "/saldos" || location.pathname === "/comparativo"}
                        onClick={fecharMenusMobile}
                    >
                        <BottomNavIcon>💰</BottomNavIcon>
                        <BottomNavText>Saldos</BottomNavText>
                    </BottomNavItem>

                    <BottomNavItem
                        to="/metas"
                        $ativo={location.pathname === "/metas"}
                        onClick={fecharMenusMobile}
                    >
                        <BottomNavIcon>🎯</BottomNavIcon>
                        <BottomNavText>Metas</BottomNavText>
                    </BottomNavItem>
                </MobileBottomNav>

                {/* Menu de Ações Rápidas Mobile */}
                {menuAcoesAberto && (
                    <>
                        <MenuBackdrop onClick={() => setMenuAcoesAberto(false)} />
                        <BottomSheetAcoes>
                            <BottomSheetHeader>
                                <span>Criar Novo Registro</span>
                                <BotaoFecharModal onClick={() => setMenuAcoesAberto(false)}>
                                    &times;
                                </BotaoFecharModal>
                            </BottomSheetHeader>
                            <BottomSheetGrid>
                                <BotaoAcaoModal
                                    onClick={() => {
                                        setMenuAcoesAberto(false);
                                        setShowModalSaldo(true);
                                    }}
                                >
                                    <IconeAcaoModal $cor="#10b981">➕</IconeAcaoModal>
                                    <div>
                                        <strong>Receita / Salário</strong>
                                        <p>Registrar entrada financeira</p>
                                    </div>
                                </BotaoAcaoModal>

                                <BotaoAcaoModal
                                    onClick={() => {
                                        setMenuAcoesAberto(false);
                                        setShowModalGasto(true);
                                    }}
                                >
                                    <IconeAcaoModal $cor="#820ad1">💳</IconeAcaoModal>
                                    <div>
                                        <strong>Gasto no Cartão</strong>
                                        <p>Lançar compra em cartão de crédito</p>
                                    </div>
                                </BotaoAcaoModal>

                                <BotaoAcaoModal
                                    onClick={() => {
                                        setMenuAcoesAberto(false);
                                        setShowModalEssencial(true);
                                    }}
                                >
                                    <IconeAcaoModal $cor="#00b3ff">📉</IconeAcaoModal>
                                    <div>
                                        <strong>Gasto Essencial</strong>
                                        <p>Conta fixa, aluguel ou luz</p>
                                    </div>
                                </BotaoAcaoModal>
                            </BottomSheetGrid>
                        </BottomSheetAcoes>
                    </>
                )}
            </Container>

            {showModalGasto && (
                <ModalNovoGasto
                    onClose={() => setShowModalGasto(false)}
                    onSubmit={adicionarGasto}
                />
            )}
            {showModalSaldo && (
                <ModalReceita
                    onClose={() => setShowModalSaldo(false)}
                    onSubmit={adicionarReceita}
                />
            )}
            {showModalEssencial && (
                <ModalEssencial
                    onClose={() => setShowModalEssencial(false)}
                    onSubmit={adicionarEssencial}
                />
            )}
        </>
    );
}

const Container = styled.div`
    display: grid;
    grid-template-columns: 15% 85%;
    grid-template-rows: 1fr auto;
    grid-template-areas:
        "nav main"
        "footer footer";
    height: 100vh;
    box-sizing: border-box;

    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;
        height: 100dvh;
        overflow: hidden;
    }
`;

const MobileTopBar = styled.header`
    display: none;

    @media (max-width: 768px) {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 14px;
        min-height: 48px;
        background-color: ${({ theme }) => theme.colors.cardsBg || "#0d121f"};
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        z-index: 100;
        position: relative;
    }
`;

const MobileUserArea = styled.div`
    position: relative;
`;

const MobileUserAvatarButton = styled.button`
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid #820ad1;
    }

    span {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #820ad1, #00b3ff);
        color: white;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
    }
`;

const MenuDropdownUsuario = styled.div`
    position: absolute;
    top: 45px;
    right: 0;
    background: #0d121f;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 14px;
    width: 210px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
    z-index: 110;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const UserNameDropdown = styled.p`
    font-size: 0.88rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const BadgePerfilDropdown = styled.span`
    align-self: flex-start;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    background: ${({ $isIngrid }) =>
        $isIngrid
            ? "linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(219, 39, 119, 0.35))"
            : "linear-gradient(135deg, rgba(130, 10, 209, 0.25), rgba(0, 179, 255, 0.35))"};
    color: ${({ $isIngrid }) => ($isIngrid ? "#f472b6" : "#00b3ff")};
    border: 1px solid
        ${({ $isIngrid }) =>
            $isIngrid ? "rgba(236, 72, 153, 0.4)" : "rgba(0, 179, 255, 0.4)"};
`;

const UserEmailDropdown = styled.p`
    font-size: 0.72rem;
    color: #94a3b8;
    margin: 0 0 6px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const LinkConfigMobile = styled(Link)`
    text-decoration: none;
    color: #cbd5e1;
    font-size: 0.85rem;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    text-align: center;
    transition: background 0.15s ease;

    &:hover {
        background: rgba(130, 10, 209, 0.2);
        color: #fff;
    }
`;

const BotaoSairDropdown = styled.button`
    background: rgba(231, 76, 60, 0.15);
    border: 1px solid rgba(231, 76, 60, 0.4);
    color: #ff6b6b;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease;

    &:hover {
        background: rgba(231, 76, 60, 0.3);
    }
`;

const NavContainer = styled.div`
    display: flex;
    grid-area: nav;
    box-sizing: border-box;
    color: white;
    padding: 60px 8px;

    @media (max-width: 768px) {
        display: none;
    }
`;

const NavCardContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 16px 8px;
    background-color: ${({ theme }) => theme.colors.cardsBg};
    border-radius: 16px;
`;

export const StyledLink = styled(Link)`
    text-decoration: none;
    color: white;
    font-size: 1rem;
    font-weight: 500;
    background-color: ${(props) => (props.$bgBtn ? "#777777" : "transparent")};
    padding: ${(props) => (props.$bgBtn ? "12px 16px" : "4px 12px")};
    border-radius: 8px;
    transition: background-color 0.3s ease;
    width: 100%;
    text-align: center;
    box-sizing: border-box;

    &:hover {
        background-color: ${({ theme }) => theme.colors.primary};
        color: ${({ theme }) => theme.colors.textOnPrimary};
    }

    &:active {
        transform: scale(0.98);
    }
`;

export const StyledButton = styled.button`
    background: transparent;
    border: none;
    color: white;
    font-size: 1rem;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 8px;
    width: 100%;
    text-align: center;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: ${({ theme }) => theme.colors.primary};
        color: ${({ theme }) => theme.colors.textOnPrimary};
    }

    &:active {
        transform: scale(0.98);
    }
`;

const UserCard = styled.div`
    width: 100%;
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
`;

const UserAvatar = styled.img`
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 2px solid ${({ theme }) => theme.colors.secondary || "#00b3ff"};
`;

const UserAvatarPlaceholder = styled.div`
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(135deg, #820ad1, #00b3ff);
    color: white;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
`;

const UserInfo = styled.div`
    text-align: center;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
`;

const UserName = styled.p`
    font-size: 0.85rem;
    font-weight: 600;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
`;

const BadgePerfilDesktop = styled.span`
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    background: ${({ $isIngrid }) =>
        $isIngrid
            ? "linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(219, 39, 119, 0.35))"
            : "linear-gradient(135deg, rgba(130, 10, 209, 0.25), rgba(0, 179, 255, 0.35))"};
    color: ${({ $isIngrid }) => ($isIngrid ? "#f472b6" : "#00b3ff")};
    border: 1px solid
        ${({ $isIngrid }) =>
            $isIngrid ? "rgba(236, 72, 153, 0.4)" : "rgba(0, 179, 255, 0.4)"};
`;

const UserEmail = styled.p`
    font-size: 0.7rem;
    color: #888888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
`;

const BotaoSair = styled.button`
    background-color: rgba(231, 76, 60, 0.15);
    border: 1px solid rgba(231, 76, 60, 0.4);
    color: #ff6b6b;
    font-size: 0.8rem;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    width: 90%;
    transition: all 0.2s ease;

    &:hover {
        background-color: rgba(231, 76, 60, 0.3);
        transform: translateY(-1px);
    }
`;

const MainContainer = styled.main`
    grid-area: main;
    overflow-y: auto;
    padding: 1rem;
    box-sizing: border-box;

    @media (max-width: 768px) {
        flex: 1;
        overflow-y: auto;
        padding: 12px 12px 88px 12px;
        -webkit-overflow-scrolling: touch;
    }
`;

const Footer = styled.footer`
    grid-area: footer;
    background-color: ${({ theme }) => theme.colors.cardsBg};
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;

    @media (max-width: 768px) {
        display: none;
    }

    .textFooter {
        padding-top: 5px;
        text-align: center;
        background: linear-gradient(to right, #820ad1, #00b3ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        color: transparent;
    }
`;

// ==================== COMPONENTES NATIVOS MOBILE ====================

const MobileBottomNav = styled.nav`
    display: none;

    @media (max-width: 768px) {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background-color: rgba(13, 18, 31, 0.95);
        backdrop-filter: blur(12px);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        justify-content: space-around;
        align-items: center;
        z-index: 90;
        padding: 0 4px;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
    }
`;

const BottomNavItem = styled(Link)`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    flex: 1;
    height: 100%;
    color: ${({ $ativo }) => ($ativo ? "#00b3ff" : "#94a3b8")};
    transition: all 0.2s ease;

    ${({ $ativo }) =>
        $ativo &&
        `
        font-weight: 700;
        transform: translateY(-2px);
    `}
`;

const BottomNavIcon = styled.span`
    font-size: 1.25rem;
    line-height: 1;
    margin-bottom: 3px;
`;

const BottomNavText = styled.span`
    font-size: 0.68rem;
    letter-spacing: 0.2px;
`;

const BottomNavAddButton = styled.button`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #820ad1 0%, #00b3ff 100%);
    color: white;
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(130, 10, 209, 0.5);
    margin-top: -24px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:active {
        transform: scale(0.92);
        box-shadow: 0 2px 8px rgba(130, 10, 209, 0.7);
    }

    span {
        line-height: 1;
        margin-top: -3px;
    }
`;

const MenuBackdrop = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(4, 8, 16, 0.7);
    backdrop-filter: blur(4px);
    z-index: 95;
`;

const BottomSheetAcoes = styled.div`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #0d121f;
    border-top: 1px solid #1e293b;
    border-radius: 20px 20px 0 0;
    padding: 20px 20px 32px 20px;
    z-index: 100;
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.6);
    animation: slideUp 0.22s ease-out;

    @keyframes slideUp {
        from {
            transform: translateY(100%);
        }
        to {
            transform: translateY(0);
        }
    }
`;

const BottomSheetHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    font-size: 1rem;
    font-weight: 700;
    color: #f8fafc;
`;

const BotaoFecharModal = styled.button`
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
`;

const BottomSheetGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const BotaoAcaoModal = styled.button`
    background: #131b2e;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;

    &:hover, &:active {
        background: #1c2742;
        border-color: #820ad1;
    }

    strong {
        display: block;
        font-size: 0.95rem;
        color: #f8fafc;
        margin-bottom: 2px;
    }

    p {
        font-size: 0.76rem;
        color: #94a3b8;
        margin: 0;
    }
`;

const IconeAcaoModal = styled.span`
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: ${({ $cor }) => `${$cor}22`};
    border: 1px solid ${({ $cor }) => `${$cor}55`};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
`;
