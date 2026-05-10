import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Check, BookOpen } from 'lucide-react';
import { BIBLE_BOOKS } from '../../lib/BibleService';
import { BibleService } from '../../lib/BibleService';
import { BibleVerse } from '../../types';

interface VerseSelection {
  bookId: string;
  bookName: string;
  chapter: number;
  verseNumber: number;
  verseText: string;
  verseRef: string; // ex: "Joao 3:16"
}

interface Props {
  onSelect: (v: VerseSelection) => void;
  onClose: () => void;
}

export default function VersePickerModal({ onSelect, onClose }: Props) {
  const [selectedBookId, setSelectedBookId] = useState('JHN');
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);

  const book = BIBLE_BOOKS.find(b => b.id === selectedBookId) ?? BIBLE_BOOKS[42];

  useEffect(() => {
    setLoading(true);
    setSelectedVerse(null);
    BibleService.fetchChapter(book.id, chapter).then(data => {
      setVerses(data);
      setLoading(false);
    });
  }, [book.id, chapter]);

  const handleConfirm = () => {
    if (selectedVerse === null) return;
    const verse = verses.find(v => v.verse === selectedVerse);
    if (!verse) return;
    onSelect({
      bookId:      book.id,
      bookName:    book.name,
      chapter,
      verseNumber: selectedVerse,
      verseText:   verse.text,
      verseRef:    `${book.name} ${chapter}:${selectedVerse}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="w-full max-w-4xl bg-zinc-900 border-4 border-zinc-800 rounded-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b-2 border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={18} className="text-primary" />
            <h3 className="text-white font-black uppercase italic text-lg">Selecionar Versiculo</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Seletor de livro e capitulo */}
        <div className="px-6 py-4 flex gap-3 border-b-2 border-zinc-800">
          <select
            value={selectedBookId}
            onChange={e => { setSelectedBookId(e.target.value); setChapter(1); }}
            className="flex-1 bg-zinc-800 border-2 border-zinc-700 rounded-xl px-3 py-2 text-white text-sm font-bold focus:border-primary outline-none"
          >
            {BIBLE_BOOKS.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 bg-zinc-800 border-2 border-zinc-700 rounded-xl px-3">
            <button
              onClick={() => setChapter(c => Math.max(1, c - 1))}
              disabled={chapter === 1}
              className="text-zinc-400 hover:text-primary disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-white font-black text-sm w-6 text-center">{chapter}</span>
            <button
              onClick={() => setChapter(c => Math.min(book.chapters, c + 1))}
              disabled={chapter === book.chapters}
              className="text-zinc-400 hover:text-primary disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Lista de versiculos */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-hide">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            verses.map(v => (
              <button
                key={v.verse}
                onClick={() => setSelectedVerse(v.verse === selectedVerse ? null : v.verse)}
                className={`w-full text-left flex gap-3 px-4 py-3 rounded-xl transition-all
                  ${selectedVerse === v.verse
                    ? 'bg-primary/15 border-2 border-primary/50'
                    : 'hover:bg-zinc-800/60 border-2 border-transparent'}`}
              >
                <sup className="text-primary font-black text-[10px] mt-1.5 w-5 shrink-0 text-right">{v.verse}</sup>
                <p className="text-zinc-300 text-sm leading-relaxed flex-1">{v.text}</p>
                {selectedVerse === v.verse && (
                  <Check size={14} className="text-primary shrink-0 mt-1" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Preview e confirmar */}
        <div className="px-6 py-4 border-t-2 border-zinc-800 space-y-3">
          {selectedVerse !== null && (
            <div className="bg-black/40 border-l-4 border-primary rounded-r-xl p-3">
              <p className="text-primary font-black text-[9px] uppercase tracking-widest mb-1">
                {book.name} {chapter}:{selectedVerse}
              </p>
              <p className="text-zinc-300 text-xs italic leading-relaxed line-clamp-2">
                &ldquo;{verses.find(v => v.verse === selectedVerse)?.text}&rdquo;
              </p>
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={selectedVerse === null}
            className="w-full bg-primary text-black py-3.5 rounded-2xl font-black uppercase italic
                       tracking-tight hover:bg-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            USAR ESTE VERSICULO ✓
          </button>
        </div>
      </motion.div>
    </div>
  );
}
