# ðŸ›¡ï¸ Planejamento e Backlog de SeguranÃ§a (PrÃ³ximas Fases)
*Auditoria de PontuaÃ§Ã£o e Defesa contra Farming*

| Vulnerabilidade | SoluÃ§Ã£o Planejada | Prioridade |
|---|---|---|
| **RPC `increment_points` Aberta** | Modificar para `SECURITY DEFINER` com `is_admin()` check. UsuÃ¡rios comuns nÃ£o poderÃ£o chamar pontos diretamente. | ðŸ”¥ CrÃ­tica |
| **BÃ´nus de Login Inseguro** | Criar RPC dedicada `claim_daily_login(user_id)` no PostgreSQL, movendo a validaÃ§Ã£o de tempo do React para o Backend. | Alta |
| **Atividades Duplicadas (Race Condition)** | Aplicar `UNIQUE CONSTRAINT ("userId", "activityId")` na tabela `participations` para tarefas nÃ£o-repetÃ­veis e limpar dados sujos. | MÃ©dia |
| **Gatilhos (Triggers) de XP** | Substituir chamadas do frontend para `increment_points` por Triggers atrelados ao insert de `participations` com status `approved`. | Arquitetural |

---

## ðŸ“… Data: 29/04/2026 (Fase 20 - UI/UX Premium e OtimizaÃ§Ã£o de Interface)

### âœ¨ Alta Fidelidade e ResiliÃªncia Visual
| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **Topbar Mobile** | TransformaÃ§Ã£o dos botÃµes flutuantes em uma `Topbar` fixa com `backdrop-blur-xl` no mobile, eliminando a colisÃ£o visual com o conteÃºdo da pÃ¡gina durante a rolagem. | âœ… Finalizado |
| **Cadastro Multi-Ã¡reas** | RefatoraÃ§Ã£o completa do Passo 3 de cadastro, transformando a seleÃ§Ã£o de Ã¡reas em uma "nuvem de botÃµes" permitindo selecionar mÃºltiplas Ã¡reas simultaneamente. InclusÃ£o de inputs dinÃ¢micos ("Especifique seu talento") para Ã¡reas artÃ­sticas e outras. | âœ… Finalizado |
| **DossiÃª do Membro (Admin)** | CriaÃ§Ã£o do modal "DossiÃª Espiritual" no painel de AdministraÃ§Ã£o (`AdminUsers.tsx`), exibindo status de batismo, Ã¡reas de atuaÃ§Ã£o mÃºltiplas e link rÃ¡pido para contato via WhatsApp. | âœ… Finalizado |
| **UX de Escolha ExplÃ­cita** | SubstituiÃ§Ã£o dos botÃµes que funcionavam como "toggle simples" por seletores lado-a-lado explÃ­citos (ex: `[JÃ¡ Sirvo] vs [NÃ£o Sirvo]`), com efeito sanfona (cascata) inteligente ao revelar novas perguntas. | âœ… Finalizado |
| **Fix: Supabase Infinite Loading** | ImplementaÃ§Ã£o de `Promise.race` com timeout global na busca de grupos no Cadastro. Resolve travamentos "Carregando tribos..." causados por atraso na inicializaÃ§Ã£o da sessÃ£o do Supabase em conexÃµes lentas. | âœ… Corrigido |
| **Fix: Typographic Clipping Mobile** | ResoluÃ§Ã£o do overflow fÃ­sico e do corte guilhotina em tipografias cursivas. Aplicada reduÃ§Ã£o de `p-10` para `p-6` em mobile e tipografia responsiva `text-3xl sm:text-4xl`, somados a `paddingRight: '0.1em'` invisÃ­vel. | âœ… Corrigido |
| **NotificationBell UI/UX** | RefatoraÃ§Ã£o profunda do painel de notificaÃ§Ãµes com "Optimistic UI Updates", zerando a latÃªncia percebida nas aÃ§Ãµes. Adicionado botÃ£o "Apagar Tudo" e renomeado "Limpar" para "Lidas" para clareza semÃ¢ntica. | âœ… Finalizado |
| **Tailwind CSS v4** | AtualizaÃ§Ã£o estrutural substituindo sintaxes defasadas (`stroke-[3]`, `rounded-[2rem]`, `bg-gradient-to-r`) pelo novo padrÃ£o (v4). | âœ… Finalizado |

---

## ðŸ“… Data: 29/04/2026 (Fase 19 - EstabilizaÃ§Ã£o de ConcorrÃªncia e UX em Tempo Real)
### âš”ï¸ Duel Arena: Anti-Cheat e ResiliÃªncia
| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **SincronizaÃ§Ã£o de Fim de Partida** | Implementado estado `waiting_results`. O duelo agora sÃ³ finaliza e consolida pontuaÃ§Ãµes quando *ambos* os jogadores respondem as 10 perguntas, evitando perda de pontos para o jogador mais lento. | âœ… Finalizado |
| **ProteÃ§Ã£o Anti-Spam (NotificaÃ§Ãµes)** | LÃ³gica de `endGame` refatorada: apenas o vencedor (ou o desafiante, em caso de empate) envia notificaÃ§Ãµes para o servidor, eliminando o spam cruzado de 4 notificaÃ§Ãµes por partida para os lÃ­deres de grupo. | âœ… Corrigido |
| **Lobby Deduplication** | Implementado `Map` para desduplicaÃ§Ã£o de `userId` na lista de presenÃ§as, resolvendo bug onde jogadores com mÃºltiplas abas abertas apareciam duplicados no lobby. | âœ… Corrigido |
| **Memory Leak (Modo Offline)** | RefatoraÃ§Ã£o no modo BOT com injeÃ§Ã£o de `useRef` para rastrear e destruir (clearTimeout) todos os temporizadores fantasmas em caso de desmontagem do componente, evitando vazamento de memÃ³ria no React. | âœ… Corrigido |
| **Progresso do Oponente em Tempo Real** | O `GameView` agora exibe em tempo real em qual questÃ£o o oponente estÃ¡ (ex: `Q 5/10`), extraindo metadados silenciosamente via payload do canal `duel_answers`. | âœ… Finalizado |

---

## ðŸ“… Data: 29/04/2026 (Fase 18 - RefatoraÃ§Ã£o UX Admin e EstabilizaÃ§Ã£o BÃ­blica)

