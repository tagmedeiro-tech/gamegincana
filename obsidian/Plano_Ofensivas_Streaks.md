**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ”¥ Plano: Sistema de Ofensivas (Streaks) â€” Estilo Duolingo

> **VersÃ£o:** Fase 22 Â· **Status:** Planejamento  
> **Objetivo:** Criar um motor de ofensivas diÃ¡rias que premia consistÃªncia de login e conclusÃ£o do devocional, com celebraÃ§Ã£o automÃ¡tica no Mural da Tribo.

---

## 1. VisÃ£o Geral

O sistema terÃ¡ **dois trilhos de ofensiva** paralelos:

| Trilho | Trigger | Ãcone |
|---|---|---|
| **Ofensiva de PresenÃ§a** | Login diÃ¡rio no app | âš¡ |
| **Ofensiva Devocional** | ConclusÃ£o do devocional diÃ¡rio | ðŸ”¥ |

Cada trilho rastreia dias consecutivos de forma independente. O usuÃ¡rio pode perder um trilho sem perder o outro.

---

## 2. Banco de Dados (Supabase)

### 2.1 â€” Colunas adicionais na tabela `profiles`

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS "streakLogin"         INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "streakLoginLastDate" DATE,
ADD COLUMN IF NOT EXISTS "streakDevotional"         INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "streakDevotionalLastDate" DATE,
ADD COLUMN IF NOT EXISTS "streakLoginMax"      INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "streakDevotionalMax" INTEGER DEFAULT 0;
```

### 2.2 â€” Tabela `streak_shields` (ProteÃ§Ã£o de Ofensiva)
Permite ao usuÃ¡rio comprar/ganhar "escudos" que protegem a ofensiva por 1 dia perdido.

```sql
CREATE TABLE IF NOT EXISTS streak_shields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,   -- 'login' | 'devotional'
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. LÃ³gica de NegÃ³cio

### 3.1 â€” AtualizaÃ§Ã£o da Ofensiva de PresenÃ§a
**Onde:** `AutomationService.handleDailyLogin()` (jÃ¡ existe)

**Fluxo:**
```
1. Buscar streakLoginLastDate do perfil
2. Se lastDate == hoje â†’ jÃ¡ computado, ignorar
3. Se lastDate == ontem â†’ streak++ 
4. Se lastDate < ontem â†’ verificar se hÃ¡ shield disponÃ­vel
   4a. Com shield â†’ streak mantido, shield consumido
   4b. Sem shield â†’ streak = 1 (reset)
5. Atualizar streakLogin, streakLoginLastDate, streakLoginMax
6. Verificar milestone â†’ disparar post no Mural se atingido
```

### 3.2 â€” AtualizaÃ§Ã£o da Ofensiva Devocional
**Onde:** `BibleViewer.tsx` â†’ funÃ§Ã£o `handleDevotionalComplete()`

**Fluxo:** IdÃªntico ao acima, mas para `streakDevotional`.

### 3.3 â€” Marcos (Milestones)
Marcos que disparam um **Post AutomÃ¡tico Premium** no Feed:

| Dias | Categoria | Mensagem no Feed |
|---|---|---|
| 3 | Normal | "3 dias em chamas! ðŸ”¥" |
| 7 | Bronze | "Uma semana de fidelidade! âš¡ Ofensiva de 7 dias!" |
| 14 | Prata | "Duas semanas sem parar! ðŸ’ª 14 dias de guerra espiritual!" |
| 30 | Ouro | "Um mÃªs inteiro! ðŸ† 30 dias de ofensiva inabalÃ¡vel!" |
| 60 | Platina | "60 dias! Um guerreiro lendÃ¡rio! ðŸ’Ž" |
| 100 | LendÃ¡rio | "100 dias! ðŸŒŸ Status de Lenda na Arena!" |
| 365 | Eterno | "365 dias. UM ANO COMPLETO. ðŸ”± GuardiÃ£o Eterno!" |

---

## 4. UI/UX â€” Widgets de Ofensiva

### 4.1 â€” Widget no Dashboard / Home
**PosiÃ§Ã£o:** Logo abaixo do header principal, antes do Feed.

