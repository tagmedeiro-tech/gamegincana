**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# âš”ï¸ Duelo BÃ­blico Inter-Grupos â€” Plano Revisado

> Feature: Desafio 1v1 em tempo real entre membros de **grupos diferentes**.
> A vitÃ³ria transfere XP do jogador E pontos do grupo perdedor para o vencedor.

---

## 1. VisÃ£o Geral â€” Por que Inter-Grupos muda tudo

```
[Tribo A: JoÃ£o] â”€â”€desafiaâ”€â”€â–º [Tribo B: Maria]
         \                          /
          \       5 perguntas       /
           \      bÃ­blicas em      /
            \     tempo real      /
             \                  /
              [JoÃ£o vence!]
                    â”‚
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚  JoÃ£o: +1 XP           â”‚
        â”‚  Tribo A: +1 pt grupo  â”‚
        â”‚  Maria: -1 XP          â”‚
        â”‚  Tribo B: -1 pt grupo  â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Impacto**: O Duelo agora Ã© uma ferramenta de guerra entre grupos. Vencer um duelo nÃ£o Ã© sÃ³ pessoal â€” Ã© pelo seu grupo.

---

## 2. Modos de Desafio

### 2.1 â€” Desafio Direto (`mode: 'direct'`)
- Jogador A escolhe um jogador especÃ­fico de outro grupo para desafiar
- O desafiado recebe uma notificaÃ§Ã£o e pode aceitar/recusar
- Requer que ambos estejam online (presenÃ§a via Supabase)

### 2.2 â€” Matchmaking (`mode: 'matchmaking'`)
- Jogador entra na fila de espera global
- Sistema emparelha automaticamente dois jogadores de grupos diferentes
- Tempo mÃ¡ximo de espera: 60 segundos â†’ fallback para bot se nÃ£o encontrar oponente

---

## 3. Banco de Dados (Supabase)

### Tabela: `bible_duels`
```sql
CREATE TABLE bible_duels (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode                      TEXT NOT NULL DEFAULT 'direct',  -- direct | matchmaking

  -- Jogadores (grupos DIFERENTES)
  challenger_id             UUID NOT NULL REFERENCES profiles(id),
  challenger_group_id       UUID NOT NULL REFERENCES groups(id),
  challenged_id             UUID NOT NULL REFERENCES profiles(id),
  challenged_group_id       UUID NOT NULL REFERENCES groups(id),

  -- Regra: grupos devem ser diferentes
  CONSTRAINT different_groups CHECK (challenger_group_id != challenged_group_id),

  status                    TEXT NOT NULL DEFAULT 'pending',
  questions                 JSONB NOT NULL,
  current_question          INT DEFAULT 0,
  challenger_score          INT DEFAULT 0,
  challenged_score          INT DEFAULT 0,

  winner_id                 UUID REFERENCES profiles(id),
  winner_group_id           UUID REFERENCES groups(id),
  loser_id                  UUID REFERENCES profiles(id),
  loser_group_id            UUID REFERENCES groups(id),

  individual_pts_transferred INT DEFAULT 0,
  group_pts_transferred      INT DEFAULT 0,

  created_at                TIMESTAMPTZ DEFAULT now(),
  started_at                TIMESTAMPTZ,
  finished_at               TIMESTAMPTZ
);
```

### Tabela: `duel_matchmaking`
```sql
CREATE TABLE duel_matchmaking (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) UNIQUE, -- 1 entrada por user
  group_id    UUID NOT NULL REFERENCES groups(id),
  status      TEXT NOT NULL DEFAULT 'waiting',  -- waiting | matched
  joined_at   TIMESTAMPTZ DEFAULT now()
);
```

### Tabela: `duel_answers`
```sql
CREATE TABLE duel_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id         UUID NOT NULL REFERENCES bible_duels(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id),
  question_index  INT NOT NULL,
  answer_index    INT NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  answered_at     TIMESTAMPTZ DEFAULT now()
);
```

### RLS â€” Acesso Cross-Group
```sql
ALTER TABLE bible_duels ENABLE ROW LEVEL SECURITY;

