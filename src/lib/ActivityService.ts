import { supabase } from './supabase';
import { ActivityDefinition } from '../types';

// ─── CATÁLOGO PADRÃO (seed local) ─────────────────────────────────────────────
// Usado para popular o banco na primeira vez e como fallback offline
export const DEFAULT_ACTIVITIES: Omit<ActivityDefinition, 'id' | 'created_at' | 'updated_at'>[] = [
  // 🏛️ PRESENÇA
  { key: 'culto_domingo',    title: 'Culto de Domingo',              description: 'Compareceu ao culto principal de domingo',           category: 'presenca',      default_points: 15, current_points: 15, icon: '🏛️', max_per_week: 1, is_active: true, requires_proof: false },
  { key: 'culto_quarta',     title: 'Culto de Quarta',               description: 'Compareceu ao culto de meio de semana',              category: 'presenca',      default_points: 10, current_points: 10, icon: '⛪', max_per_week: 1, is_active: true, requires_proof: false },
  { key: 'celula_semana',    title: 'Célula Semanal',                description: 'Compareceu à reunião de célula',                     category: 'presenca',      default_points: 10, current_points: 10, icon: '👥', max_per_week: 1, is_active: true, requires_proof: false },
  { key: 'encontro_jovens',  title: 'Encontro de Jovens',            description: 'Compareceu ao encontro específico de jovens',        category: 'presenca',      default_points: 10, current_points: 10, icon: '🔥', max_per_week: 1, is_active: true, requires_proof: false },
  { key: 'retiro',           title: 'Retiro / Acampamento',          description: 'Participou de retiro ou acampamento da Igreja',      category: 'presenca',      default_points: 50, current_points: 50, icon: '⛺', max_per_week: null, is_active: true, requires_proof: false },
  { key: 'pontualidade',     title: 'Pontualidade',                  description: 'Chegou pontualmente ao culto',                       category: 'presenca',      default_points: 5,  current_points: 5,  icon: '⏰', max_per_week: 2, is_active: true, requires_proof: false },

  // 🔥 EVANGELISMO
  { key: 'visitante_culto',  title: 'Visitante no Culto',            description: 'Trouxe um visitante ao culto',                      category: 'evangelismo',   default_points: 30, current_points: 30, icon: '🙋', max_per_week: null, is_active: true, requires_proof: true  },
  { key: 'visitante_celula', title: 'Visitante na Célula',           description: 'Trouxe um visitante à célula',                      category: 'evangelismo',   default_points: 20, current_points: 20, icon: '🤝', max_per_week: null, is_active: true, requires_proof: true  },
  { key: 'ovelha_perdida',   title: 'Ovelha Restaurada',             description: 'Trouxe alguém que estava afastado da Igreja',       category: 'evangelismo',   default_points: 40, current_points: 40, icon: '🐑', max_per_week: null, is_active: true, requires_proof: true  },
  { key: 'evangelismo_rua',  title: 'Evangelismo na Rua',            description: 'Organizou e participou de ação de evangelismo',     category: 'evangelismo',   default_points: 35, current_points: 35, icon: '📢', max_per_week: null, is_active: true, requires_proof: true  },
  { key: 'testemunho_online', title: 'Testemunho Online',            description: 'Compartilhou um testemunho de fé online',           category: 'evangelismo',   default_points: 15, current_points: 15, icon: '📱', max_per_week: 1, is_active: true, requires_proof: true  },
  { key: 'conversao',        title: 'Convertido',                    description: 'Convidou alguém que se converteu',                  category: 'evangelismo',   default_points: 60, current_points: 60, icon: '✨', max_per_week: null, is_active: true, requires_proof: true  },

  // 📖 DEVOCIONAL E BÍBLIA
  { key: 'devocional_diario', title: 'Devocional Diário',            description: 'Realizou o devocional diário e marcou como concluído', category: 'devocional', default_points: 10, current_points: 10, icon: '📖', max_per_week: 7, is_active: true, requires_proof: false },
  { key: 'leitura_capitulo', title: 'Capítulo Lido',                 description: 'Leu um capítulo da Bíblia pelo leitor',             category: 'devocional',    default_points: 10, current_points: 10, icon: '📗', max_per_week: null, is_active: true, requires_proof: false },
  { key: 'quiz_100',         title: 'Quiz Bíblico Perfeito',         description: 'Acertou todas as questões de um quiz bíblico',      category: 'devocional',    default_points: 15, current_points: 15, icon: '🏆', max_per_week: null, is_active: true, requires_proof: false },
  { key: 'quiz_parcial',     title: 'Quiz Bíblico Parcial',          description: 'Acertou ao menos 1 questão do quiz bíblico',       category: 'devocional',    default_points: 5,  current_points: 5,  icon: '📝', max_per_week: null, is_active: true, requires_proof: false },
  { key: 'nota_versiculo',   title: 'Nota em Versículo',             description: 'Anotou uma reflexão em um versículo',              category: 'devocional',    default_points: 5,  current_points: 5,  icon: '✍️', max_per_week: 3, is_active: true, requires_proof: false },
  { key: 'versiculo_memoria','title': 'Versículo Memorizado',        description: 'Memorizou e recitou um versículo',                 category: 'devocional',    default_points: 20, current_points: 20, icon: '🧠', max_per_week: 1, is_active: true, requires_proof: true  },
  { key: 'plano_semana',     title: 'Plano Semanal Concluído',       description: 'Concluiu todos os dias do plano semanal',          category: 'devocional',    default_points: 30, current_points: 30, icon: '📅', max_per_week: 1, is_active: true, requires_proof: false },
  { key: 'plano_mensal',     title: 'Plano Mensal Concluído',        description: 'Concluiu todos os dias do plano de leitura mensal',category: 'devocional',    default_points: 80, current_points: 80, icon: '🗓️', max_per_week: null, is_active: true, requires_proof: false },

  // 💻 ONLINE
  { key: 'share_post',       title: 'Compartilhou Post da Igreja',   description: 'Compartilhou um post oficial nas redes sociais',   category: 'online',        default_points: 5,  current_points: 5,  icon: '📲', max_per_week: 2, is_active: true, requires_proof: true  },
  { key: 'live_online',      title: 'Live / Devocional Online',      description: 'Participou de live ou devocional ao vivo online',  category: 'online',        default_points: 10, current_points: 10, icon: '📡', max_per_week: 2, is_active: true, requires_proof: false },
  { key: 'post_testemunho',  title: 'Post de Testemunho',            description: 'Publicou um testemunho pessoal nas redes',         category: 'online',        default_points: 15, current_points: 15, icon: '🌟', max_per_week: 1, is_active: true, requires_proof: true  },
  { key: 'desafio_semanal',  title: 'Desafio Semanal Online',        description: 'Concluiu o desafio semanal nas redes sociais',    category: 'online',        default_points: 20, current_points: 20, icon: '🎯', max_per_week: 1, is_active: true, requires_proof: true  },
  { key: 'indicar_seguidor', title: 'Indicou um Seguidor',           description: 'Indicou um amigo para seguir o perfil da Igreja', category: 'online',        default_points: 10, current_points: 10, icon: '👆', max_per_week: 3, is_active: true, requires_proof: true  },

  // 👑 LIDERANÇA E SERVIÇO
  { key: 'liderar_celula',   title: 'Liderou a Célula',              description: 'Liderou a reunião de célula',                      category: 'lideranca',     default_points: 30, current_points: 30, icon: '👑', max_per_week: 1, is_active: true, requires_proof: false },
  { key: 'ministerio_louvor', title: 'Ministrou Louvor', description: 'Ministrou louvor em um culto ou reunião', category: 'lideranca', default_points: 25, current_points: 25, icon: '🎸', max_per_week: 2, is_active: true, requires_proof: false },
  { key: 'recepcao',         title: 'Serviu na Recepção',            description: 'Serviu na recepção do culto',                      category: 'lideranca',     default_points: 15, current_points: 15, icon: '🤲', max_per_week: 2, is_active: true, requires_proof: false },
  { key: 'preparacao_culto', title: 'Preparação do Culto',           description: 'Ajudou na preparação do culto ou evento',          category: 'lideranca',     default_points: 15, current_points: 15, icon: '🛠️', max_per_week: 2, is_active: true, requires_proof: false },
  { key: 'acao_social',      title: 'Ação Social',                   description: 'Participou de ação social da Igreja',              category: 'lideranca',     default_points: 30, current_points: 30, icon: '❤️', max_per_week: null, is_active: true, requires_proof: false },
  { key: 'estudo_biblico',   title: 'Deu Estudo Bíblico',            description: 'Ministrou um estudo bíblico a alguém',            category: 'lideranca',     default_points: 25, current_points: 25, icon: '🎓', max_per_week: 2, is_active: true, requires_proof: false },
  { key: 'mentoria',         title: 'Mentoria de Membro Novo',       description: 'Acompanhou e mentorou um membro novo',             category: 'lideranca',     default_points: 20, current_points: 20, icon: '🌱', max_per_week: 1, is_active: true, requires_proof: false },
  { key: 'oracao_celula',    title: 'Liderou Oração na Célula',      description: 'Liderou o momento de oração na célula',           category: 'lideranca',     default_points: 10, current_points: 10, icon: '🙏', max_per_week: 1, is_active: true, requires_proof: false },

  // 🎯 ESPECIAIS
  { key: 'desafio_jejum',    title: 'Desafio de Jejum',              description: 'Participou do desafio de jejum da temporada',      category: 'especial',      default_points: 40, current_points: 40, icon: '⚡', max_per_week: null, is_active: true, requires_proof: false },
  { key: 'desafio_oracao_21','title': 'Oração 21 Dias',             description: 'Completou o desafio de 21 dias de oração',        category: 'especial',      default_points: 80, current_points: 80, icon: '🔱', max_per_week: null, is_active: false, requires_proof: false },
  { key: 'semana_santa',     title: 'Semana Santa',                  description: 'Participou de cultos da Semana Santa',             category: 'especial',      default_points: 50, current_points: 50, icon: '✝️', max_per_week: null, is_active: false, requires_proof: false },
  { key: 'missao_especial',  title: 'Missão Especial',               description: 'Concluiu uma missão especial designada pelo líder',category: 'especial',      default_points: 50, current_points: 50, icon: '🎖️', max_per_week: null, is_active: true, requires_proof: true  },
  { key: 'vencer_rodada',    title: 'Ganhou a Rodada',               description: 'Ficou em 1º lugar na rodada semanal do grupo',    category: 'especial',      default_points: 30, current_points: 30, icon: '🥇', max_per_week: 1, is_active: true, requires_proof: false },

  // ❤️ RELACIONAMENTO
  { key: 'visita_membro',    title: 'Visitou um Membro',             description: 'Visitou um membro doente ou afastado',            category: 'relacionamento', default_points: 25, current_points: 25, icon: '🏠', max_per_week: 2, is_active: true, requires_proof: false },
  { key: 'oracao_membro',    title: 'Orou por um Membro',            description: 'Orou por outro membro e registrou',               category: 'relacionamento', default_points: 10, current_points: 10, icon: '🤍', max_per_week: 3, is_active: true, requires_proof: false },
  { key: 'ajuda_membro',     title: 'Ajudou um Membro',              description: 'Ajudou outro membro com uma necessidade prática', category: 'relacionamento', default_points: 20, current_points: 20, icon: '🤗', max_per_week: 2, is_active: true, requires_proof: false },
];

