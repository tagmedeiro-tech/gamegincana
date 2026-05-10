import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Package, AlertCircle, History, Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { StoreItem, Redemption } from '../types';
import { NotificationService } from '../lib/NotificationService';
import { AchievementService } from '../lib/AchievementService';
import { useToast } from '../context/ToastContext';
import { Loader2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useAudio } from '../context/AudioContext';

export default function Store() {
  const { user, profile, refreshProfile } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'shop' | 'my-orders'>('shop');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { success, error: toastError, info } = useToast();
  const { playClick, playCollect, playWoosh, playSuccess } = useAudio();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // 🚀 Queries paralelas: store_items + redemptions ao mesmo tempo
        const [storeRes, redRes] = await Promise.all([
          supabase.from('store_items').select('*').eq('status', 'active').order('cost', { ascending: true }),
          user
            ? supabase.from('redemptions').select('*, store_items(*)').eq('"userId"', user.id).order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null })
        ]);

        if (!isMounted) return;
        setItems(storeRes.data || []);
        setRedemptions((redRes.data as unknown as Redemption[]) || []);
      } catch (err) {
        console.error('[Store] Error fetching store:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [user]);

  // Mantemos o handlePurchase mas ele chamará o refresh manualmente se necessário
  const refreshStore = async () => {
    const [storeRes, redRes] = await Promise.all([
      supabase.from('store_items').select('*').eq('status', 'active').order('cost', { ascending: true }),
      user
        ? supabase.from('redemptions').select('*, store_items(*)').eq('"userId"', user.id).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] })
    ]);
    setItems(storeRes.data || []);
    setRedemptions((redRes.data as unknown as Redemption[]) || []);
  };

  const handlePurchase = async () => {
    if (!user || !profile || !selectedItem) return;
    if ((profile.coins || 0) < selectedItem.cost) {
      playClick();
      info("Saldo Insuficiente", "Moedas insuficientes! Ganhe mais XP para receber moedas.");
      return;
    }
    if (selectedItem.stock <= 0) {
      info("Esgotado", "Item fora de estoque!");
      return;
    }

    setSubmitting(true);
    try {
      // 🔒 RPC atômica: valida moedas + deduz estoque (WHERE stock > 0) + cria pedido em uma única transação
      // Isso elimina a janela de inconsistência onde o pedido existia mas as moedas não eram deduzidas
      const { data: rpcResult, error: rpcError } = await supabase.rpc('redeem_store_item', {
        p_user_id: user.id,
        p_item_id: selectedItem.id,
      });

      if (rpcError) throw rpcError;

      if (rpcResult && !rpcResult.success) {
        // RPC retornou erro de negócio (sem estoque ou sem moedas)
        if (rpcResult.reason === 'out_of_stock') {
          info("Esgotado", "Este item acabou de esgotar. Tente outro!");
        } else if (rpcResult.reason === 'insufficient_coins') {
          info("Saldo Insuficiente", "Você não tem moedas suficientes.");
        } else {
          toastError("Erro no Resgate", rpcResult.message || "Não foi possível processar seu pedido.");
        }
        return;
      }

      // 🔔 NOTIFICAR ADMINS E LÍDER (fora da transação — falha aqui não reverte a compra)
      NotificationService.notifyStaff(
        profile.groupId,
        'redemption',
        'Novo Resgate na Loja!',
        `${profile.name} resgatou: ${selectedItem.name}`,
        undefined,
        profile.avatar_url || profile.avatarUrl
      ).catch(console.warn);

      // 🏆 Verificar Conquistas
      AchievementService.check(user.id).catch(console.warn);

      playSuccess();
      playCollect();
      success("Resgate Solicitado", "Procure um administrador para retirar seu prêmio.");
      setSelectedItem(null);
      await refreshProfile();
      await refreshStore();
    } catch (err) {
      console.error(err);
      toastError("Erro no Resgate", "Não foi possível processar seu pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-8 pb-20 px-4 md:px-0">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-tight md:leading-none">
            Mural <span className="text-primary block text-4xl md:text-6xl">Recompensas</span>
          </h2>
          <p className="text-zinc-500 font-bold mt-2 italic flex items-center gap-2 text-sm md:text-base">
            <ShoppingBag size={16} className="text-primary" />
            <span>Troque seu esforço por prêmios incríveis.</span>
          </p>
        </div>

        <div className="flex bg-zinc-900 border-2 md:border-4 border-zinc-800 p-1 rounded-2xl w-full lg:w-auto">
          <button 
            onClick={() => { playWoosh(); setView('shop'); }}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-xl font-black uppercase italic tracking-tighter transition-all text-xs md:text-base ${
              view === 'shop' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Package size={18} /> Vitrine
          </button>
          <button 
            onClick={() => { playWoosh(); setView('my-orders'); }}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-xl font-black uppercase italic tracking-tighter transition-all text-xs md:text-base ${
              view === 'my-orders' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <History size={18} /> Resgates
          </button>
        </div>
      </header>

       {/* Saldo de Moedas Quick View */}
       <div className="bg-yellow-500 p-4 md:p-6 rounded-4xl flex items-center justify-between shadow-2xl shadow-yellow-500/20">
          <div className="flex items-center gap-3 md:gap-4">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-yellow-500 rounded-full flex items-center justify-center font-black italic shadow-lg shrink-0">
                <Coins size={20} className="md:w-6 md:h-6" fill="currentColor" />
             </div>
             <div>
                <p className="text-black/60 text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">Moedas Disponíveis</p>
                <p className="text-black text-2xl md:text-3xl font-black italic leading-none mt-1">
                   {profile?.coins !== undefined ? `${profile.coins} MOEDAS` : 'CARREGANDO...'}
                </p>
             </div>
          </div>
          <div className="hidden sm:block text-right">
             <p className="text-black/40 text-[9px] md:text-[10px] font-black uppercase italic">XP é Honra, Moedas são Poder!</p>
             <p className="text-black font-black uppercase italic tracking-tighter text-xs md:text-base">Use com sabedoria na Arena.</p>
          </div>
       </div>

      <AnimatePresence mode="wait">
        {loading && items.length === 0 ? (
          <motion.div 
            key="loading-shop"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
          >
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-zinc-900/50 border-4 border-zinc-800/50 rounded-[2.5rem] p-6 h-80 animate-pulse" />
            ))}
          </motion.div>
        ) : view === 'shop' ? (
          <motion.div 
            key="shop"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
          >
            {items.length === 0 ? (
              <div className="col-span-full bg-zinc-900 border-4 border-dashed border-zinc-800 p-10 md:p-20 rounded-[40px] text-center">
                <p className="text-zinc-600 font-black italic uppercase text-xl md:text-2xl">A loja está sendo reabastecida. Volte logo!</p>
              </div>
            ) : items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900 border-2 md:border-4 border-zinc-800 rounded-3xl md:rounded-[2.5rem] p-4 md:p-6 flex flex-col group hover:border-primary transition-all relative overflow-hidden"
              >
                {/* Image Placeholder/Real */}
                <div className="h-40 md:h-48 bg-black rounded-2xl md:rounded-3xl mb-4 md:mb-6 overflow-hidden border-2 border-zinc-800 group-hover:border-primary/30 transition-all flex items-center justify-center relative">
                   {item.image_url ? (
                     <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                   ) : (
                     <Package size={48} className="text-zinc-800 md:w-16 md:h-16" />
                   )}
                   <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-primary text-black px-2 md:px-3 py-1 rounded-full font-black italic text-xs md:text-sm shadow-xl">
                      {item.cost} PTS
                   </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase italic leading-none mb-2">{item.name}</h3>
                  <p className="text-zinc-500 font-bold text-xs md:text-sm italic line-clamp-2 mb-4">{item.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t-2 border-zinc-800 mt-2 md:mt-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 tracking-widest">Estoque</span>
                    <span className={`text-sm md:text-base font-black italic ${item.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.stock > 0 ? `${item.stock} UN.` : 'OFF'}
                    </span>
                  </div>
                  <button
                    disabled={item.stock <= 0 || (profile?.coins || 0) < item.cost}
                    onClick={() => { playWoosh(); setSelectedItem(item); }}
                    className="bg-zinc-800 group-hover:bg-yellow-500 text-zinc-500 group-hover:text-black px-4 md:px-6 py-2 md:py-3 rounded-xl font-black uppercase italic text-[10px] md:text-xs tracking-tighter transition-all flex items-center gap-2 disabled:opacity-30 disabled:grayscale shadow-lg active:scale-95"
                  >
                    COMPRAR <Coins size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {redemptions.length === 0 ? (
              <div className="bg-zinc-900 border-4 border-dashed border-zinc-800 p-10 md:p-20 rounded-[40px] text-center">
                <p className="text-zinc-600 font-black italic uppercase text-xl md:text-2xl">Você ainda não realizou nenhum resgate.</p>
              </div>
            ) : redemptions.map((red) => (
              <div key={red.id} className="bg-zinc-900 border-2 md:border-4 border-zinc-800 p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-center justify-between group gap-4">
                <div className="flex items-center gap-3 md:gap-6 min-w-0">
                   <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-xl md:rounded-2xl border-2 border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {red.store_items?.image_url ? (
                         <img src={red.store_items.image_url} className="w-full h-full object-cover" />
                      ) : (
                         <Package size={20} className="text-zinc-700 md:w-6 md:h-6" />
                      )}
                   </div>
                   <div className="min-w-0">
                      <h4 className="text-base md:text-xl font-black uppercase italic text-white truncate">{red.store_items?.name}</h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">
                          {new Date(red.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                          red.status === 'delivered' ? 'text-green-500' :
                          red.status === 'cancelled' ? 'text-red-500' :
                          'text-orange-500'
                        }`}>
                          {red.status === 'delivered' ? 'ENTREGUE ✓' : 
                           red.status === 'cancelled' ? 'CANCELADO' : 'AGUARDANDO...'}
                        </span>
                      </div>
                   </div>
                </div>
                <div className="text-right shrink-0">
                   <p className="text-xs md:text-base text-zinc-500 font-black italic">{red.store_items?.cost} PTS</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-lg bg-zinc-900 border-4 border-zinc-800 p-6 md:p-8 rounded-[2.5rem] md:rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="text-center space-y-4 md:space-y-6">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border-4 border-primary/20">
                   <ShoppingBag size={32} className="text-primary md:w-12 md:h-12" />
                </div>
                
                <div>
                   <h3 className="text-2xl md:text-3xl font-black uppercase italic text-white leading-none">Confirmar Resgate?</h3>
                   <p className="text-zinc-500 font-bold italic mt-2 text-sm md:text-base">Você está trocando seus pontos por:</p>
                </div>

                <div className="bg-black p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-zinc-800">
                   <p className="text-primary text-xl md:text-2xl font-black italic uppercase leading-none">{selectedItem.name}</p>
                   <p className="text-zinc-600 font-black italic mt-1 text-sm md:text-base">Custo: {selectedItem.cost} Pontos</p>
                </div>

                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-orange-500/10 border-l-4 border-orange-500 text-left">
                   <AlertCircle className="text-orange-500 shrink-0 size-4 md:size-6" />
                   <p className="text-[8px] md:text-[10px] text-orange-500 font-black uppercase leading-tight italic">
                      Esta ação não pode ser desfeita. Os pontos serão descontados imediatamente e você deverá retirar o prêmio com o administrador.
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                   <button
                     onClick={() => { playClick(); setSelectedItem(null); }}
                     disabled={submitting}
                     className="bg-zinc-800 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase italic text-xs md:text-base tracking-tighter active:scale-95 transition-all disabled:opacity-50"
                   >
                     CANCELAR
                   </button>
                   <button
                     onClick={handlePurchase}
                     disabled={submitting}
                     className="bg-primary text-black py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase italic text-xs md:text-base tracking-tighter active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                     {submitting ? <Loader2 size={16} className="animate-spin md:w-5 md:h-5" /> : null}
                     {submitting ? 'PROCESSANDO...' : 'CONFIRMAR'}
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
