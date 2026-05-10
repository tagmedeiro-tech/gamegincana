# Conhecimento do Projeto: Gincana da Tribo (v3.0)

🔙 **Voltar para o Início:** [[Gincana_da_Tribo]]
📝 **Veja também:** [[Registro_de_Progresso]], [[Plano_de_Expansao]], [[Auditoria_Bugs_Performance_04052026]]

Este documento contém o estado técnico atual do projeto após a conclusão das Fases 2 e 3 do Plano de Expansão.

## 🏗️ Arquitetura Técnica
- **Frontend:** React + Vite (TSX).
- **Estilização:** Vanilla CSS + Tailwind (Design Premium Black & Gold).
- **Backend/DB:** Supabase (Auth, Postgres, Realtime).
- **Estado Global:** Context API + Hooks customizados.

## 🔑 Componentes Críticos e Fluxos
- **Dashboard.tsx:** Hub central de status. Contém o **Unified Hero Status** (Avatar, Nível, XP e Score integrado) e o painel de elite da gincana.
- **Sidebar.tsx:** Navegação pura e minimalista. Centraliza o acesso aos módulos e links administrativos.
- **NotificationBell.tsx:** Integrado ao cabeçalho do Dashboard para acesso imediato a alertas em tempo real.
- **NotificationService.ts:** Centraliza os disparos de alertas para Staff e Usuários.
- **Feed.tsx:** Mural social com carregamento paginado e likes em tempo real.
- **Store.tsx / AdminStore.tsx:** Sistema econômico de troca de pontos por itens com controle de estoque.
- **AdminInsights.tsx:** Motor de análise de inatividade e engajamento.
- **AdminAnalytics.tsx:** Dashboard de visualização de dados (gráficos de barras, linhas e pizza) usando a biblioteca `recharts`.
- **AchievementService.ts:** Centraliza a lógica de gamificação automática e definições de medalhas.
- **AIService.ts:** Motor de inteligência para missões dinâmicas e mentoria personalizada.
- **AutomationService.ts:** Gerencia rotinas automáticas (Login Bonus, Streaks).
- **AIMissionPanel.tsx:** Componente de interface para entrega de conteúdo de IA no Dashboard.
- **UserProfile.tsx:** Página de perfil social detalhado para membros da tribo.
- **BibleService.ts:** Gerencia busca de capítulos e geração de quizzes. Integrado com `bible_completions` para controle de progresso único.
- **AppTheme (Config)**: Centraliza a customização visual e funcional do app (cores, módulos ativos e bônus de login diário).

## 🛠️ Convenções de Código e UI (Skill)
- **Unified Hero Card:** Sempre que exibir dados do usuário no header, usar o container unificado para evitar quebra de layout em telas intermediárias.
- **Visualização de Dados:** Utilizar `recharts` para gráficos; manter cores síncronas com o tema dinâmico (ex: `primaryColor`).
- **Gamificação:** Novas conquistas devem ser definidas em `ACHIEVEMENT_DEFINITIONS` no `AchievementService.ts`.
- **Segurança:** Todas as novas tabelas devem ter RLS (Row Level Security) habilitado.
- **React 19:** Sempre envolver textos em `<span>` ou fragmentos para evitar erros de reconciliação de espaços em branco (Blindagem React 19).
- **Tipagem:** Proibido o uso de `any`. Use `unknown as Type` ou interfaces estritas de `types.ts`.
- **Codificação:** Garantir que arquivos TSX usem strings sem acentos em comentários para evitar bugs de codificação no compilador Vite (Encoding Safety).

## 🗄️ Tabelas Adicionadas (Esquema v3)
- `notifications`: Registro de alertas individuais.
- `store_items`: Inventário da loja de recompensas.
- `redemptions`: Log de trocas de prêmios.
- `feed_likes`: Relacionamento de curtidas nas participações.
- `user_achievements`: Registro de medalhas automáticas conquistadas.
- `bible_completions`: Registro de capítulos lidos com restrição de unicidade por usuário/livro/capítulo.
- `verse_notes`: Notas pessoais vinculadas a versículos específicos.

## 📡 Gatilhos de Notificação Ativos
- `task_submit` -> Dispara para Admin e Líder de Grupo.
- `redemption` -> Dispara para Admin.
- `login` -> Dispara para Admin.
- `task_approved / task_rejected` -> Dispara para o Usuário final.
- `achievement` -> Dispara para o Usuário ao ganhar uma medalha.

## ⛓️ Gestão de Membros (Admin)
- **AdminUsers.tsx**: Painel com visibilidade total de todos os perfis (`status`: active, pending, inactive, archived). Busca `.limit(2000)` via `Promise.allSettled`.
- **Exclusão Permanente**: 2 passos — `DELETE FROM profiles` (cascade) + RPC `ban_user_in_auth`. Não é possível deletar de `auth.users` via SQL no Supabase; banimento é a alternativa segura.
- **Soft Delete (Arquivamento)**: `status: 'archived'` + `deleted_at`. Reversível via botão de reativação.
- **Script de Manutenção**: `supabase/sync_profiles.sql` — sincroniza usuários órfãos, cria trigger `on_auth_user_created`, define função `ban_user_in_auth` e corrige constraints do Mural.
- **Feed Constraints**: Constraint `feed_posts_post_type_check` inclui todos os tipos do sistema (`new_member`, `group_update`, `streak_milestone`). Erro `23514` ocorre quando um tipo não está na lista.

## 🗄️ Tabelas Adicionadas (Esquema v4)
- **`profiles.status`**: Campo text com valores `active`, `pending`, `inactive`, `archived`.
- **`profiles.deleted_at`**: Timestamp para soft delete. Nulo = ativo.
- **`profiles.coins`**: Moedas do usuário para a loja.