### ðŸš€ UX/UI Admin e Loading
| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **AdminGroups UX Mobile** | RefatoraÃ§Ã£o de padding, fontes e truncamento nos cards para evitar quebras de layout em telas pequenas. | âœ… Finalizado |
| **EdiÃ§Ã£o Inline de Tribo** | ImplementaÃ§Ã£o de input de renomeaÃ§Ã£o direta no card (`AdminGroups`). | âœ… Finalizado |
| **LoadingSpinner Inline** | RemoÃ§Ã£o de `py-20` fixo quando `size="sm"` para evitar distorÃ§Ã£o de botÃµes com spinners embutidos. | âœ… Finalizado |
| **Login Premium Mobile** | AdaptaÃ§Ã£o responsiva da tela de login (fontes e espaÃ§amentos fluidos `sm:`). | âœ… Finalizado |

### ðŸ“– Tracking BÃ­blico AvanÃ§ado
| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **Painel de Progresso Geral** | Novo card na Biblioteca exibindo a % exata e contagem de capÃ­tulos restantes da BÃ­blia toda (1189). | âœ… Finalizado |
| **Fix: Bug de Supabase `maybeSingle()`** | CorreÃ§Ã£o de falha silenciosa ao marcar como lido; query agora forÃ§a `.eq('completion_type', 'reading')` e `.limit(1)` evadiendo crash de quizzes. | âœ… Corrigido |

---

## ðŸ“… Data: 28/04/2026 (Fase 17 - ConcordÃ¢ncia BÃ­blica & API Bolls)
  
### ðŸ“– Motor de Busca BÃ­blica e UX Mobile
  
| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **API Bolls (NVT)** | RefatoraÃ§Ã£o completa da pesquisa para usar `bolls.life/search/NVT/`, suportando busca PT-BR sem 404. | âœ… Finalizado |
| **Limpeza de Retorno (Regex)** | Filtro implementado para remover tags HTML invisÃ­veis (`<mark>`) do retorno do backend, mantendo tipografia limpa. | âœ… Finalizado |
| **BotÃ£o Dedicado (Mobile)** | InclusÃ£o de um botÃ£o visÃ­vel "BUSCAR NA CONCORDÃ‚NCIA" no Modal de Busca para evitar submissÃµes ocultas em teclados Android/iOS. | âœ… Finalizado |
| **UX de Espera (Search)** | ImplementaÃ§Ã£o do `LoadingSpinner` com feedback visual imediato apÃ³s disparo da pesquisa. | âœ… Finalizado |
  
### ðŸ’¡ Detalhes TÃ©cnicos
- **MigraÃ§Ã£o de API**: MudanÃ§a do endpoint falho `api/v2/search/` para a rota web direta `/search/NVT/?search=`.
- **TraduÃ§Ã£o Otimizada**: SubstituiÃ§Ã£o da traduÃ§Ã£o ARC (Almeida) para NVT (Nova VersÃ£o Transformadora), por oferecer um retorno indexado superior no motor Bolls.
- **CSP (Content Security Policy)**: O domÃ­nio `https://bolls.life` foi autorizado na meta tag do `index.html` para permitir requisiÃ§Ãµes de rede originadas pelo Fetch do React.
  
---

## ðŸ“… Data: 28/04/2026 (Fase 16 - Premium UI & Unified Loading Experience)
  
### âœ¨ ModernizaÃ§Ã£o Visual e ExperiÃªncia de Carregamento
  
| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **LoadingSpinner High-Fidelity** | Novo componente unificado com animaÃ§Ãµes de brasÃ£o, glow e scaling dinÃ¢mico. | âœ… Finalizado |
| **MigraÃ§Ã£o SistÃªmica** | SubstituiÃ§Ã£o de 100% dos spinners genÃ©ricos em 12+ componentes (Mural, BÃ­blia, Admin, etc). | âœ… Finalizado |
| **UX Contextual** | ImplementaÃ§Ã£o de mensagens temÃ¡ticas personalizadas para cada mÃ³dulo do sistema. | âœ… Finalizado |
| **Cross-Platform Perf** | Garantia de performance em mobile com motion/react nÃ£o-bloqueante. | âœ… Finalizado |
  
### ðŸ’¡ Detalhes TÃ©cnicos
- **Unified Component**: Criado `LoadingSpinner.tsx` que suporta tamanhos `sm` a `xl`, modo tela cheia e `backdrop-blur`.
- **AnimaÃ§Ãµes Camadas**: O spinner agora possui 3 camadas: Glow pulsante, Ring rotativo e Ãcone animado central.
- **Varredura Completa**: Atualizados arquivos crÃ­ticos: `Feed.tsx`, `Activities.tsx`, `BibleViewer.tsx`, `PointsTable.tsx`, `Chat.tsx`, `Login.tsx`, `Register.tsx`, `AdminUsers.tsx`, `AdminGroups.tsx`.
- **Impacto UX**: A espera por dados agora faz parte da narrativa da "Arena", reduzindo o estresse de latÃªncia percebida atravÃ©s de micro-interaÃ§Ãµes de alta qualidade.
  
---
  
## ðŸ“… Data: 28/04/2026 (Fase 15 - DinÃ¢mica de Duelo & Honrarias)

### âš”ï¸ EvoluÃ§Ã£o do Duelo Sagrado & Fix de Honrarias

| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **MÃ©tricas DinÃ¢micas** | XP, Moedas, Tempo e Qtd de Perguntas agora sÃ£o editÃ¡veis via Admin. | âœ… Finalizado |
| **Painel de ConfiguraÃ§Ã£o** | Nova aba "Duelo Sagrado" adicionada ao AdminSettings. | âœ… Finalizado |
| **Modo Offline (Bot)** | OpÃ§Ã£o de treinar com um bot quando nÃ£o hÃ¡ oponentes online. | âœ… Finalizado |
| **CorreÃ§Ã£o de Honrarias** | Resolvido bug de aspas literais nas chaves de insert do Supabase. | âœ… Corrigido |

### ðŸ’¡ Detalhes TÃ©cnicos
- **Duelo Sagrado**: Refatorado para consumir `duelSettings` do `useAppTheme`. Implementada lÃ³gica de BOT com latÃªncia simulada e acerto randÃ´mico (60%).
- **Fix CrÃ­tico (Aspas)**: Identificado que o uso de `'"userId"'` como chave de objeto em inserts falhava pois o PostgREST interpretava como um nome de coluna contendo aspas literais. Padronizado para usar apenas `userId` (o SDK cuida das aspas no SQL).
- **EstabilizaÃ§Ã£o de Admin**: Corrigidos inserts e updates em `LeaderPanel.tsx` e `AdminUsers.tsx` que impediam a concessÃ£o manual de pontos e medalhas.

