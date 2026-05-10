import { BIBLE_BOOKS } from './BibleService';

// ─── TIPOS ─────────────────────────────────────────────────────────────────

export interface PlanDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  totalDays: number;
  pointsPerDay: number;
  bonusPoints: number;
  color: string;
  icon: string; // emoji
  difficulty: 'easy' | 'medium' | 'hard';
  bookSequence: string[]; // ordered list of book IDs
}

export interface DailyReading {
  bookId: string;
  bookName: string;
  chapters: number[];
}

export interface DailyPortion {
  day: number;
  readings: DailyReading[];
}

export interface UserPlan {
  id: string; // user_plan id
  planId: string;
  startedAt: string;
  status: 'active' | 'completed' | 'abandoned';
  completedDays: number[];
  completedAt?: string;
}

// ─── PLANOS DISPONÍVEIS ─────────────────────────────────────────────────────

const NT_BOOKS = [
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT',
  'ROM', '1CO', '2CO', 'GAL', 'EPH',
  'PHP', 'COL', '1TH', '2TH', '1TI',
  '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
  '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
];

const OT_BOOKS = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
  '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH',
  'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER',
  'LAM', 'EZK', 'DAN', 'HOS', 'JOE', 'AMO', 'OBA', 'JON',
  'MIC', 'NAH', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'
];

const ALL_BOOKS = [...OT_BOOKS, ...NT_BOOKS];

const GOSPELS = ['MAT', 'MRK', 'LUK', 'JHN'];
const PSALMS_PROVERBS = ['PSA', 'PRO'];
const PAULINE = ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM'];

export const READING_PLANS: PlanDefinition[] = [
  {
    id: 'bible_1year',
    name: 'Bíblia em 1 Ano',
    subtitle: '365 dias',
    description: 'Leia a Bíblia inteira em um ano — ~3 capítulos por dia. O compromisso mais completo da sua jornada de fé.',
    totalDays: 365,
    pointsPerDay: 15,
    bonusPoints: 2000,
    color: '#FBBF24',
    icon: '🏆',
    difficulty: 'hard',
    bookSequence: ALL_BOOKS,
  },
  {
    id: 'nt_6months',
    name: 'Novo Testamento',
    subtitle: '180 dias',
    description: 'Leia todo o Novo Testamento em 6 meses. Perfeito para conhecer os ensinamentos de Jesus e dos apóstolos.',
    totalDays: 180,
    pointsPerDay: 10,
    bonusPoints: 800,
    color: '#3b82f6',
    icon: '✝️',
    difficulty: 'medium',
    bookSequence: NT_BOOKS,
  },
  {
    id: 'ot_6months',
    name: 'Antigo Testamento',
    subtitle: '180 dias',
    description: 'Mergulhe na história de Israel, nos Profetas e na Sabedoria em 6 meses. Raízes profundas da fé cristã.',
    totalDays: 180,
    pointsPerDay: 10,
    bonusPoints: 800,
    color: '#8b5cf6',
    icon: '📜',
    difficulty: 'medium',
    bookSequence: OT_BOOKS,
  },
  {
    id: 'nt_3months',
    name: 'Novo Testamento Express',
    subtitle: '90 dias',
    description: 'Todo o NT em apenas 3 meses. Um ritmo intenso para guerreiros determinados — ~3 capítulos por dia.',
    totalDays: 90,
    pointsPerDay: 12,
    bonusPoints: 500,
    color: '#f59e0b',
    icon: '⚡',
    difficulty: 'medium',
    bookSequence: NT_BOOKS,
  },
  {
    id: 'gospels_30days',
    name: 'Os 4 Evangelhos',
    subtitle: '30 dias',
    description: 'Conheça Jesus pelos 4 Evangelhos em um mês. Mateus, Marcos, Lucas e João completos.',
    totalDays: 30,
    pointsPerDay: 8,
    bonusPoints: 200,
    color: '#10b981',
    icon: '✨',
    difficulty: 'easy',
    bookSequence: GOSPELS,
  },
  {
    id: 'psalms_proverbs_60days',
    name: 'Salmos e Provérbios',
    subtitle: '60 dias',
    description: 'O livro de louvor e o livro da sabedoria em 60 dias. Ideal para devocionais matinais.',
    totalDays: 60,
    pointsPerDay: 8,
    bonusPoints: 300,
    color: '#ec4899',
    icon: '🎵',
    difficulty: 'easy',
    bookSequence: PSALMS_PROVERBS,
  },
  {
    id: 'paul_letters',
    name: 'Cartas de Paulo',
    subtitle: '45 dias',
    description: 'As 13 cartas paulinas em 45 dias. Doutrina, graça e vida cristã na visão do maior missionário.',
    totalDays: 45,
    pointsPerDay: 10,
    bonusPoints: 250,
    color: '#f97316',
    icon: '✉️',
    difficulty: 'easy',
    bookSequence: PAULINE,
  },
];

