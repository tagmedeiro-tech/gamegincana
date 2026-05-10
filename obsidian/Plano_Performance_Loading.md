**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ”´ DiagnÃ³stico Completo: Tela Travando ao Navegar entre PÃ¡ginas

> **Sintoma Reportado**: UsuÃ¡rio precisa dar F5 constantemente para carregar as pÃ¡ginas, pois ficam em loading infinito ou demoram demais para abrir.

---

## ðŸ” DiagnÃ³stico: Causas-Raiz Encontradas (por Gravidade)

ApÃ³s anÃ¡lise profunda de todos os arquivos crÃ­ticos (`AuthProvider.tsx`, `supabase.ts`, `App.tsx`, `useAppTheme.ts`, `Dashboard.tsx`, `AutomationService.ts`, `Sidebar.tsx`), foram identificados **10 problemas sistÃªmicos** organizados por prioridade.

---

## ðŸ”´ CRÃTICO â€” Prioridade 1: Triplo `useAppTheme()` SimultÃ¢neo

### Problema
O hook `useAppTheme()` Ã© instanciado **3 vezes independentemente** em cada carregamento do Dashboard:
- `MainLayout` (App.tsx linha 75)
- `Sidebar.tsx` (linha 17)
- `Dashboard.tsx` (linha 45)

Cada instÃ¢ncia cria:
- âœ… 1 fetch ao Supabase (tabela `config`)
- âœ… 1 canal Realtime independente
- âœ… 1 `window.addEventListener('focus', fetchTheme)`
- âœ… 1 `window.addEventListener('online', fetchTheme)`

**Resultado**: Na abertura do Dashboard, sÃ£o disparadas **3 queries simultÃ¢neas** Ã  mesma tabela `config`. Toda vez que o usuÃ¡rio clica na janela (focus), sÃ£o disparadas **mais 3 queries**.

### SoluÃ§Ã£o
Transformar `useAppTheme` em um **Context Provider** singleton (padrÃ£o `AppThemeProvider`). Assim, o fetch acontece uma Ãºnica vez no topo da Ã¡rvore e todos os componentes apenas **consomem** via `useContext`.

---

## ðŸ”´ CRÃTICO â€” Prioridade 2: Loop de Re-fetch no Dashboard

### Problema
Existe um loop de dependÃªncias criado entre Dashboard e AuthProvider:

```
Dashboard monta
    â†’ AutomationService.handleDailyLogin() [chamado 2x: MainLayout E Dashboard]
        â†’ refreshProfile() [AuthProvider]
            â†’ triggerRevalidate() â†’ setRevalidateCount(prev + 1)
                â†’ revalidateCount muda
                    â†’ fetchData() roda NOVAMENTE (dep array linha 288)
                        â†’ 8 queries Supabase simultÃ¢neas
```

**Resultado**: O Dashboard sempre executa `fetchData` **2 vezes** na montagem. Na segunda vez, dispara 8 queries em paralelo (`Promise.all`).

### Causa adicional
`AutomationService.handleDailyLogin` Ã© chamado em **dois lugares**:
1. `MainLayout` (App.tsx linha 80-84)
2. `Dashboard.tsx` (linha 270)

Isso gera execuÃ§Ãµes duplicadas de: fetch config â†’ fetch profile â†’ fetch point_logs â†’ (Ã s vezes) increment_points + notification â†’ update streak.

### SoluÃ§Ã£o
1. Remover `revalidateCount` do dependency array de `fetchData`.
2. Remover a chamada duplicada de `handleDailyLogin` do `Dashboard.tsx` (manter apenas no `MainLayout`).
3. Remover o `.then(() => refreshProfile())` apÃ³s o `handleDailyLogin` no Dashboard.

---

## ðŸ”´ CRÃTICO â€” Prioridade 3: `fetchProfile` com AbortController Inoperante

