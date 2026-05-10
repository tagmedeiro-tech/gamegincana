# Skill: Gincana da Tribo (Tribo IDE)

Esta skill contém as diretrizes e conhecimentos específicos para o desenvolvimento da plataforma Gincana da Tribo, atualizada com as novas arquiteturas de personalização e estabilização de conexões.

## 🎨 Identidade Visual (Brutalismo Dinâmico)
- **Cores**: Base em Preto (`#000000`) com Cor Primária configurável via Admin (Default: Amarelo `#FBBF24`).
- **Tipografia**: Uso intensivo de `font-black`, `italic` e `tracking-tighter` para um visual agressivo/tecnológico.
- **Logotipo**: Suporta ícones predefinidos (Lucide) ou Logotipo personalizado via upload (Storage).
- **CSS**: Uso de variáveis CSS (`--color-primary`) injetadas no `document.documentElement` pelo hook `useAppTheme`.

## 💎 Feedbacks e Micro-interações (Toast & Buttons)
- **Unified Loading System (`LoadingSpinner.tsx`)**: Centralização total dos estados de espera com interface de alta fidelidade e mensagens temáticas.
- **Notification System (Toast & Bell)**:
    - **Toasts (`NotificationToast.tsx`)**: Alertas flutuantes rápidos com barra de progresso e botão de fechar (X) reforçado (z-index alto e área de clique otimizada).
    - **Notification Bell (`NotificationBell.tsx`)**: Menu de histórico com abas ("Ouro" para importantes, "Radar" para sistema). Implementa **extração dinâmica de avatares** via metadados injetados no conteúdo (`[avatar:url]`), humanizando cada alerta com a foto do remetente ou protagonista.
- **Micro-interação de Botão**: Botões principais obrigatoriamente utilizam `active:scale-95 transition-transform` para feedback tátil (clique).
- **Estados de Processamento**: Botões que chamam API bloqueiam ações subsequentes com `disabled={loading}` e apresentam spinner de alta fidelidade (`LoadingSpinner size="sm"`) no lugar de seu texto padrão, evitando double-submission.
- **Optimistic UI Updates**: Botões de ação rápida e destrutiva (como deletar notificações ou marcar lidas) devem ser atualizados instantaneamente no estado local antes da resolução assíncrona da Promise, assegurando fluidez máxima.

## 🛡️ Estabilidade, Performance e Sessão (Anti-Timeout)
- **Timeouts Fixos**: Nunca utilizar `setTimeout` com `AbortController` para requisições na API (ex: Supabase Fetch). Browsers pausam a contagem em abas inativas (idle tabs), causando abortos instantâneos quando a aba volta ao foco. Utilize a resiliência padrão ou `fetch` nativo.
- **Re-hidratação de Sessão**: Em páginas de longa permanência (`BibleViewer`, `ReadingPlans`), injetar um `await supabase.auth.getSession()` imediatamente antes da submissão RPC para garantir que o token JWT seja revalidado caso tenha expirado enquanto a aba estava esquecida.
- **Persistência Offline-First (Auto-Save)**: Todos os formulários administrativos sensíveis (ex: `AdminSettings`, `AdminLevelEditor`) devem envelopar seus estados com o hook `useAutoSaveDraft` para garantir que o `localStorage` preserve os rascunhos em caso de falha de conexão.
- **Conversão de Timezone Local**: O Supabase salva métricas em `UTC`. Para evitar inconsistências em gráficos diários e ofensivas (*streaks*), converta localmente `created_at` usando o offset do usuário (`getTimezoneOffset()`) antes do split `T`.

