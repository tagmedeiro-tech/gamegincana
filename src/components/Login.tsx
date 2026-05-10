/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Loader2, Landmark, Mail, Lock, Shield, Trophy, Cross, Star, Flame, Crown, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppTheme } from '../hooks/useAppTheme';
import { NotificationService } from '../lib/NotificationService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/useAuth';
import LoadingSpinner from './LoadingSpinner';
import { isNative, authenticateBiometric, hapticLight } from '../lib/nativeCapabilities';
import { Fingerprint } from 'lucide-react';

export default function Login() {
  const theme = useAppTheme();
  const { info, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const getLogoIcon = () => {
    switch (theme.logoType) {
      case 'shield': return <Shield size={48} />;
      case 'trophy': return <Trophy size={48} />;
      case 'cross': return <Cross size={48} />;
      case 'star': return <Star size={48} />;
      case 'flame': return <Flame size={48} />;
      case 'crown': return <Crown size={48} />;
      case 'zap': return <Zap size={48} />;
      default: return <Landmark size={48} />;
    }
  };

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const loginPromise = supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    const timeoutPromise = new Promise<any>((_, reject) => 
      setTimeout(() => reject(new Error('Tempo limite de conexão esgotado (30s)')), 30000)
    );

    try {
      const { data: { user, session }, error } = await Promise.race([loginPromise, timeoutPromise]);
      if (error) throw error;
      
      if (user) {
        // Busca perfil com timeout
        const profilePromise = supabase.from('profiles').select('*').eq('id', user.id).single();
        const { data: profile } = await Promise.race([profilePromise, timeoutPromise]);
        
        if (profile) {
          if (profile.status === 'pending') {
            info('Conta em Análise', 'Seu cadastro foi realizado! Agora um administrador precisa aprovar seu acesso.');
            // O loading não será removido aqui para evitar clique duplo, 
            // a transição será feita pelo useEffect quando o contexto confirmar o user.
            return;
          }
          const actorAvatar = profile.avatar_url || profile.avatarUrl;
          NotificationService.notifyStaff(profile.groupId, 'login', 'Novo Acesso', `${profile.name} entrou.`, undefined, actorAvatar);
        }
      }

      // A navegação real agora é feita de forma reativa pelo useEffect, 
      // garantindo que o ProtectedRoute não expulse o usuário de volta por falta de contexto.
      
    } catch (err: any) {
      console.error("Login error:", err);
      toastError('Erro de Acesso', err.message || 'Verifique sua conexão ou credenciais.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-bold max-w-md w-full bg-zinc-950! border-primary/40 shadow-[0_0_80px_rgba(251,191,36,0.05)] p-6 sm:p-10"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-8 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 bg-black rounded-full flex items-center justify-center border-4 border-primary shadow-[0_0_40px_rgba(251,191,36,0.2)] relative z-10 overflow-hidden"
            >
              {(theme.logoUrl && !theme.logoError) ? (
                <img 
                  src={theme.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-cover scale-110" 
                  onError={() => theme.setLogoError?.(true)}
                />
              ) : (
                <div className="scale-125 text-primary">{getLogoIcon()}</div>
              )}
              {/* Glossy Reflection */}
              <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent rounded-full pointer-events-none z-20"></div>
              {/* Inner Shadow */}
              <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] rounded-full pointer-events-none z-30"></div>
            </motion.div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white leading-none uppercase drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
            {theme.loginTitle || 'Acesso à Tribo'}
          </h2>
          <p className="text-zinc-500 font-black mt-2 sm:mt-3 italic uppercase text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] opacity-60">
            {theme.loginSubtitle || `${theme.churchName} • ${theme.seasonLabel}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="group">
            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-focus-within:text-primary mb-2 sm:mb-3 flex items-center gap-2 transition-colors">
              <Mail size={12} /> <span>Endereço de E-mail</span>
            </label>
            <input 
              required
              type="email"
              placeholder="seu@email.com"
              className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-primary rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 font-bold text-white focus:outline-none transition-all placeholder:text-zinc-700 placeholder:italic text-sm sm:text-base"
              style={{
                WebkitBoxShadow: '0 0 0 1000px #09090b inset',
                WebkitTextFillColor: 'white'
              }}
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="group">
            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-focus-within:text-primary mb-2 sm:mb-3 flex items-center gap-2 transition-colors">
              <Lock size={12} /> <span>Sua Senha de Batalha</span>
            </label>
            <input 
              required
              type="password"
              placeholder="••••••••"
              className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-primary rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 font-bold text-white focus:outline-none transition-all placeholder:text-zinc-700 text-sm sm:text-base"
              style={{
                WebkitBoxShadow: '0 0 0 1000px #09090b inset',
                WebkitTextFillColor: 'white'
              }}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full relative group active:scale-95 transition-transform"
          >
            <div className="absolute -inset-1 bg-primary rounded-xl sm:rounded-2xl blur-md opacity-20 group-hover:opacity-60 transition-opacity pointer-events-none"></div>
            <div className="relative btn-primary flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-5 text-lg sm:text-xl font-black uppercase italic tracking-tighter rounded-xl sm:rounded-2xl">
              {loading ? (
                <LoadingSpinner size="sm" message="" />
              ) : (
                <React.Fragment key="content">
                  <span>{theme.loginButtonText || 'ENTRAR NA BATALHA'}</span> <LogIn size={20} className="sm:w-6 sm:h-6" />
                </React.Fragment>
              )}
            </div>
          </button>

          {isNative && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                hapticLight();
                const success = await authenticateBiometric('Acesse sua conta com segurança');
                if (success) {
                  // Se o usuário autenticou biometricamente e temos credenciais (futuro), logar direto.
                  // Por enquanto, apenas valida a identidade localmente.
                  info('Identidade Confirmada', 'Agora clique em ENTRAR para acessar o sistema.');
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border-2 border-zinc-800 text-zinc-500 font-black uppercase italic tracking-tighter text-xs hover:border-primary/40 hover:text-primary transition-all"
            >
              <Fingerprint size={18} />
              <span>Entrar com Biometria</span>
            </motion.button>
          )}
        </form>

        <div className="mt-12 text-center pt-8 border-t border-zinc-900">
          <p className="text-zinc-600 font-black text-[10px] uppercase tracking-widest mb-3 italic">
            <span>{theme.registerPrompt || 'Ainda não tem uma tribo?'}</span>
          </p>
          <Link 
            to="/register" 
            className="text-primary font-black uppercase italic tracking-tighter hover:text-white transition-all text-lg"
          >
            <span>{theme.registerButtonText || 'Cadastre-se Agora'}</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