### Problema
Em `AuthProvider.tsx` (linhas 20-21), o timeout de 5s usa `AbortController`:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);
```

**PorÃ©m**, o `controller.signal` nunca Ã© passado para a query do Supabase. O SDK do `supabase-js` recebe o `signal` via opÃ§Ã£o `{ signal: controller.signal }` no fetch, mas o cÃ³digo apenas chama:
```typescript
await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
```

O sinal de abort nÃ£o estÃ¡ conectado. Resultado: se o Supabase demorar 30 segundos, o cÃ³digo espera 30 segundos **sem jamais abortar**. O `clearTimeout` limpa apenas o timer JavaScript, mas a requisiÃ§Ã£o HTTP segue aberta.

### SoluÃ§Ã£o
Usar `Promise.race` com um `setTimeout` de 5s, ou passar `.abortSignal(controller.signal)` via mÃ©todo do SDK (disponÃ­vel em versÃµes recentes do `supabase-js`).

---

## ðŸŸ  ALTO â€” Prioridade 4: `AnimatePresence mode="wait"` Bloqueando Lazy Loading

### Problema
Em `App.tsx` (linha 147), `AnimatePresence mode="wait"` forÃ§a:
1. AnimaÃ§Ã£o de **saÃ­da** da pÃ¡gina atual (150ms)
2. **Desmontagem completa** do componente anterior
3. Carregamento lazy do chunk da nova pÃ¡gina
4. AnimaÃ§Ã£o de **entrada**

Toda navegaÃ§Ã£o desmonta o componente anterior, cancelando todas as queries em andamento e forÃ§ando um novo ciclo completo de `useEffect` + queries na prÃ³xima montagem.

### SoluÃ§Ã£o
Remover `mode="wait"` do `AnimatePresence`. Usar apenas `mode="sync"` (padrÃ£o) ou simplesmente nÃ£o usar `AnimatePresence` para navegaÃ§Ã£o de pÃ¡gina, usando apenas transiÃ§Ãµes de opacidade via CSS.

---

## ðŸŸ  ALTO â€” Prioridade 5: `window.addEventListener('focus', fetchTheme)` â€” Re-fetch Agressivo

### Problema
Em `useAppTheme.ts` (linha 199):
```typescript
window.addEventListener('focus', fetchTheme);
```

Toda vez que o usuÃ¡rio **clica em qualquer parte da janela** (nÃ£o apenas quando muda de aba), o evento `focus` dispara, fazendo uma nova query ao Supabase. Com 3 instÃ¢ncias do hook, sÃ£o **3 queries** por cada clique na janela.

**SituaÃ§Ã£o real**: O usuÃ¡rio abre o app, navega para outra aba, volta â†’ dispara 3 queries. Clica no campo de busca â†’ dispara 3 queries. Abre o DevTools â†’ dispara 3 queries ao fechar.

### SoluÃ§Ã£o
Substituir por `visibilitychange`:
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') fetchTheme();
});
```
E adicionar debounce de 2-3 segundos para evitar mÃºltiplos disparos rÃ¡pidos.

---

## ðŸŸ  ALTO â€” Prioridade 6: `AutomationService.handleDailyLogin` â€” 6 a 8 Queries em Cascata

