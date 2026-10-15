import React from 'react';
import { Gamepad, CheckCircle, Disc3 } from 'lucide-react';
import type { GamepadStatus } from '../types/game';

interface GamepadHUDProps {
  gamepad: GamepadStatus;
  onTestVibration: () => void;
}

export const GamepadHUD: React.FC<GamepadHUDProps> = ({ gamepad, onTestVibration }) => {
  return (
    <div className="bg-neutral-900/90 border border-neutral-700/80 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg backdrop-blur-md text-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${gamepad.connected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
          <Gamepad className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-200">
              {gamepad.connected ? 'Controle Conectado' : 'Controle Desconectado'}
            </span>
            {gamepad.connected && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                <CheckCircle className="w-3 h-3" /> 60 FPS Polling
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 max-w-xs truncate">
            {gamepad.connected ? gamepad.name : 'Plugue um controle USB ou Bluetooth (DualSense / Xbox)'}
          </p>
        </div>
      </div>

      {gamepad.connected && (
        <button
          onClick={onTestVibration}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-xs text-neutral-300 rounded-lg border border-neutral-600 transition flex items-center gap-1.5 cursor-pointer"
          title="Testar motor de vibração do controle"
        >
          <Disc3 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          Testar Vibração
        </button>
      )}
    </div>
  );
};
