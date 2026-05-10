import { supabase } from './supabase';
import { CalendarEvent } from '../types';

export const CalendarService = {
  async getEvents(month: Date): Promise<CalendarEvent[]> {
    const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString();

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      // Busca eventos do mês OU todos os recorrentes para projeção
      .or(`is_recurring.eq.true,and(event_date.gte."${start}",event_date.lte."${end}")`)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }

    return data || [];
  },

  async createEvent(event: Omit<CalendarEvent, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEvent(id: string) {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async getBirthdays(month: Date): Promise<{ name: string; day: number; id: string; phone?: string; avatarUrl?: string }[]> {
    const monthNum = month.getMonth() + 1;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, birthDate, whatsapp, avatar_url, avatarUrl')
      .not('birthDate', 'is', null);

    if (error) {
      console.error('Error fetching birthdays:', error);
      return [];
    }

    return data
      .filter(p => {
        if (!p.birthDate) return false;
        const bDate = new Date(p.birthDate);
        return (bDate.getMonth() + 1) === monthNum;
      })
      .map(p => ({
        id: p.id,
        name: p.name,
        phone: p.whatsapp,
        avatarUrl: p.avatar_url || p.avatarUrl,
        day: new Date(p.birthDate!).getDate() + 1
      }));
  },

  async getUserParticipations(userId: string, month: Date) {
    const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString();

    const { data, error } = await supabase
      .from('event_participations')
      .select('event_id, occurrence_date, status')
      .eq('user_id', userId)
      .gte('occurrence_date', start)
      .lte('occurrence_date', end);

    if (error) {
      console.error('Error fetching participations:', error);
      return [];
    }
    return data;
  },

  async getAvailableActivities() {
    const { data, error } = await supabase
      .from('activities')
      .select('id, title, points, description, type, secret_payload')
      .eq('status', 'active')
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching activities for calendar:', error);
      return [];
    }
    return data;
  }
};
