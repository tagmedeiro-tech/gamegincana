**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸš€ Plano: InÃ­cio de Temporada / Start Gincana

> **VersÃ£o:** Fase 23 Â· **Status:** Planejamento  
> **Objetivo:** Implementar um mecanismo seguro para reiniciar a competiÃ§Ã£o, zerando pontuaÃ§Ãµes e definindo um marco temporal de inÃ­cio, com celebraÃ§Ã£o e engajamento.

---

## 1. VisÃ£o Geral

O botÃ£o "START GINCANA" serÃ¡ a ferramenta de "reset mestre". Ele nÃ£o apenas zera os nÃºmeros, mas marca o inÃ­cio de um novo ciclo competitivo (temporada).

### Funcionalidades Principais:
1. **Reset AtÃ´mico**: Zerar `totalPoints` de todos os usuÃ¡rios e grupos simultaneamente.
2. **HistÃ³rico de Logs**: Limpar ou arquivar a tabela `point_logs` (opcional: manter histÃ³rico mas filtrar na UI).
3. **Data de InÃ­cio**: Registrar a data oficial de inÃ­cio no `config` do app.
4. **NotificaÃ§Ã£o em Massa**: Alertar todos os usuÃ¡rios sobre o inÃ­cio da jornada.

---

## 2. Arquitetura TÃ©cnica

### 2.1 â€” Nova RPC: `start_new_gincana`
Para garantir que o reset seja rÃ¡pido e seguro (atÃ´mico), usaremos uma funÃ§Ã£o no PostgreSQL.

```sql
CREATE OR REPLACE FUNCTION start_new_gincana()
RETURNS void AS $$
BEGIN
  -- 1. Zerar pontos dos usuÃ¡rios
  UPDATE profiles SET "totalPoints" = 0;
  
  -- 2. Zerar pontos dos grupos
  UPDATE groups SET "totalPoints" = 0;
  
  -- 3. Limpar logs de pontos (para comeÃ§ar ranking do zero)
  -- OpÃ§Ã£o A: Deletar tudo (Radical)
  -- DELETE FROM point_logs;
  
  -- OpÃ§Ã£o B: Marcar logs antigos como 'arquivados' (Melhor para auditoria)
  -- UPDATE point_logs SET archived = true WHERE archived = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.2 â€” Estado Global (`AppTheme`)
Adicionar campo `gincanaStartDate` e `gincanaStatus` ('active', 'preparing').

---

## 3. UI/UX â€” Painel Admin

O botÃ£o ficarÃ¡ em uma nova aba chamada **"Temporadas"** no `AdminSystemPoints.tsx` ou em um local de destaque no `AdminDashboard.tsx`.

### 3.1 â€” O Modal de ConfirmaÃ§Ã£o (Nuclear Option)
Como Ã© uma aÃ§Ã£o destrutiva, o modal deve ser intimidador e seguro:
- **Input de ConfirmaÃ§Ã£o**: O admin deve digitar "RESETAR" ou "INICIAR" para habilitar o botÃ£o.
- **Seletor de Data/Hora**: Definir quando o cronÃ´metro comeÃ§a.

---

## 4. SugestÃµes Extras (Engajamento)

### ðŸŒŸ A: Hall da Fama (Season Archive)
Antes de zerar, o sistema tira um "snapshot" do ranking atual e salva em uma tabela `season_history`. Isso cria um **Hall da Fama** onde os vencedores da gincana anterior ficam imortalizados.

### ðŸŽ–ï¸ B: InsÃ­gnia "Pioneiro"
UsuÃ¡rios que estiverem ativos no momento do "Start" ganham automaticamente uma conquista/selo: **"Guerreiro Fundador"**.

### â³ C: Countdown no Dashboard
ApÃ³s o admin definir a data de inÃ­cio, um contador regressivo aparece para todos os usuÃ¡rios no Dashboard: *"A ARENA ABRE EM: 02d 14h 05m"*.

### ðŸ“¢ D: Post AutomÃ¡tico de Abertura
O sistema cria um post no Mural com um vÃ­deo/imagem Ã©pica anunciando: *"A GRANDE GINCANA COMEÃ‡OU! QUE VENÃ‡A A MELHOR TRIBO!"*

### ðŸ›¸ E: Sala de Espera (Waiting Room)
Se o admin definir um inÃ­cio futuro, os usuÃ¡rios que entrarem no app serÃ£o redirecionados para uma **Sala de Espera Imersiva**. 
- **Visual**: GalÃ¡xia animada ou nÃ©voa Ã©pica.
- **Temporizador**: Countdown gigante em tempo real.
- **Teaser**: Lista de tribos inscritas e contagem de guerreiros prontos.

---

## 5. ImplementaÃ§Ã£o â€” Passo a Passo

### Passo 1 â€” Banco de Dados
- [x] Criar RPC `start_new_gincana`.
- [x] (Opcional) Criar tabela `season_history` para o Hall da Fama.

### Passo 2 â€” Backend Service
- [x] Criar `SeasonService.ts` (Integrado via AdminSeasonManager e RPC).

### Passo 3 â€” UI Admin
- [x] Criar o componente `AdminSeasonManager.tsx`.
- [x] Implementar o modal de confirmaÃ§Ã£o com "Double-Lock" (palavra-chave).

### Passo 4 â€” Feedback Global
- [x] Integrar com `NotificationService` (Enviado via Mural automÃ¡tico).
- [x] Integrar com `FeedService` para post de abertura.

---

### Passo 5 â€” Sala de Espera (Pre-Game)
- [x] Criar componente `WaitingRoom.tsx`.
- [x] Implementar lÃ³gica de redirecionamento no `App.tsx` baseada no `gincanaStatus`.
- [x] Adicionar efeitos visuais de "hiperespaÃ§o" ou "arena fechada".

---

## 6. PrÃ³ximos Passos

1. Implementar `WaitingRoom.tsx`.
2. Ajustar `AdminSeasonManager.tsx` para permitir status 'waiting'.

