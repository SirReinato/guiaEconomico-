import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { salvarAporteMesConfirmado } from "../services/reservaService";

const MesContext = createContext();

const STORAGE_KEY_MES = "guia_economico_mes_referencia";
const STORAGE_KEY_MESES_PAGOS = "guia_economico_meses_pagos";

export function MesProvider({ children }) {
    const [mesReferencia, setMesReferencia] = useState(() => {
        const salvo = localStorage.getItem(STORAGE_KEY_MES);
        if (salvo) {
            const [ano, mes] = salvo.split("-");
            if (ano && mes) {
                return new Date(parseInt(ano, 10), parseInt(mes, 10) - 1, 1);
            }
        }
        const hoje = new Date();
        return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    });

    const [mesesPagos, setMesesPagos] = useState(() => {
        try {
            const salvos = localStorage.getItem(STORAGE_KEY_MESES_PAGOS);
            return salvos ? JSON.parse(salvos) : [];
        } catch {
            return [];
        }
    });

    // Salva o mês de referência sempre que mudar
    useEffect(() => {
        const ano = mesReferencia.getFullYear();
        const mes = String(mesReferencia.getMonth() + 1).padStart(2, "0");
        localStorage.setItem(STORAGE_KEY_MES, `${ano}-${mes}`);
    }, [mesReferencia]);

    // Salva a lista de meses pagos
    useEffect(() => {
        localStorage.setItem(
            STORAGE_KEY_MESES_PAGOS,
            JSON.stringify(mesesPagos)
        );
    }, [mesesPagos]);

    const ano = mesReferencia.getFullYear();
    const mesIndex = mesReferencia.getMonth();

    const hoje = new Date();
    const anoAtualReal = hoje.getFullYear();
    const mesAtualRealIndex = hoje.getMonth();

    // Verifica se o calendário real já passou do mês em exibição
    const isPendenteVirada =
        anoAtualReal > ano ||
        (anoAtualReal === ano && mesAtualRealIndex > mesIndex);

    // Chave identificadora do mês: "2026-09"
    const chaveMesAtual = `${ano}-${String(mesIndex + 1).padStart(2, "0")}`;
    const estaPago = mesesPagos.includes(chaveMesAtual);

    const formatarMesAno = useCallback((date) => {
        const str = date.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
        });
        return str.charAt(0).toUpperCase() + str.slice(1);
    }, []);

    const nomeMesAno = useMemo(() => formatarMesAno(mesReferencia), [formatarMesAno, mesReferencia]);

    // Confirma que tudo do mês foi pago e avança para o próximo mês
    const confirmarMesPago = useCallback(async (valorSobra = null) => {
        if (!mesesPagos.includes(chaveMesAtual)) {
            setMesesPagos((prev) => [...prev, chaveMesAtual]);
        }
        if (valorSobra !== null && !isNaN(valorSobra)) {
            try {
                await salvarAporteMesConfirmado(chaveMesAtual, valorSobra);
            } catch (e) {
                console.warn("Erro ao salvar aporte do mês na reserva:", e);
            }
        }
        // Avança para o mês seguinte
        setMesReferencia(new Date(ano, mesIndex + 1, 1));
    }, [ano, chaveMesAtual, mesIndex, mesesPagos]);

    // Navegação manual entre meses
    const avancarMes = useCallback(() => {
        setMesReferencia((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const voltarMes = useCallback(() => {
        setMesReferencia((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const irParaMesAtual = useCallback(() => {
        const h = new Date();
        setMesReferencia(new Date(h.getFullYear(), h.getMonth(), 1));
    }, []);

    const value = useMemo(
        () => ({
            mesReferencia,
            ano,
            mesIndex,
            nomeMesAno,
            isPendenteVirada,
            estaPago,
            confirmarMesPago,
            avancarMes,
            voltarMes,
            irParaMesAtual,
            formatarMesAno,
        }),
        [
            mesReferencia,
            ano,
            mesIndex,
            nomeMesAno,
            isPendenteVirada,
            estaPago,
            confirmarMesPago,
            avancarMes,
            voltarMes,
            irParaMesAtual,
            formatarMesAno,
        ]
    );

    return (
        <MesContext.Provider value={value}>
            {children}
        </MesContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMes() {
    return useContext(MesContext);
}
