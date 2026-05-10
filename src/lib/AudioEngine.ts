/**
 * AudioEngine: Sistema de som sintético via Web Audio API.
 * Gera sons de alta fidelidade programaticamente sem dependência de arquivos externos.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: number = 0.5;
  private enabled: boolean = true;
  private bgAudio: HTMLAudioElement | null = null;
  private currentBgUrl: string | null = null;
  private lastBgUrl: string | null = null;
  private lastBgVolume: number = 0.2;

  constructor() {
    // Inicialização tardia para respeitar políticas de autopay do browser
    const saved = localStorage.getItem('arena_audio_enabled');
    this.enabled = saved !== 'false';
    const vol = localStorage.getItem('arena_audio_volume');
    if (vol) this.masterVolume = parseFloat(vol);

    // Listener global para desbloquear áudio na primeira interação
    const unlock = () => {
      this.getCtx();
      if (this.bgAudio && this.bgAudio.paused && this.currentBgUrl) {
        this.bgAudio.play().catch(() => {});
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
  }

  private getCtx() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Só tenta resumir se não estiver suspenso ou se houver chance de sucesso
      if (this.ctx.state === 'suspended') {
        // Não chamamos resume() aqui se for um evento de ciclo de vida do React
        // O listener 'unlock' no constructor cuidará disso no primeiro clique real.
        this.ctx.resume().catch(() => {}); 
      }
      return this.ctx;
    } catch (e) {
      return null;
    }
  }

  setEnabled(val: boolean) {
    this.enabled = val;
    localStorage.setItem('arena_audio_enabled', val.toString());
    if (!val) {
      this.stopBackground();
    } else if (this.lastBgUrl) {
      // Retoma a música se houver uma URL salva
      this.playBackground(this.lastBgUrl, this.lastBgVolume);
    }
  }

  setVolume(val: number) {
    this.masterVolume = val;
    localStorage.setItem('arena_audio_volume', val.toString());
  }

  isAudioEnabled() { return this.enabled; }

  // ─── Sons Sintéticos ───

  /** Som de clique metálico curto */
  playClick() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx || ctx.state === 'suspended') return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  /** Som de ignição de fogo (🔥) */
  playFire() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx || ctx.state === 'suspended') return;
    
    // Ruído branco para o "chiado" do fogo
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.4, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.2);
  }

  /** Som de shimmer/brilho (🙌) */
  playShimmer() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx || ctx.state === 'suspended') return;
    const now = ctx.currentTime;

    const playNote = (freq: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.1, now + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    };

    [880, 1108.73, 1318.51, 1760].forEach((f, i) => playNote(f, i * 0.05));
  }

  /** Som de sucesso suave (Notificação) */
  playSuccess() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx || ctx.state === 'suspended') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  /** Som triunfante de subida de nível */
  playLevelUp() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx || ctx.state === 'suspended') return;
    const now = ctx.currentTime;
    
    const playNote = (f: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.15, now + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    };

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((n, i) => playNote(n, i * 0.1, 0.4));
  }

  /** Alerta de notificação futurista */
  playNotification() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx || ctx.state === 'suspended') return;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.setValueAtTime(1760, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.15);
  }

  /** Impacto Épico Cinematográfico */
  playEpicImpact() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx || ctx.state === 'suspended') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);
    
    gain.gain.setValueAtTime(this.masterVolume * 0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  }

  /** Som de Vitória Triunfante */
  playVictory() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx || ctx.state === 'suspended') return;
    const now = ctx.currentTime;
    
    const playNote = (f: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    };

    // Acorde de C Major (C4, E4, G4, C5)
    [261.63, 329.63, 392.00, 523.25].forEach((n, i) => {
      playNote(n, i * 0.05, 1.0);
      playNote(n * 2, 0.4 + (i * 0.05), 1.5);
    });
  }

  /** Som de Coleta de Item/XP (Satisfatório) */
  playCollect() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx || ctx.state === 'suspended') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  /** Som de Woosh (Transição) */
  playWoosh() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx || ctx.state === 'suspended') return;
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.3);
  }

  // ─── Som Ambiente (Loops) ───

  playBackground(url: string, volume: number = 0.2) {
    if (!this.enabled) return;
    if (this.currentBgUrl === url) return;

    this.stopBackground();

    try {
      this.bgAudio = new Audio(url);
      this.bgAudio.loop = true;
      this.bgAudio.volume = volume * this.masterVolume;
      this.currentBgUrl = url;
      this.lastBgUrl = url;
      this.lastBgVolume = volume;
      
      // Browser autoplay workaround
      const playPromise = this.bgAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Só avisa no console se for um erro que não seja o bloqueio de autoplay esperado
          if (error.name !== 'NotAllowedError') {
            console.warn("[AudioEngine] Background audio failed:", error);
          }
        });
      }
    } catch (err) {
      console.error("[AudioEngine] Error playing background audio:", err);
    }
  }

  stopBackground() {
    if (this.bgAudio) {
      const audioToStop = this.bgAudio;
      // Fade out manual
      const fadeInterval = setInterval(() => {
        if (audioToStop.volume > 0.05) {
          audioToStop.volume -= 0.05;
        } else {
          audioToStop.pause();
          clearInterval(fadeInterval);
        }
      }, 50);
      this.bgAudio = null;
      this.currentBgUrl = null;
    }
  }
}

export const audio = new AudioEngine();
