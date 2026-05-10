import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Type, BookOpen, Youtube, Music, Loader2 } from 'lucide-react';
import { PostType, FeedPost, DEFAULT_MURAL_POINTS } from '../../types';
import { FeedService } from '../../lib/FeedService';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import PhotoUploader from './PhotoUploader';
import VersePickerModal from './VersePickerModal';

interface Props {
  initialData?: Partial<FeedPost>;
  onPublished: (post: FeedPost) => void;
  onClose: () => void;
}

type Tab = 'photo' | 'text' | 'bible_study' | 'youtube' | 'spotify_track';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'photo',        label: 'Foto',    icon: <Camera size={14} /> },
  { id: 'text',         label: 'Texto',   icon: <Type size={14} /> },
  { id: 'bible_study',  label: 'Estudo',  icon: <BookOpen size={14} /> },
  { id: 'youtube',      label: 'Video',   icon: <Youtube size={14} /> },
  { id: 'spotify_track',label: 'Musica',  icon: <Music size={14} /> },
];

export default function PostComposer({ initialData, onPublished, onClose }: Props) {
  const { profile } = useAuth();
  const { muralPoints } = useAppTheme();
  const { success: toastSuccess, error: toastError } = useToast();
  const cfg = muralPoints ?? DEFAULT_MURAL_POINTS;

  const initTab: Tab = (initialData?.postType as Tab) ?? 'photo';
  const [tab, setTab] = useState<Tab>(initTab);
  const [caption, setCaption] = useState(initialData?.caption ?? '');
  const [visibility, setVisibility] = useState<'public' | 'group_only'>('public');
  const [submitting, setSubmitting] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);

  // Foto
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? '');
  const [imagePath, setImagePath] = useState(initialData?.imagePath ?? '');

  // Versiculo
  const [verseRef, setVerseRef] = useState(initialData?.verseRef ?? '');
  const [verseText, setVerseText] = useState(initialData?.verseText ?? '');
  const [verseBookId, setVerseBookId] = useState(initialData?.verseBookId ?? '');
  const [verseChapter, setVerseChapter] = useState(initialData?.verseChapter ?? 0);
  const [verseNumber, setVerseNumber] = useState(initialData?.verseNumber ?? 0);

  // Estudo Biblico
  const [studyTitle, setStudyTitle] = useState('');
  const [studyBody, setStudyBody] = useState('');

  // YouTube
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  // Spotify
  const [spotifyInput, setSpotifyInput] = useState('');

  const canPublish = () => {
    if (tab === 'photo') return !!imageUrl;
    if (tab === 'text') return !!caption || !!verseRef;
    if (tab === 'bible_study') return !!studyTitle && !!studyBody;
    if (tab === 'youtube') return !!videoUrl;
    if (tab === 'spotify_track') return !!spotifyInput;
    return false;
  };

  const handlePublish = async () => {
    if (!profile || submitting) return;
    setSubmitting(true);
    try {
      let payload: Partial<FeedPost> = {
        authorId:   profile.id,
        groupId:    profile.groupId,
        postType:   tab as PostType,
        caption:    caption || undefined,
        visibility,
      };

      if (tab === 'photo') {
        payload = { ...payload, imageUrl, imagePath };
      } else if (tab === 'text') {
        payload = { ...payload, verseRef, verseText, verseBookId, verseChapter, verseNumber };
      } else if (tab === 'bible_study') {
        payload = { ...payload, studyTitle, studyBody };
      } else if (tab === 'youtube') {
        const videoId = FeedService.extractYouTubeId(videoUrl);
        payload = { ...payload, videoUrl, videoId, videoTitle: videoTitle || undefined };
      } else if (tab === 'spotify_track') {
        const meta = FeedService.extractSpotifyMeta(spotifyInput);
        payload = {
          ...payload,
          postType: meta.type === 'playlist' ? 'spotify_playlist' : 'spotify_track',
          spotifyUri: spotifyInput,
          spotifyUrl: spotifyInput,
          spotifyEmbedUrl: FeedService.buildSpotifyEmbedUrl(spotifyInput),
        };
      }

      const post = await FeedService.createPost(payload);
      if (!post) throw new Error('Falha ao publicar');

      // Conceder XP
      await FeedService.grantPostXP(profile.id, profile.groupId, tab as PostType, cfg);
      const xp = tab === 'bible_study' ? cfg.studyPoints : cfg.postPoints;
      toastSuccess('Publicado!', `+${xp} XP no Mural`);
      onPublished(post);
      onClose();
    } catch {
      toastError('Erro', 'Nao foi possivel publicar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-120 flex items-end sm:items-center justify-center sm:p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="relative w-full max-w-2xl bg-zinc-900 border-x-4 border-t-4 sm:border-b-4 border-zinc-800 rounded-t-4xl sm:rounded-4xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Handle mobile */}
          <div className="sm:hidden w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-1" />

          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b-2 border-zinc-800">
            <h3 className="text-white font-black uppercase italic text-lg">O que voce quer compartilhar?</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Tabs de tipo */}
          <div className="px-6 pt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-[10px]
                           tracking-widest whitespace-nowrap transition-all active:scale-95 border-2
                           ${tab === t.id
                             ? 'bg-primary text-black border-primary'
                             : 'bg-zinc-800 text-zinc-500 border-transparent hover:border-zinc-700 hover:text-white'}`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Conteudo por tab */}
          <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4 scrollbar-hide">
            {tab === 'photo' && (
              <>
                <PhotoUploader
                  onUploaded={(url, path) => { setImageUrl(url); setImagePath(path); }}
                  onClear={() => { setImageUrl(''); setImagePath(''); }}
                  preview={imageUrl || undefined}
                />
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Adicione uma legenda..."
                  rows={2}
                  className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-primary
                             rounded-2xl px-4 py-3 text-sm text-white outline-none resize-none
                             placeholder:text-zinc-600 transition-all"
                />
              </>
            )}

            {tab === 'text' && (
              <>
                {verseRef ? (
                  <div className="bg-black/40 border-l-4 border-primary rounded-r-2xl p-4 relative">
                    <button
                      onClick={() => { setVerseRef(''); setVerseText(''); setVerseBookId(''); }}
                      className="absolute top-2 right-2 text-zinc-500 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                    <p className="text-primary font-black text-[9px] uppercase tracking-widest">{verseRef}</p>
                    <p className="text-zinc-300 text-xs italic mt-1 leading-relaxed">&ldquo;{verseText}&rdquo;</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowVersePicker(true)}
                    className="w-full border-2 border-dashed border-zinc-700 rounded-2xl p-4
                               text-zinc-500 hover:border-primary hover:text-primary transition-all
                               flex items-center gap-2 justify-center font-black uppercase text-xs"
                  >
                    <BookOpen size={16} /> Adicionar versiculo da Biblia
                  </button>
                )}
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Seu comentario, reflexao ou frase..."
                  rows={4}
                  className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-primary
                             rounded-2xl px-4 py-3 text-sm text-white outline-none resize-none
                             placeholder:text-zinc-600 transition-all"
                />
              </>
            )}

            {tab === 'bible_study' && (
              <>
                <input
                  value={studyTitle}
                  onChange={e => setStudyTitle(e.target.value)}
                  placeholder="Titulo do estudo..."
                  className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-primary
                             rounded-2xl px-4 py-3 text-sm text-white outline-none
                             placeholder:text-zinc-600 transition-all font-bold"
                />
                <textarea
                  value={studyBody}
                  onChange={e => setStudyBody(e.target.value)}
                  placeholder="Escreva seu estudo biblico aqui... (Referencia, Observacoes, Aplicacao)"
                  rows={8}
                  className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-primary
                             rounded-2xl px-4 py-3 text-sm text-white outline-none resize-none
                             placeholder:text-zinc-600 transition-all"
                />
              </>
            )}

            {tab === 'youtube' && (
              <>
                <input
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="Cole o link do YouTube (ex: https://youtu.be/...)"
                  className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-primary
                             rounded-2xl px-4 py-3 text-sm text-white outline-none
                             placeholder:text-zinc-600 transition-all"
                />
                {videoUrl && FeedService.extractYouTubeId(videoUrl) && (
                  <div className="rounded-2xl overflow-hidden border-2 border-zinc-700 aspect-video">
                    <img
                      src={`https://img.youtube.com/vi/${FeedService.extractYouTubeId(videoUrl)}/maxresdefault.jpg`}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                  </div>
                )}
                <input
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  placeholder="Titulo do video (opcional)"
                  className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-primary
                             rounded-2xl px-4 py-3 text-sm text-white outline-none
                             placeholder:text-zinc-600 transition-all"
                />
              </>
            )}

            {tab === 'spotify_track' && (
              <>
                <input
                  value={spotifyInput}
                  onChange={e => setSpotifyInput(e.target.value)}
                  placeholder="Cole o link do Spotify (musica ou playlist)"
                  className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-primary
                             rounded-2xl px-4 py-3 text-sm text-white outline-none
                             placeholder:text-zinc-600 transition-all"
                />
                {spotifyInput && FeedService.buildSpotifyEmbedUrl(spotifyInput) && (
                  <div className="rounded-2xl overflow-hidden border-2 border-zinc-700">
                    <iframe
                      src={FeedService.buildSpotifyEmbedUrl(spotifyInput)}
                      width="100%"
                      height={152}
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title="Spotify preview"
                      className="rounded-2xl"
                    />
                  </div>
                )}
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Conte por que voce gosta desta musica..."
                  rows={2}
                  className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-primary
                             rounded-2xl px-4 py-3 text-sm text-white outline-none resize-none
                             placeholder:text-zinc-600 transition-all"
                />
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t-2 border-zinc-800 flex items-center gap-3">
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value as 'public' | 'group_only')}
              className="bg-zinc-800 border-2 border-zinc-700 rounded-xl px-3 py-2 text-zinc-400
                         text-[10px] font-black uppercase outline-none focus:border-primary"
            >
              <option value="public">Publico</option>
              <option value="group_only">So minha tribo</option>
            </select>
            <button
              onClick={handlePublish}
              disabled={!canPublish() || submitting}
              className="flex-1 bg-primary text-black py-3.5 rounded-2xl font-black uppercase italic
                         tracking-tight hover:bg-white transition-all active:scale-95
                         disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> Publicando...</>
                : '✨ PUBLICAR'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Verse Picker Modal */}
      <AnimatePresence>
        {showVersePicker && (
          <VersePickerModal
            onSelect={v => {
              setVerseRef(v.verseRef);
              setVerseText(v.verseText);
              setVerseBookId(v.bookId);
              setVerseChapter(v.chapter);
              setVerseNumber(v.verseNumber);
              setShowVersePicker(false);
            }}
            onClose={() => setShowVersePicker(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
