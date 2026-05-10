**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# Fase 33: Performance de Ativos & ReaÃ§Ãµes Pro ðŸš€ðŸ”¥

## 1. Performance de Ativos: Mural Skeletons ðŸ–¼ï¸âš¡
### Objetivo
Eliminar o "salto" de layout (Layout Shift) quando imagens grandes sÃ£o carregadas e substituir o loading vazio por placeholders cinemÃ¡ticos.

### AÃ§Ãµes TÃ©cnicas
- **Componente `ImageWithSkeleton`**: Criar um invÃ³lucro para o elemento `<img>` que gerencia o estado `isLoaded`.
- **Placeholder GeomÃ©trico**: Shimmer animado respeitando aspect-ratio.
- **Blur-up Technique**: Cross-fade suave (0.5s) entre o skeleton e a imagem.

---

## 2. Sistema de ReaÃ§Ãµes Pro: Impacto Sagrado ðŸŽ†ðŸ™Œ
### Objetivo
Transformar cliques em reaÃ§Ãµes em experiÃªncias tÃ¡teis e visuais memorÃ¡veis.

### AÃ§Ãµes TÃ©cnicas
- **IntegraÃ§Ã£o `canvas-confetti`**: Disparar partÃ­culas leves.
- **Gatilhos de Emoji**:
    - **ðŸ”¥**: PartÃ­culas laranja/vermelho ascendentes.
    - **ðŸ™Œ**: Confetes dourados em arco.
    - **â¤ï¸**: ExplosÃ£o de coraÃ§Ãµes.
- **Haptic Feedback**: VibraÃ§Ã£o em dispositivos compatÃ­veis.

---

## ðŸ› ï¸ Stack
- `motion/react` + `canvas-confetti`.
- CSS Grid + Aspect Ratio.

