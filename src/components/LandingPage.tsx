import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Sword, 
  Trophy, 
  Users, 
  Zap, 
  Layout, 
  MessageSquare, 
  ShoppingBag,
  ArrowRight,
  Play
} from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/useAuth';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useAppTheme();
  const { user, loading: authLoading } = useAuth();
  const landing = theme.landing;

  // Se já estiver logado, redireciona para o dashboard automaticamente
  // ou poderíamos apenas mudar o botão. Vamos redirecionar para fluidez.
  React.useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Não bloqueamos mais o render da Landing Page pelo authLoading
  // Isso garante que a página apareça instantaneamente enquanto o Supabase checa a sessão em background
  if (!landing) return <LoadingSpinner fullScreen message="Mobilizando Arena..." />;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-black font-sans overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_70%)]" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-6xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="inline-block px-4 py-1.5 mb-6 border border-primary/30 bg-primary/10 backdrop-blur-md rounded-full">
            <span className="text-primary text-sm font-bold tracking-widest uppercase italic">A Arena Digital Está Aberta</span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9] italic uppercase"
            style={{ textShadow: '0 0 40px rgba(251,191,36,0.3)' }}
          >
            {landing.heroTitle.split(' ').map((word, i) => (
              <span key={i} className={i % 2 === 1 ? 'text-primary' : 'text-white'}>
                {word}{' '}
              </span>
            ))}
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed"
          >
            {landing.heroSubtitle}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="group relative px-10 py-5 bg-primary text-black font-black text-xl italic uppercase tracking-tighter overflow-hidden transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]"
            >
              <span className="relative z-10 flex items-center gap-3">
                {landing.ctaText}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>

            {landing.videoUrl && (
              <button className="flex items-center gap-3 text-white font-bold hover:text-primary transition-colors text-lg uppercase tracking-wider group">
                <div className="w-14 h-14 rounded-full border-2 border-white/20 flex items-center justify-center group-hover:border-primary transition-colors">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                Assista o Trailer
              </button>
            )}
          </motion.div>
        </motion.div>

        {/* Floating Elements (Tech Look) */}
        <div className="absolute bottom-10 left-10 hidden lg:block opacity-20 border-l border-t border-white/30 p-4">
          <div className="text-[10px] font-mono tracking-widest uppercase">System.Status: Active</div>
          <div className="text-[10px] font-mono tracking-widest uppercase">Arena.Version: 4.2.1</div>
        </div>
        <div className="absolute top-10 right-10 hidden lg:block opacity-20 border-r border-b border-white/30 p-4 text-right">
          <div className="text-[10px] font-mono tracking-widest uppercase">Connection: Secured</div>
          <div className="text-[10px] font-mono tracking-widest uppercase">Encryption: High</div>
        </div>
      </section>

      {/* Stats Section */}
      {landing.showStats && (
        <section className="py-24 border-y border-white/10 bg-white/2">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div className="text-center">
                <div className="text-5xl md:text-7xl font-black text-primary italic mb-2 tracking-tighter">1.2k+</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Guerreiros</div>
              </div>
              <div className="text-center">
                <div className="text-5xl md:text-7xl font-black text-white italic mb-2 tracking-tighter">42</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Tribos</div>
              </div>
              <div className="text-center">
                <div className="text-5xl md:text-7xl font-black text-primary italic mb-2 tracking-tighter">85k</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Missões</div>
              </div>
              <div className="text-center">
                <div className="text-5xl md:text-7xl font-black text-white italic mb-2 tracking-tighter">15k</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Duelos</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modules Showcase */}
      {landing.showModules && (
        <section className="py-32 px-4 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
                Domine Cada <span className="text-primary">Módulo</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Uma plataforma completa para o crescimento espiritual e engajamento da juventude.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  title: 'Duelo Sagrado', 
                  desc: 'Batalhas bíblicas em tempo real. Teste seus conhecimentos sob pressão.', 
                  icon: Sword, 
                  color: 'text-primary' 
                },
                { 
                  title: 'Ranking Global', 
                  desc: 'Ascenda na hierarquia, ganhe XP e leve sua tribo ao topo da glória.', 
                  icon: Trophy, 
                  color: 'text-white' 
                },
                { 
                  title: 'Mural Social', 
                  desc: 'Compartilhe suas conquistas, interaja e fortaleça a comunidade.', 
                  icon: MessageSquare, 
                  color: 'text-primary' 
                },
                { 
                  title: 'Loja de Honra', 
                  desc: 'Troque suas moedas por prêmios reais e vantagens exclusivas.', 
                  icon: ShoppingBag, 
                  color: 'text-white' 
                },
                { 
                  title: 'Bíblia Digital', 
                  desc: 'Planos de leitura inteligentes e concordância integrada.', 
                  icon: Shield, 
                  color: 'text-primary' 
                },
                { 
                  title: 'IA Mentoria', 
                  desc: 'Missões personalizadas baseadas no seu perfil e evolução.', 
                  icon: Zap, 
                  color: 'text-white' 
                }
              ].map((mod, i) => (
                <div 
                  key={i}
                  className="group p-8 border border-white/10 bg-white/3 hover:bg-white/8 transition-all hover:-translate-y-2 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all" />
                  <mod.icon className={`w-12 h-12 ${mod.color} mb-6`} />
                  <h3 className="text-2xl font-black italic uppercase mb-4 tracking-tighter">{mod.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-medium">
                    {mod.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Social Proof (Feed Integration) */}
      {landing.showFeed && (
        <section className="py-32 px-4 bg-zinc-950">
          <div className="max-w-7xl mx-auto">
             <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
                <div className="text-center md:text-left">
                  <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
                    Arena em <span className="text-primary">Movimento</span>
                  </h2>
                  <p className="text-gray-400 max-w-xl">
                    Veja o que está acontecendo agora na Arena. Conquistas e missões em tempo real.
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                   <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Live Activity Feed</span>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Gabriel S.', action: 'completou o Duelo Sagrado', pts: '+60 XP', group: 'Tribo Judá' },
                  { name: 'Sarah M.', action: 'concluiu o Plano NT Express', pts: '+150 XP', group: 'Tribo Levi' },
                  { name: 'Lucas R.', action: 'marcou presença no Culto', pts: '+25 XP', group: 'Tribo Judá' },
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-zinc-900 border border-white/5 rounded-2xl flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-black text-primary border border-primary/20">
                      {item.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-300">
                        <span className="text-white font-black italic">{item.name}</span> {item.action}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-primary font-black text-xs">{item.pts}</span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{item.group}</span>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </section>
      )}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-primary p-12 md:p-20 text-black text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-20">
               <Shield className="w-64 h-64 -mr-32 -mt-32" />
             </div>
             
             <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter mb-8 relative z-10 leading-none">
               SUA JORNADA <br />COMEÇA AGORA
             </h2>
             
             <button 
              onClick={() => navigate('/register')}
              className="relative z-10 px-12 py-6 bg-black text-white font-black text-2xl italic uppercase tracking-tighter hover:bg-white hover:text-black transition-colors active:scale-95"
             >
               CRIAR MINHA CONTA
             </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8 text-gray-500 font-bold uppercase text-xs tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-white">TRIBO IDE</span>
          </div>
          <div>{landing.footerText}</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
