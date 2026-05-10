**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸŽ¨ Plano de Melhoria UI/UX: Mural da Tribo (Arena Social)

Este plano detalha a evoluÃ§Ã£o do Mural (Feed) para uma experiÃªncia de alta fidelidade, focada em engajamento e identidade visual premium.

---

## ðŸ’Ž 1. EstÃ©tica High-Fidelity & Identidade
*   **Bordas de Tribo DinÃ¢micas**: Posts devem exibir uma borda ou glow sutil baseado na cor do grupo do autor.
    *   *ImplementaÃ§Ã£o*: Injetar `--group-color` no estilo do `PostCard`.
*   **Glassmorphism no Header**: Barra de filtros e Header do Feed com `backdrop-blur-md` e fundo semi-transparente para profundidade no scroll.
*   **Hierarquia TipogrÃ¡fica**: 
    *   Nomes de autores em `font-black`.
    *   VersÃ­culos e Estudos BÃ­blicos com fontes serifadas elegantes para contraste "Sagrado vs Social".

## âš¡ 2. UX de Postagem (FricÃ§Ã£o Zero)
*   **Quick Composer**: Substituir o botÃ£o modal por um campo de entrada fixo no topo da pÃ¡gina.
*   **Visual Preview**: RenderizaÃ§Ã£o instantÃ¢nea de thumbnails de YouTube, Spotify e Imagens durante a digitaÃ§Ã£o.
*   **Multi-upload**: Suporte para galeria de fotos em um Ãºnico post (Carrossel).

## ðŸ”¥ 3. Engajamento & GamificaÃ§Ã£o
*   **ReaÃ§Ãµes Animadas**: Efeitos de partÃ­culas e "pop" ao reagir. ExibiÃ§Ã£o de avatares de quem reagiu.
*   **Trending Indicator**: Badge de "Em Alta" para posts com muitas interaÃ§Ãµes recentes.
*   **ComentÃ¡rios Paginados**: Carregamento inline dos comentÃ¡rios sem abrir painÃ©is pesados.

## ðŸ“± 4. Mobile & Performance
*   **Skeleton Loaders**: Substituir spinners genÃ©ricos por esqueletos que simulam o formato dos cards.
*   **Pull-to-Refresh**: Gesto nativo para atualizar o feed em dispositivos mÃ³veis.
*   **Imagens Optimizadas**: Carregamento progressivo (blur-up) para fotos de alta resoluÃ§Ã£o.

---

## ðŸ› ï¸ Backlog de ImplementaÃ§Ã£o
- [ ] Refatorar `PostCard.tsx` com estilos dinÃ¢micos de grupo.
- [ ] Criar `QuickComposer.tsx` para substituir o modal.
- [ ] Implementar micro-animaÃ§Ãµes de reaÃ§Ã£o com Framer Motion.
- [ ] Adicionar suporte a carrossel de fotos.

---
*Documento gerado em 27/04/2026 como guia de expansÃ£o da Fase 4.*

