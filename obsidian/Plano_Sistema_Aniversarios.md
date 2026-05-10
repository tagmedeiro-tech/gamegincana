**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# Plano de ImplementaÃ§Ã£o: Sistema de AniversÃ¡rios da Tribo ðŸŽ‚âœ¨

Este plano detalha a automaÃ§Ã£o para celebraÃ§Ã£o de aniversariantes, integrando CalendÃ¡rio, Mural Social e ExperiÃªncia do UsuÃ¡rio (UX).

---

## 1. VisÃ£o Geral
- **Objetivo:** Celebrar automaticamente cada membro em seu dia especial, gerando engajamento e pontos bÃ´nus.
- **Gatilho:** Primeiro login do dia ou rotina de automaÃ§Ã£o (`AutomationService`).
- **Impacto:** CalendÃ¡rio, Mural, NotificaÃ§Ãµes e Popup de Login.

---

## 2. Estrutura de Dados
O campo `birthDate` (ou `birth_date`) na tabela `profiles` serÃ¡ a fonte da verdade. 
- **Nota:** Garantir que o formato no banco seja `YYYY-MM-DD` ou `DATE`.

---

## 3. Fluxo de ImplementaÃ§Ã£o

### Camada 1: CalendÃ¡rio DinÃ¢mico ðŸ“…
- **LÃ³gica:** O `CalendarService` deve realizar uma busca secundÃ¡ria na tabela `profiles` para encontrar membros que fazem aniversÃ¡rio no mÃªs visualizado.
- **ExibiÃ§Ã£o:** Ãcone de ðŸŽ‚ no dia correspondente com o nome do membro (ex: "AniversÃ¡rio: Tiago").
- **Estilo:** Card especial com glow dourado no calendÃ¡rio.

### Camada 2: Mural Social AutomÃ¡tico ðŸ–¼ï¸
- **AÃ§Ã£o:** Ao detectar o aniversÃ¡rio no primeiro login do membro (ou via Cron), o sistema criarÃ¡ um post automÃ¡tico no `feed_posts`.
- **Tipo de Post:** `anniversary`.
- **ConteÃºdo:** "Hoje Ã© um dia especial! A Tribo celebra a vida de [Nome]! ðŸŽ‚ðŸ”¥".
- **ReaÃ§Ãµes:** Habilitar reaÃ§Ãµes de celebraÃ§Ã£o automÃ¡tica.

### Camada 3: NotificaÃ§Ãµes Globais ðŸ””
- **Disparo:** `NotificationService.notifyAll` enviarÃ¡ um alerta para todos os membros.
- **Mensagem:** "ðŸŽ‚ ParabÃ©ns! Hoje Ã© aniversÃ¡rio de [Nome]. Deixe seu parabÃ©ns no Mural!".

### Camada 4: ExperiÃªncia "Surpresa" (UX) ðŸŽ‰
- **Trigger:** VerificaÃ§Ã£o no `Dashboard.tsx` ao carregar o perfil.
- **Componente:** `AnniversaryModal.tsx`.
- **Efeitos:** 
    - Popup High-Fidelity com mensagem personalizada.
    - Disparo massivo de `canvas-confetti`.
    - Som de celebraÃ§Ã£o (integrado ao `AudioEngine`).
    - **Recompensa:** AtribuiÃ§Ã£o automÃ¡tica de "Pontos de BenÃ§Ã£o" (ex: +100 XP).

---

## 4. PrÃ³ximas Etapas TÃ©cnicas

### Fase 1: Backend & Service Update
- [x] Criar funÃ§Ã£o no `profiles` para buscar aniversariantes do mÃªs/dia.
- [x] Atualizar `CalendarService` para mesclar aniversÃ¡rios nos eventos.

### Fase 2: AutomaÃ§Ã£o & Mural
- [x] Implementar verificaÃ§Ã£o de "AniversÃ¡rio JÃ¡ Postado" (log de pontos anual).
- [x] Criar template de post para aniversÃ¡rios no `FeedService`.

### Fase 3: UI & Confete
- [x] Desenvolver o componente `AnniversaryPopup`.
- [x] Adicionar lÃ³gica de verificaÃ§Ã£o de data no `Dashboard.tsx`.
- [x] Integrar som e partÃ­culas (confete).

---
*Assinado: Antigravity AI - Estrategista de GamificaÃ§Ã£o*

