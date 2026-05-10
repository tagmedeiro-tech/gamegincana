import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useAppTheme } from '../hooks/useAppTheme';
import { Book, ChevronLeft, ChevronRight, CheckCircle2, MessageSquare, Search, BookOpen, Award, Zap, ArrowRight, X, Star, Trophy, Share2 } from 'lucide-react';
import { BibleService, BIBLE_BOOKS } from '../lib/BibleService';
import { BibleVerse, BibleQuiz as BibleQuizType, FeedPost } from '../types';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabase';
import { NotificationService } from '../lib/NotificationService';
import BibleQuiz from './BibleQuiz';
import { DevotionalService } from '../lib/DevotionalService';
import { useBiblePointsConfig } from './AdminBiblePoints';
import { AutomationService } from '../lib/AutomationService';
import PostComposer from './feed/PostComposer';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../context/ToastContext';

// Quiz banco centralizado em BibleService.QUIZ_BANK (não duplicar aqui)


export default function BibleViewer({ initialBook, initialChapter }: { initialBook?: string | null, initialChapter?: number }) {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useAppTheme();
  const biblePoints = useBiblePointsConfig();
  const { info: toastInfo, error: toastError } = useToast();
  
  const urlBookId = searchParams.get('book');
  const urlChapter = parseInt(searchParams.get('chapter') || '1');

  // Prioriza props (clique direto) sobre URL (refresh/history)
  const effectiveBookId = initialBook || urlBookId;
  const effectiveChapter = initialChapter || urlChapter;

  const selectedBook = BIBLE_BOOKS.find(b => b.id === effectiveBookId) || BIBLE_BOOKS[42]; // João por padrão
  const chapter = effectiveChapter;
  
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isReadingComplete, setIsReadingComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<BibleQuizType | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showMuralComposer, setShowMuralComposer] = useState(false);
  const [muralInitialData, setMuralInitialData] = useState<Partial<FeedPost>>({});
  const { triggerRevalidate, refreshProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasAlreadyRead, setHasAlreadyRead] = useState(false);
  const [checkingReadStatus, setCheckingReadStatus] = useState(false);

  // 🙏 Devocional pessoal perpétuo
  const [devotionalIndex, setDevotionalIndex] = useState<number | null>(null);
  const [devotionalDoneToday, setDevotionalDoneToday] = useState(false);
  const [isDevotionalSubmitting, setIsDevotionalSubmitting] = useState(false);

  // Progresso Geral
  const [totalChaptersRead, setTotalChaptersRead] = useState<number | null>(null);
  const TOTAL_BIBLE_CHAPTERS = 1189;

  // Fetch Chapter + Quiz (via BibleService — 3 camadas de cobertura)
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setIsReadingComplete(false);
      setHasAlreadyRead(false);
      
      try {
        // 1. CARREGAR VERSÍCULOS PRIMEIRO (Prioridade Máxima)
        const chapterData = await BibleService.fetchChapter(selectedBook.id, chapter);
        setVerses(chapterData);
        
        // Libera a tela para leitura imediatamente
        setLoading(false);

        // 🔍 Verificar se o usuário já leu este capítulo no último ano (Cooldown 365 dias)
        if (profile) {
          setCheckingReadStatus(true);
          try {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const { data: readData, error: readError } = await supabase
              .from('bible_completions')
              .select('id')
              .eq('user_id', profile.id)
              .eq('book_id', selectedBook.id)
              .eq('chapter', chapter)
              .eq('completion_type', 'reading')
              .gt('created_at', oneYearAgo.toISOString())
              .limit(1)
              .abortSignal(controller.signal)
              .maybeSingle();
            
            clearTimeout(timeoutId);
            
            if (readError) console.error("Error checking read status:", readError);
            
            if (readData) {
              setHasAlreadyRead(true);
              setIsReadingComplete(true);
            }
          } catch (e) {
            console.error("Timeout ou exceção ao checar status de leitura:", e);
          } finally {
            setCheckingReadStatus(false);
          }
        }

        // 2. CARREGAR QUIZ (Em background, sem bloquear a leitura)
        const quizQuestions = await BibleService.getQuizForChapter(selectedBook.id, chapter, 4);
        
        if (quizQuestions.length > 0) {
          setCurrentQuiz({
            id: `quiz_${selectedBook.id}_${chapter}`,
            chapterKey: `${selectedBook.id}:${chapter}`,
            questions: quizQuestions.map(q => ({
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              verseRef: q.chapterRef
                ? { ref: q.chapterRef.replace(':', ' '), text: '' }
                : undefined,
            })),
          });
        } else {
          setCurrentQuiz(null);
        }
      } catch (err) {
        console.error("Erro ao carregar conteúdo bíblico:", err);
        setLoading(false); // Garante que a tela saia do loading mesmo em erro
        setCheckingReadStatus(false); // Resiliência extra
      }
    };
    
    loadContent();
  }, [selectedBook.id, chapter, profile?.id]);

  // Carregar progresso pessoal de devocional
  useEffect(() => {
    if (!profile) return;
    const loadDevotional = async () => {
      const { data } = await supabase
        .from('user_devotional_progress')
        .select('current_index, last_devotional_date')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (data) {
        setDevotionalIndex(data.current_index);
        // Usa data LOCAL (sv locale retorna YYYY-MM-DD no fuso do usuário)
        const today = new Date().toLocaleDateString('sv');
        setDevotionalDoneToday(data.last_devotional_date === today);
      } else {
        setDevotionalIndex(0); // novo usuário começa no índice 0
      }
    };
    loadDevotional();
  }, [profile]);

  // Carregar progresso geral da Bíblia
  useEffect(() => {
    if (!profile) return;
    const loadTotalProgress = async () => {
      const { data } = await supabase
        .from('bible_completions')
        .select('book_id, chapter')
        .eq('user_id', profile.id)
        .eq('completion_type', 'reading');
        
      if (data) {
        const uniqueChapters = new Set(data.map(d => `${d.book_id}:${d.chapter}`));
        setTotalChaptersRead(uniqueChapters.size);
      }
    };
    loadTotalProgress();
  }, [profile]);

  const updateLocation = (bookId: string, chapterNum: number) => {
    const newParams = Object.fromEntries(searchParams.entries());
    setSearchParams({ 
      ...newParams,
      book: bookId, 
      chapter: chapterNum.toString() 
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 3) return;
    setIsSearching(true);
    
    try {
      // 📝 Tenta buscar via BibleService (Concordância)
      const results = await BibleService.searchVerses(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMarkAsRead = async () => {
    if (!profile || isSubmitting || hasAlreadyRead) return;
    
    // Se há um quiz para esse capítulo, vamos abrir o quiz em vez de marcar como lido imediatamente.
    if (currentQuiz) {
      setShowQuiz(true);
      return;
    }
    
    // Se não tem quiz, registra como leitura normal
    const points = biblePoints.free_reading_points;
    await completeReading(points, 'reading');
  };

  // Concluir o DEVOCIONAL PESSOAL do dia
  const handleCompleteDevotional = async () => {
    if (!profile || isDevotionalSubmitting || devotionalDoneToday) return;
    setIsDevotionalSubmitting(true);
    const points = biblePoints.devotional_points;
    try {
      // Re-idrata a sessão para garantir que o token JWT não expirou durante a leitura
      await supabase.auth.getSession();

      const { data, error } = await supabase.rpc('complete_user_devotional', {
        p_user_id: profile.id,
        p_group_id: profile.groupId || null,
        p_points: points,
      });
      if (error) throw error;
      if (data?.success) {
        setDevotionalDoneToday(true);
        setDevotionalIndex(data.next_index);
        const actorAvatar = profile.avatar_url || profile.avatarUrl;
        NotificationService.send(profile.id, 'achievement', '🙏 Devocional Concluído!',
          `Dia ${data.total_completed} feito! +${points} pts. Amanhã tem mais!`, undefined, actorAvatar);
        NotificationService.notifyStaff(profile.groupId, 'achievement', 'Devocional Concluído!', `${profile.name} concluiu o devocional pessoal do dia!`, undefined, actorAvatar);
        
        // 🔥 Atualizar Ofensiva Devocional
        await AutomationService.handleDevotionalStreak(profile.id);

        await refreshProfile();
        triggerRevalidate();

        // 🚀 Navegação Automática para o Próximo Devocional
        setTimeout(() => {
          const nextDev = DevotionalService.getChapterAtIndex(data.next_index);
          updateLocation(nextDev.bookId, nextDev.chapter);
        }, 1500);
      }
    } catch (err) {
      console.error('Erro ao concluir devocional:', err);
    } finally {
      setIsDevotionalSubmitting(false);
    }
  };

  const completeReading = async (points: number, completionType: 'reading' | 'quiz' = 'reading') => {
    if (!profile || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Re-idrata a sessão para garantir estabilidade pós leitura (idle mode fix)
      await supabase.auth.getSession();

      const { data, error } = await supabase.rpc('complete_bible_chapter', { 
        p_user_id: profile.id, 
        p_group_id: profile.groupId, 
        p_book_id: selectedBook.id,
        p_chapter: chapter,
        p_points: Math.round(points),
        p_is_devotional: false,
        p_completion_type: completionType
      });
      if (error) throw error;
      
      // A nova RPC de cooldown devolve 'cooldown: true' se bloqueado
      if (data && !data.success) {
        if (data.cooldown) {
          toastInfo('Capítulo já registrado', `${data.message || 'Este capítulo só será pontuado novamente após 1 ano da última leitura.'}`);
        }
        setHasAlreadyRead(true);
        setIsReadingComplete(true);
        return;
      }
      
      const activityName = completionType === 'quiz' ? 'Quiz Bíblico' : 'Leitura Concluída';
      const actorAvatar = profile.avatar_url || profile.avatarUrl;
      NotificationService.send(profile.id, 'achievement', `${activityName}!`, `Você ganhou ${points} pontos em ${selectedBook.name} ${chapter}.`, undefined, actorAvatar);
      NotificationService.notifyStaff(profile.groupId, 'achievement', `${activityName}!`, `${profile.name} concluiu: ${selectedBook.name} ${chapter}.`, undefined, actorAvatar);
      
      setIsReadingComplete(true);
      setHasAlreadyRead(true);
      setShowQuiz(false);
      
      // Só incrementa o progresso visual se o servidor confirmou sucesso
      setTotalChaptersRead(prev => prev !== null ? prev + 1 : 1);
      
      // 🔥 Atualizar Ofensiva Devocional ANTES do refresh para pegar o dado novo
      await AutomationService.handleDevotionalStreak(profile.id);
      
      await refreshProfile();
      triggerRevalidate();

      // 🚀 Navegação Automática para o Próximo Capítulo
      setTimeout(() => {
        if (chapter < selectedBook.chapters) {
          updateLocation(selectedBook.id, chapter + 1);
        } else {
          // Se for o último capítulo do livro, tenta ir para o próximo livro
          const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
          if (bookIndex !== -1 && bookIndex < BIBLE_BOOKS.length - 1) {
            const nextBook = BIBLE_BOOKS[bookIndex + 1];
            updateLocation(nextBook.id, 1);
          }
        }
      }, 1500); // Pequeno delay para o usuário ver o feedback de sucesso
    } catch (err) {
      console.error("Erro ao computar pontos:", err);
      toastError('Erro ao Salvar', 'Não foi possível salvar seu progresso. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveNote = async () => {
    if (!profile || selectedVerse === null || !noteText.trim()) return;

    try {
      const { error } = await supabase.from('verse_notes').insert({
        "userId": profile.id,
        "bookId": selectedBook.id,
        chapter,
        verse: selectedVerse,
        content: noteText
      });

      if (!error) {
        setNoteText('');
        setSelectedVerse(null);
        setShowNotes(false);
      }
    } catch (err) {
      console.error("Erro ao salvar nota:", err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 pb-20 px-4 md:px-0">
      {/* ── SELETOR DE LIVROS/CAPÍTULOS ── */}
      <div className="w-full lg:w-80 space-y-4 md:space-y-6">
        <div className="bg-zinc-900 border-2 md:border-4 border-zinc-800 rounded-3xl md:rounded-[2.5rem] p-4 md:p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4 md:mb-6 px-2">
            <Book className="text-primary" size={20} />
            <h3 className="text-lg md:text-xl font-black uppercase italic text-white tracking-tight">Biblioteca</h3>
          </div>

          {totalChaptersRead !== null && (
            <div className="mb-6 px-2 bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Sua Jornada</p>
                  <p className="text-base font-black italic text-primary">{(totalChaptersRead / TOTAL_BIBLE_CHAPTERS * 100).toFixed(1)}% LIDO</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Restam</p>
                  <p className="text-xs font-bold text-zinc-400">{TOTAL_BIBLE_CHAPTERS - totalChaptersRead} cap.</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (totalChaptersRead / TOTAL_BIBLE_CHAPTERS) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-1 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {(['old', 'new'] as const).map(testament => (
              <div key={testament}>
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 px-2 py-3 sticky top-0 bg-zinc-900 z-10">
                  {testament === 'old' ? '📜 Antigo Testamento' : '✝️ Novo Testamento'}
                </p>
                {BIBLE_BOOKS.filter(b => b.testament === testament).map(book => (
                  <button
                    key={book.id}
                    onClick={() => updateLocation(book.id, 1)}
                    className={`w-full text-left px-3 md:px-4 py-2 md:py-2.5 rounded-xl border transition-all mb-1 ${
                      selectedBook.id === book.id
                        ? 'bg-primary border-primary text-black'
                        : 'border-transparent text-zinc-500 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-black uppercase italic text-[10px] md:text-xs tracking-tight truncate mr-2">{book.name}</span>
                      <span className="text-[8px] md:text-[9px] font-bold opacity-50 shrink-0">{book.chapters}</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CARD DO DEVOCIONAL PESSOAL PERPÉTUO */}
        {devotionalIndex !== null && (() => {
          const todayChapter = DevotionalService.getTodayChapter(devotionalIndex);
          const isOnToday = selectedBook.id === todayChapter.bookId && chapter === todayChapter.chapter;
          const phasePct = DevotionalService.getPhaseProgress(todayChapter);
          return (
            <div className={`bg-zinc-900 border-2 md:border-4 p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] relative overflow-hidden group transition-all ${
              isOnToday ? 'border-primary shadow-[0_0_30px_rgba(251,191,36,0.2)]' : 'border-zinc-800'
            }`}>
              <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen size={24} className="text-primary md:w-8 md:h-8" />
              </div>
              <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-primary mb-1">🙏 Devocional Pessoal</p>
              <p className="text-[8px] md:text-[9px] font-black uppercase text-zinc-500 mb-1 leading-tight">{todayChapter.phaseLabel}</p>
              <h4 className="text-lg md:text-xl font-black uppercase italic leading-none text-white mb-1">
                {todayChapter.bookName} {todayChapter.chapter}
              </h4>
              {/* Progresso da fase */}
              <div className="mt-2 md:mt-3 mb-2 md:mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[7px] md:text-[8px] font-black text-zinc-600 uppercase">Fase {todayChapter.dayInPhase}/{todayChapter.totalInPhase}</span>
                  <span className="text-[7px] md:text-[8px] font-black text-primary">{phasePct}%</span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${phasePct}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 md:mt-3 pt-2 md:pt-3 border-t border-zinc-800/50">
                <span className="text-[9px] md:text-[10px] font-black text-primary italic">
                  {devotionalDoneToday ? '✅ Feito hoje!' : `+${biblePoints.devotional_points} XP`}
                </span>
                {!isOnToday && (
                  <button
                    onClick={() => updateLocation(todayChapter.bookId, todayChapter.chapter)}
                    className="text-[9px] md:text-[10px] font-black text-white hover:text-primary transition-colors uppercase italic flex items-center gap-1"
                  >
                    Ler Agora <ArrowRight size={10} />
                  </button>
                )}
                {isOnToday && !devotionalDoneToday && (
                  <span className="text-[9px] md:text-[10px] font-black text-primary animate-pulse uppercase">📖 Você está aqui!</span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── LEITOR BÍBLICO ── */}
      <div className="flex-1 space-y-6">
        <div className="bg-zinc-900 border-4 border-zinc-800 rounded-[3rem] p-8 lg:p-12 shadow-2xl relative min-h-[80vh]">
          {/* Header do Leitor */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-12 border-b-2 border-zinc-800 pb-6 md:pb-8">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div>
                <div className="flex items-center gap-2 text-primary mb-1 md:mb-2">
                  <BookOpen size={16} className="md:w-5 md:h-5" />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">{selectedBook.testament === 'old' ? 'Antigo Testamento' : 'Novo Testamento'}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                  {selectedBook.name} <span className="text-primary italic">{chapter}</span>
                </h2>
              </div>
              <div className="flex gap-2 md:hidden">
                <button 
                  onClick={() => setShowSearch(true)}
                  className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700"
                >
                  <Search size={18} />
                </button>
                {currentQuiz && !hasAlreadyRead && (
                  <button 
                    onClick={() => setShowQuiz(true)}
                    className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/30 animate-pulse"
                  >
                    <Trophy size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
              <button 
                onClick={() => {
                  if (chapter > 1) {
                    updateLocation(selectedBook.id, chapter - 1);
                  } else {
                    const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
                    if (bookIndex > 0) {
                      const prevBook = BIBLE_BOOKS[bookIndex - 1];
                      updateLocation(prevBook.id, prevBook.chapters);
                    }
                  }
                }}
                disabled={chapter === 1 && BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id) === 0}
                className="p-3 md:p-4 bg-zinc-800 rounded-xl md:rounded-2xl text-zinc-400 hover:bg-primary hover:text-black transition-all disabled:opacity-30 flex-1 md:flex-none flex items-center justify-center"
              >
                <ChevronLeft size={20} className="md:w-6 md:h-6" />
              </button>
              <div className="px-4 md:px-6 py-3 md:py-4 bg-black rounded-xl md:rounded-2xl border-2 border-zinc-800 font-black text-white italic text-xs md:text-base flex-1 md:flex-none text-center whitespace-nowrap">
                Cap. {chapter}
              </div>
              <button 
                onClick={() => {
                  if (chapter < selectedBook.chapters) {
                    updateLocation(selectedBook.id, chapter + 1);
                  } else {
                    const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
                    if (bookIndex !== -1 && bookIndex < BIBLE_BOOKS.length - 1) {
                      const nextBook = BIBLE_BOOKS[bookIndex + 1];
                      updateLocation(nextBook.id, 1);
                    }
                  }
                }}
                disabled={chapter === selectedBook.chapters && BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id) === BIBLE_BOOKS.length - 1}
                className="p-3 md:p-4 bg-zinc-800 rounded-xl md:rounded-2xl text-zinc-400 hover:bg-primary hover:text-black transition-all disabled:opacity-30 flex-1 md:flex-none flex items-center justify-center"
              >
                <ChevronRight size={20} className="md:w-6 md:h-6" />
              </button>
            </div>
          </div>

          {/* Texto Bíblico */}
          {loading ? (
            <LoadingSpinner message="Sincronizando Manuscritos..." size="md" />
          ) : (
            <div className="space-y-1 max-w-4xl mx-auto">
              {verses.map((v) => (
                <div
                  key={v.verse}
                  onClick={() => { setSelectedVerse(v.verse); setShowNotes(true); }}
                  className={`cursor-pointer rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 transition-all group relative flex gap-3 hover:bg-primary/5 ${
                    selectedVerse === v.verse ? 'bg-primary/10 border border-primary/30' : ''
                  }`}
                >
                  <sup className="text-primary font-black text-[10px] md:text-xs mt-1 md:mt-1.5 w-4 md:w-5 shrink-0 text-right">{v.verse}</sup>
                  <p className="text-zinc-300 text-base md:text-lg leading-relaxed font-medium flex-1">
                    {v.text}
                  </p>
                  <span className="hidden md:block absolute -top-7 left-0 bg-primary text-black text-[8px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity uppercase italic whitespace-nowrap z-20">
                    ✍️ Anotar
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer do Leitor - Ação Final */}
          {!loading && (
            <div className="mt-12 md:mt-16 pt-6 md:pt-8 border-t-2 border-zinc-800 flex flex-col items-center gap-4 md:gap-6">

              {/* BOTÃO DE DEVOCIONAL PESSOAL — só aparece se este é o capítulo do dia */}
              {devotionalIndex !== null && (() => {
                const todayDev = DevotionalService.getTodayChapter(devotionalIndex);
                const isDevotionalChapter = selectedBook.id === todayDev.bookId && chapter === todayDev.chapter;
                if (!isDevotionalChapter) return null;
                return (
                  <div className="w-full max-w-md">
                    {devotionalDoneToday ? (
                      <div className="flex flex-col items-center gap-2 py-2 md:py-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/20 rounded-full flex items-center justify-center border-4 border-primary">
                          <CheckCircle2 size={24} className="text-primary md:w-7 md:h-7" />
                        </div>
                        <p className="text-primary font-black uppercase italic tracking-widest text-xs md:text-sm">Devocional Concluído! 🙏</p>
                        <p className="text-zinc-600 text-[9px] md:text-[10px] font-black uppercase">Volte amanhã para o próximo</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleCompleteDevotional}
                        disabled={isDevotionalSubmitting}
                        className="w-full flex items-center justify-center gap-2 md:gap-3 bg-primary text-black px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black uppercase italic tracking-tighter hover:scale-105 transition-all shadow-[0_0_40px_rgba(251,191,36,0.3)] disabled:opacity-50 mb-2 text-xs md:text-base"
                      >
                        <CheckCircle2 size={20} className="md:w-5 md:h-5" />
                        <span>{isDevotionalSubmitting ? 'REGISTRANDO...' : `CONCLUIR DEVOCIONAL (+${biblePoints.devotional_points} PTS)`}</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* BOTÃO DE LEITURA LIVRE (sempre disponível) */}
              {!isReadingComplete ? (
                <button
                  onClick={handleMarkAsRead}
                  disabled={isSubmitting || checkingReadStatus}
                  className={`group relative flex items-center gap-3 md:gap-4 bg-zinc-800 border-2 border-zinc-700 hover:border-primary text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl md:rounded-3xl font-black uppercase italic tracking-tighter hover:scale-105 transition-all text-xs md:text-base ${isSubmitting || checkingReadStatus ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <CheckCircle2 size={18} className="md:w-5 md:h-5" />
                  <span>{isSubmitting ? 'PROCESSANDO...' : checkingReadStatus ? 'CHECANDO...' : `MARCAR COMO LIDO (+${biblePoints.free_reading_points} PTS)`}</span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2 md:gap-3 bg-zinc-900/50 border-2 border-zinc-800 p-4 md:p-6 rounded-3xl w-full max-w-sm">
                   <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-zinc-600 shadow-inner">
                     {hasAlreadyRead ? <CheckCircle2 size={24} className="text-zinc-500 md:w-8 md:h-8" /> : <Zap size={24} className="text-primary md:w-8 md:h-8" fill="currentColor" />}
                   </div>
                   <div className="text-center">
                     <p className="text-white font-black uppercase italic tracking-widest text-xs md:text-sm">
                       {hasAlreadyRead ? 'CAPÍTULO JÁ REGISTRADO' : 'LEITURA REGISTRADA!'}
                     </p>
                     <p className="text-zinc-500 font-bold text-[8px] md:text-[10px] uppercase mt-1 tracking-wider">Você já recebeu as honras por esta leitura</p>
                   </div>
                </div>
              )}
              <p className="text-zinc-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center">
                Tradução: <span className="text-zinc-500">Almeida Revista e Corrigida</span>
              </p>
          </div>
          )}
        </div>
      </div>

      {/* ── MODAL DE QUIZ (VIA PORTAL PARA GARANTIR VISIBILIDADE) ── */}
      {showQuiz && currentQuiz && createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl"
            onClick={() => setShowQuiz(false)}
          />
          <div className="relative z-10000 w-full max-w-2xl max-h-[95vh] overflow-y-auto custom-scrollbar rounded-4xl">
            <BibleQuiz 
              quiz={currentQuiz} 
              pointsPerCorrect={biblePoints.quiz_bonus_per_correct}
              onComplete={(bonusPoints) => completeReading(biblePoints.free_reading_points + bonusPoints, 'quiz')}
              onClose={() => setShowQuiz(false)}
              onDecline={() => completeReading(biblePoints.free_reading_points, 'reading')}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ── SEARCH MODAL (CONCORDÂNCIA) ── */}
      <AnimatePresence>
        {showSearch && (
          <div key="search-modal" className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b-2 border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                      <Search className="text-primary" size={20} />
                    </div>
                    <h3 className="text-xl font-black uppercase italic text-white tracking-tight">Concordância Bíblica</h3>
                  </div>
                  <button 
                    onClick={() => setShowSearch(false)}
                    className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-zinc-700"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pesquise por palavra (ex: Jesus, amor, fé)..."
                      className="w-full bg-black/40 border-2 border-zinc-800 rounded-2xl p-4 pl-12 text-white focus:border-primary outline-none transition-all placeholder:text-zinc-600"
                      autoFocus
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSearching || searchQuery.length < 3}
                    className="w-full bg-primary text-black py-4 rounded-2xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(251,191,36,0.2)] active:scale-[0.98]"
                  >
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search size={18} />
                        <span>BUSCAR NA CONCORDÂNCIA</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {searchResults.length > 0 ? (
                  <div className="grid gap-3">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const book = BIBLE_BOOKS.find(b => b.id === result.bookId);
                          if (book) {
                            updateLocation(book.id, result.chapter);
                            setSelectedVerse(result.verse);
                            setShowSearch(false);
                          }
                        }}
                        className="w-full bg-zinc-800/40 hover:bg-zinc-800 p-4 rounded-2xl border-2 border-transparent hover:border-primary/30 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-primary font-black uppercase italic text-xs tracking-widest">
                            {result.bookName} {result.chapter}:{result.verse}
                          </span>
                          <ArrowRight size={14} className="text-zinc-600 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-zinc-300 text-sm italic leading-relaxed">
                          "{result.text}"
                        </p>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 3 && !isSearching ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 opacity-50">
                      <BookOpen size={32} className="text-zinc-500" />
                    </div>
                    <p className="text-zinc-500 font-black uppercase italic text-sm tracking-widest">Nenhum versículo encontrado</p>
                    <p className="text-zinc-600 text-xs px-10">Tente buscar por termos mais simples ou referências exatas como "João 3:16"</p>
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-40">
                    <Search size={48} className="mx-auto mb-6 text-zinc-700" />
                    <p className="text-zinc-500 font-black uppercase italic text-sm tracking-widest leading-relaxed">
                      DIGITE PELO MENOS 3 CARACTERES<br/>PARA BUSCAR NA CONCORDÂNCIA
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-zinc-950/50 border-t-2 border-zinc-800 text-[10px] text-zinc-600 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1"><Zap size={10} /> Busca em tempo real</div>
                <div className="flex items-center gap-1"><Star size={10} /> Resultados da Almeida</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SIDE PANEL PARA NOTAS ── */}
      <AnimatePresence>
        {showNotes && (
          <div key="notes-panel">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotes(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60" 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border-l-0 md:border-l-4 border-zinc-800 shadow-2xl z-70 p-6 md:p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
                    <MessageSquare className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black uppercase italic text-white tracking-tight leading-none">Notas do Estudo</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Diário de Revelação</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowNotes(false)} 
                  className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700 hover:border-zinc-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
                <div className="bg-black/40 p-5 md:p-6 rounded-4xl border-2 border-zinc-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Star size={64} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Versículo Selecionado</p>
                  </div>
                  <p className="text-white font-bold italic leading-relaxed text-base md:text-lg">
                     <span className="text-primary mr-2 block md:inline mb-1 md:mb-0 drop-shadow-[0_0_8px_rgba(var(--primary-color-rgb),0.3)]">
                       {selectedBook.name} {chapter}:{selectedVerse}
                     </span>
                     "{verses.find(v => v.verse === selectedVerse)?.text}"
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-3 block">Sua Revelação / Comentário</label>
                    <textarea 
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="O que Deus falou com você através deste versículo?"
                      className="w-full h-40 md:h-56 bg-black/40 border-2 border-zinc-800 rounded-4xl p-5 md:p-6 text-white text-sm md:text-base focus:border-primary outline-none transition-all resize-none placeholder:text-zinc-700 shadow-inner"
                    />
                  </div>

                  <div className="grid gap-3 pt-4">
                    <button
                      onClick={saveNote}
                      className="w-full bg-primary text-black py-4 md:py-5 rounded-2xl md:rounded-4xl font-black uppercase italic tracking-tighter hover:bg-white transition-all shadow-[0_10px_30px_-10px_rgba(var(--primary-color-rgb),0.5)] active:scale-[0.98] text-base md:text-lg flex items-center justify-center gap-3"
                    >
                      <Zap size={20} className="fill-current" />
                      SALVAR NO DIÁRIO
                    </button>
                    
                    <button
                      onClick={() => {
                        setMuralInitialData({
                          postType: 'text',
                          verseRef: `${selectedBook.name} ${chapter}:${selectedVerse}`,
                          verseText: verses.find(v => v.verse === selectedVerse)?.text ?? '',
                          verseBookId: selectedBook.id,
                          verseChapter: chapter,
                          verseNumber: selectedVerse ?? 0,
                          caption: noteText,
                        });
                        setShowMuralComposer(true);
                        setShowNotes(false);
                      }}
                      className="w-full bg-zinc-800/50 border-2 border-primary/20 text-primary py-3 md:py-4 rounded-2xl md:rounded-3xl font-black uppercase italic tracking-tighter hover:bg-primary/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-xs md:text-sm"
                    >
                      <Share2 size={18} /> Compartilhar no Mural
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-zinc-800/50 space-y-4">
                   <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Star size={14} className="text-primary/50" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Sincronização em tempo real</span>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mural Composer — aberto a partir do painel de notas */}
      <AnimatePresence>
        {showMuralComposer && (
          <PostComposer
            initialData={muralInitialData}
            onPublished={() => {}}
            onClose={() => setShowMuralComposer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Exportação do PostComposer dentro do BibleViewer é feita via portal abaixo
// O componente real é renderizado no BibleViewerWithComposer que envolve o export