-- Qualquer usuÃ¡rio autenticado pode VER duelos onde participa
CREATE POLICY "participants_see_own_duels" ON bible_duels
  FOR SELECT USING (
    challenger_id = auth.uid() OR challenged_id = auth.uid()
  );

-- HistÃ³rico pÃºblico de duelos (leaderboard cross-grupo)
CREATE POLICY "public_duel_history" ON bible_duels
  FOR SELECT USING (
    status = 'finished'
  );

-- SÃ³ o desafiador cria
CREATE POLICY "challenger_creates" ON bible_duels
  FOR INSERT WITH CHECK (challenger_id = auth.uid());

-- Participantes atualizam
CREATE POLICY "participants_update" ON bible_duels
  FOR UPDATE USING (
    challenger_id = auth.uid() OR challenged_id = auth.uid()
  );
```

---

## 4. Sistema de Pontos Inter-Grupos

### Regras
| Evento | Jogador | Grupo |
|--------|---------|-------|
| VitÃ³ria | +2 XP | +1 ponto do grupo |
| Derrota | -1 XP (mÃ­n. 0) | -1 ponto do grupo (mÃ­n. 0) |
| Empate | sem mudanÃ§a | sem mudanÃ§a |
| Recusar desafio | sem penalidade | sem penalidade |
| Timeout / abandono | -1 XP | -1 ponto do grupo |

> **Nota**: A vitÃ³ria vale +2 e a derrota -1 para incentivar a participaÃ§Ã£o (nÃ£o punir demais quem tenta).

### RPC â€” TransferÃªncia Segura
```sql
CREATE OR REPLACE FUNCTION resolve_bible_duel(
  p_duel_id       UUID,
  p_winner_id     UUID,
  p_loser_id      UUID,
  p_winner_group  UUID,
  p_loser_group   UUID
)
RETURNS void AS $$
BEGIN
  -- Individual: vencedor +2, perdedor -1
  UPDATE profiles SET "totalPoints" = "totalPoints" + 2 WHERE id = p_winner_id;
  UPDATE profiles SET "totalPoints" = GREATEST(0, "totalPoints" - 1) WHERE id = p_loser_id;

  -- Grupo: transfere 1 ponto
  UPDATE groups SET "totalPoints" = "totalPoints" + 1 WHERE id = p_winner_group;
  UPDATE groups SET "totalPoints" = GREATEST(0, "totalPoints" - 1) WHERE id = p_loser_group;

  -- Logs
  INSERT INTO point_logs (user_id, group_id, points, reason) VALUES
    (p_winner_id, p_winner_group, 2,  'VitÃ³ria no Duelo BÃ­blico Inter-Grupos'),
    (p_loser_id,  p_loser_group,  -1, 'Derrota no Duelo BÃ­blico Inter-Grupos');

  -- Finaliza o duelo
  UPDATE bible_duels SET
    status = 'finished',
    winner_id = p_winner_id,
    winner_group_id = p_winner_group,
    loser_id = p_loser_id,
    loser_group_id = p_loser_group,
    individual_pts_transferred = 1,
    group_pts_transferred = 1,
    finished_at = now()
  WHERE id = p_duel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Arquitetura Realtime

### Canal: `duel:{duelId}`
```typescript
const channel = supabase
  .channel(`duel:${duelId}`)
  // Ouve mudanÃ§as no duelo (respostas, placar, status)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'bible_duels',
    filter: `id=eq.${duelId}`
  }, handleDuelUpdate)
  // Ouve novas respostas do oponente
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'duel_answers',
    filter: `duel_id=eq.${duelId}`
  }, handleOpponentAnswer)
  // PresenÃ§a: sabe se o oponente estÃ¡ online
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .subscribe(async () => {
    await channel.track({ userId: profile.id, online: true });
  });
```

### Canal de Matchmaking: `duel:matchmaking`
```typescript
const lobby = supabase
  .channel('duel:matchmaking')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'duel_matchmaking',
    filter: `user_id=eq.${profile.id}`
  }, (payload) => {
    if (payload.new.status === 'matched') {
      // Redireciona para o duelo criado
      navigateToDuel(payload.new.duel_id);
    }
  })
  .subscribe();
```

---

## 6. Fluxo de UI Completo

