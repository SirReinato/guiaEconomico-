# Plano de Implementação — Ícone do PWA e Favicon do Navegador

**Branch:** `feature/icone-pwa-e-navegador`  
**Data:** 2026-11-22

---

## Fase 1 — `feat(brand): criar SVG mestre da identidade visual e gerar ícones PNG para PWA e navegador`
- **Objetivo:** Substituir os ícones genéricos ("bola azul") por ícones alinhados à identidade visual do `src/components/Logo/index.jsx` (squircle `#060f1a` com borda gradiente `#820ad1` → `#00b3ff`, barras ascendentes, linha/flecha de tendência e `$`).
- **Arquivos:** `public/favicon.svg`, `public/favicon-32x32.png`, `public/apple-touch-icon.png`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/pwa-maskable-512x512.png`
- **DoD:** Todos os ícones gerados em `public/` com nitidez, proporção correta e safe-zone adequada na versão `maskable` para Android.

## Fase 2 — `feat(pwa,head): configurar favicons no index.html e manifest/ícones no vite.config.js`
- **Objetivo:** Registrar o favicon SVG/PNG e `apple-touch-icon` no `index.html`, além de atualizar o `manifest` do `VitePWA` em `vite.config.js` com os novos ícones (`any` e `maskable`) e cores do tema escuro neon (`#060f1a` / `#820ad1`).
- **Arquivos:** `index.html`, `vite.config.js`
- **DoD:** Aba do navegador exibe o novo ícone (sem globo genérico), `npm run build` gera `manifest.webmanifest` válido com todos os ícones e `npm run lint` passa sem erros.

## Fase 3 — `docs: atualizar AGENTS.md, sincronizar graphify e subir branch ao GitHub`
- **Objetivo:** Documentar os novos arquivos de `public/` e histórico no `AGENTS.md`, rodar `npx graphify update .`, validar `npm run lint` e `npm run build`, e enviar a branch `feature/icone-pwa-e-navegador` para `origin`.
- **Arquivos:** `AGENTS.md`
- **DoD:** `AGENTS.md` e `graphify` atualizados, `lint` e `build` verdes, branch publicada no GitHub.
