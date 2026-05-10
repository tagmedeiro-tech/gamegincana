# Plano: Mundo Aberto Cristão Infinito — "Terra Santa" 🏔️⚔️ (Otimizado para APK Mobile)

## 1. Diagnóstico: O que já existe

### Jogos Cristãos Comerciais (Não Integráveis)
Não existe nenhum jogo cristão de mundo aberto gratuito, open-source ou com API pública. Os projetos existentes são todos fechados.

### O que Temos HOJE na Gincana da Tribo
- ✅ **HyperVox Arena** (`VoxelArena.tsx`) — Mundo voxel tipo Minecraft rodando no app.
- ✅ **Game Bridge** — Protocolo de comunicação `postMessage` sincronizando XP, usuário e chat.
- ✅ **APK Instalável da Gincana** — Empacotamento nativo da plataforma já criado, pronto para escalar a performance.
- ✅ **Sistema de Tribos** — Zonas protegidas (Claims) por tribo no mapa.

### Conclusão
**A plataforma baseada em APK é o nosso trunfo**. A arquitetura nativa nos permite ignorar as restrições de navegadores web padrão e entregar um **mundo infinito e colossal de Minecraft** fluido no celular.

---

## 2. A Visão Ampliada: "Terra Santa Infinita" no Celular

Transformar a arena Voxel atual em um **mundo bíblico medieval procedural gigante**, rodando nativamente no APK instalado:
- O mapa será **infinito**, gerado através de blocos matemáticos (Chunks procedural generation).
- **Escala Continental**: Deserto do Sinai enorme para travessia em grupo, mares e grandes cadeias de montanhas.
- As tribos podem **construir megacidades e reinos** sem limites de área (apenas limites de blocos obtidos/minerados).
- **Recursos Nativos (APK)**: Integração com sensores do smartphone (vibração ao quebrar bloco, notificações push ao receber invasão).

---

## 3. Arquitetura Tecnológica e o Super APK

O foco absoluto será empoderar o APK Android/iOS já criado:

### 🚀 Maximização do APK WebView Voxel
1. **Ponte Nativa Melhorada**: Evoluir o `postMessage` para usar plugins do Capacitor, permitindo troca de mensagens instantânea e multithreading entre o app React e o Game Engine.
2. **Offloading de Memória**: O APK instalará localmente os "Assets" (texturas e sons do Voxel), liberando uso de internet de dados móveis apenas para a sincronização multiplayer (coordenadas).
3. **Gestão de Bateria**: Opções de performance no app React (Gráficos: Baixo/Médio/Épico) enviadas para o Voxel definir limites de carregamento de Chunks.

### 🛠️ Geração Procedural e Server-Side
- Mudar a engine para carregar mapa "sob demanda".
- Servidor mantendo os Chunks salvos num banco de dados eficiente. Quando um membro de tribo constrói um altar, essa edição do Chunk é gravada e sincronizada aos outros jogadores próximos.

---

## 4. Integração com a Gincana (Super Game Bridge)

Atualizar a comunicação para explorar todo o sistema do APK:

```typescript
// Eventos que o jogo (Iframe/WebView) envia para o React Nativo
type GameEvent =
  | { type: 'XP_EARNED'; amount: number; event: string }
  | { type: 'CHUNK_LOADED'; memoryUsage: number }                // NOVO - Monitoramento de uso do celular
  | { type: 'TRIGGER_VIBRATION'; intensity: 'low' | 'high' }     // NOVO - React avisa o Capacitor pra vibrar
  | { type: 'ALTAR_OFFERING'; tribe: string; amount: number }
  | { type: 'TERRITORY_CAPTURED'; chunkId: string; tribe: string } 

// Eventos que o React envia para o jogo
type ReactEvent =
  | { type: 'SYNC_USER'; payload: UserPayload }
  | { type: 'GRAPHICS_UPDATE'; level: 'low' | 'epic' }           // NOVO - APK controla a engine gráfica
  | { type: 'MISSION_COMPLETE'; reward: number }
```

---

## 5. Roteiro de Implementação Escalonável

### Fase 1 — Otimização Mobile e APK (Imediato)
- [ ] Incorporar as texturas e sons do Voxel diretamente na pasta `/public` do projeto Vite que gera o APK, evitando download via rede.
- [ ] Ativar as opções avançadas de WebGL no build do Capacitor.
- [ ] Implementar overlay de controle mobile de alta resposta (joystick nativo UI).

