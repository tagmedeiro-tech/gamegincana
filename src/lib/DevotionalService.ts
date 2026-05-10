import { BIBLE_BOOKS } from './BibleService';

// ─── SEQUÊNCIA PEDAGÓGICA PERPÉTUA ──────────────────────────────────────────
// Fase 1: Fundamentos (conhecer a Cristo e o NT essencial)
// Fase 2: NT Restante
// Fase 3: AT Completo
// Depois cicla do início para sempre.

const FOUNDATION_ORDER = [
  // Conhecer Jesus pelos Evangelhos
  'JHN', // João — O Verbo encarnado, João 3:16
  'MRK', // Marcos — Jesus em ação
  'LUK', // Lucas — misericórdia e parábolas
  'MAT', // Mateus — Sermão da Montanha
  // A Igreja e o Espírito
  'ACT', // Atos — Pentecostes e missão
  // Doutrina e Graça
  'ROM', // Romanos — pecado, graça, justificação
  'GAL', // Gálatas — liberdade em Cristo
  'EPH', // Efésios — identidade em Cristo
  'PHP', // Filipenses — alegria e contentamento
  'COL', // Colossenses — supremacia de Cristo
  'HEB', // Hebreus — fé e o sumo sacerdote
  'JAS', // Tiago — fé com obras
  '1JN', // 1 João — amor e certeza da salvação
  '1CO', // 1 Coríntios — dons e o amor (cap. 13)
  // Sabedoria e Adoração
  'PSA', // Salmos — louvor e lamento
  'PRO', // Provérbios — sabedoria prática
  // Fé sob pressão / Profecia
  'DAN', // Daniel — fé sob pressão
  'ISA', // Isaías — o servo sofredor prometido
  'JON', // Jonas — misericórdia e missão
];

const REMAINING_NT = [
  '2CO', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM',
  '1PE', '2PE', '2JN', '3JN', 'JUD', 'REV',
];

const REMAINING_OT = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU',
  'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR',
  'NEH', 'EST', 'JOB', 'ECC', 'SNG',
  'JER', 'LAM', 'EZK', 'HOS', 'JOE',
  'AMO', 'OBA', 'MIC', 'NAH', 'HAB',
  'ZEP', 'HAG', 'ZEC', 'MAL',
];

// Sequência completa em ordem pedagógica (1189 capítulos)
const FULL_SEQUENCE_BOOKS = [...FOUNDATION_ORDER, ...REMAINING_NT, ...REMAINING_OT];

export type DevotionalPhase = 'foundation' | 'nt' | 'ot';

export interface DevotionalChapter {
  bookId: string;
  bookName: string;
  chapter: number;
  indexInSequence: number; // 0-based global index
  phase: DevotionalPhase;
  phaseLabel: string;
  dayInPhase: number;      // qual dia dentro desta fase
  totalInPhase: number;    // total de capítulos nesta fase
  cycleNumber: number;     // ciclo atual (1, 2, 3...)
}

// Cache da sequência gerada (singleton)
let _sequenceCache: { bookId: string; chapter: number; phase: DevotionalPhase }[] | null = null;

export class DevotionalService {
  static readonly TOTAL_CHAPTERS = 1189;

  // Capítulos de cada fase (calculado uma vez)
  static readonly FOUNDATION_CHAPTERS = FOUNDATION_ORDER.reduce((sum, id) => {
    const b = BIBLE_BOOKS.find(b => b.id === id);
    return sum + (b?.chapters ?? 0);
  }, 0);

  static readonly NT_REMAINING_CHAPTERS = REMAINING_NT.reduce((sum, id) => {
    const b = BIBLE_BOOKS.find(b => b.id === id);
    return sum + (b?.chapters ?? 0);
  }, 0);

  /**
   * Gera (e cacheia) a sequência completa de 1189 capítulos.
   */
  static getFullSequence(): { bookId: string; chapter: number; phase: DevotionalPhase }[] {
    if (_sequenceCache) return _sequenceCache;

    const seq: { bookId: string; chapter: number; phase: DevotionalPhase }[] = [];
    const phaseMap: Record<string, DevotionalPhase> = {};
    FOUNDATION_ORDER.forEach(id => (phaseMap[id] = 'foundation'));
    REMAINING_NT.forEach(id => (phaseMap[id] = 'nt'));
    REMAINING_OT.forEach(id => (phaseMap[id] = 'ot'));

    for (const bookId of FULL_SEQUENCE_BOOKS) {
      const bookData = BIBLE_BOOKS.find(b => b.id === bookId);
      if (!bookData) continue;
      for (let ch = 1; ch <= bookData.chapters; ch++) {
        seq.push({ bookId, chapter: ch, phase: phaseMap[bookId] });
      }
    }

    _sequenceCache = seq;
    return seq;
  }

  /**
   * Dado um índice (0-1188), retorna o capítulo do devocional.
   * O índice cicla automaticamente (% 1189).
   */
  static getChapterAtIndex(rawIndex: number): DevotionalChapter {
    const seq = this.getFullSequence();
    const cycleNumber = Math.floor(rawIndex / this.TOTAL_CHAPTERS) + 1;
    const index = rawIndex % this.TOTAL_CHAPTERS;
    const entry = seq[index];

    const bookData = BIBLE_BOOKS.find(b => b.id === entry.bookId)!;

    // Calcular posição dentro da fase
    const phaseEntries = seq.filter(e => e.phase === entry.phase);
    const dayInPhase = phaseEntries.findIndex(e => e.bookId === entry.bookId && e.chapter === entry.chapter) + 1;

    const phaseLabels: Record<DevotionalPhase, string> = {
      foundation: '📖 Fundamentos — Conhecendo a Cristo',
      nt: '✝️ Novo Testamento Completo',
      ot: '📜 Antigo Testamento',
    };

    return {
      bookId: entry.bookId,
      bookName: bookData.name,
      chapter: entry.chapter,
      indexInSequence: index,
      phase: entry.phase,
      phaseLabel: phaseLabels[entry.phase],
      dayInPhase,
      totalInPhase: phaseEntries.length,
      cycleNumber,
    };
  }

  /**
   * Retorna o capítulo atual de um usuário dado seu índice salvo.
   * (O índice atual É o próximo capítulo a ler.)
   */
  static getTodayChapter(currentIndex: number): DevotionalChapter {
    return this.getChapterAtIndex(currentIndex);
  }

  /**
   * Texto formatado para exibição. Ex: "João 3"
   */
  static formatChapter(ch: DevotionalChapter): string {
    return `${ch.bookName} ${ch.chapter}`;
  }

  /**
   * Progresso percentual dentro da fase atual.
   */
  static getPhaseProgress(ch: DevotionalChapter): number {
    return Math.round((ch.dayInPhase / ch.totalInPhase) * 100);
  }
}
