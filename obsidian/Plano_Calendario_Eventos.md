**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# Plano de ImplementaÃ§Ã£o: CalendÃ¡rio da Tribo ðŸ“…ðŸ†

Este documento detalha o plano para a criaÃ§Ã£o da nova pÃ¡gina de **CalendÃ¡rio**, centralizando eventos, desafios e cronogramas da Gincana em uma interface premium e funcional.

---

## 1. VisÃ£o Geral e Objetivos
- **Objetivo:** Fornecer aos membros uma visÃ£o clara dos eventos futuros, prazos de tarefas e horÃ¡rios de pico na Arena Voxel.
- **PÃºblico:** Participantes (visualizaÃ§Ã£o e lembretes) e Administradores (agendamento e gestÃ£o).
- **EstÃ©tica:** Design "High-Fidelity" seguindo o padrÃ£o Black & Gold, com transiÃ§Ãµes suaves e estados de hover elegantes.

---

## 2. Estrutura de Dados (Supabase)
SerÃ¡ necessÃ¡ria uma nova tabela `calendar_events` para gerenciar a persistÃªncia:

| Coluna | Tipo | DescriÃ§Ã£o |
|---|---|---|
| `id` | uuid | PK, Identificador Ãºnico. |
| `title` | text | Nome do evento/desafio. |
| `description` | text | Detalhes ou regras. |
| `event_date` | date | Data do evento. |
| `start_time` | time | Hora de inÃ­cio. |
| `end_time` | time | Hora de tÃ©rmino (opcional). |
| `type` | text | 'gincana', 'live', 'metaverso', 'meeting', 'outros'. |
| `group_id` | uuid | (Opcional) Se for um evento exclusivo de uma tribo. |
| `points_reward` | int | Pontos bÃ´nus por participaÃ§Ã£o confirmada. |
| `created_by` | uuid | FK para profiles (Admin). |

---

## 3. Componentes da Interface (UI/UX)

### A. PÃ¡gina Principal (`CalendarPage.tsx`)
- **Header DinÃ¢mico:** TÃ­tulo com gradiente e contador de "PrÃ³ximos Eventos".
- **VisualizaÃ§Ã£o Mensal:** Grid responsivo (7 colunas) com navegaÃ§Ã£o entre meses.
- **VisualizaÃ§Ã£o de Lista (Mobile):** Lista vertical otimizada para telas pequenas.
- **Filtros por Categoria:** Tags clicÃ¡veis para filtrar tipos de eventos.

### B. Cards de Evento e Modais
- **EventIndicator:** Pequenos pontos ou badges coloridos no grid do calendÃ¡rio.
- **EventDetailModal:** Popup com animaÃ§Ã£o Framer Motion contendo descriÃ§Ã£o completa e botÃ£o "Adicionar ao meu Google Calendar".
- **AdminEventEditor:** Interface simplificada para admins criarem eventos rapidamente.

---

## 4. IntegraÃ§Ã£o e GamificaÃ§Ã£o
- **NotificaÃ§Ãµes:** IntegraÃ§Ã£o com o `NotificationService` para disparar alertas 1 hora antes de eventos "Live".
- **XP de PresenÃ§a:** BotÃ£o de "Check-in" em eventos que gera log de pontos automÃ¡tico (validado por admin).
- **Dashboard Widget:** Um mini-calendÃ¡rio ou "PrÃ³ximo Evento" no painel principal.

---

## 5. Fases de ImplementaÃ§Ã£o

### Fase 1: FundaÃ§Ã£o (Backend & Boilerplate)
- [/] Criar tabela `calendar_events` no Supabase com RLS (SQL gerado).
- [x] Definir tipos em `src/types.ts`.
- [x] Criar a rota `/dashboard/calendar`.

### Fase 2: UI & VisualizaÃ§Ã£o
- [x] Implementar o grid do calendÃ¡rio usando `date-fns`.
- [x] EstilizaÃ§Ã£o premium (glassmorphism nos cards de dia).
- [x] Responsividade mobile (Stack view).

### Fase 3: GestÃ£o Admin
- [x] Painel de criaÃ§Ã£o de eventos no componente `Calendar.tsx`.
- [x] Sistema de deleÃ§Ã£o e feedback via Toast.

### Fase 4: Polimento & NotificaÃ§Ãµes
- [x] Adicionar animaÃ§Ãµes de entrada (`motion`).
- [x] Vincular ao sistema de notificaÃ§Ãµes globais (`notifyAll`).
- [x] Criar Dashboard Widget (`CalendarWidget.tsx`).

---

## 6. Regras de Design (Skill Sync)
- **Cores:** `bg-zinc-950` para o fundo, `text-amber-400` para destaques.
- **InteraÃ§Ã£o:** Hover nos dias deve mostrar um brilho sutil (gold glow).
- **Blindagem:** Envolver todos os textos em `<span>` para compatibilidade React 19.

---
*Plano gerado por Antigravity AI em 05/05/2026*

