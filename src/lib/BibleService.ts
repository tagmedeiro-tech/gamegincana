import { BibleBook, BibleVerse, ExternalQuizQuestion } from '../types';

// Metadados dos Livros (Simplificado para o Plano de Leitura)
export const BIBLE_BOOKS: BibleBook[] = [
  { id: 'GEN', name: 'Gênesis', testament: 'old', chapters: 50 },
  { id: 'EXO', name: 'Êxodo', testament: 'old', chapters: 40 },
  { id: 'LEV', name: 'Levítico', testament: 'old', chapters: 27 },
  { id: 'NUM', name: 'Números', testament: 'old', chapters: 36 },
  { id: 'DEU', name: 'Deuteronômio', testament: 'old', chapters: 34 },
  { id: 'JOS', name: 'Josué', testament: 'old', chapters: 24 },
  { id: 'JDG', name: 'Juízes', testament: 'old', chapters: 21 },
  { id: 'RUT', name: 'Rute', testament: 'old', chapters: 4 },
  { id: '1SA', name: '1 Samuel', testament: 'old', chapters: 31 },
  { id: '2SA', name: '2 Samuel', testament: 'old', chapters: 24 },
  { id: '1KI', name: '1 Reis', testament: 'old', chapters: 22 },
  { id: '2KI', name: '2 Reis', testament: 'old', chapters: 25 },
  { id: '1CH', name: '1 Crônicas', testament: 'old', chapters: 29 },
  { id: '2CH', name: '2 Crônicas', testament: 'old', chapters: 36 },
  { id: 'EZR', name: 'Esdras', testament: 'old', chapters: 10 },
  { id: 'NEH', name: 'Neemias', testament: 'old', chapters: 13 },
  { id: 'EST', name: 'Ester', testament: 'old', chapters: 10 },
  { id: 'JOB', name: 'Jó', testament: 'old', chapters: 42 },
  { id: 'PSA', name: 'Salmos', testament: 'old', chapters: 150 },
  { id: 'PRO', name: 'Provérbios', testament: 'old', chapters: 31 },
  { id: 'ECC', name: 'Eclesiastes', testament: 'old', chapters: 12 },
  { id: 'SNG', name: 'Cantares', testament: 'old', chapters: 8 },
  { id: 'ISA', name: 'Isaías', testament: 'old', chapters: 66 },
  { id: 'JER', name: 'Jeremias', testament: 'old', chapters: 52 },
  { id: 'LAM', name: 'Lamentações', testament: 'old', chapters: 5 },
  { id: 'EZK', name: 'Ezequiel', testament: 'old', chapters: 48 },
  { id: 'DAN', name: 'Daniel', testament: 'old', chapters: 12 },
  { id: 'HOS', name: 'Oseias', testament: 'old', chapters: 14 },
  { id: 'JOE', name: 'Joel', testament: 'old', chapters: 3 },
  { id: 'AMO', name: 'Amós', testament: 'old', chapters: 9 },
  { id: 'OBA', name: 'Obadias', testament: 'old', chapters: 1 },
  { id: 'JON', name: 'Jonas', testament: 'old', chapters: 4 },
  { id: 'MIC', name: 'Miqueias', testament: 'old', chapters: 7 },
  { id: 'NAH', name: 'Naum', testament: 'old', chapters: 3 },
  { id: 'HAB', name: 'Habacuque', testament: 'old', chapters: 3 },
  { id: 'ZEP', name: 'Sofonias', testament: 'old', chapters: 3 },
  { id: 'HAG', name: 'Ageu', testament: 'old', chapters: 2 },
  { id: 'ZEC', name: 'Zacarias', testament: 'old', chapters: 14 },
  { id: 'MAL', name: 'Malaquias', testament: 'old', chapters: 4 },
  { id: 'MAT', name: 'Mateus', testament: 'new', chapters: 28 },
  { id: 'MRK', name: 'Marcos', testament: 'new', chapters: 16 },
  { id: 'LUK', name: 'Lucas', testament: 'new', chapters: 24 },
  { id: 'JHN', name: 'João', testament: 'new', chapters: 21 },
  { id: 'ACT', name: 'Atos', testament: 'new', chapters: 28 },
  { id: 'ROM', name: 'Romanos', testament: 'new', chapters: 16 },
  { id: '1CO', name: '1 Coríntios', testament: 'new', chapters: 16 },
  { id: '2CO', name: '2 Coríntios', testament: 'new', chapters: 13 },
  { id: 'GAL', name: 'Gálatas', testament: 'new', chapters: 6 },
  { id: 'EPH', name: 'Efésios', testament: 'new', chapters: 6 },
  { id: 'PHP', name: 'Filipenses', testament: 'new', chapters: 4 },
  { id: 'COL', name: 'Colossenses', testament: 'new', chapters: 4 },
  { id: '1TH', name: '1 Tessalonicenses', testament: 'new', chapters: 5 },
  { id: '2TH', name: '2 Tessalonicenses', testament: 'new', chapters: 3 },
  { id: '1TI', name: '1 Timóteo', testament: 'new', chapters: 6 },
  { id: '2TI', name: '2 Timóteo', testament: 'new', chapters: 4 },
  { id: 'TIT', name: 'Tito', testament: 'new', chapters: 3 },
  { id: 'PHM', name: 'Filemom', testament: 'new', chapters: 1 },
  { id: 'HEB', name: 'Hebreus', testament: 'new', chapters: 13 },
  { id: 'JAS', name: 'Tiago', testament: 'new', chapters: 5 },
  { id: '1PE', name: '1 Pedro', testament: 'new', chapters: 5 },
  { id: '2PE', name: '2 Pedro', testament: 'new', chapters: 3 },
  { id: '1JN', name: '1 João', testament: 'new', chapters: 5 },
  { id: '2JN', name: '2 João', testament: 'new', chapters: 1 },
  { id: '3JN', name: '3 João', testament: 'new', chapters: 1 },
  { id: 'JUD', name: 'Judas', testament: 'new', chapters: 1 },
  { id: 'REV', name: 'Apocalipse', testament: 'new', chapters: 22 },
];

