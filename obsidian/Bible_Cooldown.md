**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# Gincana da Tribo - Sistema de Cooldown de PontuaÃ§Ã£o do Leitor BÃ­blico

**Objetivo:** Permitir que usuÃ¡rios pontuem a Leitura e o Quiz de cada capÃ­tulo apenas **1 vez por ano** para evitar o "farm" de pontos e incentivar a leitura diversificada de toda a BÃ­blia.

## ModificaÃ§Ãµes Implementadas

### 1. SeparaÃ§Ã£o de Rotas de Ganho no Banco de Dados (Supabase)
Criada a migraÃ§Ã£o `20260427070000_bible_cooldown.sql`:
*   **AdiÃ§Ã£o da coluna `completion_type`:** Agora a tabela `bible_completions` diferencia se o ponto foi dado pela leitura normal (`'reading'`) ou pela conclusÃ£o do Quiz BÃ­blico (`'quiz'`).
*   **RemoÃ§Ã£o do Bloqueio Eterno:** A constraint `UNIQUE(user_id, book_id, chapter)` foi removida. O sistema nÃ£o bloqueia mais permanentemente a pontuaÃ§Ã£o do mesmo capÃ­tulo.
*   **AtualizaÃ§Ã£o da RPC `complete_bible_chapter`:** 
    *   A funÃ§Ã£o agora busca qual foi a Ãºltima vez (`created_at`) que o usuÃ¡rio completou aquela atividade para aquele livro/capÃ­tulo.
    *   Se o tempo for menor que 365 dias, ela devolve uma resposta de recusa customizada (`{ success: false, cooldown: true }`).

### 2. Front-end (React)
No componente principal `BibleViewer.tsx`:
*   A funÃ§Ã£o `completeReading` foi refatorada para receber o tipo de pontuaÃ§Ã£o via parÃ¢metro (`completionType: 'reading' | 'quiz'`).
*   O botÃ£o *Marcar como Lido* e o fim do *Quiz* chamam `completeReading` com seus devidos tipos, desmembrando as lÃ³gicas de registro.
*   O feedback visual para o usuÃ¡rio: Caso a API negue a pontuaÃ§Ã£o por causa do cooldown de 1 ano, um alert informa que o usuÃ¡rio atingiu o limite de recompensa para aquele capÃ­tulo neste ano.

### 3. ExceÃ§Ãµes e Casos Especiais Garantidos:
*   **Devocional DiÃ¡rio:** Continua cego Ã  tabela `bible_completions`. Ou seja, se o Devocional mandar ler GÃªnesis 1, o usuÃ¡rio vai pontuar *mesmo que jÃ¡ tenha lido e pontuado GÃªnesis 1 livremente hoje ou no mÃªs passado*. Apenas o prÃ³prio devocional Ã© restrito a uma Ãºnica conclusÃ£o por dia.
*   **Planos de Leitura:** TÃªm sua prÃ³pria tabela `reading_plan_completions` e sua prÃ³pria RPC `complete_reading_plan_day`, portanto as metas do plano de leitura nÃ£o conflitam com o limite do leitor livre.

## PrÃ³ximos Passos (Ops/ManutenÃ§Ã£o):
1. Fazer o deploy das migraÃ§Ãµes do Supabase em produÃ§Ã£o (`npx supabase db push` ou rodar o script no SQL Editor).
2. Opcional: futuramente mostrar no botÃ£o do front-end quanto tempo falta para o cooldown acabar, caso desejado.

