**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸš€ Plano: Landing Page "Arena Digital" (EditÃ¡vel)

Este documento detalha o plano de 10 passos para a criaÃ§Ã£o de uma Landing Page de alta fidelidade, tecnolÃ³gica e totalmente gerenciÃ¡vel via painel administrativo para a Gincana da Tribo.

## ðŸŽ¨ Conceito Visual
- **Estilo**: Brutalismo Premium / Cyber-TeolÃ³gico.
- **Diferencial**: 100% dos textos, imagens e visibilidade de seÃ§Ãµes controlados pelo Supabase.
- **Interatividade**: Framer Motion para entradas dinÃ¢micas e contadores em tempo real.

---

## ðŸ“… Cronograma de ImplementaÃ§Ã£o (10 Passos)

### 1. ExpansÃ£o do Schema (Backend)
- **AÃ§Ã£o**: Adicionar coluna `landing_config` (JSONB) na tabela `config` (key: 'app').
- **Objetivo**: Armazenar a estrutura da landing (hero_title, hero_subtitle, active_sections, video_url, etc).
- **Status**: â³ Pendente

### 2. Admin Landing Editor (GestÃ£o)
- **AÃ§Ã£o**: Criar `src/components/admin/AdminLandingEditor.tsx`.
- **Objetivo**: Interface para o Administrador alterar textos, trocar o ID do vÃ­deo do YouTube e alternar a visibilidade de blocos.
- **Status**: â³ Pendente

### 3. Motor de RenderizaÃ§Ã£o (Landing Engine)
- **AÃ§Ã£o**: Criar `src/pages/LandingPage.tsx`.
- **Objetivo**: Consumir o `useAppTheme` e renderizar as seÃ§Ãµes baseadas no JSON de configuraÃ§Ã£o.
- **Status**: â³ Pendente

### 4. Hero Section "Impacto CibernÃ©tico"
- **AÃ§Ã£o**: Implementar seÃ§Ã£o de entrada com tipografia `font-black` e escala massiva.
- **Detalhe**: Background com gradiente animado usando a cor primÃ¡ria dinÃ¢mica da tribo.
- **Status**: â³ Pendente

### 5. Live Pulse Statistics (Real-time)
- **AÃ§Ã£o**: Componente de contadores animados.
- **Dados**: Busca automÃ¡tica de `count(*)` de membros, grupos e pontos totais para gerar autoridade imediata.
- **Status**: â³ Pendente

### 6. Showcase de MÃ³dulos (Interatividade)
- **AÃ§Ã£o**: Cards hover-effect apresentando Duelo, Ranking e Loja.
- **Objetivo**: Mostrar as funcionalidades do sistema de forma visual e rÃ¡pida.
- **Status**: â³ Pendente

### 7. Social Proof (Feed Integration)
- **AÃ§Ã£o**: Preview dinÃ¢mico do Mural Social.
- **Objetivo**: Mostrar atividades recentes e conquistas para engajar novos visitantes.
- **Status**: â³ Pendente

### 8. Galeria de MÃ­dia Tech
- **AÃ§Ã£o**: Player de vÃ­deo customizado e grid de imagens de alta resoluÃ§Ã£o.
- **Detalhe**: Fallback inteligente para imagens caso nÃ£o haja vÃ­deo configurado.
- **Status**: â³ Pendente

### 9. SEO & Metadados DinÃ¢micos
- **AÃ§Ã£o**: ConfiguraÃ§Ã£o de `react-helmet` ou similar para SEO.
- **Objetivo**: Garantir que o link compartilhado no WhatsApp mostre o tÃ­tulo e brasÃ£o da tribo configurados.
- **Status**: â³ Pendente

### 10. Roteamento de ConversÃ£o (Entry Point)
- **AÃ§Ã£o**: ConfiguraÃ§Ã£o de rotas no `App.tsx`.
- **LÃ³gica**: A Landing Page (`/`) serÃ¡ a porta de entrada principal (antes do login). Redirecionamento automÃ¡tico para o `/dashboard` ocorrerÃ¡ apenas para usuÃ¡rios jÃ¡ autenticados.
- **Status**: â³ Pendente

---

## ðŸ“± Responsividade & Mobile-First
- **Layout Fluido**: Uso de `grid-cols-1 md:grid-cols-2` e `flex-col md:flex-row` em todas as seÃ§Ãµes.
- **Tipografia AdaptÃ¡vel**: Escalonamento dinÃ¢mico de fontes (ex: `text-4xl` em mobile, `text-7xl` em desktop).
- **Toque AmigÃ¡vel**: BotÃµes e CTAs com altura mÃ­nima de 48px e Ã¡reas de clique expandidas para dispositivos mÃ³veis.
- **Performance Mobile**: Lazy loading de imagens e vÃ­deos para garantir carregamento instantÃ¢neo em redes 4G/5G.

---

## ðŸ›¡ï¸ Regras de Design
1. **Tipografia**: Uso de `Inter` para leitura e `Outfit/Black` para tÃ­tulos.
2. **Cor**: A cor de destaque deve vir obrigatoriamente de `--color-primary`.
3. **Feedback**: Todo clique deve ter `scale-95` e todo carregamento deve usar o `LoadingSpinner` padrÃ£o.

## ðŸ”— PrÃ³ximas AÃ§Ãµes
- [ ] Criar migraÃ§Ã£o SQL para o campo `landing_config`.
- [ ] Iniciar prototipagem da Hero Section.

