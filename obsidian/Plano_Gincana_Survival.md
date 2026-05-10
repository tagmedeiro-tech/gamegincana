**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸ† Plano de ExpansÃ£o: Gincana Survival (Mega Map)

Este documento define a transiÃ§Ã£o do Metaverso de uma Arena EstÃ¡tica para um Mundo Aberto de SobrevivÃªncia com 14+ jogadores simultÃ¢neos.

## âœ… CONQUISTAS DA FASE 1 (ConcluÃ­do)
- **Geografia e Biomas**: Motor refatorado para suportar mundos de 512x512 blocos com 4 biomas distintos (Tundra, Deserto, Floresta, VulcÃ¢nico).
- **Loot e Picareta**: Implementado sistema de inventÃ¡rio. Os jogadores agora nascem com uma "Picareta de Bronze" e coletam os blocos destruÃ­dos.
- **IA de Monstros**: Classe `BrainMonster` criada com Pathfinding bÃ¡sico de perseguiÃ§Ã£o (busca o alvo mais prÃ³ximo). SincronizaÃ§Ã£o via rede rodando liso.
- **Estabilidade de Carga**: Removida a dependÃªncia da arena legada. O mundo agora gera de forma limpa e assÃ­ncrona, nÃ£o travando mais o navegador dos usuÃ¡rios.

---

## âœ… FASE 2: SURVIVAL & COMPETIÃ‡ÃƒO (ConcluÃ­do)
- [x] **Combate Funcional**: Monstros dÃ£o dano e podem ser derrotados com a picareta.
- [x] **Zonas Seguras**: Bases das tribos protegidas nos 4 cantos do mapa (margem de 48 blocos).
- [x] **Ciclo Dia/Noite**: IluminaÃ§Ã£o dinÃ¢mica sincronizada com o servidor (ciclo de ~10 min).
- [x] **Leaderboard HUD**: Ranking de XP (Score) em tempo real exibido no HUD dos jogadores.
- [x] **Hordas Noturnas**: Spawn de monstros mais intenso e agressivo durante a noite.

---

## ðŸš€ FASE 3: ECONOMIA E EXPANSÃƒO (PrÃ³ximos Passos)
- [ ] **Lojas de Base**: Troca de blocos coletados por equipamentos melhores ou cura.
- [ ] **Eventos Globais**: Bosses que aparecem no centro do mapa a cada 30 min para disputa coletiva.
- [ ] **Sistema de ClÃ£s**: Chat privado e cores especÃ­ficas para cada uma das 4 casas/tribos.
- [ ] **Upgrade de Picareta**: EvoluÃ§Ã£o de Bronze para Ferro e Ouro usando recursos raros encontrados nos biomas.

---
*Assinado: Antigravity AI - Arquiteto de Mundos*
*Notas de Deploy: O mundo agora gera 512x512 dinamicamente e salva em survival_world.json. O arquivo arena_gincana.json foi descontinuado.*

