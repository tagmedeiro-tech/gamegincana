/**
 * useMetaverseBridge — Super Game Bridge v2 (APK-aware)
 *
 * Centraliza TODA a comunicação entre o React (Gincana) e a engine Voxel (HyperVox).
 * Funciona em DOIS modos:
 *   - Web: postMessage via iframe
 *   - APK (Capacitor): usa Capacitor plugins para Haptics e Push Notifications nativos
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GraphicsLevel = 'potato' | 'low' | 'medium' | 'epic';

/**
 * Camadas do mundo por altura Y (estilo Minecraft com tema bíblico):
 *
 *  Y 120+  │ Cume de Montanha (Neve / Templo do Monte Sinai)
 *  Y 64-119│ Superfície (Deserto de Judá, Galileia, Jerusalém)
 *  Y 32-63 │ Subsolo Raso (Pedra, Argila — "as fundações da Terra")
 *  Y 16-31 │ Cavernas (Escuridão, Morcegos — "o vale da sombra")
 *  Y 1-15  │ Profundeza (Minérios raros — "tesouros escondidos")
 *  Y 0     │ Bedrock ("Rocha da Eternidade" — indestrutível)
 */
export interface WorldLayer {
  yMin: number;
  yMax: number;
  label: string;        // nome para exibir na UI
  biome: string;        // bioma associado
  color: string;        // cor do indicador
  icon: string;         // emoji temático
  xpMultiplier: number; // multiplicador de XP de mineração nessa camada
}

export const WORLD_LAYERS: WorldLayer[] = [
  { yMin: 0,   yMax: 0,   label: 'Rocha da Eternidade', biome: 'bedrock',   color: '#3f3f46', icon: '🗿', xpMultiplier: 0    },
  { yMin: 1,   yMax: 15,  label: 'Profundeza Sagrada',  biome: 'deep',      color: '#7c3aed', icon: '💎', xpMultiplier: 5    },
  { yMin: 16,  yMax: 31,  label: 'Vale da Sombra',      biome: 'cave',      color: '#4b5563', icon: '🦇', xpMultiplier: 3    },
  { yMin: 32,  yMax: 63,  label: 'Fundações da Terra',  biome: 'subsurface',color: '#92400e', icon: '⛏️', xpMultiplier: 2    },
  { yMin: 64,  yMax: 119, label: 'Superfície',          biome: 'surface',   color: '#16a34a', icon: '🌿', xpMultiplier: 1    },
  { yMin: 120, yMax: 255, label: 'Monte Sinai',         biome: 'mountain',  color: '#e2e8f0', icon: '⛰️', xpMultiplier: 1.5  },
];

/** Retorna a camada correspondente a um Y dado */
export function getLayerByY(y: number): WorldLayer {
  return WORLD_LAYERS.slice().reverse().find(l => y >= l.yMin && y <= l.yMax) ?? WORLD_LAYERS[4];
}

/** Minérios bíblicos por faixa de profundidade */
export const BIBLICAL_ORES: { name: string; yMax: number; xp: number; rarity: string; icon: string }[] = [
  { name: 'Ouro do Templo',    yMax: 15,  xp: 25, rarity: 'Lendário', icon: '🥇' },
  { name: 'Pedra Safira',      yMax: 25,  xp: 15, rarity: 'Épico',    icon: '💠' },
  { name: 'Ferro de Gileade',  yMax: 45,  xp: 8,  rarity: 'Raro',     icon: '⚙️' },
  { name: 'Pedra do Templo',   yMax: 63,  xp: 3,  rarity: 'Comum',    icon: '🧱' },
];

// ─── Criaturas Bíblicas ───────────────────────────────────────────────────────────────────

export type CreatureKind = 'passive' | 'hostile' | 'boss';

export interface BiblicalCreature {
  id: string;
  name: string;           // nome bíblico
  kind: CreatureKind;
  icon: string;
  biome: string;          // bioma de spawn
  yMin: number;           // camada Y mínima de spawn
  yMax: number;           // camada Y máxima de spawn
  xpKill: number;         // XP ao derrotar (hostis) ou ao tamear (passivos)
  loot: string[];         // itens dropados
  health: number;         // vida base
  speed: number;          // velocidade (0.5 = lento, 2 = rápido)
  description: string;    // versículo ou referência
}

