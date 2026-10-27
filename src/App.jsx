import { BrowserRouter } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MesProvider } from "./context/MesContext";
import { GastosProvider } from "./context/GastosContext";
import { SaldoProvider } from "./context/SaldoContext";
import { EssencialProvider } from "./context/EssencialContext";
import Login from "./pages/Login";

function AppContent() {
    const { user, loading } = useAuth();

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
