**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# Fase 35: O Metaverso da Tribo (IntegraÃ§Ã£o Voxel) ðŸŒâš”ï¸

## 1. VisÃ£o Geral
Transformar a Gincana da Tribo em uma experiÃªncia de mundo aberto (MMO Voxel) utilizando o **HyperVox**. O jogo funcionarÃ¡ como uma extensÃ£o da Arena, onde as tribos podem construir bases, disputar territÃ³rios e converter aÃ§Ãµes in-game em XP real na plataforma.

---

## 2. Arquitetura de IntegraÃ§Ã£o

### ðŸ›°ï¸ Topologia
- **Host App**: Gincana da Tribo (React/Vite).
- **Guest App**: HyperVox (Engine Voxel).
- **ComunicaÃ§Ã£o**: `Window.postMessage()` para troca de eventos em tempo real.
- **Identidade**: JWT / Profile ID passado via Query Params inicial.

### ðŸ”— O "Game Bridge" (Ponte de Dados)
Implementaremos um serviÃ§o no App para escutar os eventos do Iframe:
- `BLOCK_PLACED` -> +1 XP (Anti-spam habilitado)
- `ENEMY_DEFEATED` -> +10 XP
- `BASE_BUILT` -> Conquista Especial
- `PLAYER_JOIN` -> SincronizaÃ§Ã£o de Skin/Cor da Tribo

---

## 3. Cronograma de ExecuÃ§Ã£o

### ðŸ› ï¸ Passo 1: PreparaÃ§Ã£o do Ambiente
1. Clonar e isolar o repositÃ³rio `HyperVox`.
2. Adaptar o build para rodar de forma independente.
3. Criar o endpoint `/api/game-event` no Supabase (ou via Serverless) para validar pontuaÃ§Ãµes.

### ðŸŽ¨ Passo 2: CustomizaÃ§Ã£o (Skin da Gincana)
- **Texturas**: Substituir blocos padrÃ£o por blocos com as cores das tribos (LeÃµes, Ãguias, etc).
- **Spawn Points**: Definir zonas seguras especÃ­ficas para cada tribo.
- **HUD**: Integrar o logotipo da Gincana dentro da UI do jogo.

### ðŸ”Œ Passo 3: ImplementaÃ§Ã£o da Aba "Arena Voxel"
1. Nova rota no `App.tsx`: `/dashboard/arena-voxel`.
2. Componente `VoxelArena.tsx`:
   - Iframe em tela cheia (Full Screen Toggle).
   - Overlay de carregamento premium.
   - Gerenciamento de estado "AFK" (Away From Keyboard).

### ðŸš€ Passo 4: Infraestrutura Multiplayer
- Deploy do **HyperVox Server** no Railway ou Render (instÃ¢ncia dedicada para manter a persistÃªncia do mundo).
- ConfiguraÃ§Ã£o de WebSockets para baixa latÃªncia.

---

## 4. MecÃ¢nicas de GamificaÃ§Ã£o Integrada

| AÃ§Ã£o In-Game | Recompensa na Gincana | FrequÃªncia |
| :--- | :--- | :--- |
| Construir Bloco | 1 XP | MÃ¡x 50/dia |
| Eliminar Rival | 5 XP | Ilimitado |
| Defender Base | 20 XP | Semanal |
| Explorar Mapa | Badge "Explorador" | Ãšnica |

---

## 5. PrÃ³ximos Passos Imediatos (Checklist)
- [x] Validar a performance do HyperVox em dispositivos mobile e desktop (Fullscreen Native).
- [x] Criar integraÃ§Ã£o de rota isolada `VoxelArena.tsx` com bridge `postMessage`.
- [x] Definir o schema de dados e a seguranÃ§a com Supabase RPC (`process_voxel_xp`).
- [x] Gerar o mapa da Arena Principal (`arena_gincana.json`).
- [x] Implementar PersistÃªncia Local (Load/Auto-Save no Servidor Node.js).
- [x] Deploy em Cloud (Multiplayer Global - Render).
- [x] SincronizaÃ§Ã£o de Mundo em Tempo Real (WebSockets Broadcast otimizado).
- [x] SincronizaÃ§Ã£o de HUD (XP DiÃ¡rio) e Skins de Tribo.
- [x] Ponte de Chat (Real-time Bridge).
- [x] Sistema de Claims (ProteÃ§Ã£o de Spawn).

