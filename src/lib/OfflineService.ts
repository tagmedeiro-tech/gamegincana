
import { supabase } from './supabase';

/**
 * OfflineService: O cérebro da persistência local para o APK.
 * Gerencia cache de longa duração e sincronização delta.
 */
export class OfflineService {
  private static CACHE_PREFIX = 'arena_cache_v1_';

  /**
   * Salva dados no cache local com timestamp
   */
  static save(key: string, data: any) {
    try {
      const payload = {
        updatedAt: Date.now(),
        data
      };
      localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(payload));
    } catch (e) {
      console.warn('[OfflineService] Falha ao salvar cache:', e);
    }
  }

  /**
   * Recupera dados do cache local
   */
  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      return parsed.data as T;
    } catch (e) {
      return null;
    }
  }

  /**
   * Padrão Stale-While-Revalidate: 
   * Retorna o cache IMEDIATAMENTE e executa a função de busca em background.
   */
  static async swr<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    onUpdate: (newData: T) => void
  ): Promise<T | null> {
    const cachedData = this.get<T>(key);
    
    // Dispara a busca em background sem travar o retorno do cache
    fetchFn().then(newData => {
      if (newData) {
        // Verifica se mudou antes de atualizar (comparação simples de string)
        const currentStr = JSON.stringify(cachedData);
        const newStr = JSON.stringify(newData);
        
        if (currentStr !== newStr) {
          this.save(key, newData);
          onUpdate(newData);
        }
      }
    }).catch(err => console.error(`[OfflineService] Erro ao atualizar ${key}:`, err));

    return cachedData;
  }

  /**
   * Limpa todo o cache da arena
   */
  static clearAll() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.warn('[OfflineService] Falha ao limpar cache:', e);
    }
  }
}
