import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Eye, 
  EyeOff, 
  Youtube, 
  MousePointer2,
  AlertCircle
} from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from './LoadingSpinner';

const AdminLandingEditor: React.FC = () => {
  const theme = useAppTheme();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [localLanding, setLocalLanding] = useState(theme.landing || {
    heroTitle: 'A MAIOR GINCANA BÍBLICA DA REGIÃO',
    heroSubtitle: 'Prepare-se para a batalha, fortaleça sua fé e lidere sua tribo rumo à vitória na Arena Digital.',
    ctaText: 'ENTRAR NA ARENA',
    videoUrl: '',
    showStats: true,
    showModules: true,
    showFeed: true,
    showGallery: true,
    footerText: '© 2024 Gincana da Tribo - Desenvolvido para a Glória de Deus.'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Fetch current app config to not overwrite other properties
      const { data: currentConfig } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'app')
        .single();

      const newValue = {
        ...(currentConfig?.value || {}),
        landing: localLanding
      };

      const { error } = await supabase
        .from('config')
        .update({ value: newValue })
        .eq('key', 'app');

      if (error) throw error;
      success('Configuração Salva', 'A Landing Page foi atualizada com sucesso!');
    } catch (err) {
      console.error(err);
      toastError('Erro ao Salvar', 'Não foi possível atualizar a Landing Page.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key: keyof typeof localLanding) => {
    setLocalLanding(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
        <div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
            <Layout className="text-primary" /> Editor da Landing Page
          </h3>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Configure a porta de entrada da sua Arena</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl font-black uppercase italic tracking-tighter active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="sm" message="" /> : <Save size={20} />}
          {loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hero Configuration */}
        <div className="card-bold bg-zinc-900 border-zinc-800 p-8 space-y-6">
          <h4 className="text-lg font-black italic uppercase tracking-tight text-primary flex items-center gap-2 mb-6">
            <Type size={20} /> Seção Hero (Destaque)
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Título de Impacto</label>
              <textarea
                value={localLanding.heroTitle || ''}
                onChange={e => setLocalLanding({...localLanding, heroTitle: e.target.value})}
                className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-xl p-4 font-bold text-white outline-none min-h-[100px] uppercase italic"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Subtítulo Descritivo</label>
              <textarea
                value={localLanding.heroSubtitle || ''}
                onChange={e => setLocalLanding({...localLanding, heroSubtitle: e.target.value})}
                className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-xl p-4 font-bold text-white outline-none min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Texto do Botão (CTA)</label>
                <input
                  type="text"
                  value={localLanding.ctaText || ''}
                  onChange={e => setLocalLanding({...localLanding, ctaText: e.target.value})}
                  className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-xl px-4 py-3 font-bold text-white outline-none uppercase italic"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">URL do Vídeo (YouTube)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ID do vídeo ou URL"
                    value={localLanding.videoUrl || ''}
                    onChange={e => setLocalLanding({...localLanding, videoUrl: e.target.value})}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-xl pl-10 pr-4 py-3 font-bold text-white outline-none"
                  />
                  <Youtube className="absolute left-3 top-3.5 text-zinc-600" size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visibility & Footer */}
        <div className="space-y-8">
          <div className="card-bold bg-zinc-900 border-zinc-800 p-8">
            <h4 className="text-lg font-black italic uppercase tracking-tight text-primary flex items-center gap-2 mb-6">
              <Eye size={20} /> Visibilidade de Seções
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'showStats', label: 'Estatísticas Reais', icon: AlertCircle },
                { id: 'showModules', label: 'Módulos do Sistema', icon: Layout },
                { id: 'showFeed', label: 'Destaques do Mural', icon: MousePointer2 },
                { id: 'showGallery', label: 'Galeria de Mídia', icon: ImageIcon },
              ].map(section => (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id as any)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    localLanding[section.id as keyof typeof localLanding]
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <section.icon size={18} />
                    <span className="font-black uppercase italic text-xs">{section.label}</span>
                  </div>
                  {localLanding[section.id as keyof typeof localLanding] ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              ))}
            </div>
          </div>

          <div className="card-bold bg-zinc-900 border-zinc-800 p-8">
            <h4 className="text-lg font-black italic uppercase tracking-tight text-primary flex items-center gap-2 mb-6">
              <MousePointer2 size={20} /> Rodapé (Footer)
            </h4>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Texto de Copyright</label>
              <input
                type="text"
                value={localLanding.footerText || ''}
                onChange={e => setLocalLanding({...localLanding, footerText: e.target.value})}
                className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-xl px-4 py-3 font-bold text-white outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-zinc-900/30 p-8 rounded-3xl border-2 border-zinc-800 border-dashed text-center">
        <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-[10px]">A prévia em tempo real será exibida na página inicial (/)</p>
      </div>
    </div>
  );
};

export default AdminLandingEditor;
