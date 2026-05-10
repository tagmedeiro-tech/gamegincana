import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Users, Zap, CheckCircle2, XCircle, Trophy, Clock, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { DuelService, DuelQuestion, DuelRoom, OnlinePlayer } from '../lib/DuelService';
import { NotificationService } from '../lib/NotificationService';
import { FeedService } from '../lib/FeedService';
import { useToast } from '../context/ToastContext';

import { useAppTheme } from '../hooks/useAppTheme';
import { useAudio } from '../context/AudioContext';

// Fallbacks caso o tema não tenha carregado
const DEFAULT_QUESTION_TIME = 20;
const DEFAULT_TOTAL_QUESTIONS = 10;

export default function Duel() {
  const { profile, refreshProfile } = useAuth();
  const theme = useAppTheme();
  const { playClick, playEpicImpact, playVictory, playWoosh, playSuccess, playFire } = useAudio();
  
  // Configurações vindas do tema
  const settings = theme.duelSettings || {
    totalQuestions: DEFAULT_TOTAL_QUESTIONS,
    questionTime: DEFAULT_QUESTION_TIME,
    winPoints: 60, drawPoints: 30, lossPoints: 15,
    winCoins: 20, drawCoins: 10, lossCoins: 5,
    waitTimeBetweenQuestions: 1500
  };

  const [view, setView] = useState<'lobby' | 'challenge_sent' | 'challenge_received' | 'game' | 'waiting_results' | 'results'>('lobby');
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [room, setRoom] = useState<DuelRoom | null>(null);
  const [questions, setQuestions] = useState<DuelQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(settings.questionTime);
  const [answered, setAnswered] = useState(false);
  const [myAnswersCount, setMyAnswersCount] = useState(0);
  const [oppAnswersCount, setOppAnswersCount] = useState(0);
  const [oppCurrentQ, setOppCurrentQ] = useState(1);
  const [isChallenging, setIsChallenging] = useState(false);
  const [forfeitPending, setForfeitPending] = useState(false); // Controle de duplo-clique para desistência
  const [results, setResults] = useState<{ winner: string | null; myScore: number; oppScore: number } | null>(null);
  const { info, error: toastError } = useToast();
  const presenceChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const roomChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botTimers = useRef<NodeJS.Timeout[]>([]);
  const qStartTime = useRef<number>(Date.now());
  const endGameCalled = useRef(false); // Guard: evita dupla execução do endGame

  const isChallenger = room?.challenger_id === profile?.id;
  const opponentName = isChallenger ? room?.challenged_name : room?.challenger_name;

  // ── PRESENCE ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    const channelName = `duel-lobby-${profile.id}-${Date.now()}`; // ID único evita colisão ao remover+recriar
    
    const ch = supabase.channel(channelName, { config: { presence: { key: profile.id } } });
    presenceChannel.current = ch;

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<OnlinePlayer>();
      const playersMap = new Map<string, OnlinePlayer>();
      Object.values(state).forEach(presences => {
        (presences as any[]).forEach(p => {
          if (p.userId !== profile.id) {
            playersMap.set(p.userId, p);
          }
        });
      });
      setOnlinePlayers(Array.from(playersMap.values()));
    }).subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        console.log('[Duel] Presença conectada ao lobby global');
        await ch.track({
          userId: profile.id,
          name: profile.name,
          groupId: profile.groupId,
          totalPoints: profile.totalPoints,
          onlineSince: Date.now(),
          status: view,
        });
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[Duel] Erro no canal de presença: ${status}`);
        toastError('Lobby Indisponível', 'Houve uma falha ao conectar com outros jogadores. Tente recarregar a página.');
      }
    });

    return () => { supabase.removeChannel(ch); };
  }, [profile?.id]);

  // Atualiza o status no presence toda vez que a view muda (ex: entra em 'game')
  useEffect(() => {
    if (profile && presenceChannel.current && presenceChannel.current.state === 'joined') {
      presenceChannel.current.track({
        userId: profile.id,
        name: profile.name,
        groupId: profile.groupId,
        totalPoints: profile.totalPoints,
        onlineSince: Date.now(),
        status: view,
      }).catch(() => {});
    }
  }, [view]);

  // ── CHECAR SALA PENDENTE ──────────────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    const checkPending = async () => {
      if (!profile?.id) return;
      const pending = await DuelService.getPendingRoom(profile.id);
      if (!pending) return;
      
      // Só atualiza se for uma sala diferente ou se o status mudou
      setRoom(prev => {
        if (prev?.id === pending.id && prev?.status === pending.status) return prev;
        
        if (pending.status === 'waiting' && pending.challenged_id === profile.id) setView('challenge_received');
        else if (pending.status === 'active' && view !== 'game') startGame(pending);
        else if (pending.status === 'waiting' && pending.challenger_id === profile.id) setView('challenge_sent');
        
        return pending;
      });
    };
    
    checkPending();
    
    // Fallback: Checagem manual a cada 5 segundos (caso o Realtime falhe)
    const pollInterval = setInterval(checkPending, 5000);

    // 🔔 LISTENER GLOBAL DE DESAFIOS (Realtime)
    const gChName = `duel-global-${profile.id}`;
    supabase.removeChannel(supabase.channel(gChName));
    const globalCh = supabase.channel(gChName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'duel_rooms'
      }, (payload) => {
        const r = payload.new as DuelRoom;
        if (!r) return;

        // Sou o desafiado e a sala é nova OU recebi um convite pendente
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && 
            r.challenged_id === profile.id && r.status === 'waiting' && view === 'lobby') {
          console.log('[Duel] Desafio detectado para mim:', r.id);
          setRoom(r);
          setView('challenge_received');
          playFire();
        }
        
        // Sou o desafiante e o oponente aceitou
        if (payload.eventType === 'UPDATE' && r.challenger_id === profile.id && r.status === 'active') {
          setRoom(r);
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(globalCh);
      clearInterval(pollInterval);
    };
  }, [profile?.id]); // Removido 'view' para estabilidade

  // 🏁 MONITORAMENTO DE INÍCIO DE JOGO
  // Sempre que o status da sala mudar para 'active', dispara o carregamento das questões
  useEffect(() => {
    if (room?.status === 'active' && view !== 'game' && view !== 'waiting_results' && view !== 'results') {
      console.log('[Duel] Sala ativa detectada! Iniciando jogo...', room.id);
      startGame(room);
    }
  }, [room?.status, view, room?.id]);

  // ── SUBSCRIPTION DA SALA ──────────────────────────────────────────────────
  useEffect(() => {
    if (!room || room.challenged_id === 'BOT') return;
    if (roomChannel.current) supabase.removeChannel(roomChannel.current);
    const ch = supabase.channel(`duel-room-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duel_rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const updated = payload.new as DuelRoom;
        setRoom(updated);
        // O início do jogo agora é tratado pelo useEffect de monitoramento de status abaixo
        if (updated.status === 'declined') { 
          const isChall = updated.challenger_id === profile?.id;
          if (isChall) info('Desafio Recusado', 'O desafio foi recusado pelo oponente.'); 
          else info('Desafio Cancelado', 'O oponente cancelou o desafio.');
          resetDuel(); 
        }
        if (updated.status === 'expired') {
          info('Duelo Expirado', 'A partida foi cancelada por inatividade ou queda de conexão.');
          resetDuel();
        }
        if (updated.status === 'finished') {
           const isChall = updated.challenger_id === profile?.id;
           setResults({ 
              winner: updated.winner_id ?? null, 
              myScore: isChall ? updated.challenger_score : updated.challenged_score, 
              oppScore: isChall ? updated.challenged_score : updated.challenger_score 
           });
           setView('results');
           refreshProfile();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'duel_answers' }, (payload) => {
        const ans = payload.new as { room_id: string; user_id: string; is_correct: boolean; question_index: number };
        if (!ans || ans.room_id !== room.id) return;
        
        const isOpp = ans.user_id !== profile?.id;
        if (isOpp) {
          console.log('[Duel] Resposta do oponente recebida:', ans);
          setOppAnswersCount(c => c + 1);
          setOppCurrentQ(ans.question_index + 2);
          if (ans.is_correct) setOppScore(s => s + 1);
        }
      });
    ch.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[Duel] Erro no canal da sala: ${status}`);
        toastError('Falha na Partida', 'A conexão com a partida foi perdida.');
        resetDuel();
      }
    });
    roomChannel.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [room?.id]);

  const startGame = useCallback(async (r: DuelRoom) => {
    if (!r.question_ids?.length) return;
    const qs = await DuelService.getRoomQuestions(r.question_ids);
    setQuestions(qs);
    setCurrentQ(0); setMyScore(0); setOppScore(0); setSelected(null); setAnswered(false);
    setMyAnswersCount(0); setOppAnswersCount(0); setOppCurrentQ(1);
    setTimeLeft(settings.questionTime);
    qStartTime.current = Date.now();
    playEpicImpact();
    setView('game');

    // Se for um BOT, simular respostas do oponente
    if (r.challenged_id === 'BOT') {
      simulateBotOpponent(r);
    }
  }, [settings.questionTime]);

  // Simulação de BOT (responde aleatoriamente entre 3s e o tempo limite)
  const simulateBotOpponent = (r: DuelRoom) => {
    botTimers.current.forEach(clearTimeout);
    botTimers.current = [];
    let botScore = 0;
    for (let i = 0; i < settings.totalQuestions; i++) {
      const delay = 3000 + Math.random() * (settings.questionTime * 1000 - 4000);
      const timer = setTimeout(() => {
        const isCorrect = Math.random() > 0.4; // 60% de chance de acerto
        setOppAnswersCount(c => c + 1);
        setOppCurrentQ(i + 2);
        if (isCorrect) {
          botScore++;
          setOppScore(s => s + 1);
        }
      }, (i * settings.questionTime * 1000) + delay);
      botTimers.current.push(timer);
    }
  };

  // Timer
  useEffect(() => {
    if (view !== 'game') return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleTimeout(); return settings.questionTime; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view, currentQ]);

  // handleTimeout usa uma ref para evitar closure obsoleto
  const answeredRef = useRef(answered);
  useEffect(() => { answeredRef.current = answered; }, [answered]);

  // Bug fix: não depende de handleAnswer (circular) — chama diretamente com índice -1
  const handleTimeout = useCallback(() => {
    if (!answeredRef.current) handleAnswer(-1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = useCallback(async (idx: number) => {
    if (answered || !profile || !room || !questions[currentQ]) return;
    setAnswered(true);
    setSelected(idx);
    if (timerRef.current) clearInterval(timerRef.current);

    const q = questions[currentQ];
    const correct = idx === q.correct_index;
    if (correct) {
      setMyScore(s => s + 1);
      playSuccess();
    } else {
      playClick();
    }
    const ms = Date.now() - qStartTime.current;

    if (room.challenged_id !== 'BOT') {
      await DuelService.submitAnswer({
        roomId: room.id, userId: profile.id,
        questionIndex: currentQ, answerIndex: idx,
        isCorrect: correct, responseMs: ms,
      });
    }

    setTimeout(() => {
      // Bug fix: incrementa a contagem apenas APÓS o delay visual.
      // Isso garante que na 10ª pergunta o usuário tenha tempo de ver se acertou/errou antes do React desmontar a tela.
      setMyAnswersCount(c => c + 1);
      
      if (currentQ + 1 < settings.totalQuestions) {
        setCurrentQ(q => q + 1);
        setSelected(null); setAnswered(false);
        setTimeLeft(settings.questionTime);
        qStartTime.current = Date.now();
      }
    }, settings.waitTimeBetweenQuestions);
  }, [answered, profile, room, questions, currentQ, myScore, oppScore, settings]);

  // Hook de sincronização de final de jogo
  useEffect(() => {
    if (view === 'game' || view === 'waiting_results') {
      if (myAnswersCount >= settings.totalQuestions) {
        if (room?.challenged_id === 'BOT') {
          if (view !== 'results') {
            botTimers.current.forEach(clearTimeout);
            botTimers.current = [];
            
            // Fast-forward the bot's remaining answers instantly
            const remaining = settings.totalQuestions - oppAnswersCount;
            let finalBotScore = oppScore;
            for (let i = 0; i < remaining; i++) {
               if (Math.random() > 0.4) finalBotScore++; // 60% chance
            }
            endGame(myScore, finalBotScore);
          }
          return;
        }

        if (oppAnswersCount >= settings.totalQuestions) {
          if (view !== 'results') {
            endGame(myScore, oppScore);
          }
        } else {
          if (view !== 'waiting_results') setView('waiting_results');
        }
      }
    }
  }, [myAnswersCount, oppAnswersCount, view, myScore, oppScore, room, settings.totalQuestions]);

  const endGame = async (finalMyScore: number, finalOppScore: number) => {
    if (!room || !profile) return;
    // Guard: evita dupla execução se os dois clientes terminarem simultaneamente
    if (endGameCalled.current) return;
    endGameCalled.current = true;
    const isChall = room.challenger_id === profile.id;
    const chScore = isChall ? finalMyScore : finalOppScore;
    const cdScore = isChall ? finalOppScore : finalMyScore;
    
    try {
      if (room.challenged_id === 'BOT') {
        const iWon = finalMyScore > finalOppScore;
        const isDraw = finalMyScore === finalOppScore;
        
        // No points awarded for bot training mode
        setResults({ winner: iWon ? profile.id : (isDraw ? null : 'BOT'), myScore: finalMyScore, oppScore: finalOppScore });
        setView('results');
        // Bug fix: reseta o guard para permitir nova partida contra BOT
        endGameCalled.current = false;
        await refreshProfile();
        return;
      }

      const data = await DuelService.finalizeDuel(room.id, chScore, cdScore, {
        winPoints: settings.winPoints,
        lossPoints: settings.lossPoints,
        drawPoints: settings.drawPoints,
        winCoins: settings.winCoins,
        lossCoins: settings.lossCoins,
        drawCoins: settings.drawCoins,
      });
      if (data) {
        // Notify both groups only once (Winner notifies, or Challenger if draw)
        const iWon = data.winner_id === profile.id;
        const isDraw = data.winner_id === null;
        
        if (iWon || (isDraw && isChall)) {
          const resultTitle = iWon ? 'Vitória no Duelo!' : 'Empate no Duelo!';
          const resultContent = `${room.challenger_name} e ${room.challenged_name} duelaram. O placar foi ${chScore} x ${cdScore}.`;
          const actorAvatar = profile.avatar_url || (profile as any).avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`;
          
          await NotificationService.notifyStaff(room.challenger_group_id, 'achievement', resultTitle, resultContent, undefined, actorAvatar);
          if (room.challenger_group_id !== room.challenged_group_id) {
            await NotificationService.notifyStaff(room.challenged_group_id, 'achievement', resultTitle, resultContent, undefined, actorAvatar);
          }

          if (iWon) {
            await FeedService.createPost({
              authorId: profile.id, groupId: profile.groupId, postType: 'duel_victory',
              duelId: room.id,
              duelOpponentName: opponentName,
              // Bug fix: campo ausente causava post sem nome do grupo oponente no mural
              duelOpponentGroupName: isChall ? room.challenged_group_id : room.challenger_group_id,
              duelScore: `${finalMyScore} x ${finalOppScore}`,
            }).catch(console.error);
          }
        }

        setResults({ winner: data.winner_id, myScore: finalMyScore, oppScore: finalOppScore });
        if (iWon) playVictory();
        else playEpicImpact();
        setView('results');
        await refreshProfile();
      }
    } catch (err) {
      console.error("Erro ao finalizar duelo:", err);
    }
  };

  const sendChallenge = async (player: OnlinePlayer | { userId: string, name: string, groupId: string }) => {
    if (!profile || isChallenging) return;
    setIsChallenging(true);
    try {
      const qs = await DuelService.fetchQuestions(settings.totalQuestions);
      if (qs.length < 5) { toastError('Sem Perguntas', 'Perguntas insuficientes. Peça ao admin para adicionar perguntas!'); return; }
      
      if (player.userId === 'BOT') {
        const botRoom: DuelRoom = {
          id: 'bot-room-' + Date.now(),
          challenger_id: profile.id,
          challenged_id: 'BOT',
          challenger_group_id: profile.groupId,
          challenged_group_id: 'BOT',
          challenger_name: profile.name,
          challenged_name: player.name,
          question_ids: qs.map(q => q.id),
          status: 'active',
          challenger_score: 0,
          challenged_score: 0,
          created_at: new Date().toISOString()
        };
        setRoom(botRoom);
        startGame(botRoom);
        return;
      }

      const r = await DuelService.createRoom({
        challengerId: profile.id, challengedId: player.userId,
        challengerGroupId: profile.groupId, challengedGroupId: player.groupId,
        challengerName: profile.name, challengedName: player.name,
        questionIds: qs.map(q => q.id),
      });
      if (r) { 
        setRoom(r); 
        playWoosh();
        setView('challenge_sent'); 
        const actorAvatar = profile.avatar_url || (profile as any).avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`;
        await NotificationService.notifyStaff(profile.groupId, 'achievement', '⚔️ Desafio em Andamento', `${profile.name} desafiou ${player.name} para um duelo!`, undefined, actorAvatar);
        // Nota: a notificação para o oponente já é enviada pelo DuelService.createRoom (linha 87)
        // Não duplicar chamando NotificationService.send() aqui
      }
    } finally {
      setIsChallenging(false);
    }
  };

  const acceptChallenge = async () => {
    if (!room) return;
    await DuelService.acceptRoom(room.id);
  };

  const declineChallenge = async () => {
    if (!room) return;
    await DuelService.declineRoom(room.id);
    resetDuel();
  };

  const cancelChallenge = async () => {
    if (!room) return;
    await DuelService.declineRoom(room.id);
    resetDuel();
  };

  const resetDuel = () => {
    if (roomChannel.current) supabase.removeChannel(roomChannel.current);
    botTimers.current.forEach(clearTimeout);
    endGameCalled.current = false;
    setForfeitPending(false);
    setRoom(null); setView('lobby'); setQuestions([]); setResults(null);
    setMyScore(0); setOppScore(0); setCurrentQ(0);
    setMyAnswersCount(0); setOppAnswersCount(0);
  };

  const handleForfeit = async () => {
    if (!forfeitPending) {
      // Primeiro clique: avisa o usuário
      setForfeitPending(true);
      info('Confirmar Desistência?', 'Clique em "Desistir" novamente para confirmar. Isso contará como derrota.');
      setTimeout(() => setForfeitPending(false), 5000); // Reseta após 5s
      return;
    }
    // Segundo clique: executa
    setForfeitPending(false);
    if (room && room.challenged_id !== 'BOT') {
      await endGame(0, settings.totalQuestions);
    } else {
      resetDuel();
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-20 max-w-3xl mx-auto">
      <header className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Batalha Bíblica</p>
        <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
          Duelo<span className="text-primary block">Sagrado</span>
        </h1>
        <p className="text-zinc-500 font-bold italic text-sm mt-3">Desafie membros de outras tribos e prove seu conhecimento!</p>
      </header>

      <AnimatePresence mode="wait">
        {view === 'lobby' && <LobbyView key="lobby" players={onlinePlayers} isChallenging={isChallenging} onChallenge={sendChallenge} />}
        {view === 'challenge_sent' && <WaitingView key="sent" opponentName={room?.challenged_name ?? ''} onCancel={cancelChallenge} />}
        {view === 'challenge_received' && (
          <ChallengeReceivedView key="recv" challengerName={room?.challenger_name ?? ''} onAccept={acceptChallenge} onDecline={declineChallenge} />
        )}
        {view === 'game' && questions[currentQ] && (
          <GameView key="game"
            question={questions[currentQ]}
            questionNum={currentQ + 1}
            total={settings.totalQuestions}
            timeLeft={timeLeft}
            maxTime={settings.questionTime}
            myScore={myScore}
            oppScore={oppScore}
            myName={profile?.name ?? ''}
            oppName={opponentName ?? ''}
            oppCurrentQ={oppCurrentQ}
            selected={selected}
            onAnswer={handleAnswer}
            onForfeit={handleForfeit}
            forfeitPending={forfeitPending}
          />
        )}
        {view === 'waiting_results' && (
          <motion.div key="waiting_results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-8 py-16 text-center">
            <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-zinc-500 font-black uppercase text-xs tracking-widest mb-2">Aguardando Oponente</p>
              <h2 className="text-4xl font-black text-white uppercase italic">{opponentName}</h2>
              <p className="text-zinc-400 font-bold mt-4">Ele está na questão {Math.min(oppCurrentQ, settings.totalQuestions)}/{settings.totalQuestions}</p>
            </div>
          </motion.div>
        )}
        {view === 'results' && results && (
          <ResultsView key="results"
            myName={profile?.name ?? ''}
            oppName={opponentName ?? ''}
            myScore={results.myScore}
            oppScore={results.oppScore}
            iWon={results.winner === profile?.id}
            isDraw={results.winner === null}
            isBotMatch={room?.challenged_id === 'BOT'}
            onClose={resetDuel}
            settings={settings}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SUB-VIEWS ─────────────────────────────────────────────────────────────────

function LobbyView({ players, isChallenging, onChallenge }: { players: OnlinePlayer[]; isChallenging: boolean; onChallenge: (p: any) => Promise<void> | void; key?: React.Key }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex items-center gap-3 bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-5">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        <p className="text-zinc-400 font-black uppercase text-xs tracking-widest">{players.length} jogador{players.length !== 1 ? 'es' : ''} de outras tribos online</p>
      </div>

      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <Swords size={48} className="text-zinc-700" />
          <p className="text-zinc-500 font-black uppercase italic text-sm">Nenhum oponente disponível no momento</p>
          <p className="text-zinc-700 text-xs">Aguarde outros membros de diferentes tribos entrarem</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {players.map(p => {
            const isBusy = p.status === 'game' || p.status === 'waiting_results';
            return (
              <motion.div key={p.userId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-zinc-900 border-2 rounded-3xl p-5 flex items-center gap-4 transition-all ${isBusy ? 'border-zinc-800 opacity-60' : 'border-zinc-800 hover:border-primary/40'}`}>
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-black text-xl">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-black uppercase italic">{p.name}</p>
                  <p className="text-zinc-500 text-xs font-bold">{p.groupName ?? 'Sem Tribo'} · {p.totalPoints} pts</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isBusy ? 'bg-red-500' : 'bg-green-400'}`} />
                  <button onClick={() => onChallenge(p)} disabled={isChallenging || isBusy}
                    className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-2xl font-black uppercase text-xs hover:bg-white active:scale-95 transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500">
                    {isChallenging && !isBusy ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />} 
                    {isBusy ? 'Em Batalha' : 'Desafiar'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Botão de BOT sempre visível no final */}
      <div className="mt-8 pt-8 border-t border-zinc-800">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4 text-center">Ou pratique sozinho</p>
        <button onClick={() => onChallenge({ userId: 'BOT', name: 'Mestre da Lei (BOT)', groupId: 'BOT' })}
          className="w-full flex items-center justify-center gap-3 bg-zinc-800 border-2 border-zinc-700 hover:border-primary/50 text-white p-5 rounded-3xl font-black uppercase italic transition-all active:scale-95 group">
          <Zap size={24} className="text-primary group-hover:animate-pulse" />
          Treinar com Bot (Offline)
        </button>
      </div>
    </motion.div>
  );
}

function WaitingView({ opponentName, onCancel }: { opponentName: string; onCancel: () => void; key?: React.Key }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-8 py-16 text-center">
      <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <div>
        <p className="text-zinc-500 font-black uppercase text-xs tracking-widest mb-2">Aguardando resposta de</p>
        <h2 className="text-4xl font-black text-white uppercase italic">{opponentName}</h2>
      </div>
      <button onClick={onCancel} className="text-zinc-600 hover:text-zinc-400 font-black uppercase text-xs active:scale-95 transition-colors">Cancelar desafio</button>
    </motion.div>
  );
}

function ChallengeReceivedView({ challengerName, onAccept, onDecline }: { challengerName: string; onAccept: () => Promise<void> | void; onDecline: () => Promise<void> | void; key?: React.Key }) {
  const { playFire } = useAudio();
  
  useEffect(() => {
    playFire();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border-4 border-primary rounded-4xl p-10 text-center space-y-6 shadow-[0_0_60px_rgba(251,191,36,0.2)]">
      <div className="text-5xl animate-bounce">⚔️</div>
      <div>
        <p className="text-primary font-black uppercase text-xs tracking-widest mb-2">Desafio recebido!</p>
        <h2 className="text-3xl font-black text-white uppercase italic">{challengerName}</h2>
        <p className="text-zinc-500 mt-2 font-bold">desafia você para um Duelo Sagrado!</p>
      </div>
      <div className="flex gap-4">
        <button onClick={onDecline} className="flex-1 py-4 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded-2xl font-black uppercase text-sm active:scale-95 transition-all">Recusar</button>
        <button onClick={onAccept} className="flex-1 py-4 bg-primary text-black rounded-2xl font-black uppercase text-sm hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-2">
          <Swords size={18} /> Aceitar Duelo!
        </button>
      </div>
    </motion.div>
  );
}

function GameView({ question, questionNum, total, timeLeft, maxTime, myScore, oppScore, myName, oppName, oppCurrentQ, selected, onAnswer, onForfeit, forfeitPending }: {
  question: DuelQuestion; questionNum: number; total: number; timeLeft: number; maxTime: number;
  myScore: number; oppScore: number; myName: string; oppName: string; oppCurrentQ: number;
  selected: number | null; onAnswer: (idx: number) => Promise<void> | void; onForfeit: () => void;
  forfeitPending?: boolean; key?: React.Key;
}) {
  const pct = (timeLeft / maxTime) * 100;
  const urgent = timeLeft <= 5;

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onForfeit} className={`text-[10px] font-black uppercase transition-colors flex items-center gap-1 ${forfeitPending ? 'text-red-500 animate-pulse' : 'text-zinc-600 hover:text-red-500'}`}>
          <XCircle size={12} /> {forfeitPending ? 'CONFIRMAR DESISTÊNCIA?' : 'Desistir da Batalha'}
        </button>
      </div>
      {/* Placar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-3 text-center">
          <p className="text-white font-black text-2xl italic">{myScore}</p>
          <p className="text-zinc-600 text-[9px] font-black uppercase truncate">{myName}</p>
        </div>
        <div className="bg-zinc-900 border-2 border-primary/30 rounded-2xl p-3 text-center">
          <p className={`font-black text-xl italic ${urgent ? 'text-red-400' : 'text-primary'}`}>{timeLeft}s</p>
          <p className="text-zinc-600 text-[9px] font-black uppercase">Q {questionNum}/{total}</p>
        </div>
        <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-3 text-center">
          <p className="text-white font-black text-2xl italic">{oppScore}</p>
          <p className="text-zinc-600 text-[9px] font-black uppercase truncate">{oppName}</p>
          <p className="text-[8px] text-zinc-500 font-bold mt-1">Q {Math.min(oppCurrentQ, total)}/{total}</p>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${urgent ? 'bg-red-400' : 'bg-primary'}`}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
      </div>

      {/* Pergunta */}
      <div className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-8 space-y-6">
        {question.verse_ref && (
          <p className="text-[10px] text-primary font-black uppercase tracking-widest">{question.verse_ref}</p>
        )}
        <h3 className="text-xl font-black text-white leading-snug">{question.question}</h3>
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((opt, i) => {
            let cls = 'bg-black/30 border-zinc-700 text-zinc-300 hover:border-primary';
            if (selected !== null) {
              if (i === question.correct_index) cls = 'bg-green-500/20 border-green-500 text-green-300';
              else if (i === selected) cls = 'bg-red-500/20 border-red-500 text-red-400';
              else cls = 'opacity-30 border-zinc-800 text-zinc-600';
            }
            return (
              <button key={i} disabled={selected !== null} onClick={() => onAnswer(i)}
                className={`w-full text-left p-4 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-3 ${cls}`}>
                <span className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-black shrink-0">
                  {['A','B','C','D'][i]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ResultsView({ myName, oppName, myScore, oppScore, iWon, isDraw, isBotMatch, onClose, settings }: {
  myName: string; oppName: string; myScore: number; oppScore: number;
  iWon: boolean; isDraw: boolean; isBotMatch?: boolean; onClose: () => void; settings: any; key?: React.Key;
}) {
  const pts = iWon ? settings.winPoints : isDraw ? settings.drawPoints : settings.lossPoints;
  const coins = iWon ? settings.winCoins : isDraw ? settings.drawCoins : settings.lossCoins;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className={`bg-zinc-900 border-4 rounded-4xl p-10 text-center space-y-6 ${iWon ? 'border-primary shadow-[0_0_60px_rgba(251,191,36,0.3)]' : 'border-zinc-800'}`}>
      <div className="text-6xl">{iWon ? '🏆' : isDraw ? '🤝' : '😤'}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2">Resultado Final</p>
        <h2 className={`text-4xl font-black uppercase italic ${iWon ? 'text-primary' : 'text-white'}`}>
          {iWon ? 'Vitória!' : isDraw ? 'Empate!' : 'Derrota'}
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-black/40 rounded-2xl p-4">
          <p className="text-white font-black text-3xl italic">{myScore}</p>
          <p className="text-zinc-600 text-[10px] uppercase font-black mt-1 truncate">{myName}</p>
        </div>
        <div className="flex items-center justify-center text-zinc-600 font-black text-xl">×</div>
        <div className="bg-black/40 rounded-2xl p-4">
          <p className="text-white font-black text-3xl italic">{oppScore}</p>
          <p className="text-zinc-600 text-[10px] uppercase font-black mt-1 truncate">{oppName}</p>
        </div>
      </div>
      {!isBotMatch ? (
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
            <p className="text-primary font-black text-lg">+{pts} XP para sua Tribo!</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
            <p className="text-yellow-500 font-black text-lg">+{coins} Moedas conquistadas!</p>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-2xl p-4 text-center">
          <p className="text-zinc-400 font-bold text-sm italic">Modo Treino: Pontos não são contabilizados.</p>
        </div>
      )}
      <button onClick={onClose} className="w-full bg-primary text-black py-4 rounded-2xl font-black uppercase italic hover:bg-white active:scale-95 transition-all">
        Voltar ao Lobby
      </button>
    </motion.div>
  );
}
