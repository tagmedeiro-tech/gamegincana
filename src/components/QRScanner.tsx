import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, QrCode, AlertCircle, RefreshCw, Camera } from 'lucide-react';

interface QRScannerProps {
  activityTitle: string;
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ activityTitle, onScan, onClose }: QRScannerProps) {
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');
  const [loadingLib, setLoadingLib] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'active' | 'error'>('idle');
  const qrScannerRef = useRef<any>(null);

  useEffect(() => {
    // Load HTML5 QrCode dynamically from CDN
    // Usando uma versão específica para evitar quebras por atualizações silenciosas
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    script.async = true;
    script.onload = () => {
      setLoadingLib(false);
    };
    script.onerror = () => {
      setError('Falha ao carregar a biblioteca do scanner. Verifique sua conexão.');
      setLoadingLib(false);
    };
    document.body.appendChild(script);

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {});
      }
      document.body.removeChild(script);
    };
  }, []);

  const startScanner = async () => {
    if (loadingLib || !scannerContainerRef.current || !(window as any).Html5Qrcode) {
      console.log('Scanner not ready yet:', { loadingLib, win: !!(window as any).Html5Qrcode });
      return;
    }

    try {
      setCameraStatus('starting');
      setError('');

      if (!qrScannerRef.current) {
        qrScannerRef.current = new (window as any).Html5Qrcode("qr-reader");
      }

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await qrScannerRef.current.start(
        { facingMode: "environment" }, 
        config,
        (decodedText: string) => {
          onScan(decodedText);
        },
        (errorMessage: string) => {
          // Ignorar erros de frame vazio
        }
      );

      setCameraStatus('active');
    } catch (err: any) {
      console.error("Erro ao iniciar câmera:", err);
      setCameraStatus('error');
      
      let friendlyError = "Não foi possível acessar a câmera.";
      if (err.toString().includes("NotAllowedError")) {
        friendlyError = "Permissão da câmera negada. Por favor, habilite o acesso nas configurações do navegador/app.";
      } else if (err.toString().includes("NotFoundError")) {
        friendlyError = "Nenhuma câmera encontrada no dispositivo.";
      } else if (err.toString().includes("NotReadableError")) {
        friendlyError = "A câmera já está sendo usada por outro aplicativo.";
      }
      
      setError(`${friendlyError} (${err.name || 'Erro Desconhecido'})`);
    }
  };

  useEffect(() => {
    if (!loadingLib) {
      startScanner();
    }
  }, [loadingLib]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        className="relative w-full max-w-md bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[40px] shadow-2xl overflow-hidden flex flex-col items-center"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors z-20"
        >
          <X size={24} />
        </button>

        <div className="w-16 h-16 bg-primary text-black rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(251,191,36,0.2)] mb-6 relative z-10">
          <QrCode size={32} />
        </div>
        
        <h3 className="text-2xl font-black uppercase italic text-white leading-none text-center mb-1">Escanear QR Code</h3>
        <p className="text-primary font-black uppercase italic text-[10px] tracking-widest mb-6 text-center">
          {activityTitle}
        </p>

        <div className="w-full bg-black rounded-3xl overflow-hidden border-4 border-zinc-800 relative min-h-[300px] flex flex-col items-center justify-center group">
          {/* Luz de Scan */}
          {cameraStatus === 'active' && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="w-full h-0.5 bg-primary/50 shadow-[0_0_15px_rgba(251,191,36,0.8)] absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
            </div>
          )}

          <div id="qr-reader" ref={scannerContainerRef} className="w-full"></div>
          
          {(cameraStatus === 'idle' || cameraStatus === 'starting' || loadingLib) && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
              <RefreshCw className="text-primary animate-spin mb-4" size={32} />
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Iniciando câmera...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-900/90 backdrop-blur-md text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50 mb-4">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <p className="text-white text-xs font-bold leading-relaxed mb-6 px-4">{error}</p>
              <button 
                onClick={startScanner}
                className="bg-zinc-800 hover:bg-white text-zinc-400 hover:text-black px-6 py-3 rounded-2xl font-black uppercase italic text-[10px] transition-all flex items-center gap-2 border-2 border-transparent hover:border-primary"
              >
                <Camera size={14} /> Tentar Novamente
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4 w-full">
           <div className="flex items-center gap-3 bg-zinc-800/50 p-4 rounded-2xl border border-zinc-800">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
             <p className="text-zinc-400 text-[10px] font-bold leading-tight">
               Aponte a câmera para o QR Code para validar automaticamente seus pontos.
             </p>
           </div>
           
           <button 
             onClick={onClose}
             className="w-full py-4 text-zinc-600 hover:text-white font-black uppercase italic text-[10px] tracking-widest transition-colors"
           >
             Cancelar Escaneamento
           </button>
        </div>
      </motion.div>
      
      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        #qr-reader video {
          border-radius: 20px !important;
          object-fit: cover !important;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
        #qr-reader__scan_region {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}
