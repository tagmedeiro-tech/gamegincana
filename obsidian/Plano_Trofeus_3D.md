**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ† Plano de EvoluÃ§Ã£o: Sala de TrofÃ©us 3D Premium

Este documento detalha a implementaÃ§Ã£o da vitrine de trofÃ©us tridimensionais para a Gincana da Tribo.

## ðŸŽ¯ Objetivo
Transformar a visualizaÃ§Ã£o estÃ¡tica de conquistas em uma experiÃªncia imersiva de "Sala de TrofÃ©us", onde cada item possui profundidade, movimento e iluminaÃ§Ã£o dinÃ¢mica.

---

## ðŸ› ï¸ EspecificaÃ§Ãµes TÃ©cnicas

### 1. Componente `Trophy3D`
- **Container**: Div com `perspective: 1200px` para profundidade.
- **AnimaÃ§Ã£o Base**:
    - **Eixo Y (FlutuaÃ§Ã£o)**: `[-5px, 5px, -5px]` com transiÃ§Ã£o `Infinity`.
    - **Eixo Y (RotaÃ§Ã£o)**: RotaÃ§Ã£o lenta de `360deg` para visualizaÃ§Ã£o total.
- **Efeitos de IluminaÃ§Ã£o**:
    - **Shine Effect**: Gradiente de luz (sweep) que corre sobre o Ã­cone a cada 3 segundos.
    - **Glow Aura**: Brilho externo baseado na raridade (LendÃ¡rio = Ouro, Ã‰pico = Roxo, Raro = Azul).

### 2. Design da Vitrine (Showcase)
- **Layout**: SubstituiÃ§Ã£o da lista vertical por um **Showcase Grid**.
- **Pedestais**: Cards com efeito `glassmorphism` (fundo semi-transparente e blur).
- **Interatividade**: Ao passar o mouse (hover), a rotaÃ§Ã£o acelera levemente e o Ã­cone cresce.

---

## ðŸ“… Fases de ImplementaÃ§Ã£o

- [ ] **Fase 1**: CriaÃ§Ã£o do componente isolado `Trophy3D`.
- [ ] **Fase 2**: RefatoraÃ§Ã£o do `AchievementList` para o novo layout de vitrine.
- [ ] **Fase 3**: ImplementaÃ§Ã£o de sombras projetadas (Floor Shadows) dinÃ¢micas.
- [ ] **Fase 4**: IntegraÃ§Ã£o com a tela de celebraÃ§Ã£o para consistÃªncia visual.

---

## ðŸŽ¨ Paleta de Raridades 3D
- **LendÃ¡rio**: `#F59E0B` (Amber) + `Drop Shadow Gold`.
- **Ã‰pico**: `#A855F7` (Purple) + `Drop Shadow Purple`.
- **Raro**: `#3B82F6` (Blue) + `Drop Shadow Blue`.
- **Comum**: `#94A3B8` (Slate) + `Simple Glass`.

