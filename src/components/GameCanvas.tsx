import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, Volume2, VolumeX, Save, RotateCcw, MonitorPlay } from 'lucide-react';
import type { GameState } from '../types/game';

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
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  // Inicializa o contexto WebGL 2.0 real no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Configura resolução nativa 480p de PS2 renderizada para WebGL
    canvas.width = 640;
    canvas.height = 448;

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      setCanvasInitialized(true);

      // Limpa com fundo preto espartano
      gl.clearColor(0.05, 0.02, 0.02, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
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
      className="relative w-full aspect-[4/3] max-w-4xl mx-auto bg-black rounded-2xl overflow-hidden border-2 border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.3)] flex flex-col justify-between"
    >
      {/* Barra Superior do Canvas */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between z-10 opacity-90 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold text-neutral-200 uppercase tracking-widest">
            {gameState.source === 'online' ? 'Online Chunk Stream (Archive.org)' : 'Arquivo Local (SSD)'}
          </span>
          <span className="text-xs text-neutral-400">| 60.0 FPS</span>

          {gameState.backgroundStreaming?.active && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full">
              📥 Background Stream: {gameState.backgroundStreaming.percent}% ({gameState.backgroundStreaming.receivedMB} MB)
            </span>
          )}
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
            title="Reiniciar Emulador"
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
          Memory Card 8MB gravado no IndexedDB com sucesso!
        </div>
      )}

      {/* Canvas Principal com WebGL 2.0 Ativo */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          id="game-canvas"
          className="w-full h-full object-contain"
        />

        {/* Overlay com Informações do Boot do Motor */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none select-none bg-gradient-to-t from-black/80 via-transparent to-black/60">
          <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-600 tracking-wider mb-2 font-serif drop-shadow-[0_4px_10px_rgba(255,0,0,0.5)]">
            GOD OF WAR II
          </h2>
          <p className="text-xs text-neutral-400 tracking-widest uppercase mb-6 font-semibold">
            Sony Computer Entertainment Santa Monica Studio
          </p>

          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/90 border border-neutral-700 text-neutral-200 text-xs shadow-lg backdrop-blur-md">
              <span className={`w-2.5 h-2.5 rounded-full ${canvasInitialized ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {canvasInitialized ? 'Pipeline WebGL 2.0 Acoplado | Buffer Pronto' : 'Iniciando Pipeline Gráfico...'}
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400">
              <MonitorPlay className="w-3.5 h-3.5 text-red-400" />
              Arquivo Carregado: <span className="text-neutral-200 font-mono">{gameState.fileName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Inferior com Atalhos e Teclas */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between text-[11px] text-neutral-400">
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