## 🛠️ Tecnologias e Padrões
- **Framework**: React + Vite + TypeScript.
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage).
- **Estilização**: Tailwind CSS 4.
- **Performance (Crítico)**: 
    - **Conexão**: Bypassar a Web Locks API no cliente Supabase (`auth: { lock: ... }`) para evitar deadlocks em ambiente HMR.
    - **Singleton**: Sempre reutilizar a mesma instância do `supabase-js` através de `globalThis.supabase`.
    - **Auth**: Centralizar inicialização de perfil apenas no `onAuthStateChange` para evitar requisições duplicadas e race conditions.
    - **Busca Eficiente (Blitz-Load)**: Dashboards e Listas devem sempre usar limites de busca (`.limit(50)`) para dados não-essenciais. Consultas em `point_logs` devem ser restringidas por data (ex: últimos 30-60 dias) para evitar lentidão em usuários com longo histórico.
    - **Paralelização**: Requisições de dados em páginas complexas devem ser agrupadas em `Promise.all` para reduzir o tempo total de carregamento (TTI).
    - **Navegação (Anti-Blocking)**: Inicialização proativa da sessão via `supabase.auth.getSession()` antes do listener de eventos. Tarefas secundárias (como notificações de login) devem ser executadas de forma assíncrona (sem `await`) para garantir o redirecionamento instantâneo do usuário.
    - **Arquitetura de Rotas**: O sistema utiliza rotas aninhadas. A raiz (`/`) é reservada para a **Landing Page**. Toda a aplicação interna reside sob o prefixo `/dashboard`. **CRÍTICO**: Toda navegação interna via `navigate()` ou `<Link>` deve utilizar caminhos absolutos iniciados em `/dashboard/` (ex: `/dashboard/activities`, `/dashboard/admin/users`) para evitar deadlocks de roteamento e telas em branco.
    - **Lazy Loading (Otimização)**: Uso extensivo de `React.lazy` e `Suspense` em `App.tsx` para carregar componentes sob demanda, reduzindo o tamanho do bundle inicial e acelerando o carregamento da Landing Page. O `Suspense` deve ser aplicado individualmente no `Outlet` do `MainLayout` para não esconder a barra lateral durante transições.

## ⚙️ Customização do App (AppTheme)
- **Engine**: O estado global do app é ditado pela interface `AppTheme`.
- **Módulos**: Funcionalidades como `Ranking`, `Chat`, `Calendário` (`showCalendar`) e `Arena Voxel` (`showVoxel`) podem ser habilitadas/desabilitadas via Admin.
- **Duelo Sagrado Dinâmico**: O sistema de duelo agora é 100% configurável via Admin (`AdminSettings.tsx`). As métricas (tempo, pontos, moedas) são injetadas via `useAppTheme`.
- **Modo BOT (Treino)**: Se o matchmaking não encontrar oponentes em 10s, o usuário pode duelar contra um BOT (simulado com probabilidade de acerto de 60%).

### 🛡️ Boas Práticas e Armadilhas
- **Case-Sensitivity no Supabase (PostgreSQL)**:
    - **Queries/Filtros**: SEMPRE use aspas duplas em colunas camelCase (ex: `.eq('"userId"', id)`).
    - **Inserts/Updates**: NUNCA use aspas literais dentro da string da chave do objeto (ex: use `{ userId: id }` e NÃO `{ '"userId"': id }`). O SDK do Supabase já cuida da citação correta no SQL gerado; adicionar aspas manuais faz com que o PostgREST procure por uma coluna cujo NOME contém aspas literais.
- **Client-Side Joins**: Para evitar erros `PGRST200` em joins complexos com colunas camelCase, use `Promise.all` para buscar tabelas separadamente e mapeie os dados no frontend usando `Map`.
- **Clipping Tipográfico (Glitch)**: NUNCA utilize as classes `drop-shadow-*` do Tailwind em tags de texto com `italic`. Filtros CSS de sombra criam camadas de composição estritas no WebKit que cortam (clip) os vértices estendidos (overhang) das fontes itálicas. Use sempre `style={{ textShadow: '...' }}` de forma inline para textos estéticos brilhantes.
- **Estabilidade de UI (Anti-Dancing/Jitter)**: Evite o uso da prop `layout` do Framer Motion em formulários complexos ou listas longas com muitos inputs. O recálculo constante de layout pode causar tremores ("dancing"). NUNCA combine `transition-all` do Tailwind com animações do Framer Motion no mesmo elemento. Prefira `transition-colors` e micro-interações via `whileHover`/`whileTap`. **Dica**: Evite `translateY` ou `y` em `whileHover` para cards grandes, pois isso pode causar saltos de tela (jitter) durante a rolagem mobile; prefira `hover:-translate-y-2` via CSS puro com `will-change-transform`.

