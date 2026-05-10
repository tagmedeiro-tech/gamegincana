# 🧠 Skill do Projeto: Gincana da Tribo

Este documento serve como a base de conhecimento (Brain/Skill) para o desenvolvimento contínuo deste ecossistema de gamificação.

## 🏗️ Arquitetura Técnica
- **Frontend:** React + Vite + Tailwind CSS v4 + Framer Motion.
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage).
- **Estilo:** Estética "High-Fidelity" (Premium), Dark Mode predominante, gradientes dourados e animações suaves.

## 📊 Estrutura de Dados Crítica
- **Profiles:** Estendido com `totalPoints`, `role` (admin, leader, participant) e `groupId`. **Nota:** Não existe coluna `avatar_url` (usar inicial do nome como fallback).
- **Store Ecosystem:**
    - `store_items`: Prêmios disponíveis.
    - `redemptions`: Log de pedidos vinculando `store_item` e `profile`.
- **Arena Live & Gamificação:** 
    - **Arena Live V2:** Motor de busca resiliente (anti-autofill) e sistema de bônus com auditoria automática (timestamps).
    - **Desafios Dinâmicos:** Suporte a ícones híbridos (Lucide + Emoji) via componente `DynamicIcon`.
    - **RPG System:** Lógica de progressão centralizada em `src/types.ts` (`getUserLevel`, `LEVEL_THRESHOLDS`).
    - **Dashboard Premium:** Streaks de leitura, gráficos Sparkline em SVG dinâmico, Missão Diária guiada por IA Contextual.
    - **Duelos:** Arquitetura inter-grupos (`supabase.channel('duel')`) baseada num motor unificado de Quiz de 3 camadas.

## 🛠️ Regras de Ouro (Development Rules)
1. **Resiliência de Rede & Auth:** Sempre usar o `customFetch` do `src/lib/supabase.ts` (timeout de 30s). Além disso, o token JWT refresh deve sempre passar pelo **Mutex Lock** (`globalLock`) no `createSupabaseClient` para evitar deadlocks de "Invalid Refresh Token" em abas inativas.
2. **Tratamento de Erros:** Carregamentos de dados (`useEffect`) devem SEMPRE usar blocos `try/catch/finally` para evitar spinners infinitos e garantir que `setLoading(false)` execute (mesmo em `AbortError`).
3. **UI Branding & Layout Mobile:** Consultar `useAppTheme` para cores e ícones dinâmicos. Nunca use larguras fixas restritas (como `min-w-[300px]`) sem fallback responsivo, e sempre blinde os contêineres principais com `overflow-x-hidden` para evitar "chacoalhar" no scroll de celulares.
4. **Painel Admin Consolidado:** Ferramentas econômicas (Editor de Pontos, Tabelas e Multiplicador) devem residir no `AdminSystemPoints.tsx`, enquanto missões e desafios residem em `AdminActivities.tsx`. A gestão de tribos (`AdminGroups.tsx`) suporta **edição inline** de nomes e pontuações para ajustes rápidos em tempo real.
5. **Proteção de Cooldown e Progressão Bíblica:** A consulta de progresso bíblico exige filtros precisos (`.eq('completion_type', 'reading')` e `.limit(1)`) para evitar falhas do `maybeSingle()`. A pontuação do Quiz deve ser sempre dinâmica, consumindo as configurações do banco.
6. **Roteamento Absoluto:** Toda navegação interna no dashboard DEVE usar caminhos absolutos iniciados com `/dashboard/` para evitar quebra de roteamento em sub-rotas.
7. **Estabilidade de Scroll:** Evitar animações de deslocamento `y` via Framer Motion em cards grandes para prevenir jittering no mobile.
8. **Estabilização de Navegação & Cache (v2.1):** 
    - **Focus Listeners:** Proibido o uso de `window.addEventListener('focus', fetchData)` em componentes de rota, pois causa re-fetch/loading infinito ao navegar e voltar. Use apenas `'online'` ou Realtime.
    - **Loading Guards:** Checks de `if (loading)` devem ser acompanhados de verificação de dados: `if (loading && data.length === 0)`. Isso permite que o usuário veja os dados antigos (cache em memória) enquanto o novo fetch ocorre em background.
    - **Dependencies:** Nunca incluir `revalidateCount` ou `fetchData` em arrays de dependência de `useEffect` sem `useCallback` estável, sob risco de loop infinito de renderização.
    - **TTL Guard:** Para dados de alta latência, use `sessionStorage` para guardar o timestamp do último fetch e ignorar re-fetchs dentro de um intervalo (ex: 30-60s).

## 🚀 Próximos Passos (Backlog)
- [x] Criar sistema de ofensivas (Streaks) com proteção por escudo.
- [x] Consolidar o Painel de Pontos Administrativo (Central de Economia).
- [x] Implementar Gestão de Temporadas com Reset e Sala de Espera Modernizada.
- [x] Expandir o "Ecossistema Bíblico" com planos de leitura dinâmica.
- [x] Estabilizar navegação interna (Remoção de deadlocks de loading).
- [ ] Implementar compressão de imagem no client-side para uploads da loja.
- [ ] Criar sistema de notificações push via Web Push API.
- [ ] Otimizar performance do Mural com Infinite Scroll e Lazy Loading de mídias.

---
*Assinado: Antigravity AI (Pairs com Tiago)*
