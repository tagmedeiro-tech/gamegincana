import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe, Maximize2, Minimize2, Zap, Users, Shield, RefreshCw,
  Smartphone, Cpu, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Map, Wifi, WifiOff, Trophy, AlertTriangle, Sparkles, Layers, Pickaxe
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useAudio } from '../context/AudioContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import {
  useMetaverseBridge,
  type GraphicsLevel,
  type WorldLayer,
  type BiblicalCreature,
  WORLD_LAYERS,
  BIBLICAL_ORES,
  PASSIVE_ANIMALS,
  HOSTILE_MONSTERS,
  ALL_CREATURES,
  getLayerByY,
} from '../hooks/useMetaverseBridge';

// ─── Depth HUD ───────────────────────────────────────────────────────────────
function DepthHUD({ y, layer }: { y: number; layer: WorldLayer }) {
  const isSurface = y >= 64;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border backdrop-blur-md pointer-events-none transition-all duration-500`}
      style={{ backgroundColor: `${layer.color}22`, borderColor: `${layer.color}55` }}
    >
      <span className="text-base">{layer.icon}</span>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: layer.color }}>
          {layer.label}
        </p>
        <p className="text-[9px] font-bold text-white">
          {isSurface ? `Y ${y}` : `▼ Y ${y} (${64 - y}m abaixo)`}
        </p>
      </div>
    </div>
  );
}

// ─── Depth Layer Legend ───────────────────────────────────────────────────────
function DepthLegend({ currentY }: { currentY: number }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={14} className="text-primary" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Camadas do Mundo</span>
      </div>
      {[...WORLD_LAYERS].reverse().map(layer => {
        const isActive = currentY >= layer.yMin && currentY <= layer.yMax;
        return (
          <div
            key={layer.biome}
            className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
              isActive ? 'border' : 'opacity-40'
            }`}
            style={isActive ? { backgroundColor: `${layer.color}22`, borderColor: `${layer.color}55` } : {}}
          >
            <span className="text-sm w-5 text-center">{layer.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase truncate" style={{ color: isActive ? layer.color : '#71717a' }}>
                {layer.label}
              </p>
              <p className="text-[8px] text-zinc-600 font-bold">
                Y {layer.yMin === layer.yMax ? layer.yMin : `${layer.yMin}–${layer.yMax}`}
                {layer.xpMultiplier > 1 ? ` · ×${layer.xpMultiplier} XP` : ''}
              </p>
            </div>
            {isActive && (
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: layer.color }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Ore Reward Toast ─────────────────────────────────────────────────────────
function OreToast({ ore, xp, icon }: { ore: string; xp: number; icon: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="flex items-center gap-3 px-4 py-3 bg-zinc-900/90 backdrop-blur-md border border-primary/30 rounded-2xl shadow-xl"
    >
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-white font-black text-xs uppercase">{ore}</p>
        <p className="text-primary text-[10px] font-bold">+{xp} XP de mineração!</p>
      </div>
    </motion.div>
  );
}

// ─── Creature Toasts ─────────────────────────────────────────────────────────
function CreatureToast({ creature, xp, action }: { creature: BiblicalCreature; xp: number; action: string }) {
  const isHostile = creature.kind === 'hostile' || creature.kind === 'boss';
  const color = isHostile ? 'red' : 'emerald';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`flex items-center gap-3 px-4 py-3 bg-zinc-900/90 backdrop-blur-md border border-${color}-500/40 rounded-2xl shadow-xl`}
    >
      <span className="text-2xl">{creature.icon}</span>
      <div>
        <p className={`text-${color}-400 font-black text-[10px] uppercase tracking-widest`}>{action}</p>
        <p className="text-white font-black text-sm uppercase leading-tight">{creature.name}</p>
        {xp > 0 && <p className="text-primary text-[10px] font-bold mt-0.5">+{xp} XP</p>}
      </div>
    </motion.div>
  );
}

