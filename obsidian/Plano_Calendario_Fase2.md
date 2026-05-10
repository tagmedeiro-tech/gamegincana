**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ—“ï¸ Plano de ExpansÃ£o: CalendÃ¡rio & MissÃµes Recorrentes (Fase 2)

Este plano visa integrar o calendÃ¡rio Ã  dinÃ¢mica de atividades prÃ¡ticas da Gincana, permitindo que eventos recorrentes (cultos, reuniÃµes, treinos) sirvam como porta de entrada para envio de provas e ganho de XP.

## 1. VisÃ£o Geral da Arquitetura
Transformar o CalendÃ¡rio em um "Gerador de MissÃµes Temporais". Se um evento estÃ¡ no calendÃ¡rio e exige prova, ele se torna uma **Atividade Ativa** para aquele dia.

## 2. Pilares da ImplementaÃ§Ã£o

### A. Sistema de RecorrÃªncia (Smart Recurrence)
- **FrequÃªncia**: DiÃ¡ria, Semanal ou Mensal.
- **SeleÃ§Ã£o de Dias**: Checklist de Seg-Dom para eventos semanais (Ex: Culto de Domingo).
- **VigÃªncia**: Data de inÃ­cio e data de tÃ©rmino do ciclo de recorrÃªncia.
- **ExceÃ§Ãµes**: Possibilidade de cancelar uma Ãºnica ocorrÃªncia sem afetar a sÃ©rie.

### B. IntegraÃ§Ã£o com Provas (Atividades)
- **VÃ­nculo de Atividade**: O administrador pode associar um Evento a uma "Atividade de Gincana".
- **BotÃ£o de AÃ§Ã£o DinÃ¢mico**: 
    - Se o evento for hoje e exigir foto: Exibir "ðŸ“¸ ENVIAR PROVA AGORA".
    - Se o evento for futuro: Exibir "ðŸ”” LEMBRAR-ME".
    - Se jÃ¡ enviado: Exibir "âœ… PROVA ENVIADA".

### C. AutomaÃ§Ã£o de Check-in
- **GeolocalizaÃ§Ã£o (Opcional)**: Validar se o usuÃ¡rio estÃ¡ no local do evento (ex: Igreja) para liberar o envio da foto.
- **Janela de Tempo**: A prova sÃ³ pode ser enviada dentro de uma janela (ex: 1h antes atÃ© 3h depois do horÃ¡rio do evento).

## 3. MudanÃ§as no Banco de Dados (Supabase)
- **Tabela `calendar_events`**:
    - `is_recurring`: boolean
    - `recurrence_pattern`: jsonb (ex: `{ "freq": "weekly", "days": [0, 3] }`)
    - `linked_activity_id`: UUID (referÃªncia para a tabela de atividades)
    - `requires_proof`: boolean (define se precisa de foto)

## 4. Cronograma de ExecuÃ§Ã£o

### Fase 2.1: UI de RecorrÃªncia (Admin)
- [ ] Atualizar Modal de "Novo Evento" com opÃ§Ãµes de repetiÃ§Ã£o.
- [ ] Implementar lÃ³gica de visualizaÃ§Ã£o no Grid (renderizar instÃ¢ncias virtuais de eventos recorrentes).

### Fase 2.2: Ponte de Atividades
- [ ] Criar componente `EventActionBtn` que muda baseado no status da prova.
- [ ] Integrar com o `FeedService` para que a foto do evento vÃ¡ direto para o Mural.

### Fase 2.3: GamificaÃ§Ã£o
- [ ] BÃ´nus de "SequÃªncia de Cultos": Ganhar selo especial por 4 domingos seguidos com prova enviada.

---
*Assinado: Antigravity AI - Estrategista de Engajamento Digital*