// ─── ENGINE DO PLANO ──────────────────────────────────────────────────────────

export class ReadingPlanService {
  /**
   * Gera todas as porções diárias de um plano de forma algorítmica.
   * Distribui os capítulos de forma equilibrada ao longo dos dias.
   */
  static generateDailyPortions(plan: PlanDefinition): DailyPortion[] {
    // 1. Flatten de todos os capítulos na ordem do plano
    const allChapters: { bookId: string; chapter: number }[] = [];
    for (const bookId of plan.bookSequence) {
      const bookData = BIBLE_BOOKS.find(b => b.id === bookId);
      if (!bookData) continue;
      for (let ch = 1; ch <= bookData.chapters; ch++) {
        allChapters.push({ bookId, chapter: ch });
      }
    }

    const totalChapters = allChapters.length;
    const days = plan.totalDays;

    // 2. Distribuir capítulos pelos dias
    const portions: DailyPortion[] = [];
    let chapterIndex = 0;

    for (let day = 1; day <= days; day++) {
      // Calcula quantos capítulos neste dia (distribui o restante uniformemente)
      const remaining = totalChapters - chapterIndex;
      const remainingDays = days - day + 1;
      const chaptersThisDay = Math.ceil(remaining / remainingDays);
      const dayChapters = allChapters.slice(chapterIndex, chapterIndex + chaptersThisDay);
      chapterIndex += chaptersThisDay;

      // Agrupa por livro
      const byBook = new Map<string, number[]>();
      for (const { bookId, chapter } of dayChapters) {
        if (!byBook.has(bookId)) byBook.set(bookId, []);
        byBook.get(bookId)!.push(chapter);
      }

      const readings: DailyReading[] = [];
      byBook.forEach((chapters, bookId) => {
        const bookData = BIBLE_BOOKS.find(b => b.id === bookId);
        readings.push({
          bookId,
          bookName: bookData?.name ?? bookId,
          chapters,
        });
      });

      portions.push({ day, readings });
    }

    return portions;
  }

  /**
   * Retorna a porção do dia N de um plano.
   */
  static getDayPortion(plan: PlanDefinition, dayNumber: number): DailyPortion | null {
    if (dayNumber < 1 || dayNumber > plan.totalDays) return null;
    const portions = this.generateDailyPortions(plan);
    return portions[dayNumber - 1] ?? null;
  }

  /**
   * Calcula o dia atual do usuário no plano (1-based).
   */
  static getCurrentDay(startedAt: string): number {
    const start = new Date(startedAt);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }

  /**
   * Retorna a definição de um plano pelo ID.
   */
  static getPlanById(planId: string): PlanDefinition | undefined {
    return READING_PLANS.find(p => p.id === planId);
  }

  /**
   * Formata a leitura do dia como texto resumido. Ex: "João 1-3 • Mateus 4"
   */
  static formatPortion(portion: DailyPortion): string {
    return portion.readings
      .map(r => {
        if (r.chapters.length === 1) return `${r.bookName} ${r.chapters[0]}`;
        const min = r.chapters[0];
        const max = r.chapters[r.chapters.length - 1];
        return `${r.bookName} ${min}-${max}`;
      })
      .join(' • ');
  }

  /**
   * Calcula o progresso percentual do plano.
   */
  static getProgressPercent(completedDays: number, totalDays: number): number {
    return Math.round((completedDays / totalDays) * 100);
  }
}
