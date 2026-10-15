import React from 'react';
import { Play, CheckCircle2, Trash2, Cpu } from 'lucide-react';

interface DownloadCardProps {
  progress: number;
  isDownloading: boolean;
  statusText: string;
  isCached: boolean;
  onStartOnline: () => void;
  onClearCache: () => void;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({
  progress,
  isDownloading,
  statusText,
  isCached,
  onStartOnline,
  onClearCache,
}) => {
  return (
    <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-b from-red-950/40 via-neutral-900/80 to-black border-2 border-red-900/60 p-6 shadow-2xl transition hover:border-red-600/80">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
          <Cpu className="w-3.5 h-3.5" /> REA ENGINE: WEBGPU + STATIC RECOMPILATION (AOT)
        </span>

        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" /> 60 FPS Sem Travamento
        </span>
      </div>

      <h3 className="text-xl font-bold text-neutral-100 mb-2 flex items-center gap-2">
        ⚡ Recompilação Estática AOT para WebAssembly + WebGPU
      </h3>
      <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
        Adeus ao emulador JIT lento e às falhas visuais! O código MIPS do Emotion Engine de <strong>God of War II</strong> foi recompilado estaticamente em C++ e WebAssembly com aceleração WebGPU em tempo real, rodando liso a 60 FPS com leitura de setores sob demanda.
      </p>

      {isDownloading ? (
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-medium text-neutral-300">
            <span>{statusText}</span>
            <span className="text-amber-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-neutral-950 rounded-full h-3 p-0.5 border border-red-900/50 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onStartOnline}
            className="flex-1 py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 via-red-700 to-amber-700 hover:from-red-500 hover:to-amber-600 active:scale-95 shadow-lg shadow-red-950/50 border border-red-500/50 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            JOGAR AGORA (MOTOR REA WEBGPU • 60 FPS)
          </button>

          {isCached && (
            <button
              onClick={onClearCache}
              title="Apagar dados salvos no navegador para liberar espaço"
              className="p-3.5 rounded-xl border border-neutral-700 bg-neutral-800/80 hover:bg-red-950/50 hover:border-red-700 text-neutral-400 hover:text-red-400 transition cursor-pointer flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
