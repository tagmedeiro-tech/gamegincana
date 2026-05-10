**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# Plano de EstabilizaÃ§Ã£o de SessÃ£o e Performance (Anti-Timeout)

**Data**: 04/05/2026
**Objetivo**: Resolver perda de conexÃ£o com Supabase apÃ³s a pÃ¡gina ficar ociosa e otimizar performance na ediÃ§Ã£o de itens complexos (como NÃ­veis).

## 1. Causa Raiz Identificada
- **Supabase Lock/Fetch com Timeout**: A lÃ³gica de `customFetch` e o `lock` customizado em `supabase.ts` usavam `setTimeout` fixos de 30s. Em abas em background, navegadores pausam a execuÃ§Ã£o, fazendo os timeouts "estourarem" imediatamente quando a aba volta ao foco, causando aborto nas conexÃµes em andamento.
- **Perda de Trabalho em MemÃ³ria**: O React mantinha as configuraÃ§Ãµes na memÃ³ria volÃ¡til (`useState`). Quando a conexÃ£o caÃ­a, a falha no salvamento obrigava um F5, destruindo os dados em tela.
- **Performance (Re-renders)**: Ao alterar um Ãºnico nÃ­vel de uma matriz grande (como os 50 nÃ­veis), toda a matriz era re-renderizada, resultando em "lags" durante a digitaÃ§Ã£o.

## 2. AÃ§Ãµes Implementadas

### A. RefatoraÃ§Ã£o do Motor de ConexÃ£o (`supabase.ts`)
- **RemoÃ§Ã£o de Timeouts Estritos**: Retirado o uso agressivo de `AbortController` com `setTimeout` do `customFetch`.
- **Condicional de Web Locks**: O lock customizado agora sÃ³ serÃ¡ usado no ambiente de desenvolvimento (`import.meta.env.DEV`) para lidar com deadlocks de HMR (Hot Module Replacement). Em produÃ§Ã£o, o Supabase utilizarÃ¡ a estabilidade da **Web Locks API nativa**.

### B. Auto-Save e PersistÃªncia de Rascunhos (`AdminLevelEditor.tsx`)
- **Storage Local**: LÃ³gica injetada para salvar continuamente o "Draft" (rascunho) dos nÃ­veis no `localStorage` sob a chave `draft_admin_levels`.
- **PrevenÃ§Ã£o de Perda**: Ao carregar o componente, caso os dados no `localStorage` sejam diferentes dos do banco, Ã© exibido um botÃ£o opcional para o usuÃ¡rio "Restaurar Rascunho NÃ£o Salvo". Quando salvo com sucesso no banco, o cache do navegador Ã© limpo.

### C. Performance Extrema com React.memo
- A lÃ³gica de renderizaÃ§Ã£o de cada NÃ­vel foi encapsulada em um subcomponente memoizado (`LevelItemCard`) protegido por `React.memo` para impedir renders em cadeia. Cada card agora sÃ³ Ã© recalculado se suas propriedades especÃ­ficas mudarem.

### D. Safety Check de ConexÃ£o (BotÃ£o Salvar)
- O `handleSave` agora tem proteÃ§Ã£o de status e, se necessÃ¡rio, forÃ§a a verificaÃ§Ã£o silenciosa da sessÃ£o para garantir que um "Save" sÃ³ suba os dados quando a conexÃ£o estÃ¡ fresca e re-hidratada.

---

## 3. ExtensÃ£o do Plano Implementada (Fase 2)

### A. CriaÃ§Ã£o do Hook GenÃ©rico `useAutoSaveDraft`
- A lÃ³gica de rascunhos locais foi extraÃ­da para o utilitÃ¡rio `useAutoSaveDraft` e padronizada.
- Implementado no `AdminSettings`, o formulÃ¡rio de configuraÃ§Ãµes globais mais crÃ­tico, permitindo que alteraÃ§Ãµes gigantes nÃ£o sejam perdidas caso haja oscilaÃ§Ã£o na rede ao salvar, com direito a botÃ£o "Restaurar Rascunho" e "Descartar".

### B. CorreÃ§Ã£o de Fusos HorÃ¡rios (`Dashboard.tsx`)
- O Dashboard agora trata ativamente a conversÃ£o das datas UTC que chegam do banco de dados (Supabase) para o **Timezone Local (UTC-3)** do usuÃ¡rio.
- Esse ajuste eliminou o problema onde as mÃ©tricas do Sparkline de XP ou os *Streaks* (ofensivas de leitura diÃ¡ria) sumiam ou ficavam dessincronizados antes das 21h devido Ã  diferenÃ§a de tempo em relaÃ§Ã£o a Greenwich.

### C. Re-HidrataÃ§Ã£o de SessÃµes em Leituras Longas
- Em componentes como `BibleViewer` e `ReadingPlans`, onde o usuÃ¡rio passa muitos minutos lendo e a aba entra em estado `idle` (inatividade profunda do navegador), a sessÃ£o do Auth expirava.
- Adicionada a chamada defensiva `await supabase.auth.getSession()` segundos antes de finalizar Devocionais e Leituras, forÃ§ando a atualizaÃ§Ã£o do token silenciosamente em background e garantindo que os pontos sempre sejam salvos.