### Fase 2 — Mundo Infinito e Geração Procedural (1 mês)
- [ ] Modificar o servidor Node.js para suportar paginação infinita (Chunks de 32x32x32 blocos).
- [ ] Criar biomas proceduralmente baseados em ruído de Perlin (Perlin Noise).
- [ ] Configurar os marcadores dos Templos e NPCs no mapa central.

### Fase 3 — Guerras de Tribo (Megaconstruções)
- [ ] Permitir declaração de áreas gigantes no mapa como posse de uma tribo.
- [ ] Bônus passivos de XP em todo o aplicativo baseados no tamanho do império da tribo no metaverso.
- [ ] Eventos ao vivo: Alertas Push (nativos via APK) avisando de aparição de Boss ou Evento Especial no servidor.

---

## 6. Recomendação e Vantagem Competitiva

Com o APK instalado, a Gincana da Tribo deixa de ser apenas um web-app de competição para se tornar **um jogo completo**. Os jovens passarão horas dentro do app explorando o mundo, engajando intensamente. Focar na estabilização da versão mobile é a melhor prioridade atual para colher resultados incríveis.

---

## Fase 42.1 � Sistema de Profundidade Subterr\u00e2nea (09/05/2026)

### Camadas do Mundo (Y Axis)

| Camada | Y | Bioma | XP Multiplicador |
|---|---|---|---|
| \u26f0\ufe0f Monte Sinai | 120-255 | mountain | \u00d71.5x |
| \ud83c\udf3f Superf\u00edcie | 64-119 | surface | \u00d71 |
| \u26cf\ufe0f Funda\u00e7\u00f5es da Terra | 32-63 | subsurface | \u00d72 |
| \ud83e\udd87 Vale da Sombra | 16-31 | cave | \u00d73 |
| \ud83d\udc8e Profundeza Sagrada | 1-15 | deep | \u00d75 |
| \ud83d\uddff Rocha da Eternidade | 0 | bedrock | \u00d70 (indestrut�vel) |

### Min\u00e9rios B\u00edblicos

| Min\u00e9rio | At\u00e9 Y | XP Base | Raridade |
|---|---|---|---|
| \ud83e\udd47 Ouro do Templo | 15 | 25 XP | Lend\u00e1rio |
| \ud83d\udca0 Pedra Safira | 25 | 15 XP | \u00c9pico |
| \u2699\ufe0f Ferro de Gileade | 45 | 8 XP | Raro |
| \ud83e\uddf1 Pedra do Templo | 63 | 3 XP | Comum |

### Implementado

- **DepthHUD** (HUD no jogo): mostra layer atual + Y + metros abaixo da superf\u00edcie
- **DepthLegend** (sidebar): mapa visual de todas as camadas com indicador ativo
- **Depth Bar** (abaixo do jogo): barra colorida mostrando em qual camada est\u00e1
- **OreToast**: notifica\u00e7\u00e3o flutuante ao minerar (nome + XP ganho)
- **CaveToast**: alerta ao descobrir nova caverna (vibra\u00e7\u00e3o heavy no APK)
- **XP Multiplicador**: min\u00e9rios em camadas mais profundas valem at\u00e9 5x mais XP
- **SET_WORLD_LAYERS / SET_ORES**: engine do jogo recebe as camadas e min\u00e9rios via Bridge

---

## Fase 42.2 � Criaturas B\u00edblicas \u0026 Besti\u00e1rio (09/05/2026)

| Funcionalidade | Status |
|---|---|
| Cat\u00e1logo de Animais Pac\u00edficos (Ovelha, Pomba, Camelo...) | ? |
| Cat\u00e1logo de Monstros por Camada (Filho das Trevas at\u00e9 Leviat\u00e3) | ? |
| Corre\u00e7\u00e3o Bug ENEMY_DEFEATED no Bridge | ? |
| Multiplicador de XP por Profundidade | ? |
| Eventos de Domestica\u00e7\u00e3o (ANIMAL_TAMED) | ? |
| Boss Alert Overlay | ? |
| UI Besti\u00e1rio na Sidebar (Abas Hostis/Pac\u00edficos) | ? |
| Envio SET_CREATURES para a Engine Voxel | ? |