## 🛡️ Gestão de Acessos e Hierarquia (RBAC)
- **Admin Root**: `tagmedeiro@gmail.com`.
- **Cargos Definidos**:
    - **`admin`**: Controle total. Bypassa todas as travas e vê/edita todas as tribos.
    - **`leader`**: Visibilidade Global (vê rankings e configurações de outras tribos), mas **Edição Local** (só aprova pontos e edita brasão de sua própria tribo).
    - **`participant`**: Acesso restrito ao seu grupo e áreas públicas.
- **Auto-Aprovação**: Cadastro via links de convite para Admins e Líderes são aprovados automaticamente (`status: 'active'`). Membros comuns entram como `'pending'` e exigem aprovação manual no painel.
- **Segurança RLS (Anti-Recursion)**: Nunca use subqueries diretas na mesma tabela dentro do RLS (causa loop infinito). Use a função `is_admin()` criada com `SECURITY DEFINER` para verificar cargos de forma isolada e performática.

## 📁 Estrutura de Pastas e Dados
- `src/components`: Componentes de UI modulares.
- `src/hooks/useAppTheme.ts`: Motor de aplicação de temas e sincronização com o banco.
- `src/context/AuthProvider.tsx`: Gestão de sessão simplificada e resiliente.
- **Storage**: Bucket `logos` (público) usado para armazenar imagens de identidade visual.

## 👥 Interações Sociais (Mural)
- **Engajamento**: Sistema de "Curtidas" e "Comentários" persistidos em tabelas dedicadas (`feed_likes`, `feed_comments`).
- **Edição Inline (Optimistic UI)**: O autor e os admins podem editar mensagens do chat em tempo real via botão de Lápis, que transforma o balão em um `textarea` e salva no banco sem necessitar reload da página.
- **Deleção Segura (Modais React)**: Ações destrutivas (Limpar Mural, Excluir Usuários) obrigatoriamente utilizam modals customizados invés de `window.confirm()`, que é bloqueado por navegadores em iframes/previews modernos.
- **Arquitetura Social**: Feed dinâmico que mapeia `participations` com perfis e atividades de forma resiliente.
- **Micro-interações**: Uso de animações (Framer Motion) para feedbacks de engajamento (coração pulsante).

## 📝 Sistema de Cadastro Dinâmico
- **Seleção de Tribo**: O seletor de grupos deve ser sempre dinâmico, buscando da tabela `groups` em vez de listas fixas.
- **Links Estratégicos**: Geração de URLs com `groupId` embutido para preenchimento automático no cadastro.
- **WhatsApp Integrado**: Redirecionamento automático para grupos específicos após o cadastro, baseado no mapeamento configurado no `AppTheme`.

## ⚔️ Duelo Bíblico e Motor de Quiz (Nova Arquitetura)
- **Motor Unificado (BibleService)**: Para garantir 100% de cobertura nos 1.189 capítulos, usamos uma arquitetura de 3 camadas (`getQuizForChapter`):
  1. **Camada 1**: Banco local curado (`QUIZ_BANK`) para capítulos de alto impacto.
  2. **Camada 2**: OpenTDB filtrado e traduzido automaticamente no frontend.
  3. **Camada 3 (Fail-Closed/Offline-Ready)**: `generateQuestionsFromVerses` — Gera perguntas "Complete a lacuna" a partir do texto bíblico real.
- **Matchmaking e Duelo em Tempo Real**: Usuários online de grupos opostos se enfrentam através de salas dinâmicas gerenciadas via `supabase.channel('duel:{roomId}')`.
- **Prevenção de Spam via Presence (UX Anti-Ghost)**: A engine de `Presence` foi customizada para transmistir o `status` atual do usuário na tela (`lobby`, `game`). Oponentes ocupados recebem um badge vermelho de "Em Batalha", travando o botão de desafio e impedindo envios fantasmas.
- **Banco de Perguntas de Duelo Centralizado**: Tabela dedicada `duel_questions` com mais de 1.200 perguntas pré-processadas e gerenciamento via `AdminDashboard` (`AdminQuestions`).
- **Segurança Antifraude (FOR UPDATE SKIP LOCKED)**: Finalização e cálculo de empate são gerenciados via RPC (`finalize_duel`). A RPC utiliza lock em nível de linha para evitar Race Conditions ou duplicidade de créditos caso ambos os clientes enviem o fim de jogo ao mesmo tempo.
- **Recompensas Atômicas e Logs Históricos**: Ao finalizar, o jogador ganha **Pontos** e **Moedas** (lidas do AdminSettings via frontend). Tudo é registrado em `point_logs` para evitar pontuações sombrias.
- **Prevenção de Spam (Notificações)**: As notificações de fim de duelo são delegadas a apenas um dos clientes (o vencedor, ou o desafiante no empate), eliminando alertas duplicados.
- **Configuração Dinâmica (Admin)**: Métricas como `totalQuestions`, `questionTime`, premiações em XP/Moedas e tempo de espera entre questões são configuradas via painel Admin e injetadas via `AppTheme`.
- **Duelo Offline (Bot)**: Permite que usuários pratiquem sozinhos quando não há oponentes online, simulando um oponente real com lógica de probabilidade de acerto e atraso de resposta variável.

