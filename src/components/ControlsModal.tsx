import React, { useState } from 'react';
import { Keyboard, Gamepad2, X, Sparkles } from 'lucide-react';

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'controller' | 'keyboard'>('controller');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border-2 border-red-900/80 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-red-950/60 bg-gradient-to-r from-red-950/40 via-neutral-900 to-black">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white font-serif tracking-wider">
              MAPA DE CONTROLES & COMBOS ESPARTANOS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alternância de Abas */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab('controller')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'controller'
                ? 'bg-red-900/40 text-red-300 border border-red-800'
                : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> Controle (Xbox / DualSense / Genérico)
          </button>
          <button
            onClick={() => setActiveTab('keyboard')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'keyboard'
                ? 'bg-red-900/40 text-red-300 border border-red-800'
                : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Teclado (Atalhos PC)
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
          {activeTab === 'controller' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
                <h4 className="font-bold text-red-400 uppercase tracking-wider text-[11px]">Movimento & Combate</h4>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-300">Movimentação</span>
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-amber-300 font-mono">Analógico Esquerdo</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-300">Rolamento / Esquiva</span>
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-amber-300 font-mono">Analógico Direito</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-300">Ataque Rápido</span>
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-blue-400 font-mono">Quadrado (X)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-300">Ataque Forte</span>
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-emerald-400 font-mono">Triângulo (Y)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-300">Agarrar / QTE</span>
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-red-400 font-mono">Círculo (B)</span>
                </div>
              </div>

              <div className="space-y-3 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
                <h4 className="font-bold text-red-400 uppercase tracking-wider text-[11px]">Defesa & Especiais</h4>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-300">Velocino de Ouro (Bloqueio)</span>
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono">L1 (LB)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-300">Abrir Baús / Ação</span>
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono">R1 (RB)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-300">Disparar Magia</span>
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono">L2 (LT)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-300">Fúria dos Titãs</span>
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-red-400 font-mono">R2 (RT)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-300">Pulo / Pulo Duplo</span>
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-sky-400 font-mono">X (A)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
              <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Mapeamento de Teclado Padrão</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between py-1 border-b border-neutral-800"><span className="text-neutral-400">Movimento:</span> <span className="font-mono text-neutral-200 font-bold">W, A, S, D</span></div>
                <div className="flex justify-between py-1 border-b border-neutral-800"><span className="text-neutral-400">Ataque Rápido:</span> <span className="font-mono text-neutral-200 font-bold">J</span></div>
                <div className="flex justify-between py-1 border-b border-neutral-800"><span className="text-neutral-400">Ataque Forte:</span> <span className="font-mono text-neutral-200 font-bold">I</span></div>
                <div className="flex justify-between py-1 border-b border-neutral-800"><span className="text-neutral-400">Agarrar (QTE):</span> <span className="font-mono text-neutral-200 font-bold">L</span></div>
                <div className="flex justify-between py-1 border-b border-neutral-800"><span className="text-neutral-400">Pulo:</span> <span className="font-mono text-neutral-200 font-bold">Espaço / K</span></div>
                <div className="flex justify-between py-1 border-b border-neutral-800"><span className="text-neutral-400">Bloqueio (L1):</span> <span className="font-mono text-neutral-200 font-bold">Q</span></div>
                <div className="flex justify-between py-1 border-b border-neutral-800"><span className="text-neutral-400">Interagir (R1):</span> <span className="font-mono text-neutral-200 font-bold">E</span></div>
                <div className="flex justify-between py-1 border-b border-neutral-800"><span className="text-neutral-400">Magia (L2):</span> <span className="font-mono text-neutral-200 font-bold">U</span></div>
                <div className="flex justify-between py-1 border-b border-neutral-800"><span className="text-neutral-400">Save State:</span> <span className="font-mono text-amber-400 font-bold">F1</span></div>
                <div className="flex justify-between py-1 border-b border-neutral-800"><span className="text-neutral-400">Load State:</span> <span className="font-mono text-amber-400 font-bold">F3</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ENTENDI, VOLTAR AO OLIMPO
          </button>
        </div>
      </div>
    </div>
  );
};
