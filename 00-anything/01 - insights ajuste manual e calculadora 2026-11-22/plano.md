# Plano de Implementação — Insights (Ajuste Manual + Reflexo Mês Anterior) & Calculadora Flutuante

**Branch:** `feature/insights-ajuste-manual-e-calculadora`  
**Data:** 2026-11-22

---

## Fase 1 — `fix(insights): corrigir reflexo da sobra do mês anterior na projeção da reserva`
- **Objetivo:** Fazer cada mês `M` na tabela/cards do Insights receber a sobra/déficit de `M - 1` (`chaveMesAnterior`), sem alterar a tela inicial (`Home`). Suportar `saldosManuais` a partir de `2026-09`.
- **Arquivos:** `src/utils/reservaCalculos.js`, `src/pages/Insights/index.jsx`
- **DoD:** Setembro reflete em Outubro, Outubro em Novembro, Novembro em Dezembro; `saldosManuais` propaga o `valorFinal` ajustado como `valorInicial` do mês seguinte.

## Fase 2 — `feat(security,insights): permitir saldosManuais nas regras do Firestore e service da reserva`
- **Objetivo:** Atualizar `firestore.rules` (via subagente `firestore-rules-author`) para aceitar `saldosManuais` em `configuracoes/reserva` e `configuracoes/reserva_ingrid`, e expor helper em `src/services/reservaService.js`.
- **Arquivos:** `firestore.rules`, `src/services/reservaService.js`
- **DoD:** Regras validam `saldosManuais` como `map` (<= 200 chaves) e salvamento persiste no Firestore + `localStorage`.

## Fase 3 — `feat(insights): edição do valor final mensal a partir de set/2026 com tag Ajustado manual`
- **Objetivo:** Permitir editar o `Saldo Final` na tabela e nos cards mobile para meses `>= 2026-09`, exibindo tag `Ajustado manual` e opção de restaurar automático.
- **Arquivos:** `src/pages/Insights/index.jsx`
- **DoD:** Usuário consegue editar, visualizar a tag `Ajustado manual` e limpar o ajuste em desktop e mobile.

## Fase 4 — `feat(ui): adicionar calculadora flutuante global e atualizar documentação`
- **Objetivo:** Criar `src/components/CalculadoraFlutuante/index.jsx`, integrar em `src/pages/Outlet/index.jsx`, atualizar `AGENTS.md`, `README.md`, `package.json`/`graphify`, validar `npm run lint` e `npm run build`, commitar e subir branch ao GitHub.
- **Arquivos:** `src/components/CalculadoraFlutuante/index.jsx`, `src/pages/Outlet/index.jsx`, `AGENTS.md`, `README.md`, `package.json`
- **DoD:** Calculadora acessível em todas as páginas, lint/build sem erros, `graphify update .` executado e branch enviada para `origin`.
