# Plano de Otimização de Desempenho — Guia Econômico

**Data:** 2026-11-22  
**Diagnóstico:**
1. **Bundle único de 1.571,93 kB (`index-*.js`)**: todas as páginas e bibliotecas pesadas (`chart.js`, `recharts`, `firebase`, `react-icons`) carregam juntas no boot, sem `React.lazy` nem `manualChunks`.
2. **Tempestade de conexões/escritas Firestore no boot** (visível no DevTools com múltiplos `channel?gsessionid=...` de 31s–1.1min):
   - `firebase.js` usa `getFirestore(app)` sem `persistentLocalCache`.
   - `SaldoContext.jsx` dispara `salvarSalariosAjustadosAPI` (`setDoc`) automaticamente no boot.
   - `GastosContext.jsx` executa 2 ondas sequenciais de `Promise.all` e dispara `removerGastosOrfaosParcelamentoAPI` (`getDocs` extra) em todo carregamento.
   - `vite.config.js` aplica `runtimeCaching` `NetworkFirst` em URLs contendo `firebase`.
3. **Re-renders em cascata**: `value` dos Providers não está memoizado com `useMemo`.
4. **DOM pesado no `Insights`**: renderiza ~912 linhas/cards de uma vez (2021–2097) quando o filtro está em `Todos`.

---

## Issues Sequenciais (Executar 1 por vez mediante comando)

1. **Fase 1 (`SIR-134`)** — `perf(build): implementar code-splitting por rota com React.lazy e manualChunks no Vite`
2. **Fase 2 (`SIR-135`)** — `perf(firebase): habilitar cache persistente do Firestore e eliminar escritas/queries redundantes no boot`
3. **Fase 3 (`SIR-136`)** — `perf(context): memoizar values e callbacks dos Contexts para evitar re-renders em cascata`
4. **Fase 4 (`SIR-137`)** — `perf(insights): paginar/limitar renderização inicial da tabela e cards de 912 meses`
5. **Fase 5 (`SIR-138`)** — `perf(metas): otimizar carregamento de Metas e validar métricas finais de bundle`