export class BibleService {
  private static API_URL = 'https://bible-api.com';
  private static OPENTDB_URL = 'https://opentdb.com/api.php';
  // Endpoint não-oficial do Google Translate (sem chave, sem custo)
  private static GTRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

  // Cache em memória para não requisitar a API toda vez
  private static _externalQuizCache: ExternalQuizQuestion[] = [];
  private static _externalQuizCacheDate: string | null = null;

  /**
   * Banco curado de quizzes por capítulo (PT-BR).
   * Chave: "BOOK_ID:CHAPTER" — mesma estrutura do MOCK_QUIZZES do BibleViewer.
   * Centralizado aqui para ser usado tanto no BibleViewer quanto no Devocional.
   */
  static readonly QUIZ_BANK: Record<string, ExternalQuizQuestion[]> = {
    'JHN:1': [
      { id:'jhn1_1', question:"Segundo João 1:1, o Verbo estava com quem no princípio?", options:["Com os anjos","Com Deus","Com Abraão","Com Moisés"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'JHN:1' },
      { id:'jhn1_2', question:"João 1:4 — a vida no Verbo era, para os homens, o quê?", options:["A Salvação","A Lei","A Luz","A Paz"], correctIndex:2, difficulty:'easy', source:'local', chapterRef:'JHN:1' },
      { id:'jhn1_3', question:"Qual foi a missão de João Batista segundo João 1:7?", options:["Batizar o povo","Ser a luz","Dar testemunho da luz","Anunciar a lei"], correctIndex:2, difficulty:'medium', source:'local', chapterRef:'JHN:1' },
      { id:'jhn1_4', question:"Em João 1:29 João Batista chamou Jesus de quê?", options:["Filho de Davi","Cordeiro de Deus que tira o pecado","Rei de Israel","Profeta"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'JHN:1' },
    ],
    'JHN:3': [
      { id:'jhn3_1', question:"O que Jesus disse ser necessário para ver o Reino de Deus? (Jo 3:3)", options:["Guardar a lei","Nascer de novo","Fazer boas obras","Ser batizado"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'JHN:3' },
      { id:'jhn3_2', question:"Complete João 3:16: 'Porque Deus amou o mundo de tal maneira que...'", options:["enviou seus profetas","deu seu Filho unigênito","criou os anjos","escreveu a lei"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'JHN:3' },
      { id:'jhn3_3', question:"O que João Batista disse sobre si mesmo em relação a Jesus? (Jo 3:30)", options:["Sou igual a Ele","É necessário que Ele cresça e eu diminua","Sou o maior discípulo","Fui enviado para substituí-Lo"], correctIndex:1, difficulty:'medium', source:'local', chapterRef:'JHN:3' },
    ],
    'ROM:8': [
      { id:'rom8_1', question:"Segundo Romanos 8:1, o que há para os que estão em Cristo Jesus?", options:["Grande tribulação","Nenhuma condenação","Muito trabalho","Julgamento"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'ROM:8' },
      { id:'rom8_2', question:"Quem intercede por nós com gemidos inexprimíveis? (Rm 8:26)", options:["Os anjos","Os profetas","O Espírito Santo","Jesus na terra"], correctIndex:2, difficulty:'medium', source:'local', chapterRef:'ROM:8' },
      { id:'rom8_3', question:"O que Paulo afirma que pode nos separar do amor de Cristo? (Rm 8:38-39)", options:["O sofrimento","A perseguição","Nada em toda a criação","Nossos pecados"], correctIndex:2, difficulty:'hard', source:'local', chapterRef:'ROM:8' },
    ],
    'EPH:2': [
      { id:'eph2_1', question:"Pela graça sois salvos, mediante a fé. Isso é dom de quem? (Ef 2:8)", options:["De nós mesmos","Dos profetas","De Deus","Da Igreja"], correctIndex:2, difficulty:'easy', source:'local', chapterRef:'EPH:2' },
      { id:'eph2_2', question:"Cristo é chamado de quê em Efésios 2:14?", options:["Rei dos reis","Nossa paz","Luz do mundo","Bom pastor"], correctIndex:1, difficulty:'medium', source:'local', chapterRef:'EPH:2' },
    ],
    'PHP:4': [
      { id:'php4_1', question:"Qual é o versículo célebre de Filipenses 4:13?", options:["Posso tudo naquele que me fortalece","Sei ter abundância","O Senhor está perto","Não andeis ansiosos"], correctIndex:0, difficulty:'easy', source:'local', chapterRef:'PHP:4' },
      { id:'php4_2', question:"O que guarda nossos corações segundo Filipenses 4:7?", options:["O amor de Deus","A graça divina","A paz de Deus que excede todo entendimento","A oração constante"], correctIndex:2, difficulty:'medium', source:'local', chapterRef:'PHP:4' },
    ],
    'HEB:11': [
      { id:'heb11_1', question:"Como Hebreus 11:1 define a fé?", options:["A certeza de coisas que vemos","A certeza das coisas que se esperam e prova das que não se veem","Esperança de bênçãos materiais","Obediência à lei"], correctIndex:1, difficulty:'medium', source:'local', chapterRef:'HEB:11' },
      { id:'heb11_2', question:"O que Noé preparou por fé, segundo Hebreus 11:7?", options:["Uma cidade","Uma arca","Um exército","Um templo"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'HEB:11' },
    ],
    'MAT:5': [
      { id:'mat5_1', question:"Qual é a primeira bem-aventurança? (Mt 5:3)", options:["Bem-aventurados os mansos","Bem-aventurados os pobres de espírito","Bem-aventurados os misericordiosos","Bem-aventurados os puros"], correctIndex:1, difficulty:'medium', source:'local', chapterRef:'MAT:5' },
      { id:'mat5_2', question:"Em Mateus 5:44, o que Jesus manda fazer com os inimigos?", options:["Evitá-los","Amá-los e orar por eles","Corrigi-los","Combatê-los"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'MAT:5' },
    ],
    'ACT:2': [
      { id:'act2_1', question:"O que aconteceu no dia de Pentecostes? (At 2:3)", options:["Coluna de nuvem","Línguas de fogo sobre cada um","Terremoto","Vozes do céu"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'ACT:2' },
      { id:'act2_2', question:"Quantas pessoas foram batizadas após o sermão de Pedro? (At 2:41)", options:["~300","~500","~3.000","~5.000"], correctIndex:2, difficulty:'medium', source:'local', chapterRef:'ACT:2' },
    ],
    '1CO:13': [
      { id:'1co13_1', question:"Segundo 1 Coríntios 13:13, qual é o maior de todos?", options:["A fé","A esperança","O amor","A profecia"], correctIndex:2, difficulty:'easy', source:'local', chapterRef:'1CO:13' },
      { id:'1co13_2', question:"O amor é paciente e... (1 Co 13:4)", options:["firme","benigno","perfeito","eterno"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'1CO:13' },
    ],
    'GAL:5': [
      { id:'gal5_1', question:"Qual é o primeiro fruto do Espírito listado em Gálatas 5:22?", options:["Alegria","Paz","Amor","Bondade"], correctIndex:2, difficulty:'easy', source:'local', chapterRef:'GAL:5' },
      { id:'gal5_2', question:"Para que Cristo nos libertou? (Gl 5:1)", options:["Fazermos o que quisermos","Estarmos na liberdade","Guardarmos mais leis","Servir líderes"], correctIndex:1, difficulty:'medium', source:'local', chapterRef:'GAL:5' },
    ],
    '1JN:4': [
      { id:'1jn4_1', question:"Qual é a definição de Deus em 1 João 4:8?", options:["Deus é juiz","Deus é luz","Deus é amor","Deus é fogo"], correctIndex:2, difficulty:'easy', source:'local', chapterRef:'1JN:4' },
      { id:'1jn4_2', question:"Quem diz amar a Deus mas odeia o irmão? (1 Jo 4:20)", options:["Fraco na fé","Mentiroso","Ignorante","Não convertido"], correctIndex:1, difficulty:'medium', source:'local', chapterRef:'1JN:4' },
    ],
    'DAN:3': [
      { id:'dan3_1', question:"O que Sadraque, Mesaque e Abednego disseram ao rei Nabucodonozor?", options:["Precisam pensar","Não adorariam a estátua mesmo que Deus não os livrasse","O rei tinha razão","Fugiriam"], correctIndex:1, difficulty:'hard', source:'local', chapterRef:'DAN:3' },
    ],
    'GEN:1': [
      { id:'gen1_1', question:"O que Deus criou no primeiro dia?", options:["O sol e a lua","Os animais","A luz","Os peixes"], correctIndex:2, difficulty:'easy', source:'local', chapterRef:'GEN:1' },
      { id:'gen1_2', question:"Em qual dia Deus criou o ser humano?", options:["Quarto","Quinto","Sexto","Sétimo"], correctIndex:2, difficulty:'easy', source:'local', chapterRef:'GEN:1' },
      { id:'gen1_3', question:"O que Deus fez no sétimo dia?", options:["Criou os anjos","Descansou","Julgou a criação","Criou o mar"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'GEN:1' },
    ],
    'PSA:23': [
      { id:'psa23_1', question:"Com que Davi compara o Senhor no início do Salmo 23?", options:["Um rei","Um pastor","Um escudo","Uma fortaleza"], correctIndex:1, difficulty:'easy', source:'local', chapterRef:'PSA:23' },
      { id:'psa23_2', question:"Em Salmos 23:4, por qual vale Davi caminha sem temer?", options:["Vale da bênção","Vale das águas","Vale da sombra da morte","Vale do silêncio"], correctIndex:2, difficulty:'medium', source:'local', chapterRef:'PSA:23' },
    ],
  };

  /**
   * Palavras-chave por livro bíblico para filtrar perguntas externas.
   * Usadas quando não há quiz local para o capítulo solicitado.
   */
  private static readonly BOOK_KEYWORDS: Record<string, string[]> = {
    GEN: ['genesis','creation','adam','eve','noah','abraham','jacob','joseph','cain','abel'],
    EXO: ['exodus','moses','pharaoh','plagues','passover','sinai','commandments','red sea'],
    PSA: ['psalm','psalms','david','praise','lord is my shepherd'],
    PRO: ['proverbs','wisdom','solomon','fool','righteous','understanding'],
    ISA: ['isaiah','servant','messiah','immanuel','prophecy','comfort'],
    DAN: ['daniel','nebuchadnezzar','shadrach','meshach','abednego','fiery furnace','lion'],
    JON: ['jonah','whale','nineveh','great fish'],
    MAT: ['matthew','sermon on the mount','beatitudes','wise men','herod','kingdom of heaven'],
    MRK: ['mark','gospel','miracles','jesus healed','immediately'],
    LUK: ['luke','parable','prodigal','good samaritan','zachaeus','christmas','nativity'],
    JHN: ['john','word','logos','nicodemus','lazarus','i am','the way','3:16','born again'],
    ACT: ['acts','apostles','pentecost','holy spirit','peter','paul','stephen','barnabas'],
    ROM: ['romans','justification','grace','faith','sin','salvation','condemnation'],
    '1CO': ['corinthians','love chapter','spiritual gifts','resurrection','speaking in tongues'],
    GAL: ['galatians','law','grace','fruit of the spirit','freedom','justified'],
    EPH: ['ephesians','armor of god','grace through faith','body of christ'],
    PHP: ['philippians','joy','i can do all things','peace of god','contentment'],
    COL: ['colossians','supremacy','christ is all','head of the church'],
    HEB: ['hebrews','faith','hall of faith','high priest','new covenant'],
    JAS: ['james','faith and works','taming the tongue','wisdom','patience'],
    '1JN': ['1 john','love one another','god is love','eternal life','light'],
  };

  /**
   * Retorna perguntas de quiz para um capítulo específico.
   *
   * Estratégia em 3 camadas:
   * 1. Banco local curado (exato, PT-BR) — prioridade máxima
   * 2. Cache externo filtrado por palavras-chave do livro (traduzido)
   * 3. Fallback: qualquer pergunta bíblica do cache externo
   *
   * @param bookId  ID do livro (ex: 'JHN')
   * @param chapter Número do capítulo (ex: 3)
   * @param count   Quantidade de perguntas desejada (padrão: 3)
   */
  static async getQuizForChapter(
    bookId: string,
    chapter: number,
    count = 3
  ): Promise<ExternalQuizQuestion[]> {
    const key = `${bookId}:${chapter}`;

    // ── Camada 1: banco local curado ─────────────────────────────
    const localQuestions = this.QUIZ_BANK[key];
    if (localQuestions && localQuestions.length >= count) {
      return this._shuffleArray(localQuestions).slice(0, count);
    }

    // ── Camada 2: cache externo filtrado por livro ────────────────
    // Garante que o cache foi populado (busca se necessário)
    if (this._externalQuizCache.length === 0) {
      await this.fetchExternalQuizQuestions(30);
    }

    const keywords = (this.BOOK_KEYWORDS[bookId] ?? []).map(k => k.toLowerCase());
    const filtered = this._externalQuizCache.filter(q => {
      const text = q.question.toLowerCase();
      return keywords.some(kw => text.includes(kw));
    });

    // Combina local parcial + externo filtrado
    const partial = localQuestions ?? [];
    const combined = this._shuffleArray([...partial, ...filtered]);
    if (combined.length >= count) {
      return combined.slice(0, count);
    }

    // ── Camada 2.5: gera perguntas automaticamente a partir do texto bíblico ─
    // Usa bible-api.com (já integrado) para buscar os versículos do capítulo
    // e gera perguntas de "complete o versículo" e "quem/o quê" dinamicamente.
    const generated = await this.generateQuestionsFromVerses(bookId, chapter, count);
    if (generated.length > 0) {
      const withPartial = this._shuffleArray([...combined, ...generated]);
      return withPartial.slice(0, count);
    }

    // ── Camada 3: fallback — qualquer pergunta bíblica do cache ───
    const fallback = this._shuffleArray([
      ...combined,
      ...this._externalQuizCache.filter(q => !combined.includes(q)),
    ]);
    return fallback.slice(0, count);
  }

  /**
   * Gera perguntas automaticamente a partir dos versículos do capítulo.
   * Usa o texto real da bible-api.com para criar perguntas do tipo:
   *  - "Complete: [início do versículo] ___" (fill-in-the-blank)
   *  - "Qual palavra falta? [versículo com lacuna]"
   *
   * Isso garante cobertura de QUALQUER capítulo dos 1.189 da Bíblia,
   * não apenas os 14 que temos curados no banco local.
   */
  static async generateQuestionsFromVerses(
    bookId: string,
    chapter: number,
    count = 3
  ): Promise<ExternalQuizQuestion[]> {
    try {
      const verses = await this.fetchChapter(bookId, chapter);
      if (verses.length === 0) return [];

      const bookData = BIBLE_BOOKS.find(b => b.id === bookId);
      const bookName = bookData?.name ?? bookId;

      const questions: ExternalQuizQuestion[] = [];

      // Seleciona versículos significativos (evita versos muito curtos < 40 chars)
      const meaningful = verses.filter(v => v.text.trim().length >= 40);
      const picked = this._shuffleArray(meaningful).slice(0, count * 2);

      for (const verse of picked) {
        const text = verse.text.trim().replace(/\s+/g, ' ');
        const words = text.split(' ');
        if (words.length < 6) continue;

        // ── Estratégia 1: Fill-in-the-blank ──────────────────────
        // Escolhe uma palavra-chave do meio/fim do versículo para remover
        const keywordIndex = Math.floor(words.length * 0.55);
        const keyword = words[keywordIndex];
        // Ignora palavras muito curtas (artigos, preposições)
        if (keyword.length < 4) continue;

        const gapped = words
          .map((w, i) => (i === keywordIndex ? '______' : w))
          .join(' ');

        // Gera distractors plausíveis: outras palavras do mesmo versículo
        const distractors = words
          .filter((w, i) => i !== keywordIndex && w.length >= 4)
          .map(w => w.replace(/[.,;:!?]+$/g, '')) // limpa pontuação
          .filter((w, i, arr) => arr.indexOf(w) === i) // unique
          .slice(0, 3);

        // Se não tiver distractors suficientes, pula
        if (distractors.length < 3) continue;

        const correctWord = keyword.replace(/[.,;:!?]+$/g, '');
        const allOptions = this._shuffleArray([correctWord, ...distractors.slice(0, 3)]);
        const correctIndex = allOptions.indexOf(correctWord);

        if (correctIndex === -1) continue;

        questions.push({
          id: `gen_${bookId}_${chapter}_${verse.verse}`,
          question: `${bookName} ${chapter}:${verse.verse} — Complete o versículo:\n"${gapped}"`,
          options: allOptions,
          correctIndex,
          difficulty: 'medium',
          source: 'local',
          chapterRef: `${bookId}:${chapter}`,
        });

        if (questions.length >= count) break;
      }

      return questions;
    } catch {
      return [];
    }
  }

  /**
   * Busca um capítulo inteiro
   */
  static async fetchChapter(bookName: string, chapter: number): Promise<BibleVerse[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      // 🇧🇷 Forçando tradução Almeida (se disponível) ou padrão
      const response = await fetch(`${this.API_URL}/${bookName}+${chapter}?translation=almeida`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await response.json();
      
      if (!data.verses) return [];

      return data.verses.map((v: { verse: number; text: string }) => ({
        bookId: bookName,
        bookName: data.reference.split(' ')[0],
        chapter: chapter,
        verse: v.verse,
        text: v.text
      }));
    } catch (err) {
      clearTimeout(timeout);
      console.error("Erro ao buscar capítulo bíblico:", err);
      return [];
    }
  }

  /**
   * Busca perguntas de quiz da OpenTDB (Open Trivia Database)
   * Categoria 20 = Mythology, Categoria 22 = Religion/Bible
   * Resultados são cacheados por 24h para evitar rate-limiting.
   * 
   * Retorna até `amount` perguntas no formato padronizado da plataforma.
   */
  static async fetchExternalQuizQuestions(amount = 20): Promise<ExternalQuizQuestion[]> {
    const today = new Date().toISOString().split('T')[0];
    // Cache inválido após 12h — PWAs ficam abertos por dias sem recarregar
    const now = Date.now();
    const cacheAgeMs = this._externalQuizCacheDate
      ? now - new Date(this._externalQuizCacheDate).getTime()
      : Infinity;
    const isCacheValid = cacheAgeMs < 12 * 60 * 60 * 1000 && this._externalQuizCache.length > 0;

    if (isCacheValid) {
      return this._shuffleArray([...this._externalQuizCache]).slice(0, amount);
    }

    try {
      // Categoria 23 = History (inclui história bíblica)
      // Categoria 22 = Entertainment:Books (inclui Bíbia)
      // REMOVIDA Categoria 20 (Mythology) — inclui mitologia grega/nórdica que contaminava o quiz
      const [resReligion, resBooks] = await Promise.allSettled([
        fetch(`${this.OPENTDB_URL}?amount=30&category=23&type=multiple`),
        fetch(`${this.OPENTDB_URL}?amount=20&category=22&type=multiple`),
      ]);

      const questions: ExternalQuizQuestion[] = [];

      for (const res of [resReligion, resBooks]) {
        if (res.status !== 'fulfilled') continue;
        const data = await res.value.json();
        if (data.response_code !== 0 || !data.results) continue;

        for (const q of data.results) {
          const decoded = this._decodeHTMLEntities;
          // Filtra apenas perguntas com conteúdo cristão/bíblico relevante
          const questionText = decoded(q.question).toLowerCase();
          const isBiblical = 
            questionText.includes('jesus') ||
            questionText.includes('bible') ||
            questionText.includes('christ') ||
            questionText.includes('disciple') ||
            questionText.includes('apostle') ||
            questionText.includes('testament') ||
            questionText.includes('gospel') ||
            questionText.includes('psalm') ||
            questionText.includes('prophet') ||
            questionText.includes('noah') ||
            questionText.includes('moses') ||
            questionText.includes('abraham') ||
            questionText.includes('david') ||
            questionText.includes('solomon') ||
            questionText.includes('scripture');

          // Exclui explicitamente perguntas de mitologia pagã que passam pelo filtro 'god'
          const isMythology =
            questionText.includes('greek') ||
            questionText.includes('roman god') ||
            questionText.includes('norse') ||
            questionText.includes('zeus') ||
            questionText.includes('olymp') ||
            questionText.includes('hercules') ||
            questionText.includes('thor') ||
            questionText.includes('odin') ||
            questionText.includes('poseidon') ||
            questionText.includes('athena') ||
            questionText.includes('apollo') ||
            questionText.includes('mythology');

          if (!isBiblical || isMythology) continue;

          const allOptions = [
            ...q.incorrect_answers.map(decoded),
            decoded(q.correct_answer)
          ];
          const shuffled = this._shuffleArray(allOptions);
          const correctIndex = shuffled.indexOf(decoded(q.correct_answer));

          questions.push({
            id: `ext_${Math.random().toString(36).substr(2, 9)}`,
            question: decoded(q.question),
            options: shuffled,
            correctIndex,
            difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
            source: 'opentdb',
          });
        }
      }

      if (questions.length > 0) {
        // Traduzir todas as perguntas para PT-BR antes de cachear
        console.log(`[BibleService] Traduzindo ${questions.length} perguntas para PT-BR...`);
        const translated = await this._translateAllQuestions(questions);
        this._externalQuizCache = translated;
        this._externalQuizCacheDate = new Date().toISOString(); // Timestamp completo para controle de 12h
      }

      return this._shuffleArray(this._externalQuizCache).slice(0, amount);
    } catch (err) {
      console.error('Erro ao buscar quiz externo:', err);
      return [];
    }
  }

  /**
   * Retorna perguntas para o Duelo Bíblico:
   * mistura perguntas do banco local com as externas da OpenTDB.
   */
  static async getDuelQuestions(
    localBank: ExternalQuizQuestion[],
    count = 5
  ): Promise<ExternalQuizQuestion[]> {
    const external = await this.fetchExternalQuizQuestions(count * 2);
    const combined = this._shuffleArray([...localBank, ...external]);
    return combined.slice(0, count);
  }

  // ── Utilitários privados ───────────────────────────────────────

  /**
   * Traduz uma pergunta (texto + opções) do inglês para PT-BR.
   * Combina todos os textos em uma única requisição separados por um
   * delimitador único para minimizar chamadas à API.
   */
  private static async _translateQuestionToPtBR(
    q: ExternalQuizQuestion
  ): Promise<ExternalQuizQuestion> {
    const DELIM = '|||TR|||';
    const texts = [q.question, ...q.options];
    const combined = texts.join(`\n${DELIM}\n`);

    try {
      const url =
        `${this.GTRANSLATE_URL}?client=gtx&sl=en&tl=pt-BR&dt=t` +
        `&q=${encodeURIComponent(combined)}`;

      const res = await fetch(url);
      if (!res.ok) return q;
      const data = await res.json();

      // O endpoint retorna [[['texto traduzido', 'original'], ...], ...]
      const raw: string = data[0]
        .map((chunk: [string, ...unknown[]]) => chunk[0])
        .join('');

      // Separa de volta pelas variações do delimitador (translate pode alterar espaços)
      const parts = raw
        .split(/\|{2,3}TR\|{2,3}/i)
        .map((s) => s.replace(/^\n+|\n+$/g, '').trim())
        .filter(Boolean);

      if (parts.length < 5) return q; // fallback: retorna original se parseou errado

      return {
        ...q,
        question: parts[0],
        options: parts.slice(1, 5),
      };
    } catch {
      return q; // fallback silencioso
    }
  }

  /**
   * Traduz todas as perguntas em lotes de 5 para evitar sobrecarga.
   * Um delay de 200ms entre lotes respeita o rate-limit do endpoint.
   */
  private static async _translateAllQuestions(
    questions: ExternalQuizQuestion[]
  ): Promise<ExternalQuizQuestion[]> {
    const BATCH_SIZE = 5;
    const result: ExternalQuizQuestion[] = [];

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const settled = await Promise.allSettled(
        batch.map((q) => this._translateQuestionToPtBR(q))
      );
      settled.forEach((r, idx) => {
        result.push(r.status === 'fulfilled' ? r.value : batch[idx]);
      });
      // Pequeno delay entre lotes para não ser bloqueado
      if (i + BATCH_SIZE < questions.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return result;
  }

  private static _shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private static _decodeHTMLEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&eacute;/g, 'é')
      .replace(/&agrave;/g, 'à')
      .replace(/&oacute;/g, 'ó')
      .replace(/&uuml;/g, 'ü');
  }

  /**
   * Concordância Bíblica: Pesquisa por palavras-chave
   */
  static async searchVerses(query: string): Promise<BibleVerse[]> {
    if (!query || query.length < 3) return [];
    try {
      // 🇧🇷 Usando Bolls API (suporta busca em PT-BR sem token)
      // Tradução NVT (Nova Versão Transformadora)
      const response = await fetch(`https://bolls.life/search/NVT/?search=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Falha na API de busca');
      
      const data = await response.json();
      
      // Bolls search endpoint retorna uma array de objetos diretamente
      if (!Array.isArray(data)) return [];

      return data.slice(0, 50).map((v: any) => {
        const bookData = BIBLE_BOOKS[v.book - 1]; // Bolls é 1-indexed e segue a ordem canônica
        return {
          bookId: bookData?.id || 'JHN',
          bookName: bookData?.name || 'Bíblia',
          chapter: v.chapter,
          verse: v.verse,
          text: (v.text || '').replace(/<\/?[^>]+(>|$)/g, "") // Remove tags HTML como <mark> e <br>
        };
      });
    } catch (err) {
      console.error("Erro na busca bíblica:", err);
      return [];
    }
  }

  /**
   * Converte um índice linear (0-1188) para Livro e Capítulo
   */
  static getChapterByLinearIndex(index: number): { book: BibleBook; chapter: number } {
    let currentCount = 0;
    const normalizedIndex = index % 1189; // 1189 total chapters

    for (const book of BIBLE_BOOKS) {
      if (normalizedIndex < currentCount + book.chapters) {
        return {
          book,
          chapter: (normalizedIndex - currentCount) + 1
        };
      }
      currentCount += book.chapters;
    }
    return { book: BIBLE_BOOKS[0], chapter: 1 };
  }

  /**
   * Lista de Livros Fundamentais (Jesus, Sabedoria, Identidade e Igreja)
   * Expandido para cobrir os pilares do crescimento cristão de jovens
   */
  static FOUNDATION_BOOKS = [
    // ─── EVANGELHOS: Conhecer Jesus ────────────────────────────────
    'MAT', // Mateus — Sermão da Montanha, ensinos de Jesus
    'MRK', // Marcos — Jesus em ação
    'LUK', // Lucas — misericórdia, parábolas
    'JHN', // João — Verbo encarnado, João 3:16
    // ─── ATOS: A Igreja e o Espírito Santo ─────────────────────────
    'ACT', // Atos — Pentecostes, missão, primeiros cristãos
    // ─── CARTAS FUNDAMENTAIS: Doutrina e Caráter ───────────────────
    'ROM', // Romanos — pecado, graça, justificação
    'GAL', // Gálatas — graça vs. lei, fruto do Espírito
    '1CO', // 1 Coríntios — dons, amor (cap.13), ressurreição (cap.15)
    'EPH', // Efésios — identidade em Cristo
    'PHP', // Filipenses — alegria, contentamento (4:13)
    'COL', // Colossenses — supremacia de Cristo
    'HEB', // Hebreus — Cristo sumo sacerdote, fé (cap. 11)
    'JAS', // Tiago — fé com obras, sabedoria prática
    '1JN', // 1 João — amor, certeza da salvação
    // ─── SABEDORIA: Caráter e Vida Prática ─────────────────────────
    'PSA', // Salmos — louvor, lamento, confiança
    'PRO', // Provérbios — sabedoria para jovens
    // ─── PROFETAS / HISTÓRICOS CHAVE ────────────────────────────────
    'DAN', // Daniel — fé sob pressão, jovens no mundo
    'JON', // Jonas — misericórdia e missão
    'ISA', // Isaías — servo sofredor, messias prometido
  ];

  /**
   * Retorna um capítulo aleatório mas consistente para o dia baseado nos fundamentos.
   * ESTRATÉGIA: Sorteia o LIVRO primeiro (peso igual por livro), depois o capítulo.
   * Isso garante que todos os livros tenham a mesma probabilidade de aparecer,
   * evitando que Salmos (150 cap.) domine 42% das leituras.
   */
  static getFoundationChapter(date: Date) {
    // Hash de alta qualidade (FNV-like) para evitar bias do módulo simples
    const day   = date.getDate();
    const month = date.getMonth() + 1;
    const year  = date.getFullYear();

    // Gera duas seeds independentes: uma para o livro, outra para o capítulo
    // Usando multiplicação de primos para melhor distribuição
    const seedForBook    = ((year * 2654435761) ^ (month * 40503) ^ (day * 12289)) >>> 0;
    const seedForChapter = ((year * 40503) ^ (month * 12289) ^ (day * 2654435761)) >>> 0;

    const books = this.FOUNDATION_BOOKS;
    if (books.length === 0) return { book: BIBLE_BOOKS[0], chapter: 1 };

    // 1. Escolhe o livro com peso igual
    const bookId   = books[seedForBook % books.length];
    const bookData = BIBLE_BOOKS.find(b => b.id === bookId) || BIBLE_BOOKS[42];

    // 2. Escolhe o capítulo dentro do livro
    const chapter = (seedForChapter % bookData.chapters) + 1;

    return { book: bookData, chapter };
  }

  /**
   * Converte Livro e Capítulo para um índice linear (0-1188)
   */
  static getLinearIndex(bookId: string, chapter: number): number {
    let index = 0;
    for (const book of BIBLE_BOOKS) {
      if (book.id === bookId) {
        return index + (chapter - 1);
      }
      index += book.chapters;
    }
    return 0;
  }

  /**
   * Calcula o capítulo do dia baseado em uma configuração de início
   */
  static getDailyChapter(config: { mode?: 'linear' | 'random'; startDate: string; startBookId: string; startChapter: number }) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (config.mode === 'random') {
      return this.getFoundationChapter(now);
    }

    const start = new Date(config.startDate);
    start.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const startIndex = this.getLinearIndex(config.startBookId, config.startChapter);
    const currentIndex = (startIndex + diffDays) % 1189;

    return this.getChapterByLinearIndex(currentIndex);
  }

  /**
   * Lógica do Plano de Leitura Anual
   */
  static getDailyReading() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    return {
      day: dayOfYear,
      suggestedReading: "João 1-3"
    };
  }
}