## 📊 Dashboard Inteligente e Gamificação Avançada
- **Realtime Estável (Canais Dinâmicos)**: O ranking e as atualizações usam `supabase.channel()`. Para evitar o erro `cannot add postgres_changes callbacks after subscribe`, utilize sempre um **ID único** (sufixo aleatório ou `useId`) no nome do canal: `const id = "groups-" + Math.random().toString(36).substr(2, 9)`. Isso permite múltiplas instâncias de hooks sem colisões.
- **Micro-Gamificação**: 
  - **Streak de Leitura (🔥)**: Calculado retroativamente varrendo a tabela `point_logs` para `daily_devotional`.
  - **Sparkline XP**: Gráfico dinâmico construído via SVG com histórico dos últimos 7 dias.
- **IA Contextualizada (`AIService`)**: A missão diária analisa os `point_logs` da última semana e envia missões focadas no que o usuário **não tem feito**, melhorando a retenção.
- **Sistema de Ofensivas (Streaks 🔥)**:
    - **Dual-Track**: Trilhos independentes para **Presença** (Login) e **Devocional**.
    - **Resiliência**: Proteção por **Escudos** (tabela `streak_shields`) para evitar resets em caso de 1 dia de falha.
    - **Gamificação Social**: Marcos (3, 7, 30, 100, 365 dias) disparam postagens automáticas especiais (`streak_milestone`) no mural com visual premium e badges de raridade.
    - **Recompensas**: Integração automática com o sistema de troféus e premiação de XP bônus via `AchievementService`.
- **Gestão de Temporadas (Season Reset)**:
    - **Reset Atômico**: Função RPC `start_new_gincana` e deleções manuais via client para zerar pontos, histórico (`point_logs`), participações e mural (`feed_posts`, `comments`, `reactions`).
    - **Double-Lock Security**: O reset mestre exige confirmação via palavra-chave ("INICIAR GINCANA").
    - **Sala de Espera (Waiting Room)**: Componente imersivo (`WaitingRoom.tsx`) com temporizador regressivo e bloqueio global para não-admins durante a fase de preparação.
    - **Controle de Agendamento (Admin)**: O painel exibe contagem regressiva ativa para o administrador e permite **Adiantar** (Start Now) ou **Prorrogar** (Alterar Horário) a gincana em tempo real sem perder o estado de reset.
- **Arena Live (Gestão de Culto)**: Painel de alta performance (`AdminLiveEvents.tsx`) para lançamentos em tempo real. Utiliza a RPC `increment_points` para creditar pontos simultaneamente para Membro e Tribo. Suporta vitórias coletivas de Tribo (bônus sem XP individual).

## 🛰️ Estratégia de Dados (Anti-PGRST e Integridade)
- **Modos de Validação**: Atividades suportam `validationType` ('auto' | 'manual'). 
    - `'auto'`: Pontos creditados instantaneamente no envio.
    - `'manual'`: Registro fica como `pending` e requer aprovação do Admin ou Líder.
