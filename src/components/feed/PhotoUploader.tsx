import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Image, AlertCircle, Loader2 } from 'lucide-react';
import { FeedService } from '../../lib/FeedService';
import { useAuth } from '../../context/useAuth';

interface Props {
  onUploaded: (url: string, path: string) => void;
  onClear: () => void;
  preview?: string;
}

export default function PhotoUploader({ onUploaded, onClear, preview }: Props) {
  const { profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(preview ?? null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    if (!profile) return;

    // Preview local imediato
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);

    try {
      const result = await FeedService.uploadPhoto(file, profile.id);
      if (!result) throw new Error('Falha no upload');
      onUploaded(result.url, result.path);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  }, [profile, onUploaded]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setLocalPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear();
  };

  if (localPreview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-zinc-700 group">
        <img src={localPreview} alt="Preview" className="w-full max-h-64 object-cover" />
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 size={32} className="text-primary animate-spin" />
          </div>
        )}
        {!uploading && (
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center
                       text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3
                    cursor-pointer transition-all text-center
                    ${dragging
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/30'}`}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                         ${dragging ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
          {dragging ? <Image size={22} /> : <Upload size={20} />}
        </div>
        <div>
          <p className="text-white font-black uppercase italic text-sm">
            {dragging ? 'Solte aqui!' : 'Arraste ou clique para adicionar'}
          </p>
          <p className="text-zinc-600 text-[10px] font-bold mt-1">JPG, PNG ou WebP • Max 5MB</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 text-red-400 text-xs font-bold">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
