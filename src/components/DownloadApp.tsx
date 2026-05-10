import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Smartphone, Download, Apple, CheckCircle2, Shield, Zap,
  QrCode, Copy, ExternalLink, ChevronRight, Star, Bell, Camera
} from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';

// ─── URL do APK (atualizar após build de release) ────────────────────────────
// Coloque aqui a URL pública do seu APK hospedado no Supabase Storage ou GitHub Releases.
const APK_DOWNLOAD_URL = 'https://fwdtsfczcdzqbmroxaxc.supabase.co/storage/v1/object/public/danwload/app-debug.apk';
const APP_VERSION = '2.0.1';
const APP_SIZE_MB = '24';

const features = [
  { icon: Bell, label: 'Notificações de Missão', desc: 'Receba alertas mesmo com o app fechado' },
  { icon: Camera, label: 'Scanner QR Nativo', desc: '10x mais rápido que no navegador' },
  { icon: Zap, label: 'Performance Premium', desc: 'Roda direto no hardware do celular' },
  { icon: Shield, label: 'Acesso Seguro', desc: 'Login biométrico e cache offline' },
];

const androidSteps = [
  'Toque no botão "Baixar APK" abaixo',
  'Abra o arquivo baixado',
  'Toque em "Instalar" (permitir fontes desconhecidas se pedido)',
  'Pronto! Entre com sua conta da Gincana',
];

const iosSteps = [
  'Acesse o link pelo Safari no seu iPhone',
  'Toque no botão compartilhar (□↑)',
  'Selecione "Adicionar à Tela de Início"',
  'O app ficará como ícone nativo na sua tela',
];

export default function DownloadApp() {
  const theme = useAppTheme();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');

  const siteUrl = window.location.origin;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = APK_DOWNLOAD_URL;
    link.download = `gincana-da-tribo-v${APP_VERSION}.apk`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 space-y-10">

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-5xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-xl p-10 text-center shadow-2xl mt-8"
      >
        {/* Background glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        {/* App Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-28 h-28 mx-auto mb-6 rounded-4xl bg-black border-2 border-primary/40 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.2)] relative overflow-hidden group"
        >
          <img src="/favicon.png" alt="TRIBO IDE Logo" className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-black z-10">
            <CheckCircle2 size={16} className="text-white" />
          </div>
        </motion.div>

        <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white uppercase leading-none mb-3">
          {theme.appName || 'Gincana da Tribo'}
        </h1>
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-2">
          App Oficial • Versão {APP_VERSION}
        </p>
        <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
          Instale o app nativo no seu celular para uma experiência completa com notificações, scanner QR e muito mais.
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} fill="#FBBF24" className="text-primary" />
          ))}
          <span className="text-zinc-400 text-xs font-bold ml-2">Exclusivo para membros</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            className="flex items-center gap-3 px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_50px_rgba(251,191,36,0.5)] transition-all"
          >
            <Download size={22} />
            Baixar APK Android
          </motion.button>

          <button
            onClick={() => setActiveTab('ios')}
            className="flex items-center gap-3 px-8 py-4 bg-zinc-800 text-zinc-300 rounded-2xl font-black uppercase italic tracking-tighter text-base border border-zinc-700 hover:bg-zinc-700 transition-all"
          >
            <Apple size={20} />
            Instalar no iPhone
          </button>
        </div>

        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-5">
          APK • {APP_SIZE_MB}MB • Android 8.0+ • iOS via PWA
        </p>
      </motion.div>

      {/* ─── FEATURES ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {features.map(({ icon: Icon, label, desc }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon size={20} className="text-primary" />
            </div>
            <p className="text-xs font-black text-white uppercase tracking-tight leading-tight">{label}</p>
            <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── GUIA DE INSTALAÇÃO ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-zinc-900/40 border border-zinc-800/50 rounded-4xl overflow-hidden shadow-xl"
      >
        {/* Tab Bar */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-black uppercase text-xs tracking-widest transition-colors ${
              activeTab === 'android' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Smartphone size={16} /> Android APK
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-black uppercase text-xs tracking-widest transition-colors ${
              activeTab === 'ios' ? 'bg-zinc-800/60 text-white border-b-2 border-zinc-600' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Apple size={16} /> iPhone / iPad
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'android' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black italic text-white uppercase tracking-tight mb-1">Instalação Android</h2>
                <p className="text-zinc-500 text-sm font-bold">Siga os passos abaixo para instalar o APK oficial:</p>
              </div>

              <div className="space-y-3">
                {androidSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-zinc-800/50"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-300 leading-snug">{step}</p>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-black rounded-2xl font-black uppercase italic tracking-tighter text-base hover:scale-[1.02] active:scale-98 transition-transform shadow-[0_0_20px_rgba(251,191,36,0.2)]"
              >
                <Download size={20} />
                Baixar APK Agora • {APP_SIZE_MB}MB
              </button>

              <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <Shield size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold text-amber-400/80 leading-relaxed">
                  O Android pode pedir permissão para instalar de "fontes desconhecidas". Isso é normal para apps fora da Play Store. O APK é seguro e assinado pela equipe da Gincana da Tribo.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black italic text-white uppercase tracking-tight mb-1">Instalar no iPhone</h2>
                <p className="text-zinc-500 text-sm font-bold">O app funciona como PWA — sem precisar da App Store:</p>
              </div>

              <div className="space-y-3">
                {iosSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-zinc-800/50"
                  >
                    <div className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-zinc-300">{i + 1}</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-300 leading-snug">{step}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                <Apple size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold text-blue-400/80 leading-relaxed">
                  A versão iOS via App Store nativa requer uma conta Apple Developer (US$ 99/ano). Para uso interno do grupo, o PWA via Safari funciona perfeitamente e pode ser "instalado" na tela inicial.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── COMPARTILHAR LINK ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-zinc-900/40 border border-zinc-800/50 rounded-4xl p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
            <QrCode size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Compartilhar com o Grupo</h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Envie o link para os jovens da tribo</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-black/60 rounded-2xl border border-zinc-800">
          <code className="text-primary font-mono text-sm flex-1 truncate">{siteUrl}/download</code>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
              copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
            }`}
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
            Ou acesse direto pelo QR Code (gerado após publicação)
          </p>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary text-[10px] font-black uppercase hover:underline"
          >
            Abrir site <ExternalLink size={10} />
          </a>
        </div>
      </motion.div>

      {/* ─── VERSION INFO ─────────────────────────────────────────────────── */}
      <div className="text-center space-y-1 pb-4">
        <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">
          Gincana da Tribo • v{APP_VERSION} • Build Capacitor
        </p>
        <p className="text-zinc-800 text-[10px] font-bold">
          Android 8.0+ (API 26) • iOS 14+ via PWA
        </p>
      </div>
    </div>
  );
}
