import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { UserProfile as UserProfileType, getUserLevel, getLevelProgress, Achievement } from '../types';
import { Trophy, Star, Calendar, ArrowLeft, Shield, Zap, Medal, MapPin, Edit2, Save, X, Camera, Settings, Coins, ShoppingBag, Users, Gift, RefreshCw, Link, Loader2, Crown, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AchievementList from './AchievementList';
import { useAppTheme, AppTheme } from '../hooks/useAppTheme';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import LevelIcon from './LevelIcon';
import { ACHIEVEMENT_DEFINITIONS, loadAchievementDefinitions } from '../lib/AchievementService';
import { isNative, takeProfilePhoto, hapticSuccess, hapticLight } from '../lib/nativeCapabilities';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useAppTheme();
  const { user, refreshProfile: refreshAuthProfile } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState<string>('');
  const [systemAchievements, setSystemAchievements] = useState<any[]>([]);
  
  // Estados de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    avatar_url: '',
    favorite_verse: '',
    bio: '',
    whatsapp: '',
    isBaptized: false,
    isServing: false,
    wantsToServe: false,
    serviceArea: '',
    praiseInstrument: '',
    birthDate: ''
  });

  // Estado para Recompensa Especial
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(100);
  const [rewardReason, setRewardReason] = useState('');
  const [rewarding, setRewarding] = useState(false);


  // Estado para Configurações Globais
  const [appConfig, setAppConfig] = useState<AppTheme | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChallengeMsg, setShowChallengeMsg] = useState(false);
  const [viewingAvatar, setViewingAvatar] = useState(false);

  const allRecognitionCount = achievements.length + userBadges.length;
  const totalPossibleAchievements = Object.keys(ACHIEVEMENT_DEFINITIONS).length;
  const rareCount = achievements.filter(a => {
    const def = ACHIEVEMENT_DEFINITIONS[a.achievementKey];
    return def && (def.rarity === 'rare' || def.rarity === 'epic' || def.rarity === 'legendary');
  }).length + userBadges.length;

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // 1. Perfil e Config
        const [pRes, cRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', id).single(),
          supabase.from('config').select('value').eq('key', 'app').single()
        ]);

        if (pRes.error) throw pRes.error;
        const profileData = pRes.data;
        if (cRes.data) setAppConfig(cRes.data.value);
        
        setProfile(profileData);
        
        // 2. Nome do Grupo (Busca separada para evitar erro de relacionamento se a FK estiver faltando)
        if (profileData.groupId) {
          const { data: groupData } = await supabase
            .from('groups')
            .select('name')
            .eq('id', profileData.groupId)
            .single();
          if (groupData) setGroupName(groupData.name);
        } else {
          setGroupName('Sem Tribo');
        }

        setEditForm({
          name: profileData.name || '',
          avatar_url: profileData.avatar_url || profileData.avatarUrl || '',
          favorite_verse: profileData.favorite_verse || '',
          bio: profileData.bio || '',
          whatsapp: profileData.whatsapp || '',
          isBaptized: profileData.isBaptized || false,
          isServing: profileData.isServing || false,
          wantsToServe: profileData.wantsToServe || false,
          serviceArea: profileData.serviceArea || '',
          praiseInstrument: profileData.praiseInstrument || '',
          birthDate: profileData.birthDate || ''
        });

        // 2. Conquistas
        const { data: achData } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('"userId"', id)
          .order('created_at', { ascending: false });

        if (achData) setAchievements(achData);

        // 3. Selos da Tribo (Join com metadados do selo)
        const { data: badgeData } = await supabase
          .from('user_badges')
          .select('*, badges(*)')
          .eq('"userId"', id);
        
        if (badgeData) setUserBadges(badgeData);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    const loadCatalog = async () => {
      await loadAchievementDefinitions();
      setSystemAchievements(Object.values(ACHIEVEMENT_DEFINITIONS));
    };

    fetchProfileData();
    loadCatalog();
  // Apenas 'id' como depência: navigate e refreshAuthProfile são funções estáveis e não devem reiniciar o fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toastError('Arquivo muito grande', 'Sua foto deve ter no máximo 5MB.');
      return;
    }

    setSaving(true);
    try {
      const sanitizeFilename = (name: string) => {
        return name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9.]/gi, "_")
          .toLowerCase();
      };

      const fileExt = sanitizeFilename(file.name.split('.').pop() || '');
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toastError("Erro no Upload", "Não foi possível enviar a foto.");
    } finally {
      setSaving(false);
    }
  };

  // Tira foto com a câmera nativa (Capacitor) ou usa o input padrão no web
  const handleNativeCameraCapture = async () => {
    if (!isNative) return; // Deixa o label/input normal tratar
    hapticLight();
    const dataUrl = await takeProfilePhoto();
    if (dataUrl) {
      setSaving(true);
      try {
        // Converte dataUrl para Blob e faz upload no Supabase Storage
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const fileName = `${user?.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));
      } catch (err) {
        console.error('Erro no upload nativo:', err);
        toastError("Erro no Upload", "Não foi possível enviar a foto.");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async () => {
    if (!profile || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          avatarUrl: editForm.avatar_url,
          favorite_verse: editForm.favorite_verse,
          bio: editForm.bio,
          whatsapp: editForm.whatsapp,
          isBaptized: editForm.isBaptized,
          isServing: editForm.isServing,
          wantsToServe: editForm.wantsToServe,
          serviceArea: editForm.serviceArea,
          praiseInstrument: editForm.praiseInstrument,
          birthDate: editForm.birthDate
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Sincroniza o estado local do profile com o que foi salvo
      setProfile(prev => prev ? {
        ...prev,
        name: editForm.name,
        avatarUrl: editForm.avatar_url,
        favorite_verse: editForm.favorite_verse,
        bio: editForm.bio,
        whatsapp: editForm.whatsapp,
        isBaptized: editForm.isBaptized,
        isServing: editForm.isServing,
        wantsToServe: editForm.wantsToServe,
        serviceArea: editForm.serviceArea,
        praiseInstrument: editForm.praiseInstrument,
        birthDate: editForm.birthDate,
      } : null);
      setIsEditing(false);
      await refreshAuthProfile();
      hapticSuccess();
      success("Perfil Salvo", "Suas informações foram atualizadas.");
    } catch (err) {
      console.error('Error saving profile:', err);
      toastError("Erro ao Salvar", "Não foi possível salvar as alterações do perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Forjando Perfil do Guerreiro..." size="lg" />;
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-white uppercase italic mb-4">Usuário não encontrado</h2>
        <button onClick={() => navigate(-1)} className="text-yellow-500 font-bold uppercase flex items-center gap-2 mx-auto">
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>
    );
  }

  const lvl = getUserLevel(profile.totalPoints, theme.levels);
  const pct = getLevelProgress(profile.totalPoints, theme.levels);

  const handleGiveReward = async () => {
    if (!profile) return;
    setRewarding(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ coins: (profile.coins || 0) + rewardAmount })
        .eq('id', profile.id);

      if (error) throw error;
      
      success("Recompensa Enviada", `🎉 Recompensa de ${rewardAmount} Moedas enviada com sucesso!`);
      setShowRewardModal(false);
      setProfile({ ...profile, coins: (profile.coins || 0) + rewardAmount });
    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível enviar a recompensa.");
    } finally {
      setRewarding(false);
    }
  };

  const handleCopyAdminInvite = async () => {
    const link = `${window.location.origin}/register?invite=arena-admin-master`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      success("🔥 Link Copiado!", "Envie este link apenas para novos administradores de confiança. Quem se cadastrar por ele terá controle total do sistema.");
    } catch (err) {
      console.error('Erro ao copiar link:', err);
      prompt("Não foi possível copiar automaticamente. Copie o link manual abaixo:", link);
    }
  };

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-20 px-3 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* HEADER NAVIGATION (Flutuante Premium) */}
      <div className="flex items-center justify-between w-full py-4 mb-4 sm:mb-8 relative z-30">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 sm:gap-2 px-4 py-2.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-2xl text-zinc-300 hover:text-white transition-all active:scale-95 shadow-xl hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          <ArrowLeft size={16} />
          <span className="font-black uppercase italic tracking-tighter text-[10px] sm:text-xs">Arena</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {user?.id === profile.id && !isEditing && (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl text-zinc-400 hover:text-primary transition-all active:scale-95 shadow-2xl"
              >
                <Edit2 size={14} />
                <span className="hidden sm:inline font-black uppercase italic tracking-tighter text-xs">Editar</span>
              </button>

              {profile.role === 'admin' && (
                <button 
                  onClick={() => navigate('/dashboard/admin')}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl text-red-500/70 hover:text-red-500 transition-all active:scale-95 shadow-2xl"
                >
                  <Settings size={14} />
                  <span className="hidden sm:inline font-black uppercase italic tracking-tighter text-xs">Mestre</span>
                </button>
              )}
            </>
          )}

          {isEditing && (
            <div className="flex items-center gap-2">
               <button 
                onClick={() => setIsEditing(false)}
                className="w-11 h-11 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-all font-black"
              >
                <X size={20} />
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-black rounded-2xl hover:scale-105 transition-colors duration-200 font-black uppercase italic text-sm active:scale-95 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Alterações'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BENTO GRID SYSTEM */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-12 gap-4 sm:gap-6"
      >
        {/* Helper Variant for Cards */}
        {(() => {
          const cardVariants = {
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
          };
          return null;
        })()}
        
        {/* HERO CARD (8 cols Desktop, 12 cols Mobile) */}
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
          }}
          className="col-span-12 lg:col-span-8 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-4xl sm:rounded-[2.5rem] p-5 sm:p-10 relative group shadow-2xl"
        >
          {/* Background Ambient Light */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-primary/10 rounded-full overflow-hidden pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10">
            {/* AVATAR COM ANEL DE NÍVEL */}
            <div className="relative shrink-0 mt-4 sm:mt-6">
               {profile.role === 'leader' && (
                 <motion.div 
                   animate={{ 
                     y: [0, -8, 0],
                   }}
                   transition={{ 
                     duration: 4, 
                     repeat: Infinity, 
                     ease: "easeInOut" 
                   }}
                   className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                 >
                   {/* Aura Dourada Pulsante */}
                   <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse"></div>
                   
                   {/* Asset 3D Real Animado */}
                   <img 
                     src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f451/512.gif" 
                     alt="Coroa de Líder" 
                     className="w-16 h-16 relative z-10 scale-125 object-contain drop-shadow-2xl"
                   />
                   
                   {/* Sparkle sutil para dar vida */}
                   <motion.div
                     animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], x: [0, 20, 40], y: [0, -10, -20] }}
                     transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                     className="absolute top-0 right-0 z-20"
                   >
                     <Sparkles size={16} className="text-white drop-shadow-md" />
                   </motion.div>
                 </motion.div>
               )}
               <div className="absolute -inset-4 rounded-full opacity-20 blur-xl animate-pulse pointer-events-none" style={{ backgroundColor: lvl.color }}></div>
               
               <div className={`relative w-32 h-32 sm:w-48 sm:h-48 rounded-full p-1 border-2 transition-transform duration-700 group-hover:rotate-3 ${profile.role === 'leader' ? 'shadow-[0_0_50px_rgba(251,191,36,0.4)]' : ''}`} style={{ borderColor: profile.role === 'leader' ? '#FBBF24' : `${lvl.color}33` }}>
                 <div className="w-full h-full rounded-full border-4 sm:border-8 overflow-hidden relative bg-zinc-950 shadow-inner" style={{ borderColor: profile.role === 'leader' ? '#FBBF24' : lvl.color }}>
                    {isEditing ? (
                      <div className="w-full h-full relative group/upload">
                        <img src={editForm.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editForm.name}`} alt="Preview" className="w-full h-full object-cover opacity-40" />
                        {isNative ? (
                          <button type="button" onClick={handleNativeCameraCapture} className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/60 transition-all gap-2">
                             <Camera size={20} className="text-white sm:w-7 sm:h-7" />
                             <span className="text-[8px] sm:text-[10px] font-black uppercase text-white tracking-widest">Câmera</span>
                          </button>
                        ) : (
                          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/60 transition-all gap-2">
                             <Camera size={20} className="text-white sm:w-7 sm:h-7" />
                             <span className="text-[8px] sm:text-[10px] font-black uppercase text-white tracking-widest">Alterar</span>
                             <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <button type="button" onClick={() => setViewingAvatar(true)} className="w-full h-full outline-none block">
                        <img 
                          src={profile.avatar_url || profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} 
                          alt={profile.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer" 
                        />
                      </button>
                    )}
                 </div>
               </div>

               {/* BADGE DE NÍVEL FLUTUANTE */}
               <motion.div 
                 initial={{ scale: 0, rotate: -20 }}
                 animate={{ scale: 1, rotate: 0 }}
                 className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 px-4 py-1 sm:px-5 sm:py-1.5 rounded-xl sm:rounded-2xl border-2 shadow-2xl flex items-center gap-1.5 sm:gap-2 bg-black"
                 style={{ borderColor: lvl.color }}
               >
                  <LevelIcon name={lvl.icon} size={12} color={lvl.color} />
                  <p className="text-[10px] sm:text-xs font-black uppercase italic tracking-tighter" style={{ color: lvl.color }}>
                    LVL.{lvl.level}
                  </p>
               </motion.div>
            </div>

            {/* INFO BLOCK */}
            <div className="flex-1 text-center sm:text-left space-y-3 sm:space-y-4">
               <div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                     <span className={`px-3 py-0.5 sm:px-4 sm:py-1 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border shadow-xl ${
                       profile.role === 'admin' 
                        ? 'bg-red-500/20 text-red-500 border-red-500/30' 
                        : profile.role === 'leader'
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400'
                     }`}>
                       {profile.role === 'admin' ? 'Master Admin' : profile.role === 'leader' ? 'Líder' : 'Guerreiro'}
                     </span>
                     <div className="px-3 py-0.5 sm:px-4 sm:py-1 bg-zinc-950/80 border border-zinc-800 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase italic tracking-widest">
                       {groupName}
                     </div>
                  </div>

                  {isEditing ? (
                    <input 
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="text-2xl sm:text-5xl font-black bg-black/40 border-b-2 border-primary px-2 py-1 text-white outline-none w-full italic uppercase"
                      placeholder="Nome de Guerra"
                    />
                  ) : (
                    <h1 className="text-3xl sm:text-6xl font-black text-white uppercase italic tracking-tighter leading-[0.9] drop-shadow-2xl wrap-break-word">
                      {profile.name}
                    </h1>
                  )}
               </div>

               {isEditing ? (
                 <input 
                   value={editForm.favorite_verse}
                   onChange={e => setEditForm({...editForm, favorite_verse: e.target.value})}
                   className="w-full bg-transparent border-b border-zinc-800 py-2 text-zinc-400 text-sm italic font-bold outline-none focus:border-primary"
                   placeholder="Seu versículo favorito ou frase de efeito..."
                 />
               ) : (
                 <p className="text-primary font-black italic text-lg sm:text-xl leading-snug max-w-lg opacity-90">
                   "{profile.favorite_verse || 'Sem medo na batalha, com fé no coração.'}"
                 </p>
               )}

               {/* PROGRESS BAR SLICE */}
               <div className="mt-8 space-y-2.5">
                  <div className="flex justify-between items-end">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sincronia de Nível</p>
                     <p className="text-xs font-black italic" style={{ color: lvl.color }}>{lvl.title}</p>
                  </div>
                  <div className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50 p-0.5">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${pct}%` }}
                       className="h-full rounded-full relative"
                       style={{ backgroundColor: lvl.color, boxShadow: `0 0 15px ${lvl.color}44` }}
                     >
                       <div className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent"></div>
                     </motion.div>
                  </div>
                  <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest italic">
                     <span>{profile.totalPoints} XP</span>
                     <span>{lvl.maxPoints === Infinity ? 'NÍVEL MÁXIMO' : `${lvl.maxPoints} XP`}</span>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>

        {/* STATS CARD (4 cols Desktop, 12 cols Mobile) */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4 sm:gap-6">
           {/* XP LARGE */}
           <motion.div 
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
              }}
              className="col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-4xl sm:rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group shadow-2xl flex flex-col justify-between"
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none"></div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1 sm:mb-2 relative z-10">Poder de Guerra</p>
              <div className="relative z-10 flex items-baseline gap-2">
                 <span className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter leading-none">{profile.totalPoints}</span>
                 <span className="text-primary font-black text-[10px] sm:text-xs uppercase italic">XP</span>
              </div>
              <div className="absolute bottom-2 right-4 opacity-10 group-hover:opacity-20 transition-all group-hover:scale-110">
                 <Zap size={80} sm:size={120} fill="currentColor" className="text-primary" />
              </div>
           </motion.div>

           {/* COINS */}
           <motion.div 
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
              }}
              className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-4xl sm:rounded-[2.5rem] p-5 sm:p-6 flex flex-col items-center justify-center group hover:border-yellow-500/30 transition-colors duration-300 shadow-xl"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                 <Coins size={18} sm:size={20} className="text-yellow-500" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-yellow-500 italic leading-none">{profile.coins || 0}</span>
              <span className="text-[8px] font-black text-zinc-600 uppercase mt-2 tracking-widest">Moedas</span>
           </motion.div>

           {/* HONORS */}
           <motion.div 
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
              }}
              className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-4xl sm:rounded-[2.5rem] p-5 sm:p-6 flex flex-col items-center justify-center group hover:border-primary/30 transition-colors duration-300 shadow-xl"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                 <Medal size={18} sm:size={20} className="text-primary" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white italic leading-none">{allRecognitionCount}</span>
              <span className="text-[8px] font-black text-zinc-600 uppercase mt-2 tracking-widest">Honras</span>
           </motion.div>
        </div>

        {/* GALERIA DE HONRA (Design Caixa Forte / Hardcore) */}
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
          }}
          className="col-span-12 relative flex flex-col max-h-[600px] sm:max-h-[700px] p-1 shadow-2xl"
        >
           {/* Injetando estilo para esconder scrollbar mantendo a funcionalidade */}
           <style dangerouslySetInnerHTML={{ __html: `
             .no-scrollbar::-webkit-scrollbar { display: none; }
             .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
           `}} />

           {/* Fundo Metálico Pesado com Cantos Chanfrados */}
           <div 
             className="absolute inset-0 bg-linear-to-b from-zinc-900 to-zinc-950 border-t-2 border-l border-r border-zinc-800 pointer-events-none z-0" 
             style={{ 
               clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' 
             }}
           />
           {/* Painel Interno Elevado (Efeito de relevo metálico) */}
           <div 
             className="absolute inset-[3px] bg-zinc-950 border-t border-l border-zinc-800/50 pointer-events-none z-0" 
             style={{ 
               clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' 
             }}
           />

           {/* CABEÇALHO DA CAIXA FORTE */}
           <div className="flex-none relative z-20 bg-zinc-900/50 p-6 sm:p-8 border-b-2 border-zinc-900 shadow-xl">
              {/* Título Principal */}
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-yellow-500 shrink-0 shadow-inner" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                    <Trophy size={28} className="drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                 </div>
                 <div>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
                      Galeria de<br/>Honra
                    </h3>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-zinc-600 mt-1">Troféus e Selos Conquistados</p>
                 </div>
              </div>

              {/* PAINEL DE ESTATÍSTICAS */}
              <div className="mt-6 flex items-center justify-between border-t border-b border-zinc-800/50 py-3 px-2 bg-zinc-950/30">
                 {/* Conquistados */}
                 <div className="flex-1 flex flex-col items-center border-r border-zinc-800/50">
                    <span className="text-xl sm:text-2xl font-black text-yellow-500 tracking-tighter">
                      {String(allRecognitionCount).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-yellow-500/80">Conquistados</span>
                 </div>
                 {/* Disponíveis */}
                 <div className="flex-1 flex flex-col items-center border-r border-zinc-800/50">
                    <span className="text-xl sm:text-2xl font-black text-zinc-600 tracking-tighter">
                      {String(Math.max(0, totalPossibleAchievements - achievements.length)).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-600">Disponíveis</span>
                 </div>
                 {/* Raros */}
                 <div className="flex-1 flex flex-col items-center">
                    <span className="text-xl sm:text-2xl font-black text-zinc-600 tracking-tighter">
                      {String(rareCount).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-600">Conquistas Elite</span>
                 </div>
              </div>
           </div>
           
           {/* ÁREA DE SCROLL (Placas Metálicas) */}
           <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full p-4 sm:p-6 bg-zinc-950/80">
              <AchievementList achievements={achievements} userBadges={userBadges} />
           </div>

           {/* RODAPÉ MOTIVACIONAL */}
           <div className="flex-none relative z-20 p-4 border-t-2 border-zinc-900 bg-zinc-950 flex items-center justify-between" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
              <div className="w-2 h-full bg-yellow-500 absolute left-0 top-0 opacity-80" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }} />
              <p className="text-[9px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-4">
                Continue participando e<br/>desbloqueie novas conquistas
              </p>
              <Crown size={18} className="text-yellow-600 mr-2" />
           </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
          }}
          className="col-span-12 lg:col-span-4 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group shadow-2xl"
        >
           <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                   <Shield size={20} />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Ficha Ministerial</h3>
              </div>
              {isEditing && (
                <span className="text-[9px] font-black uppercase text-primary animate-pulse tracking-widest bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">Editando</span>
              )}
           </div>

           <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-6">
                  {/* DATA DE NASCIMENTO */}
                  <div className="bg-black/60 p-5 rounded-2xl border border-zinc-800 focus-within:border-primary/50 transition-all">
                    <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> Data de Nascimento
                    </p>
                    <input 
                      type="date"
                      value={editForm.birthDate}
                      onChange={e => setEditForm({...editForm, birthDate: e.target.value})}
                      className="w-full bg-transparent text-white text-sm font-bold italic outline-none color-scheme-dark"
                    />
                  </div>

                  {/* BATISMO TOGGLE */}
                  <div className="flex items-center justify-between p-4 bg-black/60 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Já sou batizado?</span>
                    <button 
                      onClick={() => setEditForm({...editForm, isBaptized: !editForm.isBaptized})}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${editForm.isBaptized ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-500'}`}
                    >
                      {editForm.isBaptized ? 'SIM' : 'NÃO'}
                    </button>
                  </div>

                  {/* SERVIÇO TOGGLES */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setEditForm({...editForm, isServing: !editForm.isServing})}
                      className={`p-4 rounded-2xl border transition-colors duration-300 text-center flex flex-col items-center gap-2 ${editForm.isServing ? 'bg-primary/10 border-primary text-primary' : 'bg-black/60 border-zinc-800 text-zinc-600'}`}
                    >
                      <Zap size={16} fill={editForm.isServing ? "currentColor" : "none"} />
                      <span className="text-[8px] font-black uppercase">Já Sirvo</span>
                    </button>
                    <button 
                      onClick={() => setEditForm({...editForm, wantsToServe: !editForm.wantsToServe})}
                      className={`p-4 rounded-2xl border transition-colors duration-300 text-center flex flex-col items-center gap-2 ${editForm.wantsToServe ? 'bg-pink-500/10 border-pink-500 text-pink-500' : 'bg-black/60 border-zinc-800 text-zinc-600'}`}
                    >
                      <Users size={16} />
                      <span className="text-[8px] font-black uppercase">Quero Servir</span>
                    </button>
                  </div>

                  {/* ÁREA DE SERVIÇO */}
                  {(editForm.isServing || editForm.wantsToServe) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-black/60 p-5 rounded-2xl border border-zinc-800 focus-within:border-primary/50 transition-all">
                        <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Área de Atuação / Interesse</p>
                        <input 
                          value={editForm.serviceArea}
                          onChange={e => setEditForm({...editForm, serviceArea: e.target.value})}
                          className="w-full bg-transparent text-white text-sm font-bold italic outline-none"
                          placeholder="Ex: Mídia, Louvor, Recepção..."
                        />
                      </div>
                      <div className="bg-black/60 p-5 rounded-2xl border border-zinc-800 focus-within:border-primary/50 transition-all">
                        <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Instrumentos (Se houver)</p>
                        <input 
                          value={editForm.praiseInstrument}
                          onChange={e => setEditForm({...editForm, praiseInstrument: e.target.value})}
                          className="w-full bg-transparent text-white text-sm font-bold italic outline-none"
                          placeholder="Ex: Violão, Voz, Teclado..."
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-black/60 p-5 rounded-2xl border border-zinc-800 focus-within:border-primary/50 transition-all">
                    <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Bio / História</p>
                    <textarea 
                      value={editForm.bio}
                      onChange={e => setEditForm({...editForm, bio: e.target.value})}
                      className="w-full bg-transparent text-white text-sm font-bold italic outline-none min-h-[100px] resize-none"
                      placeholder="Conte um pouco sobre sua fé..."
                    />
                  </div>

                  <div className="bg-black/60 p-5 rounded-2xl border border-zinc-800 focus-within:border-primary/50 transition-all">
                    <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">WhatsApp</p>
                    <input 
                      value={editForm.whatsapp}
                      onChange={e => setEditForm({...editForm, whatsapp: e.target.value})}
                      className="w-full bg-transparent text-white text-sm font-bold italic outline-none"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* BIO VIEW */}
                  <div className="bg-black/40 p-6 rounded-3xl border border-zinc-800/50 shadow-inner">
                    <p className="text-zinc-300 text-sm italic leading-relaxed whitespace-pre-wrap">
                      {profile.bio || 'Este guerreiro ainda não forjou sua própria história no dossiê.'}
                    </p>
                  </div>
                  
                  {/* GRID DE INFORMAÇÕES */}
                  <div className="grid grid-cols-1 gap-2.5">
                     <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/50 flex items-center justify-between shadow-inner">
                        <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic flex items-center gap-2">
                          <Calendar size={12} /> Nascimento
                        </span>
                        <span className="text-xs font-black text-white italic">
                          {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}
                        </span>
                     </div>
                     <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/50 flex items-center justify-between shadow-inner">
                        <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic">Batismo</span>
                        <span className="text-xs font-black text-white italic">{profile.isBaptized ? 'Sim ✅' : 'Não ⚔️'}</span>
                     </div>
                     
                     {profile.isServing && (
                       <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex items-center justify-between shadow-inner">
                          <span className="text-[9px] font-black uppercase text-primary tracking-widest italic">Em Serviço</span>
                          <span className="text-xs font-black text-primary italic uppercase tracking-tighter">Ativo ⚡</span>
                       </div>
                     )}

                     {profile.wantsToServe && !profile.isServing && (
                       <div className="bg-pink-500/5 p-4 rounded-2xl border border-pink-500/20 flex items-center justify-between shadow-inner">
                          <span className="text-[9px] font-black uppercase text-pink-500 tracking-widest italic">Interesse</span>
                          <span className="text-xs font-black text-pink-500 italic uppercase tracking-tighter">Pronto p/ Agir</span>
                       </div>
                     )}

                     {(profile.serviceArea) && (
                       <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/50 flex flex-col gap-2 shadow-inner">
                          <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic">Área / Ministério</span>
                          <span className="text-xs font-black text-white italic uppercase tracking-tighter">{profile.serviceArea}</span>
                       </div>
                     )}

                     {profile.praiseInstrument && (
                       <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/50 flex flex-col gap-2 shadow-inner">
                          <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic">Instrumentos</span>
                          <span className="text-xs font-black text-white italic uppercase tracking-tighter">{profile.praiseInstrument}</span>
                       </div>
                     )}

                     <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/50 flex items-center justify-between shadow-inner">
                        <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic">Alistamento</span>
                        <span className="text-xs font-black text-white italic">{new Date(profile.created_at || '').toLocaleDateString('pt-BR')}</span>
                     </div>
                  </div>
                </div>
              )}
           </div>
        </motion.div>

        {/* OFENSIVA E STATUS (8 cols Desktop, 12 cols Mobile) */}
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
          }}
          className="col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
           <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl flex flex-col justify-center">
              <div className="flex items-center gap-6 relative z-10">
                 <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 animate-pulse">
                    <Zap size={32} fill="currentColor" />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Ofensiva</h4>
                    <p className="text-orange-500 text-sm font-black italic">7 Dias Seguidos</p>
                 </div>
              </div>
              <p className="text-zinc-500 text-[10px] font-bold mt-4 italic uppercase tracking-widest">Mantenha a chama acesa!</p>
           </div>

           <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl flex flex-col justify-center">
              <div className="flex items-center gap-6 relative z-10">
                 <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary">
                    <Star size={32} fill="currentColor" />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Status</h4>
                    <p className="text-primary text-sm font-black italic">Ativo na Arena</p>
                 </div>
              </div>
              <p className="text-zinc-500 text-[10px] font-bold mt-4 italic uppercase tracking-widest">Pronto para o combate</p>
           </div>
        </motion.div>

        {/* BOTÕES DE AÇÃO (4 cols Desktop, 12 cols Mobile) */}
        <motion.div 
          variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
          }}
          className="col-span-12 lg:col-span-4 grid grid-cols-1 gap-4"
        >
          <button 
            onClick={() => {
              setShowChallengeMsg(true);
              setTimeout(() => setShowChallengeMsg(false), 3000);
            }}
            className="bg-linear-to-r from-primary to-yellow-600 p-6 sm:p-8 rounded-4xl text-black font-black uppercase italic tracking-tighter text-left group overflow-hidden relative shadow-2xl hover:scale-[1.02] active:scale-95 transition-all h-full"
          >
             <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-sweep pointer-events-none"></div>
             <h5 className="text-xl sm:text-2xl leading-none mb-1">
               {showChallengeMsg ? 'ARENA...' : 'Desafiar'}
             </h5>
             <p className="text-[9px] font-bold opacity-80 italic">Clique para desafiar!</p>
             <Zap className="absolute -right-2 -bottom-2 text-black/10 group-hover:scale-125 transition-transform" size={80} />
          </button>

          <button 
            onClick={() => navigate('/dashboard/store')}
            className="bg-zinc-950 border border-zinc-800 p-6 sm:p-8 rounded-4xl text-white font-black uppercase italic tracking-tighter text-left group overflow-hidden relative shadow-2xl hover:border-primary/50 active:scale-95 transition-all h-full"
          >
             <h5 className="text-xl sm:text-2xl leading-none mb-1 text-primary">Resgatar</h5>
             <p className="text-[9px] font-bold text-zinc-500 italic">Troque moedas por prêmios!</p>
             <ShoppingBag className="absolute -right-2 -bottom-2 text-white/5 group-hover:scale-125 transition-transform" size={80} />
          </button>
        </motion.div>
      </motion.div>

      {/* ADMIN SUPREMO SECTION (BENTO ADAPTATION) */}
      {profile.role === 'admin' && (
        <div className="mt-12 bg-linear-to-br from-red-950/20 to-zinc-950 border-4 border-red-500/20 rounded-[3rem] p-8 sm:p-12 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
             <Shield size={300} className="text-red-500" />
           </div>

           <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-12">
                 <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500 shadow-2xl">
                    <Settings size={32} className="animate-spin-slow" />
                 </div>
                 <div>
                    <h3 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none text-red-500">Mestre da Arena</h3>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic mt-2">Configurações de Controle e Governança Suprema</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 <button onClick={() => navigate('/dashboard/admin/store')} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-yellow-500/30 group transition-all text-left">
                    <ShoppingBag size={24} className="text-zinc-600 group-hover:text-yellow-500 mb-4 transition-colors" />
                    <span className="block font-black uppercase italic text-sm text-zinc-400 group-hover:text-white">Loja</span>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase mt-1 block">Gerenciar Prêmios</span>
                 </button>

                 <button onClick={() => navigate('/dashboard/admin/users')} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-blue-500/30 group transition-all text-left">
                    <Users size={24} className="text-zinc-600 group-hover:text-blue-500 mb-4 transition-colors" />
                    <span className="block font-black uppercase italic text-sm text-zinc-400 group-hover:text-white">Guerreiros</span>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase mt-1 block">Aprovar e Editar</span>
                 </button>

                 <button onClick={() => navigate('/dashboard/admin/tasks')} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-emerald-500/30 group transition-all text-left">
                    <Zap size={24} className="text-zinc-600 group-hover:text-emerald-500 mb-4 transition-colors" />
                    <span className="block font-black uppercase italic text-sm text-zinc-400 group-hover:text-white">Atividades</span>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase mt-1 block">Tabela de XP</span>
                 </button>

                 <button onClick={() => setShowRewardModal(true)} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-pink-500/30 group transition-all text-left border-dashed">
                    <Gift size={24} className="text-zinc-600 group-hover:text-pink-500 mb-4 transition-colors animate-bounce" />
                    <span className="block font-black uppercase italic text-sm text-zinc-400 group-hover:text-white">Recompensa</span>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase mt-1 block">Enviar Bônus</span>
                 </button>
              </div>

              <div className="mt-6">
                <button 
                  onClick={handleCopyAdminInvite}
                  className={`w-full p-6 border-2 rounded-3xl transition-all font-black uppercase italic text-sm flex items-center justify-between ${
                    copied ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-zinc-950 border-red-500/10 text-red-500/40 hover:border-red-500/50 hover:text-red-500'
                  }`}
                >
                   <div className="flex items-center gap-3">
                      <Link size={20} />
                      <span>{copied ? 'LINK DE MESTRE COPIADO!' : 'Gerar Convite Master Admin'}</span>
                   </div>
                   {copied && <Check size={18} />}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DE RECOMPENSA (Adaptado para Glassmorphism) */}
      <AnimatePresence>
        {showRewardModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRewardModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl">
               <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto border border-pink-500/20">
                     <Gift size={32} className="text-pink-500 animate-bounce" />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic text-white leading-none">Bônus Especial</h3>
                  <div className="space-y-4">
                     <div className="bg-black/60 p-6 rounded-3xl border border-zinc-800 text-left">
                        <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Montante</p>
                        <div className="flex items-center gap-4">
                           <Coins className="text-yellow-500" size={28} />
                           <input type="number" value={rewardAmount} onChange={e => setRewardAmount(parseInt(e.target.value) || 0)} className="w-full bg-transparent text-4xl font-black italic text-white outline-none" />
                        </div>
                     </div>
                     <textarea value={rewardReason} onChange={e => setRewardReason(e.target.value)} placeholder="Motivo da honraria..." className="w-full bg-black/60 p-6 rounded-3xl border border-zinc-800 text-white font-bold italic text-sm outline-none h-32 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => setShowRewardModal(false)} className="py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black uppercase italic text-xs">Cancelar</button>
                     <button onClick={handleGiveReward} disabled={rewarding} className="py-4 bg-pink-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                        {rewarding ? <Loader2 className="animate-spin" size={16} /> : 'Enviar Moedas'}
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingAvatar && profile && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl" onClick={() => setViewingAvatar(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setViewingAvatar(false)}
                className="absolute -top-16 right-0 p-3 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-full transition-all shadow-xl"
              >
                <X size={24} />
              </button>
              <div className="rounded-[3rem] overflow-hidden border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)]" style={{ borderColor: profile.role === 'leader' ? '#FBBF24' : lvl.color }}>
                <img 
                  src={profile.avatar_url || profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} 
                  alt={profile.name}
                  className="w-full h-auto object-cover max-h-[80vh]"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