---

---

## ðŸ“… Data: 28/04/2026 (Fase 14 - Varredura de Erros Ocultos no Console)


### ðŸ” Erros Identificados e Corrigidos

| Erro | Arquivo(s) | Causa | Fix |
|---|---|---|---|
| `maxresdefault.jpg 404` | `PostCard.tsx` | YouTube sem thumbnail HD | `onError` com fallback progressivo para `hqdefault.jpg` |
| `badges PGRST204` | `LeaderPanel.tsx:129` | `.eq('groupId', ...)` sem aspas duplas | `.eq('"groupId"', ...)` |
| `cells PGRST204` | `LeaderPanel.tsx:134` | `.eq('groupId', ...)` sem aspas duplas | `.eq('"groupId"', ...)` |
| `participations PGRST` | `LeaderPanel.tsx:135` | `.eq('groupId', ...)` + join FK camelCase `profiles:userId` | Aspas duplas + client-side join via `Map` |
| Silent 0 results | `Activities.tsx:58` | `.eq('userId', ...)` sem aspas | `.eq('"userId"', ...)` |
| Silent 0 results | `AchievementService.ts` | `userId` e `achievementKey` sem aspas | Aspas duplas em 3 lugares |
| Silent 0 results | `AIService.ts` | `userId` e `pointsEarned` sem aspas | Aspas duplas em 3 lugares |
| Silent 0 results | `Store.tsx` | `userId` em redemptions sem aspas | Aspas duplas em 2 lugares |
| Silent 0 results | `UserProfile.tsx:91` | `userId` em user_achievements sem aspas | Aspas duplas |
| Mensagens chat erradas | `Chat.tsx` | `groupId` sem aspas no fetch e delete | Aspas duplas em 2 lugares |

### ðŸ’¡ Aprendizados da Fase 14
- **Erros silenciosos de case-sensitivity** sÃ£o os mais perigosos â€” nÃ£o aparecem como erro de rede visÃ­vel, apenas retornam `[]` ou `0` como se nÃ£o houvesse dados.
- **FK camelCase (`profiles:userId`)** em joins embutidos no `.select()` falha silenciosamente no PostgREST. A soluÃ§Ã£o padrÃ£o agora Ã© sempre usar **client-side join com `Map`**.
- **YouTube `maxresdefault.jpg`** falha em ~30% dos vÃ­deos. PadrÃ£o de `onError` com `hqdefault.jpg` como fallback Ã© obrigatÃ³rio.
- **Conquistas nunca disparavam automaticamente** e **histÃ³rico da loja sempre aparecia vazio** â€” causa raiz era case-sensitivity silenciosa em `userId`.

## ðŸ“… Data: 28/04/2026 (Fase 13 - CorreÃ§Ã£o CrÃ­tica de NavegaÃ§Ã£o)

- **ðŸš¨ Root Cause Fix (Loading Infinito na NavegaÃ§Ã£o)**: Identificada e corrigida a causa raiz do bug onde clicar em qualquer pÃ¡gina causava loading infinito. O `AuthProvider` tinha `[fetchProfile, refreshProfile]` nas deps do `useEffect`, o que fazia o listener de auth ser **destruÃ­do e recriado a cada render**, resetando `loading = true` durante cada navegaÃ§Ã£o.
- **âš¡ AuthProvider Refatorado (Deps Vazias + Refs EstÃ¡veis)**: Implementado padrÃ£o de **ref estÃ¡vel** para o `fetchProfile` (`fetchProfileRef`). O `useEffect` agora usa deps `[]` â€” o listener de auth Ã© criado **uma Ãºnica vez** no mount e usa `fetchProfileRef.current` que Ã© sempre atualizado sem recriar o listener.
- **ðŸ›¡ï¸ Filtro de INITIAL_SESSION**: O evento `INITIAL_SESSION` do Supabase era tratado duplicado por `initializeAuth()` e pelo `onAuthStateChange`. Agora filtrado com `if (event === 'INITIAL_SESSION') return;` para evitar race conditions.
- **ðŸ”„ ProtectedRoute Resiliente**: Adicionado guard intermediÃ¡rio no `ProtectedRoute`: quando `allowedRoles` estÃ¡ definido e `profile` ainda nÃ£o chegou (estado transitÃ³rio), exibe spinner discreto ao invÃ©s de redirecionar ou quebrar.
- **ðŸ“Š Dashboard Guard Simplificado**: Removida a condiÃ§Ã£o `(user && !profile && !authLoading)` bloqueante que causava spinner de tela cheia durante navegaÃ§Ã£o. Agora a sequÃªncia de guards Ã©: `authLoading â†’ loading local â†’ user sem perfil â†’ perfil pending â†’ dashboard`.
- **ðŸ”‡ Auto-Recovery Silencioso**: Removido o listener `window.focus` do motor de auto-recuperaÃ§Ã£o (causava re-fetch desnecessÃ¡rio a cada troca de janela/aba, amplificando o problema de navegaÃ§Ã£o).

## ðŸ“… Data: 28/04/2026 (Fase 12 - Performance Extrema e Estabilidade Realtime)

- **âš¡ Dashboard Blitz-Load & Progressive Hydration**: Refatorado o carregamento do Dashboard para um modelo progressivo. Agora, os dados crÃ­ticos (Ranking e Grupos) sÃ£o priorizados para exibiÃ§Ã£o em < 300ms, enquanto dados secundÃ¡rios (Feed, Stats) carregam em background. Implementada proteÃ§Ã£o total contra "Spinner Infinito" via fallbacks no ciclo de vida do perfil.
- **ðŸš€ ParalelizaÃ§Ã£o de PainÃ©is**: Refatoradas as buscas do `LeaderPanel.tsx` e `Dashboard.tsx` para usar `Promise.all`. Agora, dados de membros, cÃ©lulas e validaÃ§Ãµes sÃ£o carregados simultaneamente, eliminando o atraso de carregamento sequencial.
- **ðŸ›¡ï¸ ResiliÃªncia Realtime**: Corrigido erro crÃ­tico `postgres_changes callbacks after subscribe`. Implementada a tÃ©cnica de **Canais EfÃªmeros DinÃ¢micos** (sufixos aleatÃ³rios em IDs de canais), permitindo mÃºltiplas instÃ¢ncias de hooks de sincronizaÃ§Ã£o sem colisÃµes no Supabase.
- **âš¡ Non-Blocking Loading (ReadingPlans)**: Refatorada a sincronizaÃ§Ã£o de planos. O loading de tela cheia agora Ã© exclusivo da primeira carga; atualizaÃ§Ãµes de fundo ocorrem sem bloquear a UI, com um indicador discreto ("Sincronizando...") para feedback visual.
- **âœ¨ UX de Resposta Imediata**: BotÃ£o "Abrir BÃ­blia Digital" no plano de leitura agora possui `e.stopPropagation()` e `e.preventDefault()`, com Z-Index priorizado (`z-9999`) e remontagem forÃ§ada via `key`, garantindo abertura instantÃ¢nea e dados sempre atualizados.