### Problema
`handleDailyLogin` executa sequencialmente:
1. `config` fetch (app settings)
2. `profiles` fetch (streak data)
3. `point_logs` fetch (check today's bonus)
4. `supabase.rpc('increment_points')` (condicional)
5. `NotificationService.send()` â†’ insert em `notifications`
6. `handleStreakUpdate()` â†’ fetch `streak_shields` â†’ update `profiles`
7. `checkStreakMilestones()` â†’ `AchievementService.awardIfNotExists()` â†’ query `user_achievements`
8. `NotificationService.send()` â†’ insert milestone notification

Esse fluxo Ã© executado **em cascata, bloqueante** e depois dispara `refreshProfile()` que gera mais uma query.

### SoluÃ§Ã£o
1. Mover a verificaÃ§Ã£o de "jÃ¡ rodou hoje" para o **inÃ­cio** e retornar imediatamente (jÃ¡ feito parcialmente, mas a trava nÃ£o cobre todos os caminhos).
2. Garantir que `handleDailyLogin` seja chamado apenas **uma vez** na sessÃ£o, guardando a execuÃ§Ã£o em `sessionStorage`.

---

## ðŸŸ¡ MÃ‰DIO â€” Prioridade 7: `AuthProvider` â€” `handleVisibilityChange` com debounce de 3s + re-fetch total

### Problema
Em `AuthProvider.tsx` (linhas 159-165):
```typescript
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    recoveryDebounceId = setTimeout(handleAutoRecovery, 3000);
  }
};
```

`handleAutoRecovery` faz `getSession()` + `fetchProfile()`. Com o `useAppTheme` tambÃ©m ouvindo `focus`/`online`, cada retorno de aba dispara 4-5 queries em paralelo.

### SoluÃ§Ã£o
Aumentar debounce para 10-15s. Verificar se o token JWT jÃ¡ Ã© vÃ¡lido antes de re-fetch do perfil (usar `supabase.auth.getSession()` e sÃ³ re-fetch se `expires_at` for prÃ³ximo).

---

## ðŸŸ¡ MÃ‰DIO â€” Prioridade 8: `Sidebar` Chamando `useAppTheme()` em Componente Separado

### Problema
`Sidebar` Ã© carregado via `lazy()` e chama `useAppTheme()` independentemente. Quando a Sidebar Ã© montada (qualquer navegaÃ§Ã£o), ela inicia seu prÃ³prio canal Realtime e ouve `focus`.

### SoluÃ§Ã£o
Com a criaÃ§Ã£o do `AppThemeProvider` (Prioridade 1), a Sidebar apenas usa `useContext(AppThemeContext)` sem criar novos efeitos ou queries.

---

## ðŸŸ¡ MÃ‰DIO â€” Prioridade 9: `Dashboard.tsx` Usando `alert()` (Bloqueante)

### Problema
`Dashboard.tsx` linhas 307 e 311 ainda usam `alert()` e `alert("Erro...")`. Isso bloqueia a thread principal do JavaScript.

### SoluÃ§Ã£o
Substituir por `useToast()` (jÃ¡ importado no componente) com `success()` e `error()`.

---

## ðŸŸ¢ BAIXO â€” Prioridade 10: `fetchProfile` sem Retry EstratÃ©gico

### Problema
`fetchProfile` faz 1 tentativa sem retry. Se o Supabase retornar um erro transitÃ³rio (timeout de rede), retorna `null` imediatamente, fazendo o AuthProvider tratar o usuÃ¡rio como "sem perfil".

### SoluÃ§Ã£o
Adicionar 1 retry com delay de 1s antes de retornar `null`.

---

## ðŸ“‹ Plano de ExecuÃ§Ã£o (Fases)

### âš¡ Fase A â€” EliminaÃ§Ã£o do Loop (Impacto Imediato)
> Estimativa: 30 min | ReduÃ§Ã£o esperada: 60-70% das queries duplicadas

1. `Dashboard.tsx`: Remover `revalidateCount` do dep array de `fetchData`.
2. `Dashboard.tsx`: Remover `AutomationService.handleDailyLogin` e `.then(refreshProfile)`.
3. `Dashboard.tsx`: Substituir `alert()` por `useToast()`.

### ðŸ”§ Fase B â€” Singleton do Tema (Impacto Alto)
> Estimativa: 45 min | ReduÃ§Ã£o esperada: 2/3 das queries de config

4. Criar `AppThemeContext.tsx` com `AppThemeProvider`.
5. Envolver o App com o Provider em `main.tsx`.
6. Remover `useAppTheme()` do `Sidebar.tsx` e `Dashboard.tsx` â†’ substituir por `useContext(AppThemeContext)`.
7. Remover `window.addEventListener('focus', fetchTheme)` â†’ usar `visibilitychange` com debounce de 5s.

### ðŸ›¡ï¸ Fase C â€” CorreÃ§Ã£o do AbortController (Estabilidade)
> Estimativa: 20 min | Elimina travamentos silenciosos

8. `AuthProvider.tsx`: Substituir `AbortController` por `Promise.race` com timeout.
9. `AutomationService.ts`: Adicionar guarda de `sessionStorage` para nÃ£o re-executar na mesma sessÃ£o.

### ðŸŽ¨ Fase D â€” NavegaÃ§Ã£o Fluida (UX)
> Estimativa: 15 min | Elimina o unmount forÃ§ado

10. `App.tsx`: Remover `mode="wait"` do `AnimatePresence`.
11. Manter animaÃ§Ã£o de opacidade via CSS `transition` puro.

---

## ðŸ“Š Impacto Esperado

| MÃ©trica | Antes | ApÃ³s Fase A+B | ApÃ³s A+B+C+D |
|---|---|---|---|
| Queries por abertura do Dashboard | ~18-20 | ~6-8 | ~4-6 |
| Queries por troca de aba (focus) | ~3-6 | ~1 (debounced) | ~0-1 |
| Tempo atÃ© interaÃ§Ã£o (TTI) | 3-8s | 1-2s | <1s |
| Loading infinito (F5 obrigatÃ³rio) | Frequente | Raro | Eliminado |

---

## ðŸ“ Status de ImplementaÃ§Ã£o

- [x] **Fase A** â€” EliminaÃ§Ã£o do Loop (Dashboard)
- [x] **Fase B** â€” Singleton do Tema (AppThemeContext)
- [x] **Fase C** â€” AbortController e SessionStorage Guard
- [x] **Fase D** â€” NavegaÃ§Ã£o sem unmount forÃ§ado

---

> [!CAUTION]
> **NUNCA** adicionar `revalidateCount` em dependency arrays de `fetchData` em nenhum componente. Isso cria loops de re-fetch.

> [!IMPORTANT]
> A **Fase A** pode ser implementada sozinha com impacto imediato e sem risco. Implementar antes de qualquer outra mudanÃ§a para validar o ganho.

