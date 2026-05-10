**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ“Š Plano de Melhorias do Dashboard (Arena Ide)

> AnÃ¡lise do arquivo `Dashboard.tsx`
> Foco: GamificaÃ§Ã£o, Engajamento, Realtime e UX

---

## 1. ðŸ”´ Problemas CrÃ­ticos (Prioridade MÃ¡xima)

### 1.1 MissÃ£o Ã‰pica Hardcoded
A "AÃ§Ã£o SolidÃ¡ria" e a recompensa (linha 453) estÃ£o escritas diretamente no cÃ³digo.
**AÃ§Ã£o:**
- Fazer fetch da tabela `activities` onde `featured = true` ou usar a de maior pontuaÃ§Ã£o.
- Se nÃ£o houver destaque, nÃ£o exibir o card gigante.
- Substituir o link fixo por `Link to={\`/activities/\${featuredActivity.id}\`}`.

### 1.2 "PrÃ³ximos Desafios" Sem Prazo de Validade
Atualmente as atividades carregam um limite de 3 (`.limit(3)`), mas nÃ£o comunicam urgÃªncia.
**AÃ§Ã£o:**
- Incluir `dueDate` ou `endDate` na tabela `activities` do Supabase.
- No card, calcular o tempo restante: `const daysLeft = ...`
- Renderizar uma badge vermelha "URGENTE - Falta 1 dia!" quando `daysLeft <= 2`.

### 1.3 Falta de Feedback de ConclusÃ£o do Devocional
O usuÃ¡rio nÃ£o sabe se a sua leitura jÃ¡ foi contabilizada ao olhar pro painel.
**AÃ§Ã£o:**
- Criar estado de conclusÃ£o e consultar se o usuÃ¡rio jÃ¡ tem log de devocional "hoje".
- Alterar o UI: Quando concluÃ­do, o card muda a cor (borda verde ou dourada) e exibe: `âœ… Devocional do Dia ConcluÃ­do (+10 XP)`.

---

## 2. ðŸŸ¡ Melhorias de MÃ©dia Prioridade (UX & Engajamento)

### 2.1 Minha Tribo (Widget Dedicado)
O usuÃ¡rio sÃ³ se vÃª no ranking geral.
**AÃ§Ã£o:**
- Adicionar uma seÃ§Ã£o logo abaixo do Perfil/Hero indicando o grupo atual dele.
- Exibir: "VocÃªs estÃ£o em 3Âº Lugar! Faltam 150 pontos para alcanÃ§ar o 2Âº."
- Requer lÃ³gica matemÃ¡tica simples usando o array `groups`.

### 2.2 Feed de AÃ§Ãµes em Tempo Real (Mini Feed)
O Dashboard parece estÃ¡tico porque as aÃ§Ãµes dos outros nÃ£o aparecem lÃ¡.
**AÃ§Ã£o:**
- Implementar um sidebar ou banner rotativo com as Ãºltimas conquistas.
- Ex: "âš¡ JoÃ£o acabou de ganhar 50 XP"
- Usar `supabase.channel('public:point_logs')` para ouvir novidades ao vivo.

### 2.3 AtualizaÃ§Ã£o de Ranking Realtime
Atualmente, se alguÃ©m pontuar, o usuÃ¡rio precisa dar F5 para ver o pÃ³dio mudar.
**AÃ§Ã£o:**
- `Dashboard.tsx` deve escutar updates na tabela `groups`.
- Atualizar o estado `groups` em tempo real para os cards se moverem sozinhos.
- *Requisito Supabase:* Tabela `groups` precisa estar com "Enable Realtime".

### 2.4 AnimaÃ§Ã£o Sequencial no PÃ³dio
**AÃ§Ã£o:**
- O pÃ³dio top 3 (`topThree.map`) entra todo junto. 
- Usar Framer Motion: adicionar `transition={{ delay: index * 0.2 }}` para que o 1Âº, 2Âº e 3Âº lugares entrem num efeito cascata, dando mais grandiosidade.

---

## 3. ðŸŸ¢ Novas Features e GamificaÃ§Ã£o (Roadmap)

### 3.1 ðŸ”¥ SequÃªncia Ofensiva (Streak) de Devocional
Mostrar chamas (ðŸ”¥) indicando dias consecutivos lidos.
**Requisito:** 
- Nova tabela `devotional_streaks` ou usar `point_logs` para verificar dias seguidos.
- Adicionar recompensa: Ao atingir 7 dias, ganha 50 XP bÃ´nus.

### 3.2 âš”ï¸ Arena de Duelos (Chamada RÃ¡pida)
Assim que o Duelo BÃ­blico (Duelo Inter-Grupos) estiver implementado:
- Adicionar um widget no Dashboard: "âš”ï¸ Arena Aberta! Desafie a Tribo Norte."
- Mostrar um ranking dos 3 melhores duelistas da semana.

### 3.3 ðŸ“ˆ Mini-GrÃ¡fico (Sparkline) de XP
Um pequeno grÃ¡fico de linha no card do usuÃ¡rio mostrando o crescimento de XP na semana.
**Biblioteca Sugerida:** Recharts (simples) ou apenas SVGs gerados dinamicamente com os pontos diÃ¡rios do usuÃ¡rio.

### 3.4 ðŸ¤– MissÃ£o Personalizada via IA
O `AIMissionPanel` hoje mostra coisas gerais.
- Integrar os `point_logs` do usuÃ¡rio ao prompt da IA.
- Fazer a IA dizer: "Notei que vocÃª nÃ£o fez atividades fÃ­sicas. Sugiro aceitar o desafio X!".

---

## ðŸ› ï¸ Plano de AÃ§Ã£o & Tabela de Etapas

| Fase | DescriÃ§Ã£o | Arquivos Afetados | Dificuldade |
|---|---|---|---|
| **Fase 1** | Remover Hardcodes, Add UrgÃªncia, Add Feedback do Devocional | `Dashboard.tsx`, `types.ts` | âœ… ConcluÃ­da |
| **Fase 2** | Realtime Ranking, Mini Feed, Card "Minha Tribo" | `Dashboard.tsx` | âœ… ConcluÃ­da |
| **Fase 3** | Streak de Leitura, Mini-GrÃ¡fico de XP | `Dashboard.tsx`, Supabase DB | âœ… ConcluÃ­da |
| **Fase 4** | Widgets de Duelo, IA de MissÃ£o personalizada | `Dashboard.tsx`, `AIMissionPanel.tsx`, `AIService.ts` | âœ… ConcluÃ­da |
| **Fase 5** | EstabilizaÃ§Ã£o Admin (Mutex Lock) & OtimizaÃ§Ã£o Mobile (Overflow) | `supabase.ts`, `Dashboard.tsx`, `AdminActivities.tsx` | âœ… ConcluÃ­da |

> **PrÃ³ximo Passo Recomendado:** Iniciar a construÃ§Ã£o do **Motor de Matchmaking (Lobby)** para a funcionalidade do Duelo BÃ­blico, criando as tabelas de `duels` no Supabase e estabelecendo os canais Websocket para conexÃ£o em tempo real entre os dois jogadores.