## ðŸ“… Data: 28/04/2026 (Fase 11 - OtimizaÃ§Ã£o de Performance de Leitura e UX Digital)
- **âš¡ BibleViewer Ultra-Fast**: Refatorada a lÃ³gica de carregamento do leitor bÃ­blico. Desacoplada a busca de versÃ­culos (sÃ­ncrona) da geraÃ§Ã£o de quiz (assÃ­ncrona/background), eliminando o travamento "Sincronizando Manuscritos".
- **ðŸ›¡ï¸ Timeouts de ResiliÃªncia**: Implementados `AbortController` com timeout de 5s em todas as chamadas de APIs externas (Bible API), garantindo que a plataforma nÃ£o trave caso serviÃ§os de terceiros fiquem lentos.
- **ðŸš€ Portal Priority (ReadingPlans)**: Ajustada a hierarquia de renderizaÃ§Ã£o no `ReadingPlans.tsx`. O Portal do leitor agora ignora estados de loading de metadados, permitindo abertura instantÃ¢nea via Deep Link.
- **âœ¨ UX de Fluidez**: SubstituÃ­dos carregamentos de pÃ¡gina inteira por carregadores segmentados, melhorando a percepÃ§Ã£o de performance e reduzindo a taxa de abandono na abertura de missÃµes de leitura.

## ðŸ“… Data: 28/04/2026 (Fase 10 - EstabilizaÃ§Ã£o de Performance e Case-Sensitivity Final)
- **âš¡ AuthProvider Singleton & Safety**: Refatorada a inicializaÃ§Ã£o do `AuthProvider` para evitar loops de renderizaÃ§Ã£o infinita. Introduzido o `profileRef` para rastreio sÃ­ncrono e timeout de seguranÃ§a (10s) para garantir estabilidade em conexÃµes lentas ou HMR agressivo.
- **ðŸ›¡ï¸ ErradicaÃ§Ã£o de Erros PGRST204 (Case-Sensitivity)**: Identificada falha sistÃªmica de sensibilidade a maiÃºsculas no PostgreSQL. Implementada a padronizaÃ§Ã£o de **aspas duplas obrigatÃ³rias** em todas as queries Supabase para colunas camelCase (ex: `'"userId"'`, `'"groupId"'`, `'"pointsEarned"'`).
- **ðŸ“Š Dashboard & PointHistory Stability**: Resolvidos os "erros invisÃ­veis" do console. Refatoradas as consultas do `Dashboard.tsx` e `PointHistory.tsx` para usar o padrÃ£o de estabilidade (aspas + client-side mapping), eliminando falhas de cache de schema do PostgREST.
- **ðŸ›¡ï¸ CorreÃ§Ã£o em Massa de PainÃ©is Administrativos**: Atualizados `AdminUsers.tsx`, `LeaderPanel.tsx` e `AdminLiveEvents.tsx` para conformidade com o novo padrÃ£o de nomes de colunas, garantindo que aprovaÃ§Ãµes de tarefas e honrarias funcionem sem falhas.

## ðŸ“… Data: 28/04/2026 (Fase 9 - Hierarquia de Acesso e EstabilizaÃ§Ã£o de Dados)
- **ðŸ›¡ï¸ Hierarquia RBAC (Cargo DinÃ¢mico)**: Implementada a lÃ³gica de acesso trÃ­plice: 
    - **Admin**: Controle global e auto-aprovaÃ§Ã£o.
    - **LÃ­der**: Visibilidade global (pode ver configuraÃ§Ãµes de outras tribos), mas ediÃ§Ã£o restrita apenas ao seu grupo (AprovaÃ§Ã£o de pontos e brasÃ£o travados por cargo).
    - **Membro**: Acesso focado na tribo e ranking pÃºblico.
- **ðŸ“Š Admin Dashboard EvoluÃ­do**: Adicionada funcionalidade de filtragem por status (Todos, Ativos, Pendentes) no `AdminUsers.tsx` e inclusÃ£o de contador "BRUTO" para diagnÃ³stico de integridade do banco.
- **âš¡ ResoluÃ§Ã£o de RecursÃ£o RLS**: Identificada e corrigida falha de seguranÃ§a no Supabase que causava loop infinito. Criada a funÃ§Ã£o `is_admin()` com `SECURITY DEFINER` para permitir leitura segura de perfis pendentes sem travar o banco.
- **ðŸ”„ SincronizaÃ§Ã£o de Perfis**: Criado o "Script de RessurreiÃ§Ã£o" SQL para forÃ§ar a criaÃ§Ã£o de perfis para usuÃ¡rios que estavam no sistema de login mas nÃ£o apareciam na lista de membros.
- **ðŸ›¡ï¸ EstabilizaÃ§Ã£o de Integridade**: Corrigido erro `23503` no `AdminUsers.tsx`. Implementada conversÃ£o automÃ¡tica de strings vazias para `null` em seletores de Tribo, garantindo compatibilidade com chaves estrangeiras UUID do Supabase.
- **ðŸŽ¨ UX & DOM Stability**: Eliminados erros de hidrataÃ§Ã£o no `Dashboard.tsx` (Links aninhados). Refatorada a estrutura de cards de missÃ£o para usar `useNavigate` e `e.stopPropagation()`, garantindo uma navegaÃ§Ã£o limpa e sem erros semÃ¢nticos de HTML.