- **Dinamica de Aceite (`requires_acceptance`)**: Desafios especiais podem exigir que o membro clique em "Aceitar" antes de cumprir. Isso cria um registro `participation` com status `accepted`, que é atualizado posteriormente com a prova.
- **Bloqueio de Duplicidade**: Leituras bíblicas e devocionais devem ser registradas via RPC `complete_bible_chapter` que valida a unicidade contra a tabela `bible_completions`. Isso impede que o mesmo capítulo seja pontuado múltiplas vezes.
- **Client-Side Joins (PGRST200 Fix)**: Para evitar erros de "Schema Cache" (`PGRST200/205`) do PostgREST em tabelas sem chaves estrangeiras formais (como `point_logs` ou `feed_posts`), use a técnica de busca em lote. Busque os dados principais primeiro, colete os IDs únicos, e faça buscas separadas em `profiles` e `groups` usando `.in('id', ids)`, mapeando tudo no frontend via `Map`.
- **Case-Sensitivity Obrigatório (CRÍTICO)**: Colunas criadas com camelCase no SQL (ex: `"userId"`, `"groupId"`, `"pointsEarned"`, `"achievementKey"`) **EXIGEM** aspas duplas literais em todas as consultas Supabase `.select()`, `.eq()`, `.update()`. Exemplo: `.eq('"userId"', user.id)`. **Arquivos que exigem atenção especial:**
  - `LeaderPanel.tsx` → `"groupId"` em badges, cells, participations
  - `Activities.tsx` → `"userId"` em participations
  - `AchievementService.ts` → `"userId"` e `"achievementKey"` em user_achievements
  - `AIService.ts` → `"userId"` em point_logs e participations
  - `Store.tsx` → `"userId"` em redemptions
  - `UserProfile.tsx` → `"userId"` em user_achievements
  - `Chat.tsx` → `"groupId"` em messages (fetch e delete)
- **FK camelCase Joins (Anti-PGRST200)**: Joins embutidos no `.select()` com chaves estrangeiras camelCase (ex: `profiles:userId(name)`) **falham silenciosamente** no PostgREST. Sempre substitua por **Client-Side Join**: busque as tabelas separadamente, construa um `Map` por ID, e mapeie manualmente. Exemplo em `LeaderPanel.tsx`: buscar `profiles` separado, mapear por `userId`.
- **YouTube Thumbnail Fallback**: `maxresdefault.jpg` retorna 404 para vídeos sem thumbnail HD. Use fallback progressivo com `onError`: tenta `hqdefault.jpg`, depois oculta a imagem (`img.style.display = 'none'`). Nunca use `maxresdefault.jpg` sem `onError`.
- **AuthProvider Singleton & Safety**: O `AuthProvider` deve usar `useRef` (`profileRef`, `fetchProfileRef`) para acessar callbacks dentro de efeitos sem recriá-los. Deps do `useEffect` do listener de auth devem ser `[]` (vazio). Safety Timeout: 8s garante liberação do `loading` mesmo em falha silenciosa. Filtrar evento `INITIAL_SESSION` para evitar race condition com `initializeAuth()`.
- **Segurança (RLS Super Admin)**: Em vez de hardcodear e-mails, usamos a regra de `is_admin() = true`. Isso permite que administradores vejam usuários pendentes e ativos de forma transparente, evitando loops infinitos de recursão.
- **Tratamento de UUID**: Sempre que um seletor de Tribo (`groupId`) permitir a opção "Vazio" ou "Sem Tribo", o valor enviado ao Supabase deve ser explicitamente `null`. Strings vazias (`""`) em colunas UUID causarão erro `23503`.
- **Semântica HTML (Anti-Nesting)**: É terminantemente proibido aninhar tags `<a>` (Links do react-router). Para cards clicáveis que possuem botões internos, use uma `div` com `onClick={() => navigate(...)}` para o card e `Link` apenas para os botões, sempre aplicando `e.stopPropagation()` para evitar bolhas de evento.

