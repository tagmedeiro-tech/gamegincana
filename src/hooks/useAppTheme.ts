/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * useAppTheme — Backwards-compatible shim para o AppThemeContext singleton.
 *
 * ANTES: cada componente que chamava useAppTheme() criava sua própria instância
 * com fetch, canal Realtime e event listeners — gerando 3-5 queries duplicadas.
 *
 * AGORA: useAppTheme() simplesmente lê do AppThemeContext (Provider no main.tsx).
 * O fetch acontece UMA VEZ, no boot. Todos os componentes compartilham o mesmo estado.
 *
 * Nenhum componente existente precisa ser alterado — a interface é idêntica.
 */

import { useAppThemeContext } from '../context/AppThemeContext';

// Re-exporta tudo do Context para que importações existentes continuem funcionando
export type { AppTheme, CustomTab } from '../context/AppThemeContext';
export { DEFAULT_THEME } from '../context/AppThemeContext';

export function useAppTheme() {
  return useAppThemeContext();
}