### Tela 1 â€” Lobby de Duelos (nova aba ou modal no Dashboard)
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  âš”ï¸  ARENA BÃBLICA INTER-GRUPOS             â”‚
â”‚                                             â”‚
â”‚  [ENTRAR NA FILA]        [DESAFIAR ALGUÃ‰M]  â”‚
â”‚                                             â”‚
â”‚  ðŸ“Š DUELOS ATIVOS AGORA                     â”‚
â”‚  Tribo A (JoÃ£o) vs Tribo B (Maria) â€” AO VIVOâ”‚
â”‚  Tribo C (Pedro) vs Tribo D (Ana)  â€” AO VIVOâ”‚
â”‚                                             â”‚
â”‚  ðŸ† ÃšLTIMOS RESULTADOS                      â”‚
â”‚  JoÃ£o (Tribo A) venceu Maria (Tribo B) +2xp â”‚
â”‚  Tribo A ganhou 1 ponto de grupo            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Tela 2 â€” SeleÃ§Ã£o de Oponente (Desafio Direto)
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ” Buscar Jogador de Outro Grupo           â”‚
â”‚  [____________________] [BUSCAR]            â”‚
â”‚                                             â”‚
â”‚  TRIBO NORTE                                â”‚
â”‚  [Avatar] Maria Santos â”€â”€ [DESAFIAR] âš”ï¸    â”‚
â”‚  [Avatar] Lucas Lima   â”€â”€ [DESAFIAR] âš”ï¸    â”‚
â”‚                                             â”‚
â”‚  TRIBO SUL                                  â”‚
â”‚  [Avatar] Ana Oliveira â”€â”€ [DESAFIAR] âš”ï¸    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Tela 3 â€” Arena do Duelo
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  âš”ï¸  DUELO INTER-GRUPOS                     â”‚
â”‚  Tribo A                  Tribo B           â”‚
â”‚  [JoÃ£o ðŸ”¥]     vs     [Maria âš¡]           â”‚
â”‚                                             â”‚
â”‚  Pergunta 2/5              [â± 00:20]        â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€      â”‚
â”‚  "Qual discÃ­pulo negou Jesus trÃªs vezes?"   â”‚
â”‚                                             â”‚
â”‚  [A] Judas        [B] Pedro  â—„ VOCÃŠ         â”‚
â”‚  [C] JoÃ£o         [D] TomÃ©                  â”‚
â”‚                                             â”‚
â”‚  JoÃ£o:  âœ… â³                               â”‚
â”‚  Maria: âœ… âŒ  â† ERROU!                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Tela 4 â€” Resultado Inter-Grupos
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ† TRIBO A VENCEU!                         â”‚
â”‚                                             â”‚
â”‚  JOÃƒO            MARIA                      â”‚
â”‚  +2 XP âœ¨        -1 XP ðŸ’€                  â”‚
â”‚                                             â”‚
â”‚  TRIBO A +1 pt   TRIBO B -1 pt             â”‚
â”‚  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•           â”‚
â”‚  JoÃ£o:  âœ…âœ…âœ…âœ…âœ…  = 5/5 ðŸ”¥                â”‚
â”‚  Maria: âœ…âœ…âœ…âŒ   = 3/4 (desistiu)         â”‚
â”‚                                             â”‚
â”‚  [REVANCHE]   [NOVO OPONENTE]   [SAIR]      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 7. Componentes a Criar

| Componente | Responsabilidade |
|-----------|----------------|
| `DuelLobby.tsx` | Lobby: fila de matchmaking + duelos ao vivo |
| `DuelChallenge.tsx` | Busca jogadores de outros grupos para desafio direto |
| `DuelArena.tsx` | Tela de duelo ativo com Realtime |
| `DuelResult.tsx` | Resultado + animaÃ§Ã£o de transferÃªncia de pontos |
| `DuelHistory.tsx` | HistÃ³rico de duelos no perfil e no ranking |
| `useDuel.ts` | Hook: canal Realtime, estado do duelo, aÃ§Ãµes |
| `useMatchmaking.ts` | Hook: fila de matchmaking, timeout, emparelhamento |
| `DuelService.ts` | CRUD de duelos, matchmaking, RPC resolution |

