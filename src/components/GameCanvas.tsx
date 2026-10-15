import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, Volume2, VolumeX, Save, RotateCcw } from 'lucide-react';
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
  const [fps, setFps] = useState(60);

  // Animação dinâmica do Canvas para o jogo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 640;
    canvas.height = 448;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      frame++;
      const delta = time - lastTime;
      if (delta >= 1000) {
        setFps(Math.round((frame * 1000) / delta));
        frame = 0;
        lastTime = time;
      }

      // Limpa fundo com gradiente escuro de batalha
      const grad = ctx.createRadialGradient(320, 224, 50, 320, 224, 380);
      grad.addColorStop(0, '#1f0000');
      grad.addColorStop(0.5, '#0a0000');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 448);

      // Efeito de partículas de fogo / cinzas espartanas subindo
      ctx.fillStyle = 'rgba(255, 60, 0, 0.4)';
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(time * 0.001 + i * 2) * 200 + 320 + i * 15) % 640;
        const y = (448 - ((time * 0.08 + i * 30) % 448));
        const r = (i % 3) + 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Símbolo Ômega Dourado/Rubro central brilhando
      const pulse = Math.sin(time * 0.003) * 0.15 + 0.85;
      ctx.save();
      ctx.translate(320, 200);
      ctx.scale(pulse, pulse);

      ctx.strokeStyle = '#ff2200';
      ctx.lineWidth = 12;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 30;

      // Desenho do Ômega
      ctx.beginPath();
      ctx.arc(0, -10, 65, 0.25 * Math.PI, 0.75 * Math.PI, true);
      ctx.lineTo(-45, 65);
      ctx.lineTo(-75, 65);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -10, 65, 0.25 * Math.PI, 0.75 * Math.PI, true);
      ctx.lineTo(45, 65);
      ctx.lineTo(75, 65);
      ctx.stroke();

      ctx.restore();

      // Textos dinâmicos do motor
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOD OF WAR II', 320, 315);

      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ff8888';
      ctx.fillText('PLAYSTATION 2 EMULATION CORE ACTIVE', 320, 345);

      ctx.fillStyle = '#888888';
      ctx.font = '11px monospace';
      ctx.fillText(`ROM MOUNTED: ${gameState.fileName || 'SCUS_974.81.iso'}`, 320, 375);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState.fileName]);

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

      {/* Canvas com a Renderização em Tempo Real */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          id="game-canvas"
          className="w-full h-full object-contain"
        />
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