function BossAlertOverlay({ boss }: { boss: BiblicalCreature }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute top-20 inset-x-0 flex justify-center pointer-events-none z-50"
    >
      <motion.div
        initial={{ y: -50, scale: 0.5 }} animate={{ y: 0, scale: 1 }}
        className="flex flex-col items-center gap-2 p-6 bg-red-950/80 backdrop-blur-xl border border-red-500/50 rounded-3xl shadow-2xl"
        style={{ boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)' }}
      >
        <span className="text-5xl animate-bounce">{boss.icon}</span>
        <h2 className="text-3xl font-black italic uppercase text-red-500 tracking-tighter text-center">
          O {boss.name} Despertou!
        </h2>
        <p className="text-red-200 text-xs font-bold uppercase tracking-widest text-center max-w-xs">
          "{boss.description}"
        </p>
        <div className="mt-2 px-4 py-1.5 bg-red-500/20 rounded-full border border-red-500/30">
          <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">
            {boss.health} HP • {boss.xpKill} XP de Recompensa
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
const TRIBE_COLORS: Record<string, string> = {
  leoes:  '#FBBF24',
  aguias: '#3B82F6',
  lobos:  '#8B5CF6',
  touros: '#EF4444',
};

const PROTECTED_ZONES = [
  { id: 'spawn-leoes',  x: [0,   20]  as [number,number], z: [0,   20]  as [number,number], owner: 'leoes'  },
  { id: 'spawn-aguias', x: [380, 400] as [number,number], z: [380, 400] as [number,number], owner: 'aguias' },
  { id: 'spawn-lobos',  x: [0,   20]  as [number,number], z: [380, 400] as [number,number], owner: 'lobos'  },
  { id: 'spawn-touros', x: [380, 400] as [number,number], z: [0,   20]  as [number,number], owner: 'touros' },
];

const GRAPHICS_LABELS: Record<GraphicsLevel, string> = {
  potato: '🥔 Mínimo',
  low:    '🔋 Economia',
  medium: '⚡ Balanceado',
  epic:   '🔥 Épico',
};

// ─── Mobile Joystick Overlay ─────────────────────────────────────────────────
function MobileControls({ 
  iframeRef, 
  hasWeapon, 
  onShoot 
}: { 
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  hasWeapon: boolean;
  onShoot: () => void;
}) {
  const send = (key: string, type: 'keydown' | 'keyup') => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'KEY_EVENT', key, event: type }, '*');
  };

  const BtnD = ({ label, icon: Icon, keyCode }: { label: string; icon: React.ElementType; keyCode: string }) => (
    <button
      onPointerDown={() => send(keyCode, 'keydown')}
      onPointerUp={() => send(keyCode, 'keyup')}
      onPointerLeave={() => send(keyCode, 'keyup')}
      className="w-14 h-14 bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white active:bg-primary/30 active:border-primary active:scale-95 transition-all select-none touch-none"
      aria-label={label}
    >
      <Icon size={22} />
    </button>
  );

  return (
    <div className="absolute bottom-24 left-4 z-30 flex flex-col items-center gap-1 lg:hidden">
      <BtnD label="Frente" icon={ChevronUp}    keyCode="w" />
      <div className="flex gap-1">
        <BtnD label="Esquerda" icon={ChevronLeft}  keyCode="a" />
        <BtnD label="Atrás"    icon={ChevronDown}  keyCode="s" />
        <BtnD label="Direita"  icon={ChevronRight} keyCode="d" />
      </div>
      {/* Pulo e Tiro */}
      <div className="mt-2 flex gap-2">
        <button
          onPointerDown={() => send(' ', 'keydown')}
          onPointerUp={() => send(' ', 'keyup')}
          className="px-6 py-3 bg-primary/80 backdrop-blur-md rounded-2xl text-black font-black text-xs uppercase tracking-widest active:scale-95 transition-all select-none touch-none"
        >
          PULAR
        </button>
        {hasWeapon && (
          <button
            onPointerDown={onShoot}
            className="px-6 py-3 bg-red-500/80 backdrop-blur-md rounded-2xl text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all select-none touch-none flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          >
            <span>📖</span> ATIRAR
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Territory Mini-Map ───────────────────────────────────────────────────────
function TerritoryMap({ tribeOwnership }: { tribeOwnership: Record<string, number> }) {
  const tribes = ['leoes', 'aguias', 'lobos', 'touros'];
  const total = tribes.reduce((s, t) => s + (tribeOwnership[t] || 0), 0) || 1;

  return (
    <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Map size={14} className="text-primary" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Domínio do Mapa</span>
      </div>
      {tribes.map(tribe => {
        const pct = Math.round(((tribeOwnership[tribe] || 0) / total) * 100);
        const color = TRIBE_COLORS[tribe] || '#71717A';
        return (
          <div key={tribe}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black uppercase" style={{ color }}>{tribe}</span>
              <span className="text-[9px] font-black text-white">{pct}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VoxelArena() {
  const { user, profile } = useAuth();
  const { playSuccess } = useAudio();

  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [loading, setLoading]             = useState(true);
  const [dailyXp, setDailyXp]            = useState(0);
  const [playerCount, setPlayerCount]     = useState(0);
  const [graphics, setGraphics]           = useState<GraphicsLevel>('medium');
  const [memoryWarn, setMemoryWarn]       = useState(false);
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [showControls, setShowControls]   = useState(false);
  const [newBiome, setNewBiome]           = useState<string | null>(null);
  const [tribeOwnership, setTribeOwnership] = useState<Record<string, number>>({
    leoes: 25, aguias: 25, lobos: 25, touros: 25,
  });
  // ── Profundidade ────────────────────────────────────────────────────────
  const [playerY, setPlayerY]             = useState(64);
  const [currentLayer, setCurrentLayer]   = useState<WorldLayer>(getLayerByY(64));
  const [oreToast, setOreToast]           = useState<{ ore: string; xp: number; icon: string } | null>(null);
  const [newCave, setNewCave]             = useState<string | null>(null);
  // ── Criaturas ───────────────────────────────────────────────────────────
  const [killToast, setKillToast]         = useState<{ creature: BiblicalCreature; xp: number } | null>(null);
  const [bossAlert, setBossAlert]         = useState<BiblicalCreature | null>(null);
  const [tameToast, setTameToast]         = useState<BiblicalCreature | null>(null);
  const [beastiaryTab, setBeastiaryTab]   = useState<'passive' | 'hostile'>('passive');
  // ── Arma (Bíblia de Fogo) ───────────────────────────────────────────────
  const [hasBibleWeapon, setHasBibleWeapon] = useState(false);
  const [weaponToast, setWeaponToast] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoadError(true);
      }
    }, 20000); // 20 segundos de timeout
    return () => clearTimeout(timer);
  }, [loading]);


  const iframeRef   = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const DAILY_LIMIT = 100;

  const GAME_URL = `https://gamegincana--tagmedeiro.replit.app/index.html?joingame=https://gamegincana--tagmedeiro.replit.app`;

  // ── Network status ──────────────────────────────────────────────────────
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Fetch XP diário inicial ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchDailyXp = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('game_logs')
        .select('points_earned')
        .eq('userId', user.id)
        .gte('created_at', today);
      if (data) setDailyXp(data.reduce((s, l) => s + (l.points_earned || 0), 0));
    };
    fetchDailyXp();
  }, [user]);

  // ── Sync user data after GAME_READY ────────────────────────────────────
  const syncUser = useCallback(() => {
    if (!iframeRef.current || !profile) return;
    iframeRef.current.contentWindow?.postMessage({
      type: 'SYNC_USER',
      payload: {
        username:       profile.name,
        tribe:          profile.groupId,
        tribeColor:     TRIBE_COLORS[profile.groupId || ''] || '#71717A',
        avatar:         profile.avatarUrl,
        dailyXp,
        dailyLimit:     DAILY_LIMIT,
        protectedZones: PROTECTED_ZONES,
      },
    }, '*');
    const win = iframeRef.current.contentWindow;
    win?.postMessage({ type: 'SET_WORLD_LAYERS', layers: WORLD_LAYERS }, '*');
    win?.postMessage({ type: 'SET_ORES', ores: BIBLICAL_ORES }, '*');
    win?.postMessage({ type: 'SET_CREATURES', creatures: ALL_CREATURES }, '*');
  }, [profile, dailyXp]);


  // ── Game Bridge ─────────────────────────────────────────────────────────
  useMetaverseBridge({
    userId:   user?.id,
    groupId:  profile?.groupId,
    iframeRef,
    onGameReady: () => {
      setLoading(false);
      syncUser();
    },
    onXpEarned: (amount) => {
      setDailyXp(prev => Math.min(DAILY_LIMIT, prev + amount));
      playSuccess?.();
    },
    onPlayerCount:      (c) => setPlayerCount(c),
    onBiomeDiscovered:  (b) => { setNewBiome(b); setTimeout(() => setNewBiome(null), 4000); },
    onTerritoryCapture: (_, tribe) => {
      setTribeOwnership(prev => ({ ...prev, [tribe]: (prev[tribe] || 0) + 5 }));
    },
    onAltarOffering:    (tribe, amount) => {
      setTribeOwnership(prev => ({ ...prev, [tribe]: (prev[tribe] || 0) + amount }));
    },
    onMemoryWarning:    (pct) => { setMemoryWarn(true); if (pct > 90) setGraphics('low'); },
    // Profundidade
    onPlayerDepth: (y, layer) => { setPlayerY(y); setCurrentLayer(layer); },
    onCaveDiscovered: (y) => {
      setNewCave(`Caverna descoberta a Y ${y}!`);
      setTimeout(() => setNewCave(null), 5000);
    },
    onOreMined: (ore, _y, _amount, xp) => {
      const info = BIBLICAL_ORES.find(o => o.name === ore);
      setOreToast({ ore, xp, icon: info?.icon ?? '⛏️' });
      setTimeout(() => setOreToast(null), 3500);
    },
    // Criaturas
    onEnemyDefeated: (creature, xp) => {
      setKillToast({ creature, xp });
      setTimeout(() => setKillToast(null), 3500);
    },
    onAnimalTamed: (animal) => {
      setTameToast(animal);
      setTimeout(() => setTameToast(null), 4000);
    },
    onBossSpawned: (boss) => {
      setBossAlert(boss);
      setTimeout(() => setBossAlert(null), 10000); // alerta fica 10s
    },
    onBossDefeated: (boss) => {
      setKillToast({ creature: boss, xp: boss.xpKill });
      setTimeout(() => setKillToast(null), 5000);
    },
  });

  // Função para equipar a bíblia (quando o usuário clica no botão secreto)
  const handleEquipBible = () => {
    if (hasBibleWeapon) return;
    setHasBibleWeapon(true);
    setWeaponToast(true);
    setTimeout(() => setWeaponToast(false), 6000);
    // Envia evento para a engine equipar visualmente
    iframeRef.current?.contentWindow?.postMessage({ type: 'EQUIP_WEAPON', weaponId: 'biblia_fogo' }, '*');
    
    // Pequena vibração e som
    if ((window as any).Capacitor) {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Heavy });
      }).catch(() => {});
    }
  };

  // Função disparada pelo botão de atirar
  const handleShootBible = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'SHOOT_WEAPON', weaponId: 'biblia_fogo' }, '*');
    // Vibração rápida para o tiro
    if ((window as any).Capacitor) {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Light });
      }).catch(() => {});
    }
  };


  // ── Graphics change → send to game ─────────────────────────────────────
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'GRAPHICS_UPDATE', level: graphics }, '*');
  }, [graphics]);

  // ── Fullscreen ──────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const xpPct = Math.min(100, (dailyXp / DAILY_LIMIT) * 100);
  const tribeColor = TRIBE_COLORS[profile?.groupId || ''] || '#FBBF24';

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-2 md:px-4">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Globe size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Metaverso — Mundo Aberto</span>
            {/* Online / Offline indicator */}
            <div className={`flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase ${isOnline ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
            Terra <span className="text-primary" style={{ textShadow: `0 0 30px ${tribeColor}88` }}>Santa</span>
          </h1>
          <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px] mt-3">
            Mundo infinito • Constrói • Explora • Conquista para sua tribo
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3 flex-wrap">
          {/* Players online */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl backdrop-blur-md min-w-[90px] text-center">
            <div className="flex items-center justify-center gap-1 text-zinc-500 mb-1">
              <Users size={12} />
              <span className="text-[8px] font-black uppercase">Online</span>
            </div>
            <div className="text-lg font-black italic text-white">{playerCount || '—'}</div>
          </div>

          {/* Daily XP */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl backdrop-blur-md min-w-[120px]">
            <div className="flex items-center gap-1 text-zinc-500 mb-1">
              <Zap size={12} />
              <span className="text-[8px] font-black uppercase">XP Diário</span>
            </div>
            <div className="text-lg font-black italic text-white mb-1">
              {dailyXp}<span className="text-[10px] text-zinc-500">/{DAILY_LIMIT}</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Tribo */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl backdrop-blur-md min-w-[90px] text-center">
            <div className="flex items-center justify-center gap-1 text-zinc-500 mb-1">
              <Shield size={12} />
              <span className="text-[8px] font-black uppercase">Tribo</span>
            </div>
            <div className="text-sm font-black italic uppercase" style={{ color: tribeColor }}>
              {profile?.groupId || '—'}
            </div>
          </div>
        </div>
      </header>

      {/* Graphics selector + APK badge */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 p-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <Cpu size={14} className="text-zinc-500 ml-2" />
          {(['potato', 'low', 'medium', 'epic'] as GraphicsLevel[]).map(lvl => (
            <button
              key={lvl}
              onClick={() => setGraphics(lvl)}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${
                graphics === lvl
                  ? 'bg-primary text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {GRAPHICS_LABELS[lvl]}
            </button>
          ))}
        </div>

        {/* APK native badge */}
        {(window as any).Capacitor && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-[9px] font-black uppercase">
            <Smartphone size={11} />
            Modo Nativo APK Ativo
          </div>
        )}

        {/* Memory warning */}
        <AnimatePresence>
          {memoryWarn && (
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-400 text-[9px] font-black uppercase"
            >
              <AlertTriangle size={11} />
              Memória Alta — Gráficos Reduzidos
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Biome Discovery Toast */}
      <AnimatePresence>
        {newBiome && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl"
          >
            <Sparkles size={20} className="text-amber-400" />
            <div>
              <p className="text-amber-400 font-black text-sm uppercase">Novo Bioma Descoberto!</p>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{newBiome} — Badge de Peregrino desbloqueado</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game + Sidebar layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">

        {/* Game Container */}
        <section className="relative">
          <div
            ref={containerRef}
            className={`relative w-full bg-zinc-950 overflow-hidden transition-all duration-300 ${
              isFullscreen
                ? 'h-screen w-screen fixed inset-0 z-50 rounded-none'
                : 'aspect-video md:aspect-21/9 rounded-4xl border-4 border-zinc-800 shadow-2xl'
            }`}
          >
            {/* Loading Overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-zinc-950 flex flex-col items-center justify-center gap-6 p-6 text-center"
                >
                  {!loadError ? (
                    <>
                      <LoadingSpinner size="xl" />
                      <div className="space-y-2">
                        <p className="text-white font-black italic uppercase text-xl tracking-tighter">Carregando Terra Santa...</p>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                          Gerando chunks procedurais do mundo infinito
                        </p>
                      </div>
                    </>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="space-y-6 max-w-sm"
                    >
                      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/20">
                        <WifiOff size={40} className="text-red-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-white font-black uppercase italic text-xl">Ops! A Arena não respondeu</h3>
                        <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                          Isso geralmente acontece quando o servidor do jogo (Replit) está em repouso.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => window.location.reload()}
                          className="w-full py-3 bg-primary text-black rounded-xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={18} /> Tentar Novamente
                        </button>
                        <a 
                          href="https://replit.com" target="_blank" rel="noreferrer"
                          className="text-[10px] text-zinc-500 font-black uppercase tracking-widest hover:text-white transition-colors"
                        >
                          Verificar Servidor no Replit ↗
                        </a>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Iframe */}
            <iframe
              ref={iframeRef}
              src={GAME_URL}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; accelerometer; gyroscope"
              onLoad={() => setTimeout(() => { setLoading(false); syncUser(); }, 2500)}
              title="Metaverso Terra Santa"
            />

            {/* Mobile joystick */}
            {showControls && (
              <MobileControls 
                iframeRef={iframeRef} 
                hasWeapon={hasBibleWeapon} 
                onShoot={handleShootBible} 
              />
            )}

            {/* Boss Alert */}
            <AnimatePresence>
              {bossAlert && <BossAlertOverlay boss={bossAlert} />}
            </AnimatePresence>

            {/* HUD — top-left: tribo + profundidade */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              <div className="flex items-center gap-2 p-3 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 relative pointer-events-auto">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: tribeColor, boxShadow: `0 0 8px ${tribeColor}` }} />
                <span className="text-[9px] font-black uppercase text-white tracking-widest">{profile?.tribeName || 'Explorador'}</span>
                
                {/* BOTÃO SECRETO PARA A BÍBLIA DE FOGO */}
                <button 
                  onClick={handleEquipBible}
                  className={`absolute -bottom-2 -right-2 w-8 h-8 flex items-center justify-center transition-all duration-700
                    ${hasBibleWeapon ? 'opacity-100 rotate-0 scale-100 bg-red-500/20 rounded-full border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'opacity-0 hover:opacity-100 -rotate-45 scale-75'}`}
                  title="A Espada do Espírito"
                >
                  <span className="text-sm">📖</span>
                </button>
              </div>
              {/* Depth HUD — mostra camada e Y atual */}
              <DepthHUD y={playerY} layer={currentLayer} />
            </div>

            {/* HUD — top-right: gráficos */}
            <div className="absolute top-4 right-20 hidden md:flex items-center gap-1 p-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 pointer-events-none">
              <Cpu size={10} className="text-zinc-400" />
              <span className="text-[8px] font-black uppercase text-zinc-400">{GRAPHICS_LABELS[graphics]}</span>
            </div>

            {/* Ore / Creature reward toast — bottom-left */}
            <div className="absolute bottom-20 left-4 z-30 flex flex-col gap-2">
              <AnimatePresence>
                {weaponToast && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -50 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-4 px-5 py-4 bg-red-950/90 backdrop-blur-md border border-red-500 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                  >
                    <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-bounce">📖</span>
                    <div>
                      <p className="text-red-400 font-black text-[10px] uppercase tracking-widest">Arma Sagrada Descoberta!</p>
                      <p className="text-white font-black text-lg uppercase leading-tight">A Bíblia de Fogo</p>
                      <p className="text-zinc-300 text-[10px] font-bold mt-1">
                        Use o botão <span className="text-red-400">ATIRAR</span> para disparar contra as trevas.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {tameToast && (
                  <CreatureToast creature={tameToast} xp={tameToast.xpKill} action="Domesticado" />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {killToast && (
                  <CreatureToast creature={killToast.creature} xp={killToast.xp} action={killToast.creature.kind === 'boss' ? 'Boss Derrotado' : 'Inimigo Derrotado'} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {oreToast && (
                  <OreToast ore={oreToast.ore} xp={oreToast.xp} icon={oreToast.icon} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {newCave && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-2 px-4 py-3 bg-zinc-900/90 backdrop-blur-md border border-purple-500/40 rounded-2xl shadow-xl"
                  >
                    <span className="text-xl">🦇</span>
                    <div>
                      <p className="text-purple-300 font-black text-xs uppercase">Caverna Descoberta!</p>
                      <p className="text-zinc-400 text-[9px] font-bold">{newCave}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls — bottom-right */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {/* Toggle mobile controls */}
              <button
                onClick={() => setShowControls(v => !v)}
                className={`p-3 backdrop-blur-md rounded-2xl border text-white transition-all lg:hidden ${showControls ? 'bg-primary/30 border-primary' : 'bg-black/60 border-white/10 hover:bg-primary/20'}`}
                title="Controles Mobile"
              >
                <Smartphone size={18} />
              </button>

              {/* Reload */}
              <button
                onClick={() => {
                  if (iframeRef.current) {
                    const src = iframeRef.current.src;
                    iframeRef.current.src = '';
                    iframeRef.current.src = src;
                    setLoading(true);
                  }
                }}
                className="p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-primary/20 transition-all group/r"
                title="Reiniciar"
              >
                <RefreshCw size={18} className="group-hover/r:rotate-180 transition-transform duration-500" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-primary/20 transition-all"
                title="Tela Cheia"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          {/* Keyboard Instructions */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { icon: '⌨️', title: 'Movimentação', desc: 'WASD para andar · ESPAÇO para pular · Mouse para câmera' },
              { icon: '🧱', title: 'Construção',   desc: 'Clique esquerdo mina · Clique direito coloca bloco' },
              { icon: '⚡', title: 'Ganhar XP',    desc: 'Construa na área da tribo · Mine fundo · Explore cavernas' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{icon}</span>
                  <span className="text-[10px] font-black uppercase text-zinc-400">{title}</span>
                </div>
                <p className="text-[9px] text-zinc-500 leading-relaxed font-bold uppercase tracking-wide">{desc}</p>
              </div>
            ))}
          </div>

          {/* Depth bar — visual da profundidade abaixo do jogo (desktop) */}
          <div className="hidden md:flex items-center gap-3 mt-4 p-3 bg-zinc-900/30 rounded-2xl border border-zinc-800">
            <Layers size={14} className="text-zinc-500 shrink-0" />
            <div className="flex-1 flex items-center gap-1 h-3">
              {WORLD_LAYERS.map(layer => {
                const isActive = playerY >= layer.yMin && playerY <= layer.yMax;
                return (
                  <div
                    key={layer.biome}
                    title={`${layer.icon} ${layer.label} (Y ${layer.yMin}–${layer.yMax})`}
                    className="flex-1 h-3 rounded-sm transition-all duration-500"
                    style={{
                      backgroundColor: layer.color,
                      opacity: isActive ? 1 : 0.25,
                      transform: isActive ? 'scaleY(1.5)' : 'scaleY(1)',
                    }}
                  />
                );
              })}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest shrink-0" style={{ color: currentLayer.color }}>
              {currentLayer.icon} Y {playerY}
            </span>
          </div>
        </section>

        {/* Sidebar: Territory + Rewards */}
        <aside className="space-y-4">
          <TerritoryMap tribeOwnership={tribeOwnership} />

          {/* Camadas do Mundo */}
          <DepthLegend currentY={playerY} />

          {/* Minérios Bíblicos */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">⛏️</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Minérios Bíblicos</span>
            </div>
            {BIBLICAL_ORES.map(ore => (
              <div key={ore.name} className="flex items-center gap-2 py-1.5 border-b border-zinc-800/60 last:border-0">
                <span className="text-base w-5 text-center">{ore.icon}</span>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-white uppercase">{ore.name}</p>
                  <p className="text-[8px] text-zinc-600 font-bold">Até Y {ore.yMax} · {ore.rarity}</p>
                </div>
                <span className="text-[9px] font-black text-primary">+{ore.xp} XP</span>
              </div>
            ))}
            <p className="text-[8px] text-zinc-600 pt-1 leading-relaxed">
              Mine em camadas mais fundas para multiplicar o XP ganho.
            </p>
          </div>

          {/* Bestiário (Criaturas) */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col h-80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">📖</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Bestiário</span>
              </div>
              <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl">
                <button
                  onClick={() => setBeastiaryTab('passive')}
                  className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${beastiaryTab === 'passive' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-600 hover:text-white'}`}
                >
                  Pacíficos
                </button>
                <button
                  onClick={() => setBeastiaryTab('hostile')}
                  className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${beastiaryTab === 'hostile' ? 'bg-red-500/20 text-red-400' : 'text-zinc-600 hover:text-white'}`}
                >
                  Hostis
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {(beastiaryTab === 'passive' ? PASSIVE_ANIMALS : HOSTILE_MONSTERS).map(creature => (
                <div key={creature.id} className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/60">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl p-2 bg-black/40 rounded-xl border border-white/5">{creature.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-white uppercase leading-none">{creature.name}</h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${creature.kind === 'boss' ? 'bg-red-500/20 text-red-400' : 'bg-primary/10 text-primary'}`}>
                          {creature.xpKill} XP
                        </span>
                      </div>
                      <p className="text-[8px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">{creature.health} HP • Camada Y: {creature.yMin}–{creature.yMax}</p>
                      <p className="text-[8px] text-zinc-400 mt-2 italic leading-relaxed">"{creature.description}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recompensas do metaverso */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={14} className="text-primary" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Recompensas</span>
            </div>
            {[
              { action: 'Construir Bloco',      xp: '+1 XP',  limit: 'Máx 100/dia' },
              { action: 'Explorar Bioma',       xp: '+20 XP', limit: 'Única vez'   },
              { action: 'Eliminar Rival',       xp: '+5 XP',  limit: 'Ilimitado'   },
              { action: 'Oferta no Altar',      xp: 'Buff Tribo', limit: 'Semanal'  },
              { action: 'Construir Base Tribo', xp: 'Conquista', limit: 'Única vez' },
            ].map(({ action, xp, limit }) => (
              <div key={action} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{action}</span>
                <div className="text-right">
                  <span className="text-[10px] font-black text-primary block">{xp}</span>
                  <span className="text-[8px] text-zinc-600 uppercase">{limit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Progresso XP diário */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">XP Diário do Metaverso</span>
              <span className="text-[10px] font-black text-white">{dailyXp}/{DAILY_LIMIT}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {dailyXp >= DAILY_LIMIT && (
              <p className="text-[9px] text-amber-400 font-black uppercase mt-2 animate-pulse">
                🏆 Limite diário atingido! Volte amanhã.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