## ðŸ“… Data: 28/04/2026 (Fase 8 - EstabilizaÃ§Ã£o e Leitura Digital)
- **ðŸš€ EstabilizaÃ§Ã£o de NavegaÃ§Ã£o SPA**: RefatoraÃ§Ã£o profunda do `AuthProvider.tsx` para inicializaÃ§Ã£o proativa da sessÃ£o (`getSession`) e dessincronizaÃ§Ã£o de tarefas nÃ£o-bloqueantes (notificaÃ§Ãµes de login). Isso eliminou definitivamente o problema de "carregamento infinito" e a necessidade de F5 apÃ³s o login.
- **ðŸ“– Plano de Leitura (Dispositivo Digital)**: EvoluÃ§Ã£o estÃ©tica do `ReadingPlans.tsx` para o conceito de "BÃ­blia Digital". Implementada interface de missÃ£o com botÃµes de aÃ§Ã£o proeminentes e feedbacks visuais de progresso aprimorados.
- **ðŸ”— Deep-Linking & Auto-Abertura**: Adicionado suporte para abertura automÃ¡tica do leitor bÃ­blico via parÃ¢metros de URL (`?reader=true&book=...`). Agora, ao clicar em "Ler Agora" no Dashboard, o usuÃ¡rio Ã© transportado diretamente para o texto sagrado.
- **ðŸ›¡ï¸ Robustez do BibleViewer**: RefatoraÃ§Ã£o do componente `BibleViewer.tsx` para aceitar `props` iniciais, garantindo que o leitor abra instantaneamente de forma sÃ­ncrona, eliminando atrasos de navegaÃ§Ã£o.
- **ðŸ“Š UX do Dashboard**: InclusÃ£o de mini barra de progresso e botÃ£o de aÃ§Ã£o rÃ¡pida no card de Plano de Leitura Ativo, reduzindo a fricÃ§Ã£o e o nÃºmero de cliques para o usuÃ¡rio.

## ðŸ“… Data: 27/04/2026 (Fase 7 - GestÃ£o Live e Super Admin)
- **âš¡ Arena Live (GestÃ£o de Culto)**: Implementado novo centro de comando no Dashboard Admin para lanÃ§amentos em tempo real durante dinÃ¢micas. Permite busca rÃ¡pida de membros e atribuiÃ§Ã£o de pontos (+10, +25, +50 XP) com um clique, afetando membro e tribo simultaneamente.
- **âš™ï¸ ConfiguraÃ§Ã£o de BÃ´nus de Login**: Adicionado painel de controle mestre em Admin > Atividades para ativar/desativar e definir pontuaÃ§Ã£o do bÃ´nus diÃ¡rio de presenÃ§a.
- **ðŸ›¡ï¸ Fix Case-Sensitivity (Login Bonus)**: Corrigido bug de duplicidade de pontos ao atualizar a pÃ¡gina; agora utiliza aspas em `"userId"` para queries PostgreSQL sensÃ­veis a maiÃºsculas na tabela `point_logs`.
- **ðŸŽ¨ Fix Sidebar Highlighting**: Desacoplada a rota de "Links Convite" para `/links-convite` (anteriormente `/admin/links`) para evitar realce duplo amarelo no menu lateral.
- **ðŸ° VitÃ³ria da Tribo**: Funcionalidade na Arena Live para premiar grupos inteiros com bÃ´nus de pontos sem afetar o XP individual dos membros.
- **ðŸ’Ž ErradicaÃ§Ã£o de Alertas Nativos**: ConcluÃ­da a substituiÃ§Ã£o de 100% dos `window.alert()` do sistema pelo `ToastContext`. Agora, todos os fluxos administrativos e do usuÃ¡rio (Loja, Perfil, Feed, Duelo, Planos de Leitura) utilizam notificaÃ§Ãµes flutuantes premium (success, error, info).
- **âœ¨ Micro-interaÃ§Ãµes Padronizadas**: RevisÃ£o sistemÃ¡tica de botÃµes de aÃ§Ã£o para incluir a classe `active:scale-95 transition-all` (feedback tÃ¡til) e estados de carregamento unificados com `Loader2` da biblioteca `lucide-react`, eliminando double-submissions e freezing de UI.
- **ðŸ“± EstabilizaÃ§Ã£o do Mural (Fix PGRST200)**: Resolvido erro crÃ­tico de carregamento do Mural causado por cache de schema do PostgREST. Implementada tÃ©cnica de **Client-Side Joins** no `FeedService.getPosts`, desacoplando a busca de posts, autores e grupos para garantir 100% de reatividade mesmo sem chaves estrangeiras formais.
- **ðŸ›¡ï¸ ResiliÃªncia de Schema**: Ajustada a busca de perfis para lidar corretamente com a coluna `"groupId"` (quoted CamelCase) and normalizaÃ§Ã£o de nomes de grupos no feed.
- **ðŸŽ¨ Planejamento UX (Arena Social)**: Criado o `Plano_Melhoria_Mural_UX.md` detalhando a evoluÃ§Ã£o estÃ©tica e funcional do mural, incluindo Quick Composer e identidades dinÃ¢micas de grupo.

## ðŸ“… Data: 26/04/2026 (Fase 6 - Em Andamento)
- **ðŸ“š Plano de Leitura BÃ­blica**: Implementado sistema completo com 7 planos (NT em 6 meses, AT em 6 meses, BÃ­blia em 1 Ano, etc). UsuÃ¡rio aceita um plano, confirma a porÃ§Ã£o diÃ¡ria sem quiz e ganha XP por dia + bÃ´nus final para o grupo.
- **ðŸš« Bloqueio de Duplicidade**: Implementada a tabela `bible_completions` e a RPC `complete_bible_chapter` para evitar que usuÃ¡rios ganhem pontos repetidamente pelo mesmo capÃ­tulo.
- **âš”ï¸ Duelo Sagrado (Real-time)**: Implementado sistema completo de batalhas em tempo real com integraÃ§Ã£o ao Supabase Presence para detecÃ§Ã£o de jogadores e matchmaking. LÃ³gica cronometrada e distribuiÃ§Ã£o automÃ¡tica de XP via RPC `finalize_duel`.
- **ðŸ“š ExtraÃ§Ã£o Offline de Banco de QuestÃµes**: Painel AdminQuestions finalizado e Migration SQL com 1.237 perguntas injetadas via engenharia reversa do banco SQLite offline.
- **ðŸ›¡ï¸ EstabilizaÃ§Ã£o de RLS**: Corrigidas polÃ­ticas de seguranÃ§a para as tabelas `notifications`, `user_achievements`, `feed_likes` e `verse_notes`.
- **ðŸ‘¤ Perfil PÃºblico**: Implementada a pÃ¡gina `/profile/:id` com visualizaÃ§Ã£o detalhada de XP, nÃ­vel, medalhas e bio.
- **ðŸ”— IntegraÃ§Ã£o de NavegaÃ§Ã£o**: Dashboard e Sidebar agora permitem navegaÃ§Ã£o direta para perfis de membros.