/** Animais passivos — podem ser domesticados, não atacam */
export const PASSIVE_ANIMALS: BiblicalCreature[] = [
  {
    id: 'ovelha',
    name: 'Ovelha de Deus',
    kind: 'passive',
    icon: '🐑',
    biome: 'surface',
    yMin: 64, yMax: 119,
    xpKill: 0,
    loot: ['Lã Branca', 'Cordeiro Assado'],
    health: 8,
    speed: 0.6,
    description: 'O Senhor é meu pastor — Sl 23:1',
  },
  {
    id: 'pomba',
    name: 'Pomba do Espírito',
    kind: 'passive',
    icon: '🕊️',
    biome: 'surface',
    yMin: 80, yMax: 255,
    xpKill: 5,
    loot: ['Pena Sagrada'],
    health: 4,
    speed: 1.8,
    description: 'O Espírito desceu como uma pomba — Mt 3:16',
  },
  {
    id: 'camelo',
    name: 'Camelo do Deserto',
    kind: 'passive',
    icon: '🐪',
    biome: 'desert',
    yMin: 64, yMax: 119,
    xpKill: 0,
    loot: ['Pelo de Camelo', 'Leite do Deserto'],
    health: 20,
    speed: 0.8,
    description: 'Mais fácil passar um camelo pelo fundo de uma agulha — Mt 19:24',
  },
  {
    id: 'burro',
    name: 'Jumento Sagrado',
    kind: 'passive',
    icon: '🐴',
    biome: 'surface',
    yMin: 64, yMax: 119,
    xpKill: 0,
    loot: ['Selim de Couro'],
    health: 15,
    speed: 0.7,
    description: 'Montado num jumento entrou em Jerusalém — Zc 9:9',
  },
  {
    id: 'peixe',
    name: 'Peixe do Mar de Galileia',
    kind: 'passive',
    icon: '🐟',
    biome: 'ocean',
    yMin: 40, yMax: 63,
    xpKill: 2,
    loot: ['Peixe Fresco', 'Moeda de Templo'],
    health: 3,
    speed: 1.2,
    description: 'Lançai a rede do lado direito — Jo 21:6',
  },
  {
    id: 'leao_passivo',
    name: 'Leão de Judá (Manso)',
    kind: 'passive',
    icon: '🦁',
    biome: 'savanna',
    yMin: 64, yMax: 119,
    xpKill: 10,
    loot: ['Pele de Leão', 'Dente de Ouro'],
    health: 30,
    speed: 1.4,
    description: 'O Leão da tribo de Judá venceu — Ap 5:5',
  },
];

/** Monstros hostis por camada de profundidade */
export const HOSTILE_MONSTERS: BiblicalCreature[] = [
  // Superfície
  {
    id: 'filho_trevas',
    name: 'Filho das Trevas',
    kind: 'hostile',
    icon: '🧟',
    biome: 'surface',
    yMin: 64, yMax: 119,
    xpKill: 10,
    loot: ['Osso Maldito'],
    health: 20,
    speed: 1.0,
    description: 'Vós sois filhos das trevas — 1 Ts 5:5',
  },
  {
    id: 'aguia_ceus',
    name: 'Águia dos Céus',
    kind: 'hostile',
    icon: '🧙',
    biome: 'mountain',
    yMin: 120, yMax: 255,
    xpKill: 15,
    loot: ['Pena de Arcanjo'],
    health: 18,
    speed: 2.0,
    description: 'Subirão com asas como águias — Is 40:31',
  },
  // Fundações da Terra
  {
    id: 'serpente_eden',
    name: 'Serpente do Éden',
    kind: 'hostile',
    icon: '🐍',
    biome: 'subsurface',
    yMin: 32, yMax: 63,
    xpKill: 20,
    loot: ['Escama Venenosa', 'Maçã Proibida'],
    health: 35,
    speed: 0.9,
    description: 'A serpente era mais astuta que todos os animais — Gn 3:1',
  },
  // Vale da Sombra
  {
    id: 'demonio_caverna',
    name: 'Demônio das Cavernas',
    kind: 'hostile',
    icon: '🦇',
    biome: 'cave',
    yMin: 16, yMax: 31,
    xpKill: 30,
    loot: ['Cristal das Trevas', 'Corrente Quebrada'],
    health: 50,
    speed: 1.5,
    description: 'Ainda que eu andasse pelo vale da sombra — Sl 23:4',
  },
  // Profundeza Sagrada
  {
    id: 'anjo_queda',
    name: 'Anjo da Queda',
    kind: 'hostile',
    icon: '👿',
    biome: 'deep',
    yMin: 1, yMax: 15,
    xpKill: 45,
    loot: ['Asa Negra', 'Fragmento de Luz'],
    health: 80,
    speed: 1.3,
    description: 'Vi Satanás cair do céu como relâmpago — Lc 10:18',
  },
  // Boss
  {
    id: 'leviata',
    name: 'Leviatã',
    kind: 'boss',
    icon: '🐉',
    biome: 'deep',
    yMin: 1, yMax: 10,
    xpKill: 150,
    loot: ['Escama de Leviatã', 'Coração das Profundezas', 'Ouro do Templo'],
    health: 500,
    speed: 0.7,
    description: 'Podes pescar o Leviatã com um anzol? — Jó 41:1',
  },
];

