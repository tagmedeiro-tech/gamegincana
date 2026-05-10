**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# Plano de ImplementaÃ§Ã£o: Mural de Fotos Premium (Mural da Tribo v2.0)

Este plano detalha a criaÃ§Ã£o de um componente de Mural de Fotos dinÃ¢mico e interativo para a Gincana da Tribo, focado em alta fidelidade visual, engajamento social e automaÃ§Ã£o.

## ðŸŽ¯ Objetivos
- Criar uma galeria imersiva que exiba as fotos mais curtidas do feed.
- Permitir que membros adicionem fotos diretamente ao mural.
- Implementar uma exibiÃ§Ã£o automÃ¡tica e randÃ´mica (Slideshow/Carousel) com estÃ©tica Cyber-Brutalist.
- Garantir responsividade total e performance premium.

## ðŸŽ¨ UI/UX Design (EstÃ©tica Gincana)
- **Container**: Estilo *Glassmorphism* com bordas neon e brilho sutil.
- **TransiÃ§Ãµes**: Uso de `framer-motion` para efeitos de "Fade & Slide" e "Ken Burns" (zoom lento) nas fotos.
- **Interatividade**: Hover effects que revelam o autor e o nÃºmero de curtidas.
- **BotÃ£o "Adicionar Foto"**: BotÃ£o flutuante ou integrado com animaÃ§Ã£o de pulso e Ã­cone de cÃ¢mera.

## ðŸ› ï¸ Arquitetura TÃ©cnica

### 1. Fonte de Dados (Engine)
- **Filtro DinÃ¢mico**: Buscar `feed_posts` onde `postType === 'photo'`.
- **Ranking de Popularidade**: Ordenar pela soma de reaÃ§Ãµes (`reactionSummary`).
- **Realtime**: SincronizaÃ§Ã£o automÃ¡tica via Supabase Realtime para refletir novas fotos curtidas instantaneamente.

### 2. Componente `PhotoMural.tsx`
- **Estados**:
    - `photos`: Lista de posts de imagem filtrados.
    - `currentIndex`: Ãndice da foto em exibiÃ§Ã£o.
- **LÃ³gica de RotaÃ§Ã£o**:
    - `useEffect` con `setInterval` para trocar fotos a cada 5-8 segundos.
    - FunÃ§Ã£o `shuffle` para garantir que a ordem seja randÃ´mica a cada ciclo.
- **Upload Direto**:
    - Modal de upload que cria um novo `FeedPost` do tipo `photo`.

### 3. IntegraÃ§Ã£o no Dashboard
- O Mural serÃ¡ posicionado como um destaque no topo ou lateral do Dashboard, servindo como a "Vitrine de GlÃ³ria" da tribo.

## ðŸ“‹ Tarefas
- [ ] Criar o arquivo `src/components/PhotoMural.tsx`.
- [ ] Implementar a lÃ³gica de busca e ordenaÃ§Ã£o por curtidas.
- [ ] Desenvolver a interface de slideshow com `AnimatePresence`.
- [ ] Adicionar o botÃ£o de upload e integraÃ§Ã£o com o storage.
- [ ] Estilizar com o tema Brutalista DinÃ¢mico (Black & Gold).
- [ ] Injetar o componente no `Dashboard.tsx`.

## ðŸš€ Impacto Esperado
- Aumento do engajamento no Mural social.
- ValorizaÃ§Ã£o dos membros que produzem conteÃºdo de alta qualidade.
- Atmosfera mais viva e dinÃ¢mica na pÃ¡gina inicial do app.

