**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ“± Mural da Tribo â€” Fase 2 Implementada

**Status:** âœ… Cards BÃ¡sicos + Composer â€” CONCLUÃDO  
**Data:** 27/04/2026

---

## Componentes Criados (`src/components/feed/`)

| Arquivo | DescriÃ§Ã£o |
|---|---|
| `PostReactionBar.tsx` | Barra com 5 emojis, picker animado, toggle e contador |
| `PostCommentSection.tsx` | ComentÃ¡rios expansÃ­veis, scroll, XP por comentÃ¡rio |
| `PostCard.tsx` | Card genÃ©rico com sub-cards por tipo + moderaÃ§Ã£o |
| `PhotoUploader.tsx` | Drag-and-drop, preview local, upload Storage |
| `VersePickerModal.tsx` | Seletor de versÃ­culo via BibleService + BIBLE_BOOKS |
| `PostComposer.tsx` | Modal compositor com 5 tabs, visibility, XP ao publicar |

## Sub-cards implementados no `PostCard.tsx`

| Tipo | Card |
|---|---|
| `photo` | Imagem com lightbox fullscreen |
| `text` | VersÃ­culo estilizado + deep-link para BibleViewer |
| `bible_study` | AcordeÃ£o expansÃ­vel com markdown |
| `youtube` | Thumbnail + botÃ£o Play â†’ iframe nativo (youtube-nocookie) |
| `spotify_track` / `spotify_playlist` | Embed player nativo |
| `achievement` | Card dourado com Ã­cone e label |
| `duel_victory` | Card vermelho com placar |
| `activity_proof` | Imagem + nome da atividade |

## Feed.tsx Refatorado

- Header com botÃ£o **"+ Postar"**
- **Filtros dinÃ¢micos** buscados da tabela `groups`
- Filtros de tipo: Fotos, Videos, Estudos, Conquistas
- **Realtime**: novos posts aparecem no topo via `postgres_changes`
- PaginaÃ§Ã£o com "Ver mais"
- Estado vazio com CTA

## BibleViewer.tsx Integrado

- Import do `PostComposer`
- State: `showMuralComposer` + `muralInitialData`
- BotÃ£o **"ðŸ“¢ Compartilhar no Mural"** no painel de notas, abaixo de "Salvar Nota"
- Pre-preenche o composer com: `verseRef`, `verseText`, `verseBookId`, `verseChapter`, `verseNumber`, `caption` (texto da nota)

## PrÃ³ximas Fases

### Fase 3 â€” Auto-integraÃ§Ãµes (a implementar)
- [ ] Hook em `AchievementService` para auto-post de conquistas
- [ ] Hook em `Duel.tsx` apÃ³s vitÃ³ria
- [ ] BotÃ£o "Compartilhar" em `LeaderPanel.tsx` e `Activities.tsx`

### Fase 4 â€” Admin (a implementar)
- [ ] Painel "Mural da Tribo" em `AdminSettings.tsx` (pontos configurÃ¡veis)
- [ ] `PostModerationPanel.tsx`

