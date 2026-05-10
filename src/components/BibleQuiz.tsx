import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Trophy, HelpCircle, Zap, BookOpen, ArrowRight } from 'lucide-react';
import { BibleQuiz as BibleQuizType } from '../types';
import { useAuth } from '../context/useAuth';
import { NotificationService } from '../lib/NotificationService';

interface BibleQuizProps {
  quiz: BibleQuizType | null;
  onComplete: (score: number) => void;
  onClose: () => void;
  onDecline?: () => void;
  pointsPerCorrect?: number;
}

// Ícone de letra para cada opção
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function BibleQuiz({ quiz, onComplete, onClose, onDecline, pointsPerCorrect = 5 }: BibleQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);

  const { profile } = useAuth();

  if (!quiz) return null;

  const handleAnswer = (index: number) => {
    if (showFeedback) return;

    setSelectedOption(index);
    setShowFeedback(true);

    const isCorrect = index === quiz.questions[currentQuestion].correctIndex;
    if (isCorrect) setScore(prev => prev + 1);
    setResults(prev => [...prev, isCorrect]);

    setTimeout(() => {
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOption(null);
        setShowFeedback(false);
      } else {
        setIsFinished(true);
      }
    }, 1800);
  };

  // ── TELA DE RESULTADO ──────────────────────────────────────────────────────
  if (isFinished) {
    const totalQ = quiz.questions.length;
    const pct = Math.round((score / totalQ) * 100);
    const finalPoints = score * pointsPerCorrect;
    const isPerfect = score === totalQ;
    const isGood = pct >= 60;

    const handleCollect = async () => {
      setIsCollecting(true);
      try {
        if (profile) {
          await NotificationService.notifyStaff(
            profile.groupId,
            'achievement',
            'Quiz Respondido!',
            `${profile.name} respondeu um Quiz Bíblico e acertou ${score}/${totalQ} perguntas.`,
            undefined,
            profile.avatar_url || profile.avatarUrl
          );
        }
        await onComplete(finalPoints);
      } finally {
        setIsCollecting(false);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        <div className={`bg-zinc-900 border-4 rounded-[3.5rem] p-8 md:p-12 text-center space-y-8 shadow-2xl relative ${
          isPerfect ? 'border-primary shadow-[0_0_80px_rgba(251,191,36,0.3)]' : 'border-zinc-800'
        }`}>
          {/* Efeito de brilho de fundo */}
          {isPerfect && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 blur-[100px] rounded-full" />}

          {/* Ícone de resultado com animação */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto border-4 relative z-10 ${
              isPerfect ? 'bg-primary border-primary shadow-[0_0_40px_rgba(251,191,36,0.4)]' : isGood ? 'bg-zinc-800 border-zinc-700' : 'bg-red-900/30 border-red-800'
            }`}
          >
            {isPerfect
              ? <Trophy size={56} className="text-black" />
              : isGood
              ? <Zap size={56} className="text-primary" fill="currentColor" />
              : <BookOpen size={56} className="text-zinc-400" />
            }
          </motion.div>

          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2">
              {isPerfect ? '🔥 PERFORMANCE ABSOLUTA' : isGood ? '✅ BOM DESEMPENHO' : '📖 CONTINUE FIRME'}
            </p>
            <h2 className="text-5xl font-black uppercase italic text-white leading-none tracking-tighter">
              {isPerfect ? 'MESTRE DA PALAVRA!' : isGood ? 'DESAFIO VENCIDO!' : 'QUIZ CONCLUÍDO'}
            </h2>
          </div>

          {/* Grid de Estatísticas Premium */}
          <div className="grid grid-cols-3 gap-6 relative z-10">
            <div className="bg-black/60 rounded-4xl p-6 border-2 border-zinc-800 flex flex-col items-center justify-center">
              <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Acertos</p>
              <p className="text-3xl font-black text-white italic">{score}<span className="text-sm text-zinc-700 not-italic ml-1">/{totalQ}</span></p>
            </div>
            <div className="bg-black/60 rounded-4xl p-6 border-2 border-zinc-800 flex flex-col items-center justify-center">
              <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Precisão</p>
              <p className={`text-3xl font-black italic ${isPerfect ? 'text-primary' : isGood ? 'text-green-400' : 'text-red-400'}`}>{pct}%</p>
            </div>
            <div className="bg-primary rounded-4xl p-6 border-2 border-primary/50 shadow-[0_10px_30px_rgba(251,191,36,0.2)] flex flex-col items-center justify-center">
              <p className="text-[10px] font-black uppercase text-black/40 mb-1 leading-none">XP BÔNUS</p>
              <p className="text-3xl font-black text-black italic">+{finalPoints}</p>
            </div>
          </div>

          {/* Revisão Simplificada e Elegante */}
          <div className="space-y-3 text-left max-h-48 overflow-y-auto pr-2 custom-scrollbar relative z-10">
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-1 mb-2">Revisão Rápida</p>
            {quiz.questions.map((q, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                results[i] ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  results[i] ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {results[i] ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-300 truncate">{q.question}</p>
                  {!results[i] && (
                    <p className="text-[10px] text-green-500 font-black uppercase mt-1">
                      Correto: {q.options[q.correctIndex]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleCollect}
            disabled={isCollecting}
            className={`w-full group relative overflow-hidden bg-primary text-black py-6 rounded-4xl font-black uppercase italic tracking-tighter transition-all text-xl shadow-[0_20px_40px_rgba(251,191,36,0.2)] hover:scale-[1.02] active:scale-95 ${isCollecting ? 'opacity-70 cursor-wait' : ''}`}
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <span>{isCollecting ? 'PROCESSANDO...' : `COLETAR ${finalPoints} XP + LEITURA`}</span>
              {!isCollecting && <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />}
            </div>
            {/* Efeito de brilho no botão */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </motion.div>
    );
  }

  // ── TELA DE PERGUNTA ───────────────────────────────────────────────────────
  const q = quiz.questions[currentQuestion];
  const progress = ((currentQuestion) / quiz.questions.length) * 100;

  return (
    <div className="max-w-2xl w-full">
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="bg-zinc-900 border-4 border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl"
      >
        {/* Barra de Progresso */}
        <div className="relative h-1.5 bg-zinc-800">
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        <div className="p-8 lg:p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/40">
                <HelpCircle size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
                  Questão {currentQuestion + 1} / {quiz.questions.length}
                </p>
                <p className="text-[10px] font-black text-zinc-400 uppercase italic">Quiz Bíblico</p>
              </div>
            </div>
            {/* Mini score tracker */}
            <div className="flex gap-1.5">
              {quiz.questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-all ${
                    i < currentQuestion
                      ? results[i] ? 'bg-green-500' : 'bg-red-500'
                      : i === currentQuestion
                      ? 'bg-primary'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Contexto/versículo de referência (se disponível) */}
          {q.verseRef && (
            <div className="bg-black/30 border border-zinc-800 rounded-2xl px-5 py-3 mb-6 flex items-start gap-3">
              <BookOpen size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-[10px] text-zinc-500 italic leading-relaxed">
                <span className="text-primary font-black mr-2">{q.verseRef.ref}</span>
                "{q.verseRef.text}"
              </p>
            </div>
          )}

          {/* Pergunta */}
          <h4 className="text-xl lg:text-2xl font-black text-white mb-8 leading-snug">
            {q.question}
          </h4>

          {/* Opções */}
          <div className="space-y-3">
            {q.options.map((option, idx) => {
              let base = "bg-black/30 border-zinc-800 text-zinc-400";
              let hover = "hover:border-primary/60 hover:text-white hover:bg-primary/5";
              let letterBg = "bg-zinc-800 text-zinc-500";

              if (showFeedback) {
                if (idx === q.correctIndex) {
                  base = "bg-green-500/15 border-green-500 text-green-300";
                  letterBg = "bg-green-500 text-black";
                  hover = "";
                } else if (idx === selectedOption) {
                  base = "bg-red-500/15 border-red-500 text-red-400";
                  letterBg = "bg-red-500 text-black";
                  hover = "";
                } else {
                  base = "opacity-25 border-zinc-800 text-zinc-600";
                  hover = "";
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={!showFeedback ? { scale: 1.01 } : {}}
                  whileTap={!showFeedback ? { scale: 0.99 } : {}}
                  onClick={() => handleAnswer(idx)}
                  disabled={showFeedback}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${base} ${hover}`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${letterBg}`}>
                    {OPTION_LETTERS[idx]}
                  </span>
                  <span className="font-bold text-sm leading-snug flex-1">{option}</span>
                  <AnimatePresence>
                    {showFeedback && idx === q.correctIndex && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                      </motion.div>
                    )}
                    {showFeedback && idx === selectedOption && idx !== q.correctIndex && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <XCircle size={18} className="text-red-500 shrink-0" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Botões de saída — ambos travados durante processamento para evitar duplo callback */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-6">
        <button
          onClick={onClose}
          disabled={isCollecting}
          className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <BookOpen size={14} /> Fechar e Voltar ao Texto
        </button>
        
        {onDecline && (
          <button
            onClick={() => {
              if (isCollecting) return; // Guard extra contra duplo clique
              setIsCollecting(true);
              onDecline();
            }}
            disabled={isCollecting}
            className="text-red-500/70 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 disabled:opacity-40"
          >
            <Zap size={14} /> {isCollecting ? 'PROCESSANDO...' : 'Pular Quiz e Coletar Só Leitura'}
          </button>
        )}
      </div>
    </div>
  );
}
