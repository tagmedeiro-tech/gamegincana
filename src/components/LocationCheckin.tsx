import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import { getCurrentLocation, hapticVictory, hapticLight } from '../lib/nativeCapabilities';
import { supabase } from '../lib/supabase';

// ─── Fórmulas de Geodesia ─────────────────────────────────────────────────────
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

export default function LocationCheckin() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const { success, error: toastError, info } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);

  const config = theme.checkinLocation;

  useEffect(() => {
    if (config?.enabled && profile) {
      checkTodayCheckin();
    }
  }, [config?.enabled, profile?.id]);

  const checkTodayCheckin = async () => {
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('userId', profile.id)
      .eq('type', 'location_checkin')
      .gte('created_at', `${today}T00:00:00`)
      .maybeSingle();
    
    if (data) setAlreadyDone(true);
  };

  const handleCheckin = async () => {
    if (!config || !profile || alreadyDone) return;
    
    setChecking(true);
    hapticLight();

    try {
      // 1. Obter localização real
      const loc = await getCurrentLocation();
      if (!loc) {
        toastError("GPS Indisponível", "Ative o GPS do seu celular para fazer o check-in.");
        return;
      }

      // 2. Calcular distância
      const d = calculateDistance(loc.latitude, loc.longitude, config.latitude, config.longitude);
      setDistance(d);

      // 3. Validar raio
      if (d > config.radius) {
        toastError("Fora do Alcance", `Você está a ${Math.round(d)}m da ${config.label}. Aproxime-se mais!`);
        return;
      }

      // 4. Registrar no Supabase
      const { error } = await supabase.from('activity_logs').insert({
        userId: profile.id,
        groupId: profile.groupId,
        points: config.points,
        type: 'location_checkin',
        description: `Check-in Presencial: ${config.label}`,
        metadata: { distance: d, lat: loc.latitude, lon: loc.longitude }
      });

      if (error) throw error;

      setAlreadyDone(true);
      hapticVictory();
      success("Check-in Realizado!", `Você ganhou ${config.points} pontos por estar presente.`);

    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível validar sua localização.");
    } finally {
      setChecking(false);
    }
  };

  if (!config?.enabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-bold bg-zinc-900/40 border-primary p-6 relative overflow-hidden group"
    >
      {/* Background Glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />

      <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-black border-2 border-primary/40 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.1)] shrink-0">
          <MapPin size={32} className={alreadyDone ? "text-emerald-500" : "text-primary animate-pulse"} />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <h3 className="text-xl font-black italic uppercase text-white tracking-tight">Check-in Presencial</h3>
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black rounded-full border border-primary/30">+{config.points} PTS</span>
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
            {alreadyDone 
              ? `Presença confirmada na ${config.label}!` 
              : `Confirme que você está na ${config.label} para ganhar pontos.`}
          </p>
        </div>

        <div className="w-full sm:w-auto">
          {alreadyDone ? (
            <div className="flex items-center gap-2 px-6 py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 font-black uppercase italic text-sm">
              <CheckCircle2 size={18} />
              Concluído Hoje
            </div>
          ) : (
            <button
              onClick={handleCheckin}
              disabled={checking}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:scale-[1.03] active:scale-97 transition-all disabled:opacity-50"
            >
              {checking ? <Loader2 size={22} className="animate-spin" /> : <Navigation size={22} />}
              {checking ? "Localizando..." : "Marcar Presença"}
            </button>
          )}
        </div>
      </div>

      {distance !== null && !alreadyDone && distance > config.radius && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
        >
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest">
            Distância: {Math.round(distance)} metros. Você precisa estar a menos de {config.radius}m.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