## 📚 Plano de Leitura Bíblica
- **Engine**: `ReadingPlanService.ts` gera as porções diárias de cada plano de forma algorítmica, distribuindo capítulos uniformemente pelos dias.
- **Planos Disponíveis**: Bíblia em 1 Ano (365d), NT em 6 meses (180d), AT em 6 meses (180d), NT Express (90d), 4 Evangelhos (30d), Salmos e Provérbios (60d), Cartas de Paulo (45d).
- **Fluxo**: Usuário aceita um plano → confirma porção diária sem quiz → recebe XP por dia via `complete_reading_plan_day` RPC → bônus final ao concluir.
- **Integração Digital (Dispositivo)**: O leitor bíblico (`BibleViewer`) deve suportar abertura via `props` (`initialBook`/`initialChapter`) e via URL (`?reader=true`). Isso permite que o Dashboard ou o Histórico de Leitura abram o texto sagrado instantaneamente.
- **Performance de Leitura**: O carregamento de versículos deve ser **prioritário e independente**. Quizzes, traduções e gerações de IA devem rodar em **background** (assíncrono) para não bloquear a leitura. Todas as requisições externas à Bible API devem possuir timeout de 5s via `AbortController`.
- **Pontuação Dinâmica (Quiz)**: O bônus por acerto e a base de leitura devem ser injetados via `bible_points` config. Nunca use valores fixos (hardcoded) para recompensas, garantindo que o Admin tenha controle total sobre a economia.
- **Concordância Bíblica (Busca)**: O sistema de pesquisa utiliza a API pública Bolls (bolls.life) conectada à tradução NVT (Nova Versão Transformadora), garantindo alta disponibilidade. O retorno JSON é processado e as marcações HTML (`<mark>`) são filtradas via Regex (`/<\/?[^>]+(>|$)/g`) garantindo apresentação limpa sem ferir a tipografia premium.
- **Tabelas**: `user_reading_plans` (1 plano ativo por vez) + `reading_plan_completions` (UNIQUE por dia).

## 🎛️ Administração e Configuração
- **Central de Pontos (`AdminSystemPoints.tsx`)**: Painel mestre unificado para gerenciar toda a economia do jogo.
    - **Pontos Automáticos**: Gerencia Mural, Login, Bíblia e Duelos.
    - **Tabelas de Pontuação**: Integração do `AdminPointsEditor` para definições oficiais.
    - **Economia de Moedas**: Centraliza o **Multiplicador Automático** (conversão XP → Moedas).
    - **Consistência**: O salvamento é atômico via botão "Salvar Tudo", garantindo que alterações cruzadas em `appConfig` e `bible_points` sejam persistidas sem conflitos.
- **Gestão de Temporadas (`AdminSeasonManager.tsx`)**: Painel para agendamento de início de gincana e reset total de estatísticas.
- **Gestão de Tribos (`AdminGroups.tsx`)**: Suporte total a **Edição Inline**.
    - **Nome**: Clique no ícone de lápis para renomear.
    - **Pontos**: Clique diretamente no valor da pontuação para abrir o campo de ajuste rápido (com ícone ⚡).
    - **Líder**: Seleção dinâmica vinculada à tabela `profiles`.
- **Editor de Quiz (`AdminQuestions.tsx`)**: Gerenciamento do banco de perguntas do Duelo Sagrado.

## 🚀 Fluxos Críticos
1. **Inicialização**: O app deve carregar em < 1s. Se demorar, verifique conflitos de locks no `AuthProvider`. O leitor bíblico deve abrir o texto em < 500ms.
2. **Atualização de Tema**: Mudanças na tabela `config` (key: 'app') refletem instantaneamente em todos os usuários via Postgres Realtime.
3. **Mural de Atividades**: Requer o script SQL de estabilização (tabelas de participações e logs de pontos) para funcionar corretamente.

## 🚀 Deploy e Hosting (Netlify)
- **Roteamento SPA**: Exige arquivo `_redirects` na pasta `public` com a regra `/* /index.html 200`.
- **Segurança (CSP)**: O arquivo `netlify.toml` deve conter a `Content-Security-Policy` atualizada permitindo conexões com `supabase.co`, `bible-api.com`, `bolls.life` e `translate.googleapis.com`.
- **Headers**: `X-Frame-Options: SAMEORIGIN` e `X-Content-Type-Options: nosniff` devem estar presentes para proteção contra clickjacking.

## 🏆 Ranking v4.0 (Command Center)
- **Design Cyber-Brutalism**: Pódio e Listas reescritos com foco em alta fidelidade e flexbox para zero-overlap em telas pequenas (mobile-first).
- **Gamificação e Badges**: Sistema de insígnias visuais no `<RankingCard>` calculadas em tempo real (`isOnFire`, `isElite`, `isAscension`).
- **Live Feed (Battle Ticker)**: Componente de rodapé (`BattleTicker.tsx`) que recicla chamadas de API do Sparkline para exibir os últimos logs da arena num letreiro digital animado (marquee) infinito, sem sobrecarregar o banco de dados.
- **Integração Gráfica**: `<Tooltip>` do Recharts ativado com parser para datas amigáveis e feedback estético. Visualizador em tela cheia (Lightbox) para Logos, ativado no `Ranking.tsx`.
- **Exportação Social**: Biblioteca `html-to-image` injetada para permitir o download imediato dos cartões e compartilhamento em redes sociais.

