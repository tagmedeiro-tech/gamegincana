**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸš€ Plano de AutomaÃ§Ã£o do Mural: Eventos de Tribo & Novos Guerreiros

## 1. VisÃ£o Geral
Transformar o Mural da Tribo em um ecossistema social mais vivo. Sempre que houver uma aÃ§Ã£o administrativa crÃ­tica (mudanÃ§a de identidade da tribo ou recrutamento), o sistema gerarÃ¡ um **Post AutomÃ¡tico Premium** para gerar engajamento imediato (celebraÃ§Ã£o).

## 2. Estrutura de Dados (`types.ts`)
Precisamos expandir os tipos de postagens permitidos para suportar renderizaÃ§Ãµes especÃ­ficas.

**Novos `PostType` no `FeedPost`**:
- `'new_member'`: Para quando um membro Ã© aprovado.
- `'group_update'`: Para mudanÃ§as de nome ou brasÃ£o da tribo.

**Metadados Extras (no corpo do Post)**:
Aproveitaremos os campos existentes (`caption`, `imageUrl`) ou adicionaremos campos flexÃ­veis no frontend para armazenar os dados do evento sem precisar alterar o banco de dados.

## 3. UI/UX: EstÃ©tica Premium & Micro-interaÃ§Ãµes

### A. Card de Novo Guerreiro (`new_member`)
**Conceito**: "Um novo guerreiro entrou na Arena".
- **Visual**: Fundo com gradiente radial sutil na cor da tribo (`--color-primary`).
- **ComposiÃ§Ã£o**: 
  - Uma borda pulsante.
  - A foto de perfil do novo membro centralizada, grande, com um efeito "Glow" atrÃ¡s dela.
  - O BrasÃ£o da tribo no canto superior direito.
- **Tipografia**: "O GUERREIRO [NOME] FOI CONVOCADO!" em fonte `black italic`.
- **AnimaÃ§Ã£o**: Ao fazer o scroll e o card aparecer na tela, a foto do membro faz um `scale-up` com efeito elÃ¡stico (`framer-motion`).

### B. Card de AtualizaÃ§Ã£o de Tribo (`group_update`)
**Conceito**: "A identidade da tribo evoluiu".
- **Visual**: Um design minimalista focado na nova identidade. Fundo escuro texturizado.
- **ComposiÃ§Ã£o**:
  - Se for mudanÃ§a de logo: O novo brasÃ£o ocupa o centro do card, iluminado por um holofote (`box-shadow` e blur interno).
  - Se for mudanÃ§a de nome: O novo nome em texto Gigante, cortado (estilo brutalista) na borda do card.
- **AnimaÃ§Ã£o**: Brilho intermitente que passa por cima do novo logotipo.

## 4. Engenharia e Disparos (Triggers)

NÃ£o usaremos "Database Triggers" (PostgreSQL) para isso, pois queremos controle flexÃ­vel sobre o autor do post (o Admin ou o LÃ­der). Faremos os disparos pelo Frontend nos seguintes pontos crÃ­ticos:

### A. Disparo de Novo Membro
**Onde:** `AdminUsers.tsx` e `LeaderPanel.tsx` (FunÃ§Ã£o de Aprovar UsuÃ¡rio).
**Fluxo:**
1. O lÃ­der/admin clica em "Aprovar".
2. O Supabase atualiza o status para `active`.
3. O cÃ³digo chama `FeedService.createPost({ ... })` anonimamente ou em nome da Tribo.
4. O post entra no Feed como `'new_member'`.

### B. Disparo de AtualizaÃ§Ã£o de Tribo
**Onde:** `AdminGroups.tsx` (Modal de EdiÃ§Ã£o).
**Fluxo:**
1. O admin altera o nome ou o logo da tribo.
2. Compara se a URL do logo ou o nome foi de fato alterado (evita spam).
3. ApÃ³s salvar no Supabase, cria um post no Feed contendo a URL da nova logo ou o texto da atualizaÃ§Ã£o.

## 5. ImplementaÃ§Ã£o: Passo a Passo

- [ ] **Passo 1**: Atualizar `types.ts` adicionando `'new_member'` e `'group_update'` ao `PostType`.
- [ ] **Passo 2**: Atualizar o componente de renderizaÃ§Ã£o do Mural (`Feed.tsx` ou componente filho `PostCard.tsx`) para mapear esses novos tipos com HTML/Tailwind especÃ­ficos para a estÃ©tica Brutalista Premium.
- [ ] **Passo 3**: Criar a funÃ§Ã£o `createSystemPost` no `FeedService.ts` dedicada a montar o payload correto (garantindo case-sensitivity `"groupId"`, etc).
- [ ] **Passo 4**: Injetar o `createSystemPost` na funÃ§Ã£o de salvar do painel `AdminGroups.tsx`.
- [ ] **Passo 5**: Injetar o `createSystemPost` na funÃ§Ã£o `handleApproveUser` do `AdminUsers.tsx` e painel de lÃ­der.

---
*Este Ã© um plano diretor. Se aprovado, iniciaremos as modificaÃ§Ãµes de ponta a ponta.*