## ðŸ“… Data: 26/04/2026 (Fase 5 ConcluÃ­da)
- **ðŸ¤– AIService & Mentoria**: Implementado motor de IA para geraÃ§Ã£o de MissÃµes DiÃ¡rias dinÃ¢micas e mentoria personalizada baseada no comportamento do usuÃ¡rio.
- **âš¡ AutomaÃ§Ã£o de BÃ´nus**: Sistema de login diÃ¡rio automÃ¡tico que concede pontos de 'PresenÃ§a Digital' (+5 pts) a cada acesso diÃ¡rio.
- **ðŸ§  Admin Strategic Advisor**: Centro de recomendaÃ§Ãµes para o administrador, sugerindo aÃ§Ãµes de reativaÃ§Ã£o de membros e identificaÃ§Ã£o de talentos.
- **ðŸŽ¯ AIMissionPanel**: Nova interface no Dashboard para visualizaÃ§Ã£o imediata dos desafios gerados pela IA.

## ðŸ“… Data: 26/04/2026 (Fase 4 ConcluÃ­da)
- **ðŸ… Medalhas AutomÃ¡ticas**: Sistema de 'Achievements' inteligente que concede medalhas e bÃ´nus por comportamento (ex: 15 tarefas, primeira compra).
- **ðŸ“Š Dashboard AnalÃ­tico**: Implementado centro de inteligÃªncia com grÃ¡ficos (Bar, Line, Pie) via `recharts` para anÃ¡lise de engajamento e dominaÃ§Ã£o de tribos.
- **âœ¨ Showcase na Sidebar**: Vitrine visual de medalhas integrada ao card de perfil do usuÃ¡rio.
- **ðŸ›¡ï¸ UnificaÃ§Ã£o de Tipos**: SincronizaÃ§Ã£o global do `NotificationType` para suportar novas categorias de alerta.

---
## ðŸ“… Data: 26/04/2026 (Fases 2 e 3 ConcluÃ­das)
- **ðŸš€ GamificaÃ§Ã£o AvanÃ§ada**: Sistema RPG de NÃ­veis (1-5) e XP Bar implementados.
- **ðŸ›ï¸ Loja de Recompensas**: Vitrine de prÃªmios, controle de estoque e resgates ativos.
- **ðŸ”¥ Mural Social (Feed)**: Timeline de conquistas com likes real-time e Destaque da Semana.
- **ðŸ”” NotificaÃ§Ãµes Inteligentes**: Toasts e Sininho para alertas de tarefas, logins e resgates.
- **ðŸ“ˆ Insights Admin**: Motor de anÃ¡lise para identificar membros sumidos e rising stars.
- **ðŸ›¡ï¸ EstabilizaÃ§Ã£o React 19**: Blindagem de texto e correÃ§Ã£o de "cascading renders".

---
## ðŸ“… Data: 25/04/2026

### ðŸš€ Infraestrutura e Backend
- **MigraÃ§Ã£o ConcluÃ­da**: TransiÃ§Ã£o total de Firebase para **Supabase**.
- **SincronizaÃ§Ã£o de Banco**: Implementado o esquema do Google AI Studio via Supabase CLI.
  - Tabelas: `profiles`, `groups`, `activities`, `messages` (Chat), `config` (Tema dinÃ¢mico).
  - Reset de banco remoto realizado com sucesso.
- **ConfiguraÃ§Ã£o de Ambiente**: Arquivo `.env` configurado com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

### ðŸ’» Desenvolvimento Frontend
- **IntegraÃ§Ã£o AI Studio**: ExtraÃ§Ã£o e fusÃ£o do cÃ³digo-fonte do protÃ³tipo exportado.
- **CorreÃ§Ã£o de Realtime**: Corrigido bug de "cannot add callback after subscribe" no Supabase Realtime (Canais agora usam sufixos Ãºnicos).
- **Limpeza de CÃ³digo (Linting)**:
  - Removidos imports e variÃ¡veis nÃ£o utilizados.
  - Tipagem forte implementada em componentes crÃ­ticos (Chat, Register).
  - AtualizaÃ§Ã£o para sintaxe **Tailwind CSS 4** (classes `!` e quebra de palavras).

### ðŸ›¡ï¸ SeguranÃ§a e Acessos
- **Admin Root**: Configurado acesso mestre para `tagmedeiro@gmail.com`.
  - **Auto-PromoÃ§Ã£o**: Cadastro com este e-mail garante cargo `admin` automaticamente.
  - **Bypass de Grupo**: Admins nÃ£o precisam selecionar tribo e ficam com `groupId: null`.
- **Visibilidade**: Link "Meu Grupo" ocultado da sidebar para administradores.

### ðŸ›¡ï¸ Fase 4: EstabilizaÃ§Ã£o Visual e UX de Elite
- **Dashboard Unificado**:
  - MigraÃ§Ã£o do `NotificationBell` para o cabeÃ§alho do Dashboard.
  - MigraÃ§Ã£o do **Card de NÃ­vel RPG** da Sidebar para o Dashboard.
  - CriaÃ§Ã£o do **Unified Hero Status**: Avatar, XP, Medalhas e Score integrados em um Ãºnico container premium Ã  prova de quebra de layout.
- **RefatoraÃ§Ã£o da Sidebar**:
  - Limpeza profunda de imports e cÃ³digo morto.
  - RestauraÃ§Ã£o da lÃ³gica de logout com redirecionamento automÃ¡tico para a tela de login.
- **EstabilizaÃ§Ã£o TÃ©cnica**:
  - CorreÃ§Ã£o de erros de `ReferenceError` e falhas de reload do Vite (causados por referÃªncias Ã³rfÃ£s).
  - ResoluÃ§Ã£o de conflitos de codificaÃ§Ã£o (UTF-8) em comentÃ¡rios e strings do Dashboard.
  - EliminaÃ§Ã£o de erros de linter (`any` e variÃ¡veis nÃ£o utilizadas).

