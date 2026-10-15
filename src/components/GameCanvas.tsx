import React, { useRef, useState } from 'react';
import { Maximize2, Minimize2, ExternalLink, RotateCcw, Cpu, Sparkles } from 'lucide-react';
import type { GameState } from '../types/game';

interface GameCanvasProps {
  gameState: GameState;
  onReset: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onReset }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determina a URL do disco para o motor WebGPU
  const discUrl = gameState.source === 'local' && gameState.romBlob
    ? URL.createObjectURL(gameState.romBlob)
    : '/disc.iso';

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const openDedicatedWindow = () => {
    window.open(`/ps2web.html?disc=${encodeURIComponent(discUrl)}`, '_blank');
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] max-w-5xl mx-auto bg-black rounded-2xl overflow-hidden border-2 border-red-900 shadow-[0_0_60px_rgba(220,38,38,0.45)] flex flex-col justify-between"
    >
      {/* Barra de Controle Superior */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between z-10 opacity-90 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
          <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-red-400" />
            REA WebGPU AOT Core
          </span>
          <span className="text-xs text-amber-300 font-mono font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            60 FPS Nativo
          </span>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-700 shadow-lg">
          <button
            onClick={openDedicatedWindow}
            className="p-1.5 text-neutral-300 hover:text-amber-400 transition cursor-pointer flex items-center gap-1 text-xs font-medium"
            title="Abrir em aba ou janela independente de alta performance"
          >
            <ExternalLink className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Janela Externa</span>
          </button>

          <button
            onClick={onReset}
            className="p-1.5 text-neutral-300 hover:text-red-400 transition cursor-pointer"
            title="Voltar ao Menu Principal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Modo Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Frame de Execução do Motor WebGPU Recompilado */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        <iframe
          src={`/ps2web.html?disc=${encodeURIComponent(discUrl)}`}
          className="w-full h-full border-0 bg-black"
          allow="cross-origin-isolated; autoplay; gamepad; fullscreen"
          title="God of War II WebGPU AOT Recomp"
        />
      </div>

      {/* Barra de Rodapé com Atalhos de Controle */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between text-[11px] text-neutral-400 z-10 pointer-events-none">
        <div className="flex items-center gap-3">
          <span>🎮 <b>Controles:</b> Suporte nativo a DualShock 4/5, Xbox e Teclado</span>
          <span className="hidden sm:inline">⚡ <b>Pipeline:</b> MIPS R5900 → WebAssembly + WebGPU Shaders</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">● Memory Card Slot 1 (IndexedDB)</span>
        </div>
      </div>
    </div>
  );
};
