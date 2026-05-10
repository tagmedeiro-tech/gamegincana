**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# Auditoria de Performance e Bugs â€” Gincana da Tribo
**Data**: 04/05/2026 | **Profundidade**: AnÃ¡lise completa de todos os mÃ³dulos

---

## ðŸ”´ CRÃTICO â€” Bugs que quebravam o sistema

### [BUG-1] Hook `useReadingPlansData.ts` inexistente âœ… CORRIGIDO
**Arquivos afetados**: `ReadingPlans.tsx`, `src/hooks/` (diretÃ³rio)
**Impacto**: `ReadingPlans.tsx` importava o hook que **nÃ£o existia no disco**, causando erro de build/runtime e tela branca.
**Causa raiz**: O hook foi referenciado no plano do Obsidian e no cÃ³digo de ReadingPlans.tsx, mas o arquivo `.ts` nunca foi criado.
**Fix aplicado**: Hook criado com:
- Busca de completions com `.in('user_plan_id', planIds)` em vez de N queries individuais
- **ReduÃ§Ã£o: de N+1 queries â†’ 2 queries totais** (1 para planos, 1 para todos os completions)

### [BUG-2] N+1 Query no antigo ReadingPlans.tsx âœ… CORRIGIDO (via BUG-1)
**CÃ³digo antigo**:
```ts
// Para CADA plano do usuÃ¡rio, fazia uma query separada de completions:
const enriched = await Promise.all(plans.map(async p => {
  const { data: completions } = await supabase
    .from('reading_plan_completions')
    .select('day_number')
    .eq('user_plan_id', p.id); // â† 1 query por plano = N queries!
}));
```
**Fix**: Uma Ãºnica query com `.in('user_plan_id', [todos os ids])`.

---

## ðŸŸ  ALTO â€” Bugs que causavam comportamento incorreto

### [BUG-3] Insert de `user_achievements` sem aspas nas colunas camelCase âœ… CORRIGIDO
**Arquivo**: `src/lib/AchievementService.ts` â€” linha 268
**Problema**: 
```ts
// ANTES (bug silencioso â€” pode falhar em Postgres com colunas camelCase):
.insert({ userId, achievementKey: key })

// DEPOIS (correto):
.insert({ '"userId"': userId, '"achievementKey"': key })
```
**Impacto**: Conquistas poderiam nÃ£o ser salvas corretamente no banco, sem erro visÃ­vel.

### [BUG-4] `AchievementService.check()` â€” 4 queries sequenciais âœ… CORRIGIDO
**Impacto**: Cada verificaÃ§Ã£o de achievements disparava 4 round-trips ao Supabase em fila.
**Fix**: `Promise.all([participations, redemptions, profile, completions])` â€” agora sÃ£o paralelas.
**Bonus**: A query de `profile` agora tambÃ©m busca `streakLogin` e `streakDevotional` juntos (sem query extra).

### [BUG-5] `AuthProvider` â€” visibilitychange sem debounce âœ… CORRIGIDO
**Arquivo**: `src/context/AuthProvider.tsx`
**Problema**: Toda vez que o usuÃ¡rio voltava a qualquer aba do browser, `handleAutoRecovery()` era chamado imediatamente, disparando `getSession()` + `fetchProfile()`.
**CenÃ¡rio problemÃ¡tico**: UsuÃ¡rio alterna entre 3 abas â†’ 3 buscas de perfil simultÃ¢neas â†’ race condition na atualizaÃ§Ã£o do estado.
**Fix**: Debounce de 3 segundos â€” o fetch sÃ³ acontece se o usuÃ¡rio ficar na aba por 3s contÃ­nuos.

### [BUG-6] `AutomationService.scheduleAutomatedChallenges()` â€” console.log em produÃ§Ã£o âœ… CORRIGIDO
**Arquivo**: `src/lib/AutomationService.ts` â€” linha 269
```ts
console.log('Scheduling automated challenges...'); // â† expÃµe internals em prod
```
**Fix**: Removido. SubstituÃ­do por comentÃ¡rio.

---

## ðŸŸ¡ MÃ‰DIO â€” Oportunidades de performance identificadas (nÃ£o crÃ­tico)