export const ALL_CREATURES = [...PASSIVE_ANIMALS, ...HOSTILE_MONSTERS];

export interface UserPayload {
  username: string;
  tribe: string;
  tribeColor: string;
  avatar?: string;
  dailyXp: number;
  dailyLimit: number;
  protectedZones: ProtectedZone[];
}

export interface ProtectedZone {
  id: string;
  x: [number, number];
  z: [number, number];
  owner: string;
}

// Eventos que o JOGO envia para o React
export type GameEvent =
  | { type: 'GAME_READY' }
  | { type: 'XP_EARNED'; amount: number; event: string }
  | { type: 'CHUNK_LOADED'; memoryUsage: number }
  | { type: 'TRIGGER_VIBRATION'; intensity: 'light' | 'medium' | 'heavy' }
  | { type: 'ALTAR_OFFERING'; tribe: string; amount: number }
  | { type: 'TERRITORY_CAPTURED'; chunkId: string; tribe: string }
  | { type: 'PLAYER_COUNT'; count: number }
  | { type: 'BIOME_DISCOVERED'; biome: string; chunkId: string }
  | { type: 'BASE_BUILT'; tribe: string; location: { x: number; z: number } }
  | { type: 'CHAT_SENT'; text: string }
  // ── Profundidade Subterrânea ──────────────────────────────────────────────
  | { type: 'PLAYER_DEPTH'; y: number }
  | { type: 'CAVE_DISCOVERED'; y: number; caveId: string }
  | { type: 'ORE_MINED'; ore: string; y: number; amount: number }
  // ── Criaturas Bíblicas ────────────────────────────────────────────────────
  | { type: 'ENEMY_DEFEATED'; monsterId: string; y: number }     // monstro derrotado
  | { type: 'ANIMAL_TAMED'; animalId: string }                   // animal domesticado
  | { type: 'ANIMAL_BRED'; animalId: string; offspring: number } // animais reproduzidos
  | { type: 'BOSS_SPAWNED'; bossId: string; x: number; z: number }// boss apareceu no mapa
  | { type: 'BOSS_DEFEATED'; bossId: string; killers: string[] };// boss derrotado (coletivo)

// Eventos que o REACT envia para o jogo
export type ReactEvent =
  | { type: 'SYNC_USER'; payload: UserPayload }
  | { type: 'GRAPHICS_UPDATE'; level: GraphicsLevel }
  | { type: 'MISSION_COMPLETE'; reward: number }
  | { type: 'TRIBE_BUFF_ACTIVE'; buff: 'speed' | 'xp_bonus' | 'defense' }
  | { type: 'CHAT_MESSAGE'; payload: { sender: string; text: string; tribe: string } }
  // ── Configuração de Mundo (enviado uma vez ao GAME_READY) ─────────────────
  | { type: 'SET_WORLD_LAYERS'; layers: WorldLayer[] }
  | { type: 'SET_ORES'; ores: typeof BIBLICAL_ORES }
  | { type: 'SET_CREATURES'; creatures: BiblicalCreature[] }
  // ── Sistema de Armas (Bíblia de Fogo) ──────────────────────────────────────
  | { type: 'EQUIP_WEAPON'; weaponId: string }
  | { type: 'SHOOT_WEAPON'; weaponId: string };

