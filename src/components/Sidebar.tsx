/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Users, CheckSquare, Settings, Menu, X, Landmark, LogOut, Shield, Cross, Star, Flame, Crown, Zap, Link, BarChart2, MessageCircle, ShoppingBag, BookOpen, Scroll, Swords, Volume2, VolumeX, Globe, Calendar, ShieldCheck, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../context/useAuth';
import NotificationBell from './NotificationBell';
import { useAudio } from '../context/AudioContext';

export default function Sidebar() {
  const [isOpen, setIsOpen] = React.useState(window.innerWidth >= 1024);
  const theme = useAppTheme();
  const { profile, signOut } = useAuth();
  const { playClick, enabled, setEnabled, playSuccess, playWoosh } = useAudio();
  const navigate = useNavigate();
  const userRole = profile?.role || 'participant';

  // Handle resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLogoIcon = () => {
    switch (theme.logoType) {
      case 'shield': return <Shield size={48} className="text-black" />;
      case 'trophy': return <Trophy size={48} className="text-black" />;
      case 'cross': return <Cross size={48} className="text-black" />;
      case 'star': return <Star size={48} className="text-black" />;
      case 'flame': return <Flame size={48} className="text-black" />;
      case 'crown': return <Crown size={48} className="text-black" />;
      case 'zap': return <Zap size={48} className="text-black" />;
      default: return <Landmark size={48} className="text-black" />;
    }
  };

  const isAdmin = userRole === 'admin';
  const menuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: Trophy },
    ...((isAdmin || theme.showCalendar !== false) ? [{ id: 'calendar', path: '/dashboard/calendar', label: 'Calendário', icon: Calendar }] : []),
    ...((isAdmin || theme.showFeed !== false) ? [{ id: 'feed', path: '/dashboard/feed', label: 'Mural', icon: Flame }] : []),
    ...((isAdmin || theme.showStore !== false) ? [{ id: 'store', path: '/dashboard/store', label: 'Loja', icon: ShoppingBag }] : []),
    ...((isAdmin || theme.showRanking !== false) ? [{ id: 'ranking', path: '/dashboard/ranking', label: 'Ranking', icon: BarChart2 }] : []),
    ...((isAdmin || theme.showBible !== false) ? [{ id: 'bible', path: '/dashboard/bible', label: 'Bíblia', icon: BookOpen }] : []),
    ...((isAdmin || theme.showReadingPlans !== false) ? [{ id: 'reading-plans', path: '/dashboard/reading-plans', label: 'Plano de Leitura', icon: Scroll }] : []),
    ...((isAdmin || theme.showDuel !== false) ? [{ id: 'duel', path: '/dashboard/duel', label: 'Duelo Sagrado', icon: Swords }] : []),
    ...((isAdmin || theme.showVoxel !== false) ? [{ id: 'metaverso', path: '/dashboard/metaverso', label: 'Mundo Aberto', icon: Globe }] : []),
    ...((isAdmin || theme.showActivities !== false) ? [{ id: 'activities', path: '/dashboard/activities', label: 'Atividades', icon: CheckSquare }] : []),
    ...((isAdmin || theme.showMyGroup !== false) ? [{ id: 'group', path: '/dashboard/group', label: 'Meu Grupo', icon: Users }] : []),
    ...((isAdmin || theme.showChat !== false) ? [{ id: 'chat', path: '/dashboard/chat', label: 'Chat', icon: MessageCircle }] : []),
  ];

  if (userRole === 'leader' || userRole === 'admin') {
    menuItems.push({ id: 'leader-panel', path: '/dashboard/leader', label: 'Gestão Tribo', icon: Crown });
  }

  if (userRole === 'admin') {
    menuItems.push({ id: 'admin', path: '/dashboard/admin', label: 'Painel Admin', icon: Settings });
    menuItems.push({ id: 'links', path: '/dashboard/links-convite', label: 'Links Convite', icon: Landmark });
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Topbar Mobile (Fixo) */}
      <div className={`fixed top-0 left-0 right-0 h-20 z-50 flex items-center justify-between px-4 sm:px-6 bg-black/80 backdrop-blur-xl border-b border-zinc-800/80 transition-all duration-300 lg:hidden ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-3.5 bg-primary rounded-2xl text-black shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:scale-105 active:scale-95 transition-all"
          >
            <Menu size={22} className="stroke-3" />
          </button>
          
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => {
                const newState = !enabled;
                setEnabled(newState);
                if (newState) setTimeout(() => playSuccess(), 50);
              }}
              className={`p-2.5 rounded-xl border transition-all ${enabled ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
              title={enabled ? 'Silenciar Sons' : 'Ativar Sons'}
            >
              {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <NotificationBell />
          </div>
        </div>
        
        {/* Opcional: Logo simplificada no meio ou direita do Topbar */}
        <div className="flex items-center opacity-80">
          <Shield size={24} className="text-primary" />
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-black border-r-4 border-primary flex flex-col shadow-[10px_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Top Section - Fixa e permite overflow para o sino de notificações */}
            <div className="p-6 pb-0 flex-none">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <button
                    onClick={() => {
                      const newState = !enabled;
                      setEnabled(newState);
                      if (newState) setTimeout(() => playSuccess(), 50);
                    }}
                    className={`p-2.5 rounded-xl border transition-all group/sound ${enabled ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'}`}
                    title={enabled ? 'Silenciar Sons' : 'Ativar Sons'}
                  >
                    {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </button>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-3 text-zinc-400 hover:text-primary transition-colors lg:hidden"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Scrollable Section */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 pt-0 flex flex-col">
              <div className="mb-12 flex flex-col items-center relative">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`relative flex items-center justify-center transition-all duration-500 mb-6 group overflow-hidden ${
                !theme.logoUrl 
                  ? 'w-24 h-24 bg-primary rounded-4xl rotate-3 transform hover:rotate-0 shadow-[0_0_50px_rgba(251,191,36,0.3)] border-4 border-black' 
                  : 'w-28 h-28 rounded-full border-4 border-primary shadow-[0_0_30px_rgba(251,191,36,0.2)] bg-black'
              }`}>
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                
                {theme.logoUrl
                  ? <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-cover scale-110" />
                  : <div className="scale-125">{getLogoIcon()}</div>
                }

                {/* Inner Shadow for depth */}
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] rounded-full pointer-events-none z-20"></div>
              </motion.div>

              <div className="text-center relative z-10">
                <h1 className="text-3xl font-black italic tracking-tight leading-none text-white uppercase pr-2" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>
                  {theme.appName.split(' ')[0]}
                  {theme.appName.split(' ')[1] && (
                    <span className="text-primary block text-5xl mt-1" style={{ textShadow: '0 0 25px rgba(251,191,36,0.5)' }}>{theme.appName.split(' ')[1]}</span>
                  )}
                </h1>
                <p className="text-[8px] font-black tracking-[0.3em] text-zinc-500 uppercase mt-3">{theme.churchName}</p>
              </div>
              <div className="h-1 w-24 bg-primary/20 mt-6 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-primary animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>

            <nav className="flex-1 space-y-6">
              {menuItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => { 
                    playClick();
                    playWoosh();
                    if (window.innerWidth < 1024) setIsOpen(false); 
                  }}
                  className={({ isActive }) => `sidebar-link w-full text-left ${
                    isActive
                      ? 'text-primary opacity-100'
                      : 'text-white opacity-60 hover:opacity-100'
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={20} className={isActive ? 'text-primary' : 'text-white'} />
                      <span className="font-black italic uppercase tracking-tighter text-xl">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              {/* Custom Tabs */}
              {theme.customTabs && theme.customTabs.filter(t => isAdmin || t.enabled).length > 0 && (
                <div className="pt-4 border-t border-zinc-800">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-3 px-1">Links Extras</p>
                  {theme.customTabs.filter(t => isAdmin || t.enabled).map(tab => (
                    <a key={tab.id} href={tab.url} target="_blank" rel="noopener noreferrer"
                      onClick={playClick}
                      className="sidebar-link w-full text-white opacity-60 hover:opacity-100 hover:text-primary transition-all">
                      <Link size={16} />
                      <span>{tab.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </nav>

            <div className="mt-auto space-y-4 pt-6 border-t border-zinc-800/50">
              {/* Mini Profile Card */}
              {profile && (
                <div className="space-y-3">
                  <NavLink 
                    to={`/dashboard/profile/${profile.id}`}
                    onClick={() => { 
                      playClick();
                      if (window.innerWidth < 1024) setIsOpen(false); 
                    }}
                    className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-primary transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-zinc-700 overflow-hidden shrink-0 group-hover:border-primary transition-all">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 font-black"><span>{profile.name.charAt(0)}</span></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black uppercase italic text-[11px] truncate"><span>{profile.name}</span></p>
                      <p className="text-primary font-black text-[9px] uppercase tracking-widest"><span>{profile.totalPoints} </span><span>PTS</span></p>
                    </div>
                  </NavLink>
                </div>
              )}

              {/* Download App Button */}
              <NavLink
                to="/download"
                onClick={() => { playClick(); if (window.innerWidth < 1024) setIsOpen(false); }}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-xl border font-black uppercase text-[9px] tracking-widest transition-all ${
                    isActive
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-primary hover:border-primary/40'
                  }`
                }
              >
                <Smartphone size={14} />
                <span>Baixar App</span>
              </NavLink>

              <button
                onClick={() => {
                  playClick();
                  handleSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                <LogOut size={16} /><span>SAIR DO SISTEMA</span>
              </button>
            </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