export const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  presenca:       { label: 'Presença',        icon: '🏛️', color: 'text-blue-400 bg-blue-900/30 border-blue-800' },
  evangelismo:    { label: 'Evangelismo',     icon: '🔥', color: 'text-orange-400 bg-orange-900/30 border-orange-800' },
  devocional:     { label: 'Devocional',      icon: '📖', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-800' },
  online:         { label: 'Online',          icon: '💻', color: 'text-purple-400 bg-purple-900/30 border-purple-800' },
  lideranca:      { label: 'Liderança',       icon: '👑', color: 'text-amber-400 bg-amber-900/30 border-amber-800' },
  especial:       { label: 'Especiais',       icon: '🎯', color: 'text-red-400 bg-red-900/30 border-red-800' },
  relacionamento: { label: 'Relacionamento',  icon: '❤️', color: 'text-pink-400 bg-pink-900/30 border-pink-800' },
};

// ─── SERVICE ──────────────────────────────────────────────────────────────────
export class ActivityService {
  /**
   * Busca todas as definições do banco. Se o banco estiver vazio, faz o seed.
   */
  static async getAll(): Promise<ActivityDefinition[]> {
    const { data, error } = await supabase
      .from('activity_definitions')
      .select('*')
      .order('category')
      .order('current_points', { ascending: false });

    if (error) {
      console.error('ActivityService.getAll error:', error);
      return [];
    }

    // Se não houver dados, faz o seed
    if (!data || data.length === 0) {
      await ActivityService.seed();
      return ActivityService.getAll();
    }

    return data as ActivityDefinition[];
  }

