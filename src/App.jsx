import { BrowserRouter } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MesProvider } from "./context/MesContext";
import { useRegisterSW } from 'virtual:pwa-register/react';
import { GastosProvider } from "./context/GastosContext";
import { SaldoProvider } from "./context/SaldoContext";
import { EssencialProvider } from "./context/EssencialContext";
import Login from "./pages/Login";

function AppContent() {
    const { user, loading } = useAuth();
    const { needRefresh, updateServiceWorker } = useRegisterSW({
        onRegistered(r) { console.log('SW registered', r); },
        onNeedRefresh() { console.log('New version available'); }
    });


    if (loading) {
        return (
            <LoadingContainer>
                <Spinner />
                <LoadingText>Carregando Guia Econômico...</LoadingText>
            </LoadingContainer>
        );
    }

    if (!user) {
        return <Login />;
    }

    return (
        <MesProvider>
            <SaldoProvider>
                <EssencialProvider>
                    <GastosProvider>
                        <AppRoutes />
                        {needRefresh && (
                            <UpdateBanner onClick={() => updateServiceWorker(true)}>
                                🚀 Nova versão disponível! Clique para atualizar
                            </UpdateBanner>
                        )}
                    </GastosProvider>
                </EssencialProvider>
            </SaldoProvider>
        </MesProvider>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

const spin = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    background-color: ${({ theme }) => theme.colors.backgroundHome || "#0b0b1c"};
    gap: 16px;
`;

const Spinner = styled.div`
    width: 48px;
    height: 48px;
    border: 4px solid rgba(130, 10, 209, 0.2);
    border-top: 4px solid #00b3ff;
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
`;

const LoadingText = styled.p`
    color: ${({ theme }) => theme.colors.textPrimary || "#e0e1dd"};
    font-size: 1rem;
    letter-spacing: 0.5px;
`;

const UpdateBanner = styled.button`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 9999;
    background: linear-gradient(90deg, #0d6efd, #00b3ff);
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    font-weight: 600;
    font-size: 0.82rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 2px 10px rgba(0, 179, 255, 0.35);
    cursor: pointer;
    transition: background 0.2s, opacity 0.2s;

    @media (max-width: 768px) {
        top: 52px;
        padding: 6px 12px;
        font-size: 0.78rem;
    }

    &:hover {
        background: linear-gradient(90deg, #0b5ed7, #0099db);
    }

    &:active {
        opacity: 0.9;
    }
`;