interface BridgeOptions {
  userId?: string;
  groupId?: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onGameReady?: () => void;
  onXpEarned?: (amount: number, event: string) => void;
  onPlayerCount?: (count: number) => void;
  onBiomeDiscovered?: (biome: string) => void;
  onTerritoryCapture?: (chunkId: string, tribe: string) => void;
  onAltarOffering?: (tribe: string, amount: number) => void;
  onMemoryWarning?: (usage: number) => void;
  // Subterrâneo
  onPlayerDepth?: (y: number, layer: WorldLayer) => void;
  onCaveDiscovered?: (y: number, caveId: string) => void;
  onOreMined?: (ore: string, y: number, amount: number, xp: number) => void;
  // Criaturas
  onEnemyDefeated?: (creature: BiblicalCreature, xp: number) => void;
  onAnimalTamed?: (animal: BiblicalCreature) => void;
  onBossSpawned?: (boss: BiblicalCreature, x: number, z: number) => void;
  onBossDefeated?: (boss: BiblicalCreature) => void;
}

// ─── Capacitor Detection ─────────────────────────────────────────────────────

function isCapacitor(): boolean {
  return typeof (window as any).Capacitor !== 'undefined';
}

async function triggerHaptics(intensity: 'light' | 'medium' | 'heavy') {
  if (!isCapacitor()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[intensity] });
  } catch {
    // Capacitor não disponível ou permissão negada — silencia
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 100;

export function useMetaverseBridge({
  userId,
  groupId,
  iframeRef,
  onGameReady,
  onXpEarned,
  onPlayerCount,
  onBiomeDiscovered,
  onTerritoryCapture,
  onAltarOffering,
  onMemoryWarning,
  onPlayerDepth,
  onCaveDiscovered,
  onOreMined,
  onEnemyDefeated,
  onAnimalTamed,
  onBossSpawned,
  onBossDefeated,
}: BridgeOptions) {
  const dailyXpRef = useRef(0);

  // ── Enviar evento para o jogo ────────────────────────────────────────────
  const sendToGame = useCallback((event: ReactEvent) => {
    iframeRef.current?.contentWindow?.postMessage(event, '*');
  }, [iframeRef]);

  // ── Escutar eventos do jogo ──────────────────────────────────────────────
  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const data = e.data as GameEvent;
      if (!data?.type) return;

      switch (data.type) {
        case 'GAME_READY':
          onGameReady?.();
          break;

        case 'PLAYER_COUNT':
          onPlayerCount?.(data.count);
          break;

        case 'BIOME_DISCOVERED':
          onBiomeDiscovered?.(data.biome);
          break;

        case 'TERRITORY_CAPTURED':
          onTerritoryCapture?.(data.chunkId, data.tribe);
          break;

        case 'ALTAR_OFFERING':
          onAltarOffering?.(data.tribe, data.amount);
          break;

        case 'TRIGGER_VIBRATION':
          await triggerHaptics(data.intensity);
          break;

        case 'CHUNK_LOADED':
          if (data.memoryUsage > 80) {
            onMemoryWarning?.(data.memoryUsage);
          }
          break;

        // ── Profundidade ────────────────────────────────────────────────────
        case 'PLAYER_DEPTH': {
          const layer = getLayerByY(data.y);
          onPlayerDepth?.(data.y, layer);
          // Vibração ao entrar em zona profunda (immersão)
          if (data.y <= 31) await triggerHaptics('medium');
          break;
        }

        case 'CAVE_DISCOVERED': {
          onCaveDiscovered?.(data.y, data.caveId);
          await triggerHaptics('heavy'); // descoberta de caverna = vibração forte
          break;
        }

        case 'ORE_MINED': {
          if (!userId) break;
          const oreInfo = BIBLICAL_ORES.find(o => o.name === data.ore);
          const layer   = getLayerByY(data.y);
          // XP = base do minério × multiplicador da camada
          const xpGrant = Math.round((oreInfo?.xp ?? 3) * layer.xpMultiplier * (data.amount || 1));

          if (dailyXpRef.current < DAILY_LIMIT && xpGrant > 0) {
            const { data: res } = await supabase.rpc('process_voxel_xp', {
              p_user_id:   userId,
              p_event_type: 'ORE_MINED',
              p_points:    xpGrant,
              p_metadata:  { ore: data.ore, y: data.y, depth_layer: layer.biome, source: 'HyperVox_V2' },
            });
            if (res?.success) {
              dailyXpRef.current = Math.min(DAILY_LIMIT, dailyXpRef.current + xpGrant);
              onOreMined?.(data.ore, data.y, data.amount, xpGrant);
              onXpEarned?.(xpGrant, 'ORE_MINED');
            }
          }
          await triggerHaptics('light');
          break;
        }

        case 'XP_EARNED': {
          if (!userId) break;
          const amount = data.amount || 1;
          const eventType = data.event || 'BLOCK_PLACED';

          if (dailyXpRef.current >= DAILY_LIMIT) break;

          const { data: res, error } = await supabase.rpc('process_voxel_xp', {
            p_user_id: userId,
            p_event_type: eventType,
            p_points: amount,
            p_metadata: { source: 'HyperVox_V2_APK', groupId },
          });

          if (!error && res?.success) {
            dailyXpRef.current = Math.min(DAILY_LIMIT, dailyXpRef.current + amount);
            onXpEarned?.(amount, eventType);
            await triggerHaptics('light');
          }
          break;
        }

        // ── Criaturas Bíblicas ────────────────────────────────────────────────────
        case 'ENEMY_DEFEATED': {
          // 🐛 BUG FIX: Este evento existia no plano mas nunca foi implementado
          if (!userId) break;
          const creature = ALL_CREATURES.find(c => c.id === data.monsterId);
          if (!creature || creature.kind === 'passive') break;

          const layer = getLayerByY(data.y);
          // XP = base da criatura × multiplicador da camada (mais fundo = mais XP)
          const xpGrant = Math.round(creature.xpKill * Math.max(1, layer.xpMultiplier * 0.8));

          if (dailyXpRef.current < DAILY_LIMIT && xpGrant > 0) {
            const { data: res } = await supabase.rpc('process_voxel_xp', {
              p_user_id:   userId,
              p_event_type: creature.kind === 'boss' ? 'BOSS_KILLED' : 'ENEMY_DEFEATED',
              p_points:    xpGrant,
              p_metadata:  {
                monster: creature.name,
                y: data.y,
                depth_layer: layer.biome,
                source: 'HyperVox_V2',
              },
            });
            if (res?.success) {
              dailyXpRef.current = Math.min(DAILY_LIMIT, dailyXpRef.current + xpGrant);
              onEnemyDefeated?.(creature, xpGrant);
              onXpEarned?.(xpGrant, 'ENEMY_DEFEATED');
            }
          }
          // Boss = vibração forte, normal = média
          await triggerHaptics(creature.kind === 'boss' ? 'heavy' : 'medium');
          break;
        }

        case 'ANIMAL_TAMED': {
          const animal = PASSIVE_ANIMALS.find(a => a.id === data.animalId);
          if (!animal) break;
          onAnimalTamed?.(animal);
          // Ganhar XP ao domesticar (sem limite de kills)
          if (userId && animal.xpKill > 0 && dailyXpRef.current < DAILY_LIMIT) {
            await supabase.rpc('process_voxel_xp', {
              p_user_id: userId,
              p_event_type: 'ANIMAL_TAMED',
              p_points: animal.xpKill,
              p_metadata: { animal: animal.name, source: 'HyperVox_V2' },
            });
          }
          await triggerHaptics('light');
          break;
        }

        case 'BOSS_SPAWNED': {
          const boss = ALL_CREATURES.find(c => c.id === data.bossId);
          if (boss) onBossSpawned?.(boss, data.x, data.z);
          await triggerHaptics('heavy'); // alerta máximo no celular!
          break;
        }

        case 'BOSS_DEFEATED': {
          const boss = ALL_CREATURES.find(c => c.id === data.bossId);
          if (boss) onBossDefeated?.(boss);
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [userId, groupId, onGameReady, onXpEarned, onPlayerCount, onBiomeDiscovered, onTerritoryCapture, onAltarOffering, onMemoryWarning]);

  // ── Sincronizar chat Supabase → Jogo ─────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`voxel-chat-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.groupId === null || msg.groupId === groupId) {
          sendToGame({
            type: 'CHAT_MESSAGE',
            payload: { sender: msg.senderName, text: msg.text, tribe: msg.groupId || 'Global' },
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, groupId, sendToGame]);

  return { sendToGame, dailyXpRef, DAILY_LIMIT };
}
