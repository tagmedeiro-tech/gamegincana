import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StoreItem, Redemption } from '../types';
import { 
  Plus, Package, Edit2, 
  CheckCircle2, XCircle, ShoppingBag,
  Save, X, ImageIcon, Upload, Trash2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';

export default function AdminStore() {
  const { success, error: toastError, info } = useToast();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'redemptions'>('items');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: 0,
    stock: 0,
    image_url: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      console.log('[AdminStore] Iniciando carregamento...');
      setLoading(true);
      try {
        console.log('[AdminStore] Buscando store_items...');
        const { data: iData, error: e1 } = await supabase.from('store_items').select('*').order('created_at', { ascending: false });
        if (e1) console.error('[AdminStore] Erro store_items:', e1);
        console.log('[AdminStore] store_items concluído. Buscando redemptions...');

        const { data: rData, error: e2 } = await supabase
          .from('redemptions')
          .select('*, store_items(*), profiles(name)')
          .order('created_at', { ascending: false });
        if (e2) console.error('[AdminStore] Erro redemptions:', e2);
        console.log('[AdminStore] redemptions concluído.');
        
        if (isMounted) {
          setItems(iData || []);
          setRedemptions(rData as unknown as Redemption[] || []);
        }
      } catch (err) {
        console.error('[AdminStore] Catch error:', err);
      } finally {
        console.log('[AdminStore] Fim do bloco try/catch. isMounted:', isMounted);
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const refreshData = async () => {
    const { data: iData } = await supabase.from('store_items').select('*').order('created_at', { ascending: false });
    const { data: rData } = await supabase
      .from('redemptions')
      .select('*, store_items(*), profiles(name)')
      .order('created_at', { ascending: false });
    setItems(iData || []);
    setRedemptions(rData as unknown as Redemption[] || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (editingItem) {
        await supabase.from('store_items').update(formData).eq('id', editingItem.id);
        success("Item Atualizado", "As alterações foram salvas.");
      } else {
        await supabase.from('store_items').insert(formData);
        success("Item Criado", "O novo produto já está na loja.");
      }
      setShowItemForm(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', cost: 0, stock: 0, image_url: '', status: 'active' });
      refreshData();
    } catch (err) {
      console.error(err);
      toastError('Erro', 'Ocorreu um erro ao salvar o item.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateRedemption = async (id: string, status: 'delivered' | 'cancelled') => {
    try {
      const { error } = await supabase.from('redemptions').update({ status }).eq('id', id);
      if (error) throw error;
      refreshData();
      success(status === 'delivered' ? 'Entregue' : 'Cancelado', 'Status do pedido atualizado.');
    } catch (err) {
      console.error(err);
      toastError('Erro', 'Não foi possível atualizar o status.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      info('Formato Inválido', 'Selecione uma imagem válida (PNG, JPG, WEBP).');
      return;
    }

    setUploadingImage(true);
    try {
      await supabase.storage.createBucket('store_items', { public: true });
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `product-${Date.now()}.${ext}`;
      
      const { error } = await supabase.storage
        .from('store_items')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('store_items').getPublicUrl(path);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      success("Upload Completo", "A imagem foi enviada com sucesso.");
    } catch (err) {
      console.error(err);
      toastError('Erro no Upload', 'Ocorreu um erro ao enviar a imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading && items.length === 0) return <div className="p-20 text-center animate-pulse text-primary font-black">Carregando Loja...</div>;

  return (
    <div className="space-y-8">
      {/* Tab Selector */}
      <div className="flex bg-zinc-900 border-4 border-zinc-800 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase italic tracking-tighter transition-all ${
            activeTab === 'items' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Package size={18} /> Itens & Estoque
        </button>
        <button 
          onClick={() => setActiveTab('redemptions')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase italic tracking-tighter transition-all ${
            activeTab === 'redemptions' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <ShoppingBag size={18} /> Pedidos de Resgate
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'items' ? (
          <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-white uppercase italic">Gerenciar Inventário</h3>
              <button 
                onClick={() => setShowItemForm(true)}
                className="bg-primary text-black px-6 py-3 rounded-xl font-black uppercase italic tracking-tighter flex items-center gap-2 active:scale-95 transition-transform"
              >
                <Plus size={20} /> NOVO ITEM
              </button>
            </div>

            {/* Item List */}
            <div className="grid grid-cols-1 gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-zinc-900 border-4 border-zinc-800 p-6 rounded-3xl flex items-center justify-between group hover:border-primary transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-black rounded-xl border-2 border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                       {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-700" />}
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase italic text-white leading-none mb-1">{item.name}</h4>
                      <div className="flex items-center gap-4">
                         <span className="text-primary font-black italic">{item.cost} PTS</span>
                         <span className={`text-[10px] font-black uppercase ${item.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                           Estoque: {item.stock} UNID.
                         </span>
                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${item.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                           {item.status}
                         </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                     <button 
                       onClick={() => { setEditingItem(item); setFormData(item as unknown as typeof formData); setShowItemForm(true); }}
                       className="p-3 bg-zinc-800 text-white rounded-xl hover:bg-primary hover:text-black"
                     >
                       <Edit2 size={18} />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="red" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <h3 className="text-2xl font-black text-white uppercase italic">Fila de Entregas</h3>
            <div className="grid grid-cols-1 gap-4">
               {redemptions.map(red => (
                 <div key={red.id} className="bg-zinc-900 border-4 border-zinc-800 p-6 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-primary overflow-hidden flex items-center justify-center">
                          {red.profiles?.avatar_url ? <img src={red.profiles.avatar_url} className="w-full h-full object-cover" /> : <span className="font-black">{red.profiles?.name.charAt(0)}</span>}
                       </div>
                       <div>
                          <p className="text-white font-black uppercase italic text-sm leading-none mb-1">
                            <span>{red.profiles?.name}</span> resgatou <span>{red.store_items?.name}</span>
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">
                            {new Date(red.created_at).toLocaleString('pt-BR')}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       {red.status === 'pending' ? (
                         <>
                           <button 
                             onClick={() => handleUpdateRedemption(red.id, 'delivered')}
                             className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-500 active:scale-95 transition-all"
                           >
                             <CheckCircle2 size={16} /> ENTREGAR
                           </button>
                           <button 
                             onClick={() => handleUpdateRedemption(red.id, 'cancelled')}
                             className="p-2 text-zinc-600 hover:text-red-500 transition-colors active:scale-95"
                           >
                             <XCircle size={20} />
                           </button>
                         </>
                       ) : (
                         <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest ${red.status === 'delivered' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                            {red.status === 'delivered' ? '✓ ENTREGUE' : 'X CANCELADO'}
                         </div>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Modal Form */}
      <AnimatePresence>
        {showItemForm && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowItemForm(false)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[40px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black uppercase italic text-white">{editingItem ? 'Editar Prêmio' : 'Novo Prêmio'}</h3>
                <button onClick={() => setShowItemForm(false)}><X className="text-zinc-500" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* IMAGEM DO PRODUTO */}
                  <div className="md:col-span-2 bg-black/30 p-5 rounded-2xl border-2 border-zinc-800 flex items-center gap-6">
                    <div className="w-24 h-24 bg-black rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                      {formData.image_url ? (
                        <>
                          <img src={formData.image_url} alt="Produto" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setFormData({...formData, image_url: ''})} className="absolute top-1 right-1 p-1 bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                        </>
                      ) : (
                        <ImageIcon size={24} className="text-zinc-700" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                       <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block">Imagem do Produto (Opcional)</label>
                       <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer transition-colors flex items-center justify-center gap-2 max-w-[200px]">
                        {uploadingImage ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Upload size={14} />}
                        {uploadingImage ? 'Enviando...' : 'Fazer Upload'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                      </label>
                      <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full bg-black border border-zinc-800 focus:border-primary p-2 rounded-lg text-white outline-none text-[10px]" placeholder="Ou cole a URL direta da imagem aqui..." />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 block">Nome do Produto</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white outline-none" placeholder="Ex: Camiseta da Tribo" />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 block">Custo (Pontos)</label>
                    <input type="number" required value={formData.cost} onChange={e => setFormData({...formData, cost: parseInt(e.target.value)})} className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white outline-none" min="0" />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 block">Estoque Inicial</label>
                    <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white outline-none" min="0" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 block">Descrição Detalhada</label>
                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white outline-none resize-none" placeholder="Detalhes sobre o produto, tamanho, validade, etc." />
                  </div>

                  <div className="md:col-span-2">
                     <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 block">Status do Produto</label>
                     <select 
                       value={formData.status} 
                       onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})} 
                       className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white outline-none font-bold"
                     >
                        <option value="active">🟢 Ativo (Disponível na Loja)</option>
                        <option value="inactive">🔴 Inativo (Oculto)</option>
                     </select>
                  </div>
                </div>
                <button disabled={processing || uploadingImage} type="submit" className="w-full bg-primary text-black py-4 rounded-2xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                  {processing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
                  {processing ? "SALVANDO..." : "SALVAR PRÊMIO"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
