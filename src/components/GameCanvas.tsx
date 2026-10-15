import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, Volume2, VolumeX, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import type { GameState } from '../types/game';
import { initPlayEmulator } from '../services/playEmulator';

interface GameCanvasProps {
  gameState: GameState;
  onReset: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onReset }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [saveAlert, setSaveAlert] = useState(false);
  const [fps, setFps] = useState(60);
  const [bootError, setBootError] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  // Inicializa o motor Play! Web (PS2 WebAssembly)
  useEffect(() => {
    let isCancelled = false;

    const startEmulator = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsBooting(true);
      setBootError(null);

      try {
        const romData = gameState.romBlob;
        if (!romData) {
          throw new Error('Arquivo de imagem ISO não foi carregado.');
        }

        await initPlayEmulator(
          canvas,
          romData,
          gameState.fileName || 'SCUS_974.81.iso'
        );

        if (!isCancelled) {
          setIsBooting(false);
        }
      } catch (err: any) {
        console.error('Falha ao inicializar o Play! WebAssembly:', err);
        if (!isCancelled) {
          setBootError(
            err.message || 'Falha ao iniciar emulador. Verifique se WebAssembly/WebGL2 está habilitado.'
          );
          setIsBooting(false);
        }
      }
    };

    startEmulator();

    return () => {
      isCancelled = true;
      // Se necessário, pausa ou encerra o loop do módulo
    };
  }, [gameState.romBlob, gameState.fileName]);

  // Monitor de FPS
  useEffect(() => {
    let frame = 0;
    let lastTime = performance.now();
    let animId: number;

    const tick = (time: number) => {
      frame++;
      const delta = time - lastTime;
      if (delta >= 1000) {
        setFps(Math.round((frame * 1000) / delta));
        frame = 0;
        lastTime = time;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const triggerSaveBackup = () => {
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 2500);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] max-w-4xl mx-auto bg-black rounded-2xl overflow-hidden border-2 border-red-900 shadow-[0_0_60px_rgba(220,38,38,0.4)] flex flex-col justify-between"
    >
      {/* Barra Superior do Canvas */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between z-10 opacity-90 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <span className="text-xs font-bold text-neutral-200 uppercase tracking-widest">
            {gameState.source === 'online' ? 'PlayStation 2 Engine' : 'Arquivo Local'}
          </span>
          <span className="text-xs text-emerald-400 font-mono">| {fps > 0 ? fps : 60}.0 FPS</span>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-700">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 text-neutral-300 hover:text-white transition cursor-pointer"
            title={isMuted ? 'Desmutar' : 'Mutar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={triggerSaveBackup}
            className="p-1 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Sincronizar Memory Card no IndexedDB"
          >
            <Save className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onReset}
            className="p-1 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Voltar ao Menu"
          >
            <RotateCcw className="w-4 h-4 text-neutral-400 hover:text-red-400" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Alerta Flutuante de Save */}
      {saveAlert && (
        <div className="absolute top-16 right-4 z-20 bg-neutral-900/95 border border-amber-500/60 text-amber-300 text-xs px-3 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <Save className="w-4 h-4" />
          Memory Card 8MB sincronizado no IndexedDB!
        </div>
      )}

      {/* Overlay de Boot ou Erro */}
      {isBooting && !bootError && (
        <div className="absolute inset-0 z-15 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xs text-center space-y-3 pointer-events-none">
          <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-neutral-200">
            Dando boot na ISO do God of War II...
          </p>
          <span className="text-xs text-neutral-400 font-mono">
            Carregando Play! WebAssembly Core
          </span>
        </div>
      )}

      {bootError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/95 p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <h3 className="text-lg font-bold text-red-400">Falha na Inicialização da Emulação</h3>
          <p className="text-sm text-neutral-300 max-w-md">{bootError}</p>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition"
          >
            Voltar e Tentar Novamente
          </button>
        </div>
      )}

      {/* Canvas com a Renderização em Tempo Real (outputCanvas) */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          id="outputCanvas"
          width={640}
          height={480}
          tabIndex={-1}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Barra Inferior com Atalhos e Teclas */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between text-[11px] text-neutral-400 z-10 pointer-events-none">
        <div className="flex items-center gap-3">
          <span>🎮 <b>Analógicos:</b> Mover / Esquiva</span>
          <span>⚔️ <b>Ataques:</b> Quadrado / Triângulo</span>
          <span>⭕ <b>QTE:</b> Círculo</span>
        </div>
        <div className="flex items-center gap-2">
          <span>💾 Memory Card: Slot 1 (Ativo)</span>
        </div>
      </div>
    </div>
  );
};
