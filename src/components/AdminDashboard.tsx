import React, { useState } from 'react';
import AdminUsers from './AdminUsers';
import AdminGroups from './AdminGroups';
import AdminActivities from './AdminActivities';
import AdminSettings from './AdminSettings';
import PointHistory from './PointHistory';
import AdminInsights from './AdminInsights';
import AdminStore from './AdminStore';
import AdminAnalytics from './AdminAnalytics';
import AdminBiblePoints from './AdminBiblePoints';
import AdminQuestions from './AdminQuestions';
import AdminLiveEvents from './AdminLiveEvents';
import AdminSystemPoints from './AdminSystemPoints';
import AdminLevelEditor from './AdminLevelEditor';
import AdminSeasonManager from './AdminSeasonManager';
import AdminLandingEditor from './AdminLandingEditor';
import AdminPushNotifications from './AdminPushNotifications';
import { Users, UserCog, Target, Settings, History, BarChart2, ShoppingBag, TrendingUp, BookOpen, Swords, Zap, Sliders, Flag, Star, Monitor, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';

type AdminTab = 'users' | 'groups' | 'tasks' | 'insights' | 'analytics' | 'store' | 'settings' | 'logs' | 'bible' | 'questions' | 'live' | 'pontos' | 'seasons' | 'levels' | 'landing' | 'push';

export default function AdminDashboard() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeSubTab = (tab as AdminTab) || 'users';

  const setActiveSubTab = (newTab: AdminTab) => {
    navigate(`/dashboard/admin/${newTab}`);
  };

  const menuItems = [
    { id: 'seasons', label: 'Temporadas', icon: Flag },
    { id: 'levels', label: 'Níveis', icon: Star },
    { id: 'live', label: 'Arena Live', icon: Zap },
    { id: 'users', label: 'Membros', icon: UserCog },
    { id: 'groups', label: 'Tribos', icon: Users },
    { id: 'tasks', label: 'Desafios', icon: Target },
    { id: 'pontos', label: 'Pontuações', icon: Sliders },
    { id: 'bible', label: 'Bíblia', icon: BookOpen },
    { id: 'questions', label: 'Perguntas', icon: Swords },
    { id: 'insights', label: 'Insights', icon: BarChart2 },
    { id: 'analytics', label: 'Análise', icon: TrendingUp },
    { id: 'store', label: 'Loja', icon: ShoppingBag },
    { id: 'logs', label: 'Logs', icon: History },
    { id: 'settings', label: 'Aparência', icon: Settings },
    { id: 'landing', label: 'Landing Page', icon: Monitor },
    { id: 'push', label: 'Push', icon: Bell },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-6xl font-black tracking-tight leading-none uppercase text-white">Painel Admin</h2>
          <p className="text-zinc-500 font-medium mt-2 italic uppercase tracking-widest text-[10px]">Gestão Suprema da Gincana TRIBO IDE</p>
        </div>
      </header>

      {/* Admin Sub-Navigation */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 border-b-4 border-zinc-900 pb-2 flex-nowrap">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubTab(item.id as AdminTab)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-black uppercase italic tracking-tighter transition-all whitespace-nowrap ${
              activeSubTab === item.id 
                ? 'bg-zinc-900 text-primary border-t-4 border-l-4 border-r-4 border-primary shadow-[0_-10px_20px_rgba(251,191,36,0.1)]' 
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeSubTab === 'users' && <AdminUsers />}
        {activeSubTab === 'groups' && <AdminGroups />}
        {activeSubTab === 'tasks' && <AdminActivities />}
        {activeSubTab === 'pontos' && <AdminSystemPoints />}
        {activeSubTab === 'insights' && <AdminInsights />}
        {activeSubTab === 'analytics' && <AdminAnalytics />}
        {activeSubTab === 'store' && <AdminStore />}
        {activeSubTab === 'bible' && <AdminBiblePoints />}
        {activeSubTab === 'questions' && <AdminQuestions />}
        {activeSubTab === 'live' && <AdminLiveEvents />}
        {activeSubTab === 'logs' && <div className="card-bold bg-zinc-900 border-primary p-8"><PointHistory /></div>}
        {activeSubTab === 'settings' && <AdminSettings />}
        {activeSubTab === 'seasons' && <AdminSeasonManager />}
        {activeSubTab === 'levels' && <AdminLevelEditor />}
        {activeSubTab === 'landing' && <AdminLandingEditor />}
        {activeSubTab === 'push' && <AdminPushNotifications />}
      </motion.div>
    </div>
  );
}
