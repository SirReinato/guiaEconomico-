import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import { isProprietarioInsights, isEmailAutorizado, getPerfilUsuario } from "../utils/permissoes";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                if (!isEmailAutorizado(currentUser.email)) {
                    setAuthError(
                        `O e-mail ${currentUser.email} não tem permissão de acesso a este painel financeiro.`
                    );
                    setUser(null);
                    signOut(auth);
                } else {
                    setAuthError("");
                    setUser(currentUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginComGoogle = async () => {
        setAuthError("");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const loggedUser = result.user;

            if (!isEmailAutorizado(loggedUser.email)) {
                setAuthError(
                    `Acesso negado: o e-mail ${loggedUser.email} não tem autorização neste dashboard.`
                );
                await signOut(auth);
                setUser(null);
                return false;
            }

            setUser(loggedUser);
            return true;
        } catch (error) {
            console.error("Erro no login com Google:", error);
            if (error.code === "auth/popup-closed-by-user") {
                setAuthError("Janela de login fechada antes de concluir.");
            } else if (error.code === "auth/unauthorized-domain") {
                setAuthError(
                    "Este domínio ainda não está autorizado no Firebase Console. Adicione seu domínio da Vercel em Authentication -> Configurações -> Domínios autorizados."
                );
            } else {
                setAuthError("Falha na autenticação. Tente novamente.");
            }
            return false;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setAuthError("");
        } catch (error) {
            console.error("Erro ao deslogar:", error);
        }
    };

    const perfilAtivo = useMemo(() => {
        return getPerfilUsuario(user?.email);
    }, [user?.email]);

    const temAcessoInsights = useMemo(() => {
        return isProprietarioInsights(user?.email);
    }, [user?.email]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                authError,
                loginComGoogle,
                logout,
                isAuthorized: Boolean(user),
                temAcessoInsights,
                isProprietario: temAcessoInsights,
                perfilAtivo,
                isIngrid: perfilAtivo === "ingrid",
                isRenato: perfilAtivo === "renato",
                nomePerfil: perfilAtivo === "ingrid" ? "Ingrid" : "Renato",
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}
