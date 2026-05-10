import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, Check, X, Search, BookOpen, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';

interface DuelQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  category: string;
  difficulty: string;
  verse_ref?: string;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = ['geral', 'evangelhos', 'epistolas', 'antigo_testamento', 'doutrina', 'profecia', 'historia'];
const DIFFICULTIES = ['facil', 'medio', 'dificil'];
const DIFF_LABEL: Record<string, string> = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
const DIFF_COLOR: Record<string, string> = { facil: 'text-green-400', medio: 'text-yellow-400', dificil: 'text-red-400' };

const emptyForm = () => ({
  question: '',
  options: ['', '', '', ''],
  correct_index: 0,
  category: 'geral',
  difficulty: 'medio',
  verse_ref: '',
});

export default function AdminQuestions() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<DuelQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchQuestions = useCallback(async () => {
    const { data } = await supabase
      .from('duel_questions')
      .select('*')
      .order('created_at', { ascending: false });
    setQuestions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setShowModal(true); };

  const openEdit = (q: DuelQuestion) => {
    setEditingId(q.id);
    setForm({ question: q.question, options: [...q.options], correct_index: q.correct_index, category: q.category, difficulty: q.difficulty, verse_ref: q.verse_ref ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || form.options.some(o => !o.trim())) {
      alert('Preencha a pergunta e todas as opções.'); return;
    }
    setSaving(true);
    const payload = { question: form.question, options: form.options, correct_index: form.correct_index, category: form.category, difficulty: form.difficulty, verse_ref: form.verse_ref || null, created_by: profile?.id, is_active: true };

    if (editingId) {
      await supabase.from('duel_questions').update(payload).eq('id', editingId);
    } else {
      await supabase.from('duel_questions').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    fetchQuestions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta pergunta?')) return;
    await supabase.from('duel_questions').delete().eq('id', id);
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleToggle = async (q: DuelQuestion) => {
    await supabase.from('duel_questions').update({ is_active: !q.is_active }).eq('id', q.id);
    setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, is_active: !item.is_active } : item));
  };

  const filtered = questions.filter(q => {
    const matchS = !search || q.question.toLowerCase().includes(search.toLowerCase());
    const matchC = filterCat === 'all' || q.category === filterCat;
    const matchD = filterDiff === 'all' || q.difficulty === filterDiff;
    return matchS && matchC && matchD;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 flex items-center gap-2"><BookOpen size={14} /> Banco de Perguntas</p>
          <h1 className="text-4xl font-black uppercase italic text-white">Duelo <span className="text-primary">Sagrado</span></h1>
          <p className="text-zinc-500 text-xs font-bold mt-1">{questions.filter(q => q.is_active).length} perguntas ativas · {questions.length} total</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-2xl font-black uppercase text-sm hover:bg-white transition-all">
          <Plus size={18} /> Nova Pergunta
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-5 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pergunta..."
            className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-2xl py-3 pl-11 pr-4 text-white font-bold outline-none text-sm transition-all" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${filterCat === c ? 'bg-primary border-primary text-black' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
              {c === 'all' ? 'Todas' : c.replace('_', ' ')}
            </button>
          ))}
          <div className="w-px bg-zinc-800 mx-1" />
          {['all', ...DIFFICULTIES].map(d => (
            <button key={d} onClick={() => setFilterDiff(d)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${filterDiff === d ? 'bg-primary border-primary text-black' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
              {d === 'all' ? 'Qualquer' : DIFF_LABEL[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className={`bg-zinc-900 border-2 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start gap-3 transition-all ${q.is_active ? 'border-zinc-800' : 'border-zinc-800 opacity-50'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-current ${DIFF_COLOR[q.difficulty]}`}>{DIFF_LABEL[q.difficulty]}</span>
                  <span className="text-[9px] font-black uppercase text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{q.category.replace('_', ' ')}</span>
                  {q.verse_ref && <span className="text-[9px] text-primary font-bold">{q.verse_ref}</span>}
                </div>
                <p className="text-white font-bold text-sm mb-2 leading-snug">{q.question}</p>
                <div className="grid grid-cols-2 gap-1">
                  {q.options.map((opt, idx) => (
                    <p key={idx} className={`text-[10px] px-2 py-1 rounded-lg ${idx === q.correct_index ? 'bg-green-500/10 text-green-400 font-black' : 'text-zinc-600 font-medium'}`}>
                      {['A','B','C','D'][idx]}. {opt}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleToggle(q)} className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${q.is_active ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-600'}`}>
                  {q.is_active ? '✓' : '○'}
                </button>
                <button onClick={() => openEdit(q)} className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all">
                  <Edit3 size={13} />
                </button>
                <button onClick={() => handleDelete(q.id)} className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-red-900/40 text-zinc-600 hover:text-red-400 flex items-center justify-center transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-zinc-700">
              <BookOpen size={40} />
              <p className="font-black uppercase text-sm italic">Nenhuma pergunta encontrada</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Criar/Editar */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/85 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-zinc-900 border-4 border-zinc-800 rounded-[3rem] p-8 overflow-y-auto max-h-[90vh] space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase italic">{editingId ? 'Editar' : 'Nova'} <span className="text-primary">Pergunta</span></h2>
                <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"><X size={18} /></button>
              </div>

              {/* Referência + Categoria + Dificuldade */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Referência</label>
                  <input value={form.verse_ref} onChange={e => setForm(f => ({ ...f, verse_ref: e.target.value }))} placeholder="João 3:16"
                    className="w-full mt-1 bg-black border-2 border-zinc-800 focus:border-primary rounded-xl py-2.5 px-4 text-white font-bold text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Categoria</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full mt-1 bg-black border-2 border-zinc-800 focus:border-primary rounded-xl py-2.5 px-3 text-white font-bold text-sm outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Dificuldade</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full mt-1 bg-black border-2 border-zinc-800 focus:border-primary rounded-xl py-2.5 px-3 text-white font-bold text-sm outline-none">
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{DIFF_LABEL[d]}</option>)}
                  </select>
                </div>
              </div>

              {/* Pergunta */}
              <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Pergunta *</label>
                <textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} rows={3} placeholder="Digite a pergunta bíblica..."
                  className="w-full mt-1 bg-black border-2 border-zinc-800 focus:border-primary rounded-2xl py-3 px-4 text-white font-bold text-sm outline-none resize-none" />
              </div>

              {/* Opções */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Opções (clique no ✓ para marcar a correta)</label>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button onClick={() => setForm(f => ({ ...f, correct_index: i }))}
                      className={`w-8 h-8 rounded-xl border-2 font-black text-xs shrink-0 transition-all ${form.correct_index === i ? 'bg-green-500 border-green-500 text-black' : 'border-zinc-700 text-zinc-600 hover:border-green-500'}`}>
                      {['A','B','C','D'][i]}
                    </button>
                    <input value={opt} onChange={e => { const ops = [...form.options]; ops[i] = e.target.value; setForm(f => ({ ...f, options: ops })); }}
                      placeholder={`Opção ${['A','B','C','D'][i]} *`}
                      className={`flex-1 bg-black border-2 rounded-xl py-2.5 px-4 text-white font-bold text-sm outline-none transition-all ${form.correct_index === i ? 'border-green-500/40 focus:border-green-500' : 'border-zinc-800 focus:border-primary'}`} />
                  </div>
                ))}
                <p className="text-[9px] text-zinc-600 font-black px-1">A letra destacada em verde é a resposta correta</p>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full bg-primary text-black py-4 rounded-2xl font-black uppercase italic hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Check size={18} /> {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Pergunta'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
