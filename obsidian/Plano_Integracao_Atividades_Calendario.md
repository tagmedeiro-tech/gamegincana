**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ›¡ï¸ Plano: IntegraÃ§Ã£o Total CalendÃ¡rio + Atividades

Este documento detalha o sistema de validaÃ§Ã£o de provas e a unificaÃ§Ã£o da criaÃ§Ã£o de atividades dentro do fluxo do calendÃ¡rio.

## 1. Fluxo de Vida de uma Prova (Foto)
1. **Envio**: UsuÃ¡rio sobe a foto via CalendÃ¡rio.
2. **PersistÃªncia**: 
   - Foto -> `storage/proofs`
   - Registro -> `participations` (status: `pending`, date: `YYYY-MM-DD`)
3. **Visibilidade**:
   - Para o UsuÃ¡rio: No CalendÃ¡rio, o botÃ£o vira "Aguardando ValidaÃ§Ã£o".
   - Para a Tribo: Post no Mural com a foto (com marca d'Ã¡gua "Pendente").
   - Para o LÃ­der: NotificaÃ§Ã£o e entrada na fila de aprovaÃ§Ã£o.
4. **Desfecho**:
   - **Aprovado**: Pontos creditados + NotificaÃ§Ã£o de sucesso.
   - **Rejeitado**: Motivo enviado ao usuÃ¡rio + BotÃ£o de reenvio habilitado.

## 2. Bloqueio de Duplicidade
O sistema verificarÃ¡ a chave Ãºnica: `user_id` + `event_id` + `occurrence_date`.
- Se existir registro, o botÃ£o de upload Ã© desabilitado para evitar spam de pontos.

## 3. UnificaÃ§Ã£o no Modal de CriaÃ§Ã£o (UX Admin)
Ao criar um evento no calendÃ¡rio e marcar "Exigir Foto", o sistema oferecerÃ¡:
- **OpÃ§Ã£o A (Atividade Existente)**: Selecionar uma atividade jÃ¡ cadastrada (ex: "Leitura DiÃ¡ria").
- **OpÃ§Ã£o B (Nova Atividade AutomÃ¡tica)**: O sistema cria uma atividade espelho com o mesmo nome do evento.
   - *Campos automÃ¡ticos*: Pontos, Nome, Categoria.
   - *ConfiguraÃ§Ã£o*: Definir se a aprovaÃ§Ã£o Ã© automÃ¡tica (AI) ou manual (LÃ­der).

## 4. PrÃ³ximas Etapas TÃ©cnicas
- [x] Criar tabela `event_participations` se nÃ£o houver.
- [x] Implementar `checkExistingParticipation` no `CalendarService`.
- [x] Desenvolver o "Preview da Foto" antes do envio definitivo.
- [x] Criar o componente `StatusBadge` para o card do calendÃ¡rio (Pendente/Aprovado).

---
*Assinado: Antigravity AI - Estrategista de Sistemas*