---

## ðŸ“… Data: 03/05/2026 (Fase 21 - ReorganizaÃ§Ã£o Arquitetural e ConsistÃªncia EconÃ´mica)

### ðŸ—ï¸ ConsolidaÃ§Ã£o Administrativa
| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **MigraÃ§Ã£o: Tabelas de PontuaÃ§Ã£o** | A aba de "Tabelas de PontuaÃ§Ã£o" foi movida da tela de Desafios para a tela de PontuaÃ§Ãµes. Agora reside como uma sub-aba em `AdminSystemPoints.tsx`, facilitando a gestÃ£o centralizada da economia. | âœ… Finalizado |
| **MigraÃ§Ã£o: Multiplicador AutomÃ¡tico** | A ferramenta de conversÃ£o XP â†’ Moedas foi migrada para o painel de PontuaÃ§Ãµes. O salvamento agora Ã© unificado atravÃ©s do botÃ£o "Salvar Tudo" do painel, garantindo integridade atÃ´mica das configuraÃ§Ãµes. | âœ… Finalizado |
| **UX Administrativa Unificada** | ImplementaÃ§Ã£o de sub-navegaÃ§Ã£o em `AdminSystemPoints.tsx` para alternar entre "Pontos AutomÃ¡ticos" e "Tabelas de ReferÃªncia", eliminando a fragmentaÃ§Ã£o de configuraÃ§Ãµes. | âœ… Finalizado |

### ðŸ“– EstabilizaÃ§Ã£o e LÃ³gica de Recompensas
| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **Quiz BÃ­blico DinÃ¢mico** | CorreÃ§Ã£o crÃ­tica na lÃ³gica de premiaÃ§Ã£o. O componente `BibleQuiz.tsx` agora consome dinamicamente o `bonusPerCorrect` da configuraÃ§Ã£o do Supabase, eliminando o valor hardcoded de 5 pts. | âœ… Corrigido |
| **Base de Leitura Realista** | O bÃ´nus de conclusÃ£o do quiz agora utiliza o valor de `free_reading_points` configurado no admin como base, garantindo que o usuÃ¡rio nÃ£o receba pontos arbitrÃ¡rios (antes fixo em 10 pts). | âœ… Corrigido |
| **Cleanup de CÃ³digo Admin** | RemoÃ§Ã£o de imports e estados Ã³rfÃ£os em `AdminActivities.tsx`, deixando a gestÃ£o de desafios limpa e focada exclusivamente em missÃµes. | âœ… Finalizado |

### ðŸ’¡ Detalhes TÃ©cnicos
- **Single Source of Truth**: Centralizada a gestÃ£o da tabela `config` (key: `app` e `bible_points`) em um Ãºnico componente, reduzindo o risco de sobrescritas acidentais e race conditions entre diferentes painÃ©is admin.
- **IntegraÃ§Ã£o de Props**: Refatorada a passagem de dados entre `BibleViewer` e `BibleQuiz` para garantir que o motor de pontos respeite a personalizaÃ§Ã£o do administrador em tempo real.
- **UX Consistency**: Mantido o padrÃ£o visual Brutalista Premium nas novas abas de navegaÃ§Ã£o, utilizando bordas robustas e transiÃ§Ãµes suaves do Framer Motion.

---

**Status Atual**: Arquitetura Administrativa Consolidada e LÃ³gica de Pontos 100% DinÃ¢mica.
**PrÃ³ximo Foco Sugerido**: Fase 22 - ExpansÃ£o de NÃ­veis (ImplementaÃ§Ã£o dos 50 nÃ­veis com trofÃ©us e badges premium no perfil).

---

## ðŸ“… Data: 03/05/2026 (Fase 22 - Landing Page "Arena Digital" & ConversÃ£o)

### ðŸš€ Landing Page TecnolÃ³gica
| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **Porta de Entrada (/)** | CriaÃ§Ã£o da `LandingPage.tsx` como rota raiz do projeto, focada em converter novos visitantes antes do login. | âœ… Finalizado |
| **Admin Landing Editor** | Novo painel administrativo (`AdminLandingEditor.tsx`) para controle total de textos, visibilidade de seÃ§Ãµes e vÃ­deos sem necessidade de cÃ³digo. | âœ… Finalizado |
| **Design Brutalista Premium** | ImplementaÃ§Ã£o de estÃ©tica high-tech com `framer-motion`, `backdrop-blur` e gradientes dinÃ¢micos baseados na cor da tribo. | âœ… Finalizado |
| **Responsividade Total** | Layout mobile-first otimizado para smartphones, garantindo que a experiÃªncia de conversÃ£o seja perfeita em qualquer dispositivo. | âœ… Finalizado |
| **IntegraÃ§Ã£o Auth** | Roteamento inteligente que redireciona usuÃ¡rios logados automaticamente para o `/dashboard`, mantendo o fluxo de uso fluido. | âœ… Finalizado |

### ðŸ’¡ Detalhes TÃ©cnicos
- **ConfiguraÃ§Ã£o JSONB**: Centralizada a gestÃ£o da landing dentro do campo `landing` no objeto de configuraÃ§Ã£o global do app.
- **Micro-interaÃ§Ãµes**: Adicionadas animaÃ§Ãµes de entrada por scroll e hover-effects tecnolÃ³gicos em todos os mÃ³dulos da landing.
- **SEO & Social**: PreparaÃ§Ã£o de metadados dinÃ¢micos para compartilhamento em redes sociais e WhatsApp.

**Status Atual**: Landing Page Ativa, EditÃ¡vel e Responsiva.
**PrÃ³ximo Foco Sugerido**: Fase 23 - ExpansÃ£o de NÃ­veis (50 nÃ­veis, trofÃ©us e badges premium).

---

## ?? Data: 03/05/2026 (Fase 23 - Estabilização de Navegação, Performance e Deploy)