**ComposiÃ§Ã£o:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  âš¡ PRESENÃ‡A              ðŸ”¥ DEVOCIONALâ”‚
â”‚  â–ˆâ–ˆâ–ˆ 14 dias              â–ˆâ–ˆâ–ˆ 7 dias    â”‚
â”‚  [========>               [====>        â”‚
â”‚  PrÃ³ximo: 30 dias          PrÃ³ximo: 14  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- **Fundo**: Dark com gradiente radial laranja/dourado
- **NÃºmero de dias**: Fonte gigante, `font-black italic`, com cor progressiva:
  - 1-6 dias: Branco
  - 7-13 dias: Amarelo (primary)
  - 14-29 dias: Laranja
  - 30-59 dias: Vermelho
  - 60+ dias: Roxo pulsante
- **Ãcone de chama**: AnimaÃ§Ã£o `framer-motion` de scale suave (respira)
- **Barra de progresso**: Mostra quantos dias faltam para o prÃ³ximo marco

### 4.2 â€” Card de Milestone no Mural (post automÃ¡tico)
**Tipo de post:** `'streak_milestone'` (novo PostType)

**Visual:**
- Fundo escuro com **efeito de partÃ­culas de fogo** (CSS keyframes)
- NÃºmero de dias em destaque central, com brilho
- Badge de categoria (Bronze/Prata/Ouro/Platina/LendÃ¡rio)
- Nome do guerreiro
- Tipo de ofensiva (PresenÃ§a ou Devocional)

### 4.3 â€” AnimaÃ§Ã£o de CelebraÃ§Ã£o (local)
Quando o usuÃ¡rio entra no app e a ofensiva aumenta â†’ toast especial (nÃ£o usar o Toast padrÃ£o, criar um overlay de celebraÃ§Ã£o):

- Chamas animadas subindo pela tela por 2s
- NÃºmero do streak em destaque
- "Ofensiva aumentada!" em fonte brutalista

---

## 5. ImplementaÃ§Ã£o â€” Passo a Passo

### Passo 1 â€” Banco de Dados
- [x] Executar a migration SQL para adicionar colunas em `profiles`
- [x] Criar tabela `streak_shields`
- [x] Adicionar RLS policies para `streak_shields`

### Passo 2 â€” LÃ³gica de NegÃ³cio (`AutomationService.ts`)
- [x] Refatorar `handleDailyLogin()` para calcular e atualizar `streakLogin`
- [x] Criar funÃ§Ã£o `handleStreakUpdate(userId, type)` reutilizÃ¡vel
- [x] Criar funÃ§Ã£o `checkStreakMilestone(streak, type)` que retorna o marco atingido
- [x] Criar funÃ§Ã£o `autoPostStreakMilestone(userId, groupId, streak, type)` que chama FeedService

### Passo 3 â€” IntegraÃ§Ã£o Devocional (`BibleViewer.tsx`)
- [x] ApÃ³s conclusÃ£o do devocional, chamar `AutomationService.handleDevotionalStreak(userId)`

### Passo 4 â€” Novos Tipos no Mural
- [x] Adicionar `'streak_milestone'` ao `PostType` em `types.ts`
- [x] Criar `StreakMilestoneCard` no `PostCard.tsx`

### Passo 5 â€” Widget de UI
- [x] Criar componente `StreakWidget.tsx`
- [x] Injetar no componente principal do dashboard/home

### Passo 6 â€” Painel Admin
- [x] Adicionar controles de streaks no `AdminSystemPoints.tsx`:
  - [x] Toggle para ativar/desativar o sistema de ofensivas
  - [x] Configurar pontos bÃ´nus por marco (Integrado via AdminSystemPoints)

---

## 6. Componentes Novos

| Arquivo | PropÃ³sito |
|---|---|
| `src/components/StreakWidget.tsx` | Widget de exibiÃ§Ã£o das ofensivas |
| AtualizaÃ§Ã£o: `src/lib/AutomationService.ts` | LÃ³gica de cÃ¡lculo de streak |
| AtualizaÃ§Ã£o: `src/components/BibleViewer.tsx` | Trigger devocional |
| AtualizaÃ§Ã£o: `src/types.ts` | Novo PostType |
| AtualizaÃ§Ã£o: `src/components/feed/PostCard.tsx` | Novo card de milestone |
| AtualizaÃ§Ã£o: `src/components/AdminSystemPoints.tsx` | Config de streaks |
| Migration: `supabase/migrations/20260503001000_streaks.sql` | Schema DB |

---

## 7. Regras de NegÃ³cio CrÃ­ticas

1. **Uma ofensiva por dia**: O registro do streak ocorre apenas uma vez por dia UTC.
2. **Fuso horÃ¡rio**: Usar data UTC para evitar inconsistÃªncias.
3. **Streak â‰  pontos**: O streak Ã© apenas uma mÃ©trica de consistÃªncia. Os pontos do login/devocional sÃ£o concedidos separadamente (jÃ¡ implementados).
4. **BÃ´nus de Milestone**: No marco, conceder pontos EXTRAS alÃ©m do bÃ´nus diÃ¡rio normal.
5. **Post no Mural**: Marcos sÃ£o postados automaticamente mas o usuÃ¡rio pode deletar.
6. **Privacidade**: O milestone post usa `visibility: 'public'` para celebraÃ§Ã£o coletiva.

---

## 8. Estimativa de EsforÃ§o

| Tarefa | Complexidade |
|---|---|
| Migration SQL | ðŸŸ¢ Baixa (10 min) |
| AutomationService refactor | ðŸŸ¡ MÃ©dia (30 min) |
| BibleViewer integration | ðŸŸ¢ Baixa (15 min) |
| StreakWidget UI | ðŸŸ¡ MÃ©dia (45 min) |
| PostCard StreakMilestoneCard | ðŸŸ¡ MÃ©dia (30 min) |
| AdminSystemPoints update | ðŸŸ¢ Baixa (15 min) |
| **Total Estimado** | **~2h 25min** |

---

*Aprovado este plano â†’ iniciar pelo Passo 1 (Migration SQL) e Passo 2 (AutomationService).*

---

## 9. TrofÃ©us de Ofensiva â€” Sala de TrofÃ©us

### 9.1 â€” VisÃ£o Geral

Cada marco de ofensiva concede um **trofÃ©u permanente** que aparece na **Sala de TrofÃ©us** do perfil do guerreiro (`/profile/:id`). O trofÃ©u Ã© registrado na tabela `user_achievements` (jÃ¡ existente) e exibido pelo sistema de conquistas atual.

### 9.2 â€” Novos TrofÃ©us no `ACHIEVEMENT_DEFINITIONS`

| Chave (`key`) | Nome | DescriÃ§Ã£o | Pontos | Raridade | Cor |
|---|---|---|---|---|---|
| `streak_login_3` | FaÃ­sca âš¡ | 3 dias consecutivos de acesso | 30 | `common` | `#94a3b8` |
| `streak_login_7` | Chama da Semana ðŸ”¥ | 7 dias consecutivos de acesso | 150 | `rare` | `#f97316` |
| `streak_login_14` | GuardiÃ£o Quinzenal ðŸ›¡ï¸` | 14 dias de presenÃ§a contÃ­nua | 400 | `rare` | `#3b82f6` |
| `streak_login_30` | Guerreiro do MÃªs ðŸ† | 30 dias sem falhar | 1000 | `epic` | `#a855f7` |
| `streak_login_60` | InabalÃ¡vel ðŸ’Ž | 60 dias de fidelidade absoluta | 2500 | `epic` | `#6366f1` |
| `streak_login_100` | CenturiÃ£o ðŸŒŸ | 100 dias consecutivos | 5000 | `legendary` | `#f59e0b` |
| `streak_login_365` | GuardiÃ£o Eterno ðŸ”± | 365 dias â€” um ano na Arena | 15000 | `legendary` | `#ec4899` |
| `streak_devotional_7` | Fiel no Pouco ðŸ“– | 7 dias seguidos de devocional | 300 | `rare` | `#3b82f6` |
| `streak_devotional_14` | DiscÃ­pulo Ardente âœï¸ | 14 dias de devocional diÃ¡rio | 750 | `epic` | `#a855f7` |
| `streak_devotional_30` | Servidor da Palavra ðŸ“œ | 30 dias de devocional completo | 2000 | `epic` | `#a855f7` |
| `streak_devotional_60` | ApÃ³stolo da Disciplina ðŸ”± | 60 dias de devoÃ§Ã£o ininterrupta | 5000 | `legendary` | `#f59e0b` |

> **Nota:** Os trofÃ©us `reading_streak_7` e `reading_streak_15` jÃ¡ existentes serÃ£o mantidos para compatibilidade retroativa. Os novos trofÃ©us de login sÃ£o adicionados sem conflito.

### 9.3 â€” Fluxo de ConcessÃ£o AutomÃ¡tica

```
Usuario faz login diÃ¡rio
        â†“
AutomationService.handleDailyLogin()
        â†“
handleStreakUpdate('login')
        â†“
streakLogin aumenta (ex: 7)
        â†“
checkStreakAchievements('login', streakLogin=7)
        â†“
   Identifica key: 'streak_login_7'
   Verifica: jÃ¡ tem esse trofÃ©u?
        â†“ NÃ£o
AchievementService.award(userId, 'streak_login_7')
        â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  1. INSERT em user_achievements     â”‚
â”‚  2. RPC increment_points (+150 pts) â”‚
â”‚  3. NotificationService.send()      â”‚
â”‚  4. FeedService.createPost()        â”‚  â† Post tipo 'achievement' no Mural
â”‚  5. Chat Global (se epic/legendary) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â†“
TrofÃ©u aparece na Sala de TrofÃ©us do perfil
```

### 9.4 â€” IntegraÃ§Ã£o com a Sala de TrofÃ©us (jÃ¡ existente)

O sistema de trofÃ©us jÃ¡ estÃ¡ funcional no projeto. Os novos trofÃ©us de ofensiva serÃ£o **automaticamente exibidos** junto com os demais conquistas no perfil do usuÃ¡rio, sem necessidade de modificar o componente de exibiÃ§Ã£o.

**Agrupamento visual sugerido** (na Sala de TrofÃ©us):
- Adicionar uma categoria `streak` ao exibir trofÃ©us, com Ã­cone de fogo ðŸ”¥
- Filtro: "Ofensivas" que exibe apenas os `streak_login_*` e `streak_devotional_*`

### 9.5 â€” AtualizaÃ§Ã£o do Passo 2 (AutomationService)

```typescript
// PseudocÃ³digo do mÃ©todo atualizado
static async handleStreakUpdate(userId: string, type: 'login' | 'devotional') {
  const profile = await getProfile(userId);
  const streakField = type === 'login' ? 'streakLogin' : 'streakDevotional';
  const lastDateField = type === 'login' ? 'streakLoginLastDate' : 'streakDevotionalLastDate';
  
  const today = new Date().toISOString().split('T')[0];
  const lastDate = profile[lastDateField];
  
  if (lastDate === today) return; // jÃ¡ processado hoje
  
  const yesterday = getPreviousDay(today);
  let newStreak: number;
  
  if (lastDate === yesterday) {
    newStreak = profile[streakField] + 1; // consecutivo!
  } else {
    // Verificar shield antes de resetar
    const shield = await getAvailableShield(userId, type);
    if (shield && isOneDayGap(lastDate, today)) {
      await consumeShield(shield.id);
      newStreak = profile[streakField]; // mantÃ©m com shield
    } else {
      newStreak = 1; // reset
    }
  }
  
  const newMax = Math.max(newStreak, profile[`${streakField}Max`]);
  
  await updateProfile(userId, {
    [streakField]: newStreak,
    [lastDateField]: today,
    [`${streakField}Max`]: newMax,
  });
  
  // Verificar e conceder trofÃ©us
  await checkStreakAchievements(userId, type, newStreak);
  
  return newStreak;
}

static async checkStreakAchievements(userId: string, type: string, streak: number) {
  const milestones = type === 'login'
    ? [3, 7, 14, 30, 60, 100, 365]
    : [7, 14, 30, 60];
  
  for (const milestone of milestones) {
    if (streak >= milestone) {
      const key = `streak_${type}_${milestone}`;
      await AchievementService.awardIfNotExists(userId, key);
    }
  }
}
```

### 9.6 â€” AtualizaÃ§Ã£o do Passo 5 (no Passo a Passo original)

O `StreakWidget.tsx` deve exibir tambÃ©m os trofÃ©us jÃ¡ conquistados relacionados Ã  ofensiva:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ”¥ OFENSIVA DEVOCIONAL          âš¡ PRESENÃ‡A DIGITAL  â”‚
â”‚  â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ 14 dias                â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ 7 dias       â”‚
â”‚  PrÃ³ximo: 30 dias                PrÃ³ximo: 14 dias    â”‚
â”‚                                                      â”‚
â”‚  ðŸ† TrofÃ©us de Ofensiva:                             â”‚
â”‚  [ðŸ“– Fiel no Pouco] [âœï¸ DiscÃ­pulo] [âš¡ Chama] ...    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```


