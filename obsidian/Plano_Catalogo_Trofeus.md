**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ›ï¸ Plano: CatÃ¡logo Completo de TrofÃ©us (Vitrine de Progresso)

Este plano detalha a transformaÃ§Ã£o da Sala de TrofÃ©us em um catÃ¡logo aspiracional de conquistas.

## ðŸŽ¯ Objetivo
Estimular o engajamento dos membros atravÃ©s da visualizaÃ§Ã£o de trofÃ©us "bloqueados", criando um senso de coleÃ§Ã£o e progresso.

---

## ðŸ› ï¸ EspecificaÃ§Ãµes de UI/UX

### 1. Estados Visuais
- **DESBLOQUEADO (Ganho)**:
    - Cor neon plena e vibrante.
    - Efeito de brilho (glow) e partÃ­culas ativos.
    - AnimaÃ§Ã£o de flutuaÃ§Ã£o 3D completa.
    - Exibe data de conquista e XP recebido.

- **BLOQUEADO (Pendente)**:
    - Filtro `grayscale(100%)` no trofÃ©u.
    - Opacidade reduzida (ex: `opacity-40`).
    - Sem animaÃ§Ãµes de flutuaÃ§Ã£o ou brilho intenso.
    - Overlay sutil com Ã­cone de cadeado (`Lock`).

### 2. Interatividade de ExploraÃ§Ã£o
- Ao clicar em um trofÃ©u **bloqueado**, a interface deve exibir as instruÃ§Ãµes de conquista (ex: "Realize 10 leituras bÃ­blicas para desbloquear").
- Incentivo visual para o usuÃ¡rio realizar a aÃ§Ã£o (call-to-action).

---

## ðŸ“… Roteiro de ImplementaÃ§Ã£o

- [ ] **LÃ³gica de UnificaÃ§Ã£o**: Alterar `AchievementList.tsx` para fazer o "outer join" entre as definiÃ§Ãµes globais e as conquistas do usuÃ¡rio.
- [ ] **Componente de Card**: Implementar os estados `isLocked` no card de trofÃ©u.
- [ ] **Feedback Educativo**: Adicionar o texto explicativo "Como conquistar" nos itens bloqueados.
- [ ] **Filtros de Visibilidade**: (Opcional) Adicionar filtro para mostrar "Todos", "Conquistados" ou "Pendentes".

