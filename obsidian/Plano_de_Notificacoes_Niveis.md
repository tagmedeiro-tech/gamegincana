**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ”” Plano de NotificaÃ§Ãµes em NÃ­veis (Hierarquia Total)

## ðŸ“Œ 1. VisÃ£o Geral
O objetivo deste plano Ã© garantir que o sistema de notificaÃ§Ãµes da Gincana da Tribo funcione em nÃ­veis hierÃ¡rquicos rÃ­gidos:
- **Administrador (Super Admin):** Funciona como uma "Torre de Vigia". Recebe alertas de **TUDO** que acontece na plataforma, independente do grupo.
- **LÃ­der de Tribo:** Funciona como um "General". Recebe alertas detalhados sobre as aÃ§Ãµes **apenas dos membros da sua prÃ³pria tribo**. O lÃ­der nÃ£o tem acesso aos alertas das tribos adversÃ¡rias.

## ðŸ› ï¸ 2. DiagnÃ³stico do Sistema Atual
A infraestrutura para essa hierarquia jÃ¡ existe atravÃ©s do mÃ©todo `NotificationService.notifyStaff(groupId, type, title, content)`. Esse mÃ©todo jÃ¡ faz o trabalho de notificar os admins e apenas o lÃ­der do `groupId` passado.

No entanto, hÃ¡ uma ausÃªncia de rastreamento de diversas atividades cruciais na plataforma.

### O que estÃ¡ funcionando (e deve ser mantido):
- âœ… **Envio de Prova de Atividades (`Activities.tsx`)**: Usa `notifyStaff`. Admin e LÃ­der veem.
- âœ… **Novos Cadastros Pendentes (`Register.tsx`)**: Notifica o Admin.

### O que precisa ser ajustado (Inconsistente):
- âš ï¸ **Logins (`Login.tsx`)**: Usa `notifyAdmins`. O lÃ­der nÃ£o sabe quando seu membro entra.
- âš ï¸ **Loja/Resgates (`Store.tsx`)**: Usa `notifyAdmins`. O lÃ­der nÃ£o sabe quando seu membro troca pontos.

### O que estÃ¡ faltando (Pontos Cegos):
- âŒ **Duelos (`Duel.tsx`)**: Nenhum alerta Ã© gerado quando alguÃ©m lanÃ§a um desafio ou quando o resultado sai.
- âŒ **Quizzes BÃ­blicos (`BibleQuiz.tsx`)**: Nenhuma notificaÃ§Ã£o sobre o desempenho do membro (acertos/erros).
- âŒ **Planos de Leitura e Devocionais (`BibleViewer.tsx` / `ReadingPlans.tsx`)**: Apenas o prÃ³prio usuÃ¡rio sabe que concluiu. O Staff nÃ£o recebe confirmaÃ§Ã£o.

---

## ðŸš€ 3. Etapas de ImplementaÃ§Ã£o (Action Plan)

### Fase 1: PadronizaÃ§Ã£o da Hierarquia Base
**Objetivo:** Integrar os lÃ­deres aos eventos de sistema que jÃ¡ existem.
1. Alterar `NotificationService.notifyAdmins` para `NotificationService.notifyStaff(profile.groupId, ...)` no arquivo `Login.tsx`. Isso farÃ¡ o lÃ­der ser avisado quando sua equipe estiver online. mas no duelo, todos devem saber quem esta online ou nÃ£o para duelar
2. Alterar `notifyAdmins` para `notifyStaff(profile.groupId, ...)` no arquivo `Store.tsx`. O lÃ­der acompanharÃ¡ os prÃªmios da sua tribo.

### Fase 2: Mapeamento de Novas AÃ§Ãµes (O Fim dos Pontos Cegos)
**Objetivo:** Injetar os gatilhos do `notifyStaff` nos eventos de gamificaÃ§Ã£o.
1. **Quizzes (`BibleQuiz.tsx`):**
   - Injetar no `handleComplete`: 
     *Ex: "JoÃ£o (Tribo X) respondeu o Quiz de GÃªnesis 1 e acertou 3/4."*
2. **Leitura/Devocional (`BibleViewer.tsx`):**
   - Injetar no `completeReading` e `handleCompleteDevotional`:
     *Ex: "Maria cumpriu o Devocional Pessoal do Dia!"*
3. **Duelos Sagrados (`Duel.tsx`):**
   - Ao lanÃ§ar desafio: Notificar Admin e LÃ­der do Desafiante.
   - Ao finalizar/encerrar: Notificar Admin, LÃ­der do Vencedor e LÃ­der do Perdedor com o resultado oficial.

### Fase 3: PrevenÃ§Ã£o de Caos no Sininho (Filtro Anti-Flood)
**Objetivo:** Evitar que as notificaÃ§Ãµes crÃ­ticas sumam no meio de alertas comuns.
Se registrarmos tudo no sininho (`notifications`), o Admin receberÃ¡ centenas de notificaÃ§Ãµes por dia, escondendo provas de atividades pendentes.
1. **Nova Categoria no Enum de NotificaÃ§Ãµes:** Separar alertas que requerem aÃ§Ã£o (ex: validar prova) de alertas sistÃªmicos (ex: Fulano logou).
2. **Dashboard > Radar ao Vivo (Opcional):** Em vez de entupir o sininho com quizzes e logins, essas atividades de baixo nÃ­vel podem alimentar um "Feed do Sistema" visÃ­vel na tela inicial do Admin/LÃ­der.
3. **Sininho de Ouro:** O sininho ficarÃ¡ reservado apenas para:
   - Provas de atividades aguardando validaÃ§Ã£o manual.
   - Resgates de loja aguardando entrega fÃ­sica.
   - Pedidos de aprovaÃ§Ã£o de cadastro de usuÃ¡rio.


   4: notificar todo mundo quando uma atividade for lanÃ§ada para os usuarios.
   5: 

---
*Documento gerado para registro no Obsidian (Brain).*