## ⌛ Sala de Espera (Waiting Room) v2.0
- **Hype Wall (Realtime Chat)**:
    - **Global Channel**: Utiliza `groupId: null` para permitir que todos os usuários pendentes ou ativos conversem no pré-lançamento.
    - **Filtro Seguro**: Devido a limitações do Supabase Realtime com filtros SQL em valores `null`, a filtragem é feita via callback (JS) para garantir recebimento instantâneo.
- **Presence Monitoring**: Exibição em tempo real do número de "Guerreiros Conectados" através do canal de presença do Supabase.
- **Versus Combat Card**:
    - **Real Logos**: Busca automática do campo `logoUrl` da tabela `groups`.
    - **Responsive Stack**: Layout adaptativo que empilha os combatentes no mobile (`flex-col`) e os alinha horizontalmente no desktop (`flex-row`) com o selo "VS" dinâmico.
- **Atmosfera Premium**:
    - **Spark Particles**: Sistema de partículas caindo otimizado com `useMemo` para evitar resets durante re-renders do cronômetro.
    - **Glassmorphism**: Uso intensivo de `backdrop-blur-md` e bordas semi-transparentes para profundidade visual.
- **Cronômetro Resiliente**: Lógica de contagem regressiva desacoplada do estado de animação de fundo para performance fluida.
## ⛓️ Gestão de Membros Admin (`AdminUsers.tsx`)
- **Visibilidade Total**: O painel busca todos os perfis com `.limit(2000)` via `Promise.allSettled` para garantir resiliência. Perfis sem `status` são normalizados como `'active'`.
- **Filtros de Status**: Suporta `all`, `active`, `pending`, `inactive` e `archived`. O filtro `all` oculta arquivados por padrão.
- **Busca em Tempo Real**: Campo de pesquisa por nome/e-mail e seletor de tribo funcionam em conjunto com os filtros de status.
- **Badges de Status**: Cada membro exibe badge visual colorido: Pendente (laranja), Arquivado (cinza), Inativo (vermelho).
- **Arquivamento (Soft Delete)**: Botão de arquivo (ícone `Archive`) define `status: 'archived'` e `deleted_at`. O membro é preservado no banco mas oculto dos rankings.
- **Exclusão Permanente (Crítico)**: Bota lixeira (`Trash2`) executa exclusão em 2 passos:
  1. `DELETE FROM profiles WHERE id = userId` — o `ON DELETE CASCADE` do schema propaga a remoção para `participations`, `point_logs`, `feed_posts`, etc.
  2. RPC `ban_user_in_auth(user_id)` — bane o usuário no `auth.users` (define `banned_until = '2099-12-31'`) para revogar o acesso imediatamente.
  - **Atenção**: Não é possível deletar de `auth.users` via função PostgreSQL no Supabase (restrição da plataforma). O banimento é a alternativa segura sem Edge Function.
- **Trigger de Auto-Perfil**: `on_auth_user_created` garante que novos cadastros sempre tenham um `profile` criado automaticamente como `'pending'`.
- **Sincronização**: Script `supabase/sync_profiles.sql` cria perfis para usuários do Auth sem correspondente em `profiles` (usuários "órfãos").
- **Feed Constraints**: A constraint `feed_posts_post_type_check` deve incluir `'new_member'`, `'group_update'` e `'streak_milestone'` para que os auto-posts do sistema funcionem sem erro `23514`.
- **Reativação**: Usuários arquivados podem ser reativados (define `status: 'active'`, `deleted_at: null`) via botão `CheckCircle2`.

## 📅 Modernização do Sistema de Missões e Notificações (v2.0)
- **Calendário Ultra-Premium**:
    - **Aestética High-Fidelity**: Uso de *Mesh Gradients* de fundo e *Glassmorphism* real no seletor de data para uma experiência visual AAA.
    - **Interatividade**: Micro-animações via `framer-motion` em todos os botões de navegação e cards de aniversário.