### ?? Infraestrutura e Otimização Extrema
| Funcionalidade | Descrição | Status |
|---|---|---|
| **Arquitetura de Rotas Aninhadas** | Refatoração completa do App.tsx para usar rotas aninhadas. A raiz (/) agora é exclusiva da Landing Page, enquanto toda a aplicação interna reside em /dashboard. | ? Finalizado |
| **Lazy Loading & Suspense** | Implementação de carregamento sob demanda para todos os módulos pesados. O bundle inicial foi reduzido drasticamente, acelerando o carregamento da Landing Page. | ? Finalizado |
| **Fix: Sidebar Persistence** | Movido o Suspense para dentro do MainLayout, garantindo que o menu lateral e a Topbar não desapareçam durante a navegação entre páginas internas. | ? Corrigido |
| **Fix: UPDATE requires a WHERE clause** | Correção de erro SQL crítico no reset de temporada. Adicionado filtro dummy para satisfazer exigências de segurança do Supabase/PostgreSQL em atualizações globais. | ? Corrigido |
| **Preparação Netlify** | Configuração do arquivo _redirects e 
etlify.toml com CSP (Content Security Policy) robusta, permitindo todas as APIs de Bíblia e Tradução. | ? Finalizado |
| **Build de Produção** | Execução e validação do build final. Pasta dist atualizada e pronta para deploy imediato. | ? Finalizado |

### ?? Detalhes Técnicos
- **Nested Routes**: Todos os links internos no Sidebar.tsx e AdminDashboard.tsx foram atualizados para incluir o prefixo /dashboard, garantindo consistência na navegação.
- **Performance**: A Landing Page agora carrega sem depender da inicialização completa do módulo de Administração ou Duelo, graças ao React.lazy.
- **Segurança**: CSP atualizada para autorizar olls.life, ible-api.com e 	ranslate.googleapis.com, garantindo que o sistema de busca bíblica e quizzes funcione em produção.

**Status Atual**: Sistema Estabilizado, Veloz e Pronto para Lançamento Global no Netlify.
**Próximo Foco Sugerido**: Fase 24 - Níveis e Badges (Implementação visual dos 50 níveis e sistema de conquistas premium).

---

## ?? Data: 03/05/2026 (Fase 24 - Controle Total de Temporada e Refino de UI)

### ??? Estabilização e Gestão Avançada
| Funcionalidade | Descrição | Status |
|---|---|---|
| **Contagem Regressiva Admin** | Implementação de dashboard de monitoramento de agendamento dentro do AdminSeasonManager, permitindo visualização real-time do tempo para o início. | ? Finalizado |
| **Controle de Prorrogação/Adiantamento** | Adicionados botões para " Iniciar Agora\ ou \Alterar Horário\ sem a necessidade de realizar um novo reset completo, mantendo a integridade da preparação. | ? Finalizado |
| **Reset Profundo (Deep Clean)** | Refatoração da lógica de reset para incluir a deleção de eed_posts, point_logs, participations, comments e 
eactions, garantindo um Mural 100% limpo no novo start. | ? Finalizado |
| **Fix: UI Stability (Anti-Dancing)** | Resolução de jittering visual no Editor de Níveis através da remoção de conflitos entre CSS transitions e Framer Motion layout. | ? Finalizado |
| **Fix: Controlled Input Warnings** | Correção sistêmica de avisos de 
ull values em inputs de administração, garantindo conformidade com as melhores práticas do React. | ? Finalizado |

### ?? Detalhes Técnicos
- **Season Logic**: A lógica de reset agora é sequencial para respeitar chaves estrangeiras: reações/comentários -> posts -> participações.
- **UI Performance**: Migração de hover effects de CSS para whileHover do Framer Motion, reduzindo repaints desnecessários durante scroll em listas longas.
- **Resiliência**: Adicionados fallbacks de string vazia em todos os campos do Editor de Níveis para evitar quebra de renderização em dados inconsistentes.

**Status Atual**: Sistema de Gestão de Temporada Blindado e UI Estabilizada.
**Próximo Foco Sugerido**: Fase 25 - Implementação de Badges de Prestígio (Sistema de conquistas raras por temporada).

---

## ðŸ“… Data: 03/05/2026 (Fase 26 - Cyber-Brutalism v4.0 no Ranking)

### ðŸš€ TransformaÃ§Ã£o em Command Center
| Funcionalidade | DescriÃ§Ã£o | Status |
|---|---|---|
| **Design High-Fidelity** | RefatoraÃ§Ã£o completa da pÃ¡gina de Ranking utilizando o estilo Cyber-Brutalism (flexbox, zero overlap, logos gigantes). | âœ… Finalizado |
| **Filtro Real-Time Mensal** | O botÃ£o "Melhores do MÃªs" agora processa a pontuaÃ§Ã£o calculada ao vivo a partir dos point_logs do mÃªs atual. | âœ… Finalizado |
| **Live Feed (Battle Ticker)** | ImplementaÃ§Ã£o de um Ticker de rodapÃ© com animaÃ§Ã£o Marquee que exibe o log infinito das Ãºltimas pontuaÃ§Ãµes das tribos. | âœ… Finalizado |
| **Tooltips & Lightbox** | AdiÃ§Ã£o de Tooltips nativos no Recharts para detalhar o Sparkline e um Visualizador de Logos em tela cheia (Zoom in Modal). | âœ… Finalizado |
| **Sistema de Badges DinÃ¢micas** | Regras de negÃ³cio renderizando emojis com efeitos (On Fire ðŸ”¥, Elite ðŸ’Ž, AscensÃ£o ðŸš€) nos cartÃµes das tribos baseados na performance atual. | âœ… Finalizado |
| **ExportaÃ§Ã£o de Card (Share)** | IntegraÃ§Ã£o da biblioteca html-to-image para capturar a arte do RankingCard/PodiumCard e baixar no formato PNG. | âœ… Finalizado |

**Status Atual**: Ranking finalizado no padrÃ£o Ouro.
**PrÃ³ximo Foco Sugerido**: Finalizar otimizaÃ§Ãµes gerais de banco e permissÃµes.

### ? Modernizao da Sala de Espera (Waiting Room v2.0)
- **Data**: 2026-05-03
- **Objetivo**: Criar uma experincia de pr-lanamento imersiva e de alta fidelidade.
- **Implementaes**:
  - **Hype Wall**: Chat global em tempo real funcional com correo de filtros para mensagens globais.
  - **Presence**: Contagem ao vivo de guerreiros conectados via Supabase Presence.
  - **Versus Card**: Confronto visual pico entre as duas principais tribos com logotipos reais e layout responsivo.
  - **Efeitos Visuais**: Partculas de fascas (sparks) suavizadas e background brutalista premium.
  - **Mobile UX**: Layout stackable para evitar cortes de tela e otimizar visibilidade em dispositivos mveis.
- **Resultado**: Sala de espera estabilizada e visualmente impactante, pronta para o lanamento oficial.
