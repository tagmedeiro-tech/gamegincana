import React, { createContext, useContext, useState, useEffect } from 'react';
import { audio } from '../lib/AudioEngine';

interface AudioContextType {
  enabled: boolean;
  setEnabled: (val: boolean) => void;
  playClick: () => void;
  playFire: () => void;
  playShimmer: () => void;
  playSuccess: () => void;
  playLevelUp: () => void;
  playNotification: () => void;
  playEpicImpact: () => void;
  playVictory: () => void;
  playCollect: () => void;
  playWoosh: () => void;
  playBackground: (url: string, volume?: number) => void;
  stopBackground: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(audio.isAudioEnabled());

  const setEnabled = (val: boolean) => {
    audio.setEnabled(val);
    setEnabledState(val);
  };

  // Inicializa o áudio no primeiro clique do usuário (exigência dos browsers)
  useEffect(() => {
    const initAudio = () => {
      // Tenta tocar um som vazio para inicializar o context
      (audio as any).getCtx();
      window.removeEventListener('click', initAudio);
    };
    window.addEventListener('click', initAudio);
    return () => window.removeEventListener('click', initAudio);
  }, []);

  return (
    <AudioContext.Provider value={{
      enabled,
      setEnabled,
      playClick: () => audio.playClick(),
      playFire: () => audio.playFire(),
      playShimmer: () => audio.playShimmer(),
      playSuccess: () => audio.playSuccess(),
      playLevelUp: () => audio.playLevelUp(),
      playNotification: () => audio.playNotification(),
      playEpicImpact: () => audio.playEpicImpact(),
      playVictory: () => audio.playVictory(),
      playCollect: () => audio.playCollect(),
      playWoosh: () => audio.playWoosh(),
      playBackground: (url, vol) => audio.playBackground(url, vol),
      stopBackground: () => audio.stopBackground(),
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