---

## 6. Backlog TÃ©cnico e Refinamentos
1. **OtimizaÃ§Ã£o de TrÃ¡fego**: Implementar compressÃ£o (Gzip/Brotli) no envio da malha do mundo (JSON) para reduzir o tempo de carregamento inicial.
2. **Sistema de Claims**: Impedir que membros de tribos diferentes destruam blocos em Ã¡reas protegidas (Zonas de Spawn).
3. **HUD do Guerreiro**: [CONCLUÃDO] Exibir XP acumulado no dia diretamente no Iframe (via Bridge).
4. **SincronizaÃ§Ã£o de Skins**: [CONCLUÃDO] Atribuir cores de blocos/skins automaticamente baseadas no `groupId` do perfil sincronizado.


---

> [!IMPORTANT]
> **SEGURANÃ‡A**: Para evitar fraudes (usuÃ¡rios simulando cliques via console), o jogo deve enviar um hash de validaÃ§Ã£o ou os pontos devem ser processados pelo servidor do jogo e enviados via Webhook autenticado para o Supabase.

## 7. Roadmap de ExpansÃ£o (PrÃ³ximas Fases) ðŸš€

### ðŸ›°ï¸ Fase A: Infraestrutura Multiplayer (WebSockets)
1.  **Broadcast de PosiÃ§Ã£o**: [CONCLUÃDO] Implementar o envio de pacotes UDP/WebSocket leves para que jogadores vejam uns aos outros (Ghost Players).
2.  **SincronizaÃ§Ã£o de Blocos**: [CONCLUÃDO] Garantir que, quando um jogador coloca um bloco, ele apareÃ§a instantaneamente para todos os outros conectados.
3.  **Chat In-Game**: [CONCLUÃDO] Ponte entre o Chat da Gincana e o Chat do Metaverso.

### ðŸ° Fase B: Sistema de DominaÃ§Ã£o (Claims)
1.  **Zonas de InfluÃªncia**: [CONCLUÃDO] Dividir o mapa em 4 quadrantes (um para cada tribo) e uma "Zona Neutra" (Arena de Batalha).
2.  **ProteÃ§Ã£o de Spawn**: [CONCLUÃDO] Impedir a destruiÃ§Ã£o de blocos em um raio de 20 metros do ponto de entrada de cada tribo.
3.  **Bandeiras de Conquista**: Adicionar blocos especiais que, se mantidos por 10 minutos, geram bÃ´nus de XP global para a tribo.

### â˜ï¸ Fase C: Deploy e Escalabilidade
1.  **ContainerizaÃ§Ã£o**: [CONCLUÃDO] Criar o `Dockerfile` otimizado para o servidor Node.js/Socket.io.
2.  **Deploy no Render**: [CONCLUÃDO] Configurar a instÃ¢ncia dedicada com RAM suficiente para manter 50+ jogadores simultÃ¢neos.
3.  **ConfiguraÃ§Ã£o de SSL/CORS**: [CONCLUÃDO] Garantir que o Iframe do domÃ­nio da Gincana possa falar com o domÃ­nio do jogo sem bloqueios de seguranÃ§a.

### âš”ï¸ Fase D: Eventos "Live" no Metaverso
1.  **Boss Fight**: Evento agendado onde um monstro gigante aparece na Arena Central; todos os guerreiros devem se unir para derrotÃ¡-lo e ganhar moedas.
2.  **Modo Battle Royale**: Zona de construÃ§Ã£o que diminui com o tempo para treinar a agilidade dos construtores.
3.  **GravaÃ§Ã£o de Replay**: Sistema para que o administrador possa "voar" pelo mapa e tirar fotos das melhores construÃ§Ãµes para postar no Mural.