- **Sistema de Celebração de Aniversários**:
    - **Engajamento Social**: Integração direta com WhatsApp (`wa.me`) via modal interativo, permitindo parabenizar membros com mensagens personalizadas em um clique.
    - **Visualização de Fotos**: Exibição obrigatória da foto de perfil (`avatar_url`) nos cards de aniversário, com fallback dinâmico para avatares artísticos (DiceBear) baseados no nome do usuário.
- **Metadados de Notificação (Invisíveis)**:
    - **Padrão de Transporte**: Devido à falta de campo `sender_id` no banco, utilizamos o padrão `[avatar:URL]` injetado no final do campo `content`. 
    - **Lógica de Parsing**: O componente receptor deve utilizar Regex para extrair a URL e remover a tag do texto visível ao usuário, garantindo uma interface limpa.
    - **Aplicações**: Usado para mostrar a foto do Líder em validações de tarefas e a foto do aniversariante em anúncios globais.

## 🏆 Gamificação Suprema & Ofensivas 2.0 (Fase 37)
- **Catálogo de 100 Troféus**: Expansão total do `AchievementService.ts` com 100 conquistas únicas divididas em 4 raridades (Comum, Raro, Épico, Lendário).
- **Galeria de Honra Cyber-Industrial**: Redesign do painel de conquistas no perfil (`AchievementList.tsx`) com headers dinâmicos, contadores de progresso (X/100) e efeitos visuais baseados na raridade.
- **Estabilização de Ofensivas (Timezone)**: Migração da lógica de reset de UTC para **Horário Local** (`toLocalISOString`). Isso evita o reset prematuro de streaks durante o uso noturno.
## 📅 Estabilização de Áudio & Sincronização (Fase 41) 🔊⚖️
- **AudioEngine Resiliente**:
    - **Unlock Mecanismo**: Implementado listener global no constructor para desbloquear `AudioContext` e `HTMLAudioElement` no primeiro gesto do usuário.
    - **Silenciamento de Logs**: Verificação de `ctx.state === 'suspended'` e `error.name === 'NotAllowedError'` para evitar poluição do console durante o boot.
    - **Local Hosting**: Migração da trilha sonora para `/audio/epic_bg.mp3` local para garantir 100% de disponibilidade.
- **Sincronização de Pontos (Supabase Fix)**:
    - **PGRST203 Resolution**: Padronização da função `increment_points` para aceitar `group_id` como `TEXT`, resolvendo o conflito de tipos UUID.
    - **Atomic Reload**: Uso de `NOTIFY pgrst, 'reload schema';` para garantir que mudanças no SQL reflitam instantaneamente na API.

## 🛡️ Auditoria de Segurança de Usuários e RLS (Fase 42)
- **Bloqueio de Escalada de Privilégio**: A tabela de perfis no Supabase possui um gatilho (`protect_profile_sensitive_fields`) que atua `BEFORE UPDATE` para impedir que usuários não-administradores modifiquem campos vitais (ex: `role = 'admin'`, `totalPoints = 999999`, `status`, `groupId`, `coins`) via requisição REST interceptada.
- **Isolamento da Função de Banimento**: A RPC `ban_user_in_auth` foi refatorada exigindo verificação estrita de `role = 'admin'` dentro do escopo da transação, bloqueando a falha crítica onde qualquer usuário autenticado podia banir terceiros.
- **Sincronia Automática de Membros (memberCount)**: Criação do gatilho `maintain_group_member_count` na tabela `profiles`. Sempre que um guerreiro é movido de tribo, as populações (`memberCount`) das tribos envolvidas são recalculadas automaticamente pelo banco, sem descompasso.
- **Sanitização de Uploads**: Formulários de Perfil e Registro bloqueiam ativamente via client-side o envio de imagens de Avatares com mais de 5MB, blindando a cota gratuita do Supabase Storage.
- **Estabilidade do Cache Offline (PWA)**: O `AuthProvider` chama rigorosamente `OfflineService.clearAll()` no momento do *Sign Out* (e no state *SIGNED_OUT*), erradicando o *cache bleeding* (dados de sessão morta piscando para o próximo usuário). O debounce de recuperação via *visibilitychange* foi reajustado para 2s garantindo aprovações quase instantâneas.
- **Race Condition no Login (Bate e Volta)**: Resolvido o bug que exigia recarregar a tela para entrar. O `navigate('/dashboard')` agora é estritamente reativo, sendo disparado por um `useEffect` quando o contexto global `useAuth()` tem a carga concluída.
