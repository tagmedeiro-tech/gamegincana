**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ“± Mural da Tribo â€” Rede Social (Fase 1 Implementada)

**Status:** âœ… Backend + Tipos â€” CONCLUÃDO  
**Data:** 27/04/2026

---

## O que foi implementado (Fase 1)

### ðŸ“¦ Novos Tipos (`src/types.ts`)
- `PostType` â€” 9 tipos de post
- `ReactionEmoji` â€” 5 emojis de reaÃ§Ã£o (â¤ï¸ ðŸ”¥ ðŸ™Œ ðŸ˜‚ ðŸ˜®)
- `FeedFilter` â€” sistema de filtros por grupo/tipo
- `FeedPost` â€” interface completa com todos os campos
- `PostComment`, `PostReaction`, `TribePlaylist`
- `MuralPointsConfig` + `DEFAULT_MURAL_POINTS`

### âš™ï¸ AppTheme atualizado (`src/hooks/useAppTheme.ts`)
- Novo campo `muralPoints` na interface `AppTheme`
- Valores padrÃ£o injetados no estado inicial
- ConfigurÃ¡vel pelo Admin via `AdminSettings.tsx` (Fase 5)

### ðŸ”§ FeedService (`src/lib/FeedService.ts`)
- `getPosts(page, filter)` â€” com filtros: all / my_group / type:X / group_id
- `createPost(payload)` â€” mapeamento camelCase â†” snake_case
- `deletePost(postId, imagePath)` â€” apaga Storage automaticamente
- `pinPost(postId, pinned)` â€” fixar no topo
- `toggleReaction(postId, userId, emoji)` â€” toggle inteligente
- `getReactions / getComments / addComment / deleteComment`
- `uploadPhoto(file, userId)` â€” validaÃ§Ã£o de tipo/tamanho + Storage
- `buildSpotifyEmbedUrl / extractSpotifyMeta`
- `extractYouTubeId / buildYouTubeEmbedUrl` (nocookie, sem API key)
- `autoPostAchievement / autoPostDuelVictory / shareActivityProof`
- `grantPostXP / grantCommentXP` â€” integrados com `point_logs`

### ðŸ—„ï¸ SQL Migration (`supabase/mural_tribo_migration.sql`)
- Tabela `feed_posts` (com CHECK de post_type e visibility)
- Tabela `post_comments` (com limite de 1000 chars)
- Tabela `post_reactions` (UNIQUE por post+user+emoji)
- Tabela `tribe_playlists`
- Bucket `feed-media` com polÃ­ticas RLS
- Trigger anti-spam: mÃ¡x 10 posts/dia por usuÃ¡rio
- Realtime habilitado nas 3 tabelas principais

### ðŸ”’ CSP / SeguranÃ§a
- `index.html` â€” meta tag `Content-Security-Policy` liberando `frame-src` YouTube + Spotify
- `netlify.toml` â€” headers HTTP de seguranÃ§a (X-Frame-Options, CSP, Referrer-Policy)

---

## Filtros do Feed

| Filtro | Comportamento |
|---|---|
| `all` | Todos os posts pÃºblicos |
| `my_group` | SÃ³ posts do grupo do usuÃ¡rio |
| `type:photo` / `type:youtube` / etc | Por tipo de post |
| `{group_id}` | Posts de um grupo especÃ­fico |

Os grupos sÃ£o buscados dinamicamente da tabela `groups`.

---

## PontuaÃ§Ã£o ConfigurÃ¡vel (Admin)

Salva em `config` key `'app'` dentro de `muralPoints`:
- `postPoints` (default: 2)
- `studyPoints` (default: 5)
- `commentPoints` (default: 1, mÃ¡x 3/dia)
- `reactionBonusPoints` (default: 3, dispara com 5 reaÃ§Ãµes)

---

## YouTube â€” Player Nativo

- Thumbnail carregada de `img.youtube.com/vi/{id}/maxresdefault.jpg` (gratuito)
- Clique no play substitui por `<iframe>` com autoplay
- Usa `youtube-nocookie.com` (sem tracking)
- Sem necessidade de API Key

---

## PrÃ³ximas Fases

### Fase 2 â€” Cards BÃ¡sicos (a implementar)
- [ ] `PostComposer.tsx` â€” modal com seletor de tipo
- [ ] `PostCard.tsx` â€” router por tipo
- [ ] `PostReactionBar.tsx`
- [ ] `PostCommentSection.tsx`
- [ ] `PhotoUploader.tsx` (drag-and-drop)
- [ ] `PhotoCard.tsx` com lightbox
- [ ] `TextCard.tsx` com deep-link para BibleViewer
- [ ] `VersePickerModal.tsx` â€” selecionar versÃ­culo do mÃ³dulo BÃ­blia
- [ ] BotÃ£o "Compartilhar no Mural" no `BibleViewer.tsx`
- [ ] Refatorar `Feed.tsx` com nova arquitetura + filtros

### Fase 3 â€” Cards de MÃ­dia
- [ ] `YoutubeCard.tsx` â€” player nativo play/pause
- [ ] `SpotifyTrackCard.tsx` â€” embed player
- [ ] `SpotifyPlaylistCard.tsx`
- [ ] `BibleStudyCard.tsx` â€” markdown bÃ­blico

### Fase 4 â€” Auto-integraÃ§Ãµes
- [ ] `AchievementCard.tsx` + hook em `AchievementService`
- [ ] `DuelVictoryCard.tsx` + hook em `Duel.tsx`
- [ ] `ActivityProofCard.tsx` + botÃ£o em `LeaderPanel.tsx`

### Fase 5 â€” Admin + Polimento
- [ ] Painel "Mural da Tribo" em `AdminSettings.tsx`
- [ ] `PostModerationPanel.tsx`
- [ ] PaginaÃ§Ã£o infinita
- [ ] NotificaÃ§Ã£o quando alguÃ©m comenta no seu post

---

## Arquivos Modificados/Criados

| Arquivo | AÃ§Ã£o |
|---|---|
| `src/types.ts` | âœ… Tipos adicionados ao final |
| `src/hooks/useAppTheme.ts` | âœ… `muralPoints` adicionado |
| `src/lib/FeedService.ts` | âœ… Criado do zero |
| `supabase/mural_tribo_migration.sql` | âœ… Criado â€” executar no Supabase |
| `index.html` | âœ… Meta tag CSP adicionada |
| `netlify.toml` | âœ… Headers HTTP adicionados |

---

## ðŸ›¡ï¸ EstabilizaÃ§Ã£o e CorreÃ§Ãµes CrÃ­ticas
- **Fix PGRST200 (27/04/2026)**: ImplementaÃ§Ã£o de **Client-Side Joins** no `FeedService.getPosts` para resolver falhas de carregamento. Agora o serviÃ§o busca posts, perfis e grupos separadamente, eliminando a dependÃªncia de chaves estrangeiras formais para visualizaÃ§Ã£o.

