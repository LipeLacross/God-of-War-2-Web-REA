import React, { useRef } from 'react';
import { HardDrive, Upload } from 'lucide-react';

interface LocalFileCardProps {
  onFileSelect: (file: File) => void;
}

export const LocalFileCard: React.FC<LocalFileCardProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 shadow-xl flex flex-col justify-between hover:border-neutral-700 transition">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300">
            <HardDrive className="w-4 h-4" />
          </span>
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Modo Local (BYOG)
          </span>
        </div>
        <h4 className="text-lg font-bold text-neutral-200 mb-2">
          Carregar ISO do Computador
        </h4>
        <p className="text-xs text-neutral-400 leading-relaxed mb-4">
          Já tem o arquivo <code>God of War II.iso</code> ou <code>.chd</code> no seu SSD? Carregue sem consumir nem 1 byte de internet via HTML5 File System API.
        </p>
      </div>

      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept=".iso,.bin,.chd,.cso"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 px-4 rounded-xl text-xs font-bold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 active:scale-95 border border-neutral-700 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          SELECIONAR ARQUIVO NO PC (.ISO / .CHD)
        </button>
      </div>
    </div>
  );
};
