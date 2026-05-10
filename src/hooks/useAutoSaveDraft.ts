import { useState, useEffect, useCallback } from 'react';

export function useAutoSaveDraft<T>(key: string, serverData: T | undefined | null) {
  const [hasDraft, setHasDraft] = useState(false);

  // Verifica na montagem se há rascunho diferente do servidor
  useEffect(() => {
    if (serverData === undefined || serverData === null) return;
    const draft = localStorage.getItem(key);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        // Compara ignorando eventuais funções ou referências
        if (JSON.stringify(parsedDraft) !== JSON.stringify(serverData)) {
          setHasDraft(true);
        } else {
           // Se for igual ao server, limpa
           localStorage.removeItem(key);
           setHasDraft(false);
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    }
  }, [serverData, key]);

  // Função manual/automática para salvar
  const saveDraft = useCallback((currentData: T) => {
    if (serverData && JSON.stringify(currentData) !== JSON.stringify(serverData)) {
      localStorage.setItem(key, JSON.stringify(currentData));
    }
  }, [serverData, key]);

  const getDraft = useCallback((): T | null => {
    const draft = localStorage.getItem(key);
    if (draft) {
      try {
        return JSON.parse(draft);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [key]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
    setHasDraft(false);
  }, [key]);

  return { hasDraft, setHasDraft, saveDraft, getDraft, clearDraft };
}
