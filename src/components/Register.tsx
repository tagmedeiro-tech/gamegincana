/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Loader2, Landmark, Trophy, Cross, 
  Camera, Heart, Phone, PartyPopper, ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppTheme } from '../hooks/useAppTheme';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import { NotificationService } from '../lib/NotificationService';

interface Group {
  id: string;
  name: string;
}

export default function Register() {
  const theme = useAppTheme();
  const { error: toastError, info } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteToken = searchParams.get('invite');

  const [groups, setGroups] = useState<Group[]>([]);
  const [fetchingGroups, setFetchingGroups] = useState(true);
  const [registeredAsAdmin, setRegisteredAsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchGroups = async () => {
      try {
        // Usa Promise.race para evitar que o Supabase fique travado aguardando sessão
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao carregar tribos')), 5000)
        );
        const fetchPromise = supabase.from('groups').select('id, name').order('name');
        
        const response: any = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (response.error) throw response.error;
        if (isMounted && response.data) setGroups(response.data);
      } catch (err) {
        console.error("Erro crítico ao buscar tribos:", err);
      } finally {
        if (isMounted) setFetchingGroups(false);
      }
    };
    fetchGroups();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const getLogoIcon = () => {
    if (theme.logoUrl) return <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />;
    switch (theme.logoType) {
      case 'shield': return <Shield size={48} className="text-black" />;
      case 'trophy': return <Trophy size={48} className="text-black" />;
      case 'cross': return <Cross size={48} className="text-black" />;
      default: return <Landmark size={48} className="text-black" />;
    }
  };

  const roleParam = searchParams.get('role') || searchParams.get('type') || 'participant';
  const isAdminFlow = roleParam === 'admin';
  const isLeaderFlow = roleParam === 'leader';
  const groupIdFromUrl = searchParams.get('groupId');
  const inviteCode = searchParams.get('invite');

  // Códigos de convite lidos do ambiente (não expostos no bundle JS)
  // Configure VITE_INVITE_CODES=ARENA2024,LIDER_VIP,ADMIN_INVITE no .env
  const VALID_INVITES = (import.meta.env.VITE_INVITE_CODES || 'ARENA2024,LIDER_VIP,ADMIN_INVITE,ARENA-ADMIN-MASTER,ADMIN,LIDER')
    .split(',')
    .map((c: string) => c.trim().toUpperCase());
  
  // Regra de Aprovação: Admins e Líderes com convite entram ativos. Participantes dependem de aprovação.
  const isAutoApproved = (isAdminFlow || isLeaderFlow) && (inviteCode && VALID_INVITES.includes(inviteCode.toUpperCase()));

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    birthDate: '',
    whatsapp: '',
    isBaptized: false,
    isServing: false,
    wantsToServe: false,
    serviceAreas: [] as string[],
    praiseInstrument: '',
    groupId: groupIdFromUrl || '',
    avatarUrl: '',
    agreedToRules: false,
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tipo — sem isso qualquer arquivo podia ser enviado para o storage de avatares
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toastError('Formato inválido', 'Use uma imagem JPG, PNG, WebP ou GIF.');
      return;
    }

    // Limite de 5MB para economizar Storage
    if (file.size > 5 * 1024 * 1024) {
      toastError('Arquivo muito grande', 'Sua foto deve ter no máximo 5MB.');
      return;
    }

    setUploading(true);
    try {
      const sanitizeFilename = (name: string) => {
        return name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9.]/gi, "_")
          .toLowerCase();
      };

      const fileExt = sanitizeFilename(file.name.split('.').pop() || '');
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toastError('Erro de Avatar', 'Não foi possível enviar a sua foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!formData.agreedToRules) {
      info("Termos Obrigatórios", "Você precisa aceitar as regras para participar.");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            avatar_url: formData.avatarUrl,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar conta");

      // Detecta e-mail já cadastrado (Supabase retorna identities vazio nesse caso)
      if (authData.user.identities && authData.user.identities.length === 0) {
        throw new Error("User already registered");
      }

      const isAdmin = formData.email.toLowerCase() === 'tagmedeiro@gmail.com' || inviteToken === 'arena-admin-master';
      const profileStatus = (isAdmin || isAdminFlow || isAutoApproved) ? 'active' : 'pending';
      const profileRole  = (isAdmin || isAdminFlow) ? 'admin' : roleParam;
      const profileGroup = (isAdmin || isAdminFlow) ? null : (formData.groupId || null);

      // ─── ATUALIZAÇÃO DO PERFIL EM BACKGROUND (fire-and-forget) ───────────────
      // O trigger on_auth_user_created já inseriu um perfil mínimo.
      // Tentamos UPDATE (mais seguro em RLS) e UPSERT como fallback.
      // Nunca bloqueamos a tela de sucesso por erros de profile.
      const updateProfileBg = async () => {
        for (let attempt = 1; attempt <= 3; attempt++) {
          await new Promise(r => setTimeout(r, attempt * 1000));
          const { error: ue } = await supabase.from('profiles').update({
            name: formData.name, email: formData.email, role: profileRole,
            "groupId": profileGroup, "avatarUrl": formData.avatarUrl || null,
            "birthDate": formData.birthDate || null, whatsapp: formData.whatsapp || null,
            "isBaptized": formData.isBaptized, "isServing": formData.isServing,
            "wantsToServe": formData.wantsToServe,
            "serviceArea": formData.serviceAreas.join(', ') || null,
            "praiseInstrument": formData.praiseInstrument || null,
            coins: 0, achievements: [], status: profileStatus,
          }).eq('id', authData.user!.id);
          if (!ue) return;
          if (attempt === 3) {
            await supabase.from('profiles').upsert([{
              id: authData.user!.id, "totalPoints": 0,
              name: formData.name, email: formData.email, role: profileRole,
              "groupId": profileGroup, "avatarUrl": formData.avatarUrl || null,
              "birthDate": formData.birthDate || null, whatsapp: formData.whatsapp || null,
              "isBaptized": formData.isBaptized, "isServing": formData.isServing,
              "wantsToServe": formData.wantsToServe,
              "serviceArea": formData.serviceAreas.join(', ') || null,
              "praiseInstrument": formData.praiseInstrument || null,
              coins: 0, achievements: [], status: profileStatus,
            }], { onConflict: 'id' });
          }
        }
      };
      updateProfileBg().catch(e => console.error('Register bg update error:', e));

      // ─── NOTIFICAÇÃO EM BACKGROUND (fire-and-forget) ─────────────────────────
      (async () => {
        try {
          if (isAdmin || isAdminFlow) {
            await NotificationService.notifyStaff(formData.groupId || undefined, 'login',
              '🔥 NOVO ADMINISTRADOR',
              `${formData.name} entrou para o conselho mestre via link de convite.`,
              '/dashboard/admin/users', formData.avatarUrl);
          } else {
            await NotificationService.notifyStaff(formData.groupId || undefined, 'task_submit',
              '⚔️ NOVO GUERREIRO INSCRITO',
              `${formData.name} aguarda aprovação para entrar na arena. Verifique o cadastro!`,
              '/dashboard/admin/users', formData.avatarUrl);
          }
        } catch (ne) { console.warn('Register notify error (nao critico):', ne); }
      })();

      if (isAdmin || isAdminFlow) setRegisteredAsAdmin(true);

      // ✅ Exibe a tela de SUCESSO imediatamente após o Auth aceitar o signup
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error("Register error:", err);
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      let displayMessage = message;
      if (message.includes("User already registered") || message.includes("already registered")) {
        displayMessage = "Este e-mail ja esta em uso! Utilize outro e-mail ou clique em 'Login'.";
        setStep(1);
      } else if (message.includes("Password should be at least")) {
        displayMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (message.includes("Unable to validate email") || message.includes("invalid email")) {
        displayMessage = "Endereco de e-mail invalido. Verifique e tente novamente.";
      } else if (message.includes("Email rate limit")) {
        displayMessage = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      }
      toastError('Erro no Cadastro', displayMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    const selectedGroupObj = groups.find(g => g.id === formData.groupId);
    const triboName = selectedGroupObj?.name || 'sua Tribo';
    const whatsappLink = theme.whatsappLinks?.[formData.groupId];

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-bold max-w-lg w-full bg-zinc-950! border-primary p-12 text-center shadow-[0_0_80px_rgba(251,191,36,0.1)]"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            className="w-24 h-24 bg-black border-4 border-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(251,191,36,0.3)] relative"
          >
            <PartyPopper size={48} className="text-primary" />
            <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent rounded-full"></div>
          </motion.div>
          
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none mb-4">
            {registeredAsAdmin ? (
              <span>ACESSO <span className="text-red-500">MESTRE</span> LIBERADO</span>
            ) : (
              <><span>BEM-VINDO À </span><br/><span className="text-primary italic">{triboName.toUpperCase()}</span></>
            )}
          </h2>
          <p className="text-zinc-500 font-bold mb-8">
            {registeredAsAdmin 
              ? <span>Você agora possui poderes administrativos. Gerencie a arena com sabedoria e honra.</span>
              : isAutoApproved 
                ? <span>Seu cadastro foi realizado com sucesso! Agora você faz parte da elite da Gincana.</span>
                : <span>Seu cadastro foi enviado para análise! Em breve um administrador liberará seu acesso à arena.</span>
            }
          </p>

          <div className="space-y-4">
            {whatsappLink && (
              <a 
                href={whatsappLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-5 bg-[#25D366] text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_10px_20px_rgba(37,211,102,0.2)]"
              >
                <Phone size={24} /> <span>Entrar no WhatsApp da Tribo</span>
              </a>
            )}
            
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-3 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
              <span>{isAutoApproved ? 'ENTRAR NA BATALHA' : 'VOLTAR AO DASHBOARD'}</span> <ArrowRight size={24} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-bold max-w-lg w-full bg-zinc-950! border-primary/40 p-6 sm:p-10 shadow-[0_0_80px_rgba(251,191,36,0.05)]"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-8 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center border-4 border-primary shadow-[0_0_40px_rgba(251,191,36,0.2)] relative z-10 overflow-hidden">
               {getLogoIcon()}
               <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent rounded-full pointer-events-none"></div>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
            <span style={{ paddingRight: '0.1em', textShadow: '0 0 1px transparent' }}>
              {step === 1 ? 'Sua Identidade' : step === 2 ? 'Dados Pessoais' : 'Compromisso'}
            </span>
          </h2>
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 w-10 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary' : 'bg-zinc-800'}`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                <div className="flex flex-col items-center gap-4 mb-8">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full bg-zinc-900 border-4 border-zinc-800 group-hover:border-primary transition-all overflow-hidden flex items-center justify-center shadow-2xl">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={40} className="text-zinc-700" />
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                          <LoadingSpinner size="sm" message="" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-1 right-1 p-3 bg-primary text-black rounded-full cursor-pointer shadow-xl hover:scale-110 transition-all">
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      <Camera size={20} />
                    </label>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Avatar da Tribo</p>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-focus-within:text-primary mb-3 transition-colors">E-mail de Batalha</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      style={{ WebkitBoxShadow: '0 0 0 1000px #09090b inset', WebkitTextFillColor: 'white' }}
                      className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-primary rounded-2xl px-6 py-4 font-bold text-white outline-none transition-all" />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-focus-within:text-primary mb-3 transition-colors">Senha Secreta</label>
                    <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                      style={{ WebkitBoxShadow: '0 0 0 1000px #09090b inset', WebkitTextFillColor: 'white' }}
                      className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-primary rounded-2xl px-6 py-4 font-bold text-white outline-none transition-all" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-focus-within:text-primary mb-3 transition-colors">Nome do Guerreiro(a)</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    style={{ WebkitBoxShadow: '0 0 0 1000px #09090b inset', WebkitTextFillColor: 'white' }}
                    className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-primary rounded-2xl px-6 py-4 font-bold text-white outline-none transition-all" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-focus-within:text-primary mb-3 transition-colors">Nascimento</label>
                    <input required type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})}
                      style={{ WebkitBoxShadow: '0 0 0 1000px #09090b inset', WebkitTextFillColor: 'white' }}
                      className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-primary rounded-2xl px-6 py-4 font-bold text-white outline-none transition-all" />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-focus-within:text-primary mb-3 transition-colors">WhatsApp</label>
                    <input required type="tel" placeholder="(00) 00000-0000" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      style={{ WebkitBoxShadow: '0 0 0 1000px #09090b inset', WebkitTextFillColor: 'white' }}
                      className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-primary rounded-2xl px-6 py-4 font-bold text-white outline-none transition-all" />
                  </div>
                </div>
                {(!isAdminFlow && inviteToken !== 'arena-admin-master') && (
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-focus-within:text-primary mb-3 transition-colors">Sua Tribo de Destino</label>
                    <select 
                      required
                      value={formData.groupId} 
                      onChange={e => setFormData({...formData, groupId: e.target.value})}
                      disabled={!!groupIdFromUrl || fetchingGroups}
                      className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-primary rounded-2xl px-6 py-4 font-bold text-white outline-none transition-all disabled:opacity-50 appearance-none"
                    >
                      <option value="" className="bg-zinc-900">
                        {fetchingGroups ? 'Carregando tribos...' : 'Selecione sua tribo...'}
                      </option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id} className="bg-zinc-900">{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                <div className="bg-zinc-900/50 p-5 rounded-2xl border-2 border-zinc-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Cross size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Passo de Fé</p>
                      <h3 className="text-white font-black uppercase italic text-sm">Você é Batizado(a)?</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setFormData({...formData, isBaptized: true})}
                      className={`py-3 rounded-xl font-black uppercase text-[10px] sm:text-xs transition-all ${formData.isBaptized ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-500 ring-offset-2 ring-offset-black' : 'bg-zinc-950 text-zinc-500 border-2 border-zinc-900 hover:bg-zinc-800'}`}>
                      Sim, sou
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, isBaptized: false})}
                      className={`py-3 rounded-xl font-black uppercase text-[10px] sm:text-xs transition-all ${!formData.isBaptized ? 'bg-zinc-800 text-white shadow-lg ring-2 ring-zinc-700 ring-offset-2 ring-offset-black' : 'bg-zinc-950 text-zinc-500 border-2 border-zinc-900 hover:bg-zinc-800'}`}>
                      Ainda não
                    </button>
                  </div>
                </div>

                {/* --- SEÇÃO: MINISTÉRIO / SERVIÇO --- */}
                <div className="bg-zinc-900/50 p-5 rounded-2xl border-2 border-zinc-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Shield size={20} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Engajamento</p>
                      <h3 className="text-white font-black uppercase italic text-sm">Serve em algum ministério?</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button type="button" onClick={() => setFormData({...formData, isServing: true, wantsToServe: false})}
                      className={`py-3 rounded-xl font-black uppercase text-[10px] sm:text-xs transition-all ${formData.isServing ? 'bg-green-600 text-white shadow-lg shadow-green-500/20 ring-2 ring-green-500 ring-offset-2 ring-offset-black' : 'bg-zinc-950 text-zinc-500 border-2 border-zinc-900 hover:bg-zinc-800'}`}>
                      Já Sirvo
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, isServing: false})}
                      className={`py-3 rounded-xl font-black uppercase text-[10px] sm:text-xs transition-all ${!formData.isServing ? 'bg-zinc-800 text-white shadow-lg ring-2 ring-zinc-700 ring-offset-2 ring-offset-black' : 'bg-zinc-950 text-zinc-500 border-2 border-zinc-900 hover:bg-zinc-800'}`}>
                      Não Sirvo
                    </button>
                  </div>

                  {/* Se NÃO SERVE, pergunta se tem interesse */}
                  <AnimatePresence>
                    {!formData.isServing && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="pt-4 border-t-2 border-zinc-800/50">
                          <h3 className="text-zinc-400 font-bold text-xs uppercase mb-3">Tem interesse em começar?</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setFormData({...formData, wantsToServe: true})}
                              className={`py-3 rounded-xl font-black uppercase text-[10px] sm:text-xs transition-all ${formData.wantsToServe ? 'bg-primary text-black shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-black' : 'bg-zinc-950 text-zinc-500 border-2 border-zinc-900 hover:bg-zinc-800'}`}>
                              Tenho Interesse
                            </button>
                            <button type="button" onClick={() => setFormData({...formData, wantsToServe: false})}
                              className={`py-3 rounded-xl font-black uppercase text-[10px] sm:text-xs transition-all ${!formData.wantsToServe ? 'bg-zinc-800 text-white shadow-lg ring-2 ring-zinc-700 ring-offset-2 ring-offset-black' : 'bg-zinc-950 text-zinc-500 border-2 border-zinc-900 hover:bg-zinc-800'}`}>
                              Por enquanto não
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Seleção de Área (Mostra se Já Serve ou se Tem Interesse) */}
                  <AnimatePresence>
                    {(formData.isServing || formData.wantsToServe) && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="pt-6 mt-4 border-t-2 border-zinc-800/50 space-y-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 italic">
                              {formData.isServing ? 'Em quais áreas você atua? (Selecione várias)' : 'Quais áreas tem interesse? (Selecione várias)'}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { id: 'louvor', label: 'Louvor' },
                                { id: 'midia', label: 'Mídia & Com.' },
                                { id: 'infantil', label: 'Infantil' },
                                { id: 'jovens', label: 'Jovens' },
                                { id: 'acolhimento', label: 'Recepção' },
                                { id: 'intercessao', label: 'Oração' },
                                { id: 'danca_teatro', label: 'Artes' },
                                { id: 'social', label: 'Ação Social' },
                                { id: 'ensino', label: 'Ensino/EBD' },
                                { id: 'eventos', label: 'Eventos' },
                                { id: 'seguranca', label: 'Segurança' },
                                { id: 'celulas', label: 'Células/PG' },
                                { id: 'outro', label: 'Outro' }
                              ].map(area => {
                                const isSelected = formData.serviceAreas.includes(area.id);
                                return (
                                  <button
                                    key={area.id}
                                    type="button"
                                    onClick={() => {
                                      const newAreas = isSelected 
                                        ? formData.serviceAreas.filter(a => a !== area.id)
                                        : [...formData.serviceAreas, area.id];
                                      setFormData({ ...formData, serviceAreas: newAreas });
                                    }}
                                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all border-2 ${isSelected ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(251,191,36,0.15)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                  >
                                    {area.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {(formData.serviceAreas.includes('louvor') || formData.serviceAreas.includes('danca_teatro') || formData.serviceAreas.includes('outro')) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-4 border-t-2 border-zinc-800/50">
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 italic">
                                {formData.serviceAreas.includes('louvor') ? 'Instrumento ou Talento Vocal' : 'Especifique sua função/talento'}
                              </label>
                              <input type="text" placeholder={formData.serviceAreas.includes('louvor') ? "Ex: Guitarra, Vocal Principal, Bateria..." : "Descreva aqui os detalhes..."} value={formData.praiseInstrument}
                                onChange={e => setFormData({...formData, praiseInstrument: e.target.value})}
                                className="w-full bg-zinc-950 border-2 border-zinc-800 focus:border-primary rounded-xl px-4 py-3 font-bold text-white outline-none" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-3xl">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-1">
                      <input type="checkbox" required checked={formData.agreedToRules} onChange={e => setFormData({...formData, agreedToRules: e.target.checked})}
                        className="w-6 h-6 rounded-lg border-2 border-primary bg-black text-primary focus:ring-0 cursor-pointer" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors leading-relaxed">
                      <span>Eu aceito os </span><span className="text-primary underline italic">Termos de Honra da Arena</span><span> e prometo lutar com integridade, união e espírito cristão.</span>
                    </span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button type="submit" disabled={loading || uploading}
              className="order-1 sm:order-2 flex-2 btn-primary flex items-center justify-center gap-3 py-5 text-xl rounded-2xl shadow-[0_10px_30px_rgba(251,191,36,0.2)] active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100">
              {loading || uploading ? <LoadingSpinner size="sm" message="" /> : <span>{step === 3 ? 'SOU TRIBO!' : 'PRÓXIMO'}</span>}
              {!(loading || uploading) && <ArrowRight size={24} />}
            </button>

            {step === 1 ? (
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="order-2 sm:order-1 flex-1 py-5 border-2 border-zinc-800 rounded-2xl font-black uppercase italic tracking-tighter text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
              >
                <span>Login</span>
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setStep(step - 1)}
                className="order-2 sm:order-1 flex-1 py-5 border-2 border-zinc-800 rounded-2xl font-black uppercase italic tracking-tighter text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
              >
                <span>Voltar</span>
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