  /**
   * Atualiza uma definição de atividade (apenas admin)
   */
  static async update(id: string, updates: Partial<ActivityDefinition>): Promise<boolean> {
    const { error } = await supabase
      .from('activity_definitions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) { console.error('ActivityService.update error:', error); return false; }
    return true;
  }

  /**
   * Ativa ou desativa uma atividade
   */
  static async toggleActive(id: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('activity_definitions')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) { console.error('ActivityService.toggleActive error:', error); return false; }
    return true;
  }

  /**
   * Cria uma nova atividade customizada (apenas admin)
   */
  static async create(
    data: Omit<ActivityDefinition, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ActivityDefinition | null> {
    const { data: created, error } = await supabase
      .from('activity_definitions')
      .insert({ ...data })
      .select()
      .single();

    if (error) { console.error('ActivityService.create error:', error); return null; }
    return created as ActivityDefinition;
  }

  /**
   * Remove uma atividade customizada (apenas admin)
   */
  static async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('activity_definitions')
      .delete()
      .eq('id', id);

    if (error) { console.error('ActivityService.remove error:', error); return false; }
    return true;
  }

  /**
   * Busca os pontos atuais de uma atividade pela chave
   */
  static async getPoints(key: string): Promise<number> {
    const { data } = await supabase
      .from('activity_definitions')
      .select('current_points, is_active')
      .eq('key', key)
      .single();

    if (!data || !data.is_active) return 0;
    return data.current_points;
  }

  /**
   * Popula o banco com as atividades padrão (primeira execução)
   */
  static async seed(): Promise<void> {
    const { error } = await supabase
      .from('activity_definitions')
      .insert(DEFAULT_ACTIVITIES);

    if (error) console.error('ActivityService.seed error:', error);
  }
}
