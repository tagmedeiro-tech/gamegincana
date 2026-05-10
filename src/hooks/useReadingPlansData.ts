/**
 * useReadingPlansData.ts
 * Hook SWR para orquestrar o estado de planos de leitura de forma assíncrona e performática.
 * Busca user_reading_plans + reading_plan_completions em paralelo via Promise.all.
 */
import useSWR from 'swr';
import { supabase } from '../lib/supabase';
import { UserPlan } from '../lib/ReadingPlanService';

const fetchUserPlans = async (userId: string): Promise<UserPlan[]> => {
  // 1. Buscar todos os planos do usuário de uma vez
  const { data: plans, error } = await supabase
    .from('user_reading_plans')
    .select('id, plan_id, started_at, status, completed_at, bonus_awarded')
    .eq('user_id', userId);

  if (error || !plans || plans.length === 0) return [];

  // 2. Buscar TODOS os completions de uma vez com IN (sem N+1 queries)
  const planIds = plans.map(p => p.id);
  const { data: allCompletions } = await supabase
    .from('reading_plan_completions')
    .select('user_plan_id, day_number')
    .in('user_plan_id', planIds);

  // 3. Montar mapa de completions por plan_id (O(n) instead of N×O(n))
  const completionMap = new Map<string, number[]>();
  (allCompletions || []).forEach(c => {
    if (!completionMap.has(c.user_plan_id)) completionMap.set(c.user_plan_id, []);
    completionMap.get(c.user_plan_id)!.push(c.day_number);
  });

  // 4. Enriquecer planos com seus completions
  return plans.map(p => ({
    id: p.id,
    planId: p.plan_id,
    startedAt: p.started_at,
    status: p.status,
    completedDays: completionMap.get(p.id) || [],
    completedAt: p.completed_at,
  } as UserPlan));
};

export function useReadingPlansData(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `reading-plans/${userId}` : null,
    () => fetchUserPlans(userId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000, // 30s — planos mudam com mais frequência
      revalidateOnReconnect: true,
    }
  );

  return {
    userPlans: data || [],
    isLoading,
    error,
    mutate,
  };
}