---

## 8. Matchmaking â€” Algoritmo

```typescript
// DuelService.ts â€” LÃ³gica de matchmaking
static async joinMatchmakingQueue(userId: string, groupId: string) {
  // 1. Entra na fila
  await supabase.from('duel_matchmaking').upsert({
    user_id: userId,
    group_id: groupId,
    status: 'waiting',
    joined_at: new Date().toISOString()
  });

  // 2. Busca oponente de outro grupo que esteja esperando
  const { data: opponent } = await supabase
    .from('duel_matchmaking')
    .select('*')
    .eq('status', 'waiting')
    .neq('group_id', groupId)      // â† DEVE ser de outro grupo
    .neq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();

  if (!opponent) return null; // continua aguardando

  // 3. Cria o duelo entre os dois
  const questions = await BibleService.getDuelQuestions(localBank, 5);
  const { data: duel } = await supabase.from('bible_duels').insert({
    mode: 'matchmaking',
    challenger_id: userId,
    challenger_group_id: groupId,
    challenged_id: opponent.user_id,
    challenged_group_id: opponent.group_id,
    questions,
    status: 'active',
    started_at: new Date().toISOString()
  }).select().single();

  // 4. Marca ambos como emparelhados
  await supabase.from('duel_matchmaking')
    .update({ status: 'matched', duel_id: duel.id })
    .in('user_id', [userId, opponent.user_id]);

  return duel;
}
```

---

## 9. Roadmap de ImplementaÃ§Ã£o

### Fase 1 â€” Backend (2-3 dias)
- [ ] Criar tabelas: `bible_duels`, `duel_answers`, `duel_matchmaking`
- [ ] Implementar RLS (acesso cross-grupo)
- [ ] RPC `resolve_bible_duel` â€” transferÃªncia segura de pontos
- [ ] `DuelService.ts` â€” CRUD + matchmaking

### Fase 2 â€” Realtime (2 dias)
- [ ] `useDuel.ts` â€” canal `duel:{id}` + presenÃ§a
- [ ] `useMatchmaking.ts` â€” fila de espera + emparelhamento automÃ¡tico
- [ ] Timeout de 60s no matchmaking, 30s por pergunta

### Fase 3 â€” UI (3-4 dias)
- [ ] `DuelLobby.tsx` â€” lobby com duelos ao vivo
- [ ] `DuelChallenge.tsx` â€” busca de jogadores de outros grupos
- [ ] `DuelArena.tsx` â€” arena com timer e respostas em tempo real
- [ ] `DuelResult.tsx` â€” animaÃ§Ã£o de transferÃªncia inter-grupos

### Fase 4 â€” IntegraÃ§Ã£o & Polimento (1-2 dias)
- [ ] BotÃ£o "Desafiar" no perfil de qualquer membro (cross-grupo)
- [ ] Feed de duelos recentes no Dashboard
- [ ] Badge "CampeÃ£o Inter-Grupos" para X vitÃ³rias consecutivas
- [ ] Ranking de duelos separado do ranking de XP

---

## 10. Pontos CrÃ­ticos de Design

> [!IMPORTANT]
> **RLS cross-group**: Por padrÃ£o, usuÃ¡rios sÃ³ veem dados do prÃ³prio grupo. Ã‰ necessÃ¡rio criar polÃ­ticas explÃ­citas para que `bible_duels` seja visÃ­vel para ambos os participantes (de grupos diferentes).

> [!WARNING]
> **Race condition no matchmaking**: Dois usuÃ¡rios podem tentar emparelhar simultaneamente. Resolver com `FOR UPDATE SKIP LOCKED` no SQL ou via Edge Function.

> [!TIP]
> **Limite anti-abuso**: MÃ¡ximo de 5 duelos/dia por usuÃ¡rio e nenhum duelo pode acontecer entre o mesmo par mais de 2x por dia. Isso evita farming de pontos entre contas aliadas.

> [!CAUTION]
> **TransferÃªncia de pontos de grupo**: Grupos podem ficar com 0 pontos se perderem muitos duelos. Considerar um "piso" de 0 e um teto de transferÃªncia de 5 pts/grupo/dia para proteger grupos menores.