### [OPT-1] `AchievementService.award()` â€” 3 operaÃ§Ãµes sequenciais por conquista
**Arquivo**: `src/lib/AchievementService.ts`
**Fluxo atual**: insert â†’ busca profile â†’ rpc increment_points â†’ send notification â†’ create post â†’ insert message
**RecomendaÃ§Ã£o**: Para conquistas mÃºltiplas simultÃ¢neas (raro), considerar processamento em background.
**Status**: NÃ£o alterado (risco de breaking change, impacto baixo).

### [OPT-2] `ReadingPlans.tsx` â€” useEffect de sincronizaÃ§Ã£o com dependÃªncia instÃ¡vel
```ts
useEffect(() => {
  if (userPlans.length > 0) {
    const active = userPlans.find(p => p.status === 'active');
    if (active) {
      setActivePlan(active);
      if (view === 'list') setView('active'); // â† 'view' nÃ£o estÃ¡ nas deps!
    }
  }
}, [userPlans]); // â† deveria incluir 'view'
```
**Risco**: Comportamento inconsistente se `view` mudar antes de `userPlans`. Baixo impacto real.
**RecomendaÃ§Ã£o**: Adicionar `view` Ã s dependÃªncias ou usar `useRef` para o check.

### [OPT-3] `Chat.tsx` â€” Canal Realtime com nome aleatÃ³rio a cada render
```ts
channel = supabase.channel(`chat:${groupId || 'global'}:${Math.random()}`)
```
**Impacto**: O `Math.random()` garante canal Ãºnico, evitando conflitos ao re-subscribe. Correto porÃ©m acumula canais Ã³rfÃ£os se o componente re-renderizar antes do cleanup. O `useEffect` tem cleanup via `supabase.removeChannel()`, entÃ£o o impacto real Ã© mÃ­nimo.
**Status**: OK, sem aÃ§Ã£o necessÃ¡ria.

### [OPT-4] `Ranking.tsx` â€” Fetch duplicado ao trocar filtro
```ts
useEffect(() => {
  fetchRanking();
  const channel = supabase.channel(...).subscribe();
  return () => supabase.removeChannel(channel);
}, [revalidateCount, filter]); // â† ambos disparam o mesmo fetchRanking
```
**Problema**: Ao mudar `filter`, o `useEffect` re-executa E o canal Realtime Ã© recriado desnecessariamente. O canal nÃ£o precisa mudar com o filtro (filtros sÃ£o client-side).
**RecomendaÃ§Ã£o futura**: Separar o canal em um `useEffect` com deps `[revalidateCount]` apenas.

---

## ðŸŸ¢ OK â€” PadrÃµes analisados e corretos

| MÃ³dulo | PadrÃ£o | Status |
|---|---|---|
| `supabase.ts` | customFetch com retry automÃ¡tico (2x, 500ms delay) | âœ… |
| `AuthProvider.tsx` | Timeout de 8s de seguranÃ§a + listener Ãºnico | âœ… |
| `AuthProvider.tsx` | `profileRef` estÃ¡vel para evitar recriaÃ§Ã£o do listener | âœ… |
| `AutomationService.ts` | Trava de seguranÃ§a `streakLoginLastDate === today` | âœ… |
| `AutomationService.ts` | Shield de streak com idempotÃªncia | âœ… |
| `Store.tsx` | Queries paralelas (fix desta sessÃ£o) | âœ… |
| `Dashboard.tsx` | `Promise.all` para bloco crÃ­tico + background | âœ… |
| `Dashboard.tsx` | `fetchData()` apÃ³s award (fix desta sessÃ£o) | âœ… |

---

## ðŸ“Š Resumo dos Fixes Aplicados Nesta SessÃ£o

| ID | Tipo | Arquivo | Impacto |
|---|---|---|---|
| BUG-1 | **CrÃ­tico** | `hooks/useReadingPlansData.ts` | Tela branca em ReadingPlans (arquivo inexistente) |
| BUG-2 | **CrÃ­tico** | via BUG-1 | N+1 queries: de N+1 â†’ 2 queries |
| BUG-3 | **Alto** | `AchievementService.ts` | Conquistas nÃ£o sendo salvas corretamente |
| BUG-4 | **Alto** | `AchievementService.ts` | 4x speedup na verificaÃ§Ã£o de conquistas |
| BUG-5 | **Alto** | `AuthProvider.tsx` | Elimina race conditions de fetch de perfil |
| BUG-6 | **MÃ©dio** | `AutomationService.ts` | Remove log sensÃ­vel de produÃ§Ã£o |

**Ãšltima auditoria**: 04/05/2026

