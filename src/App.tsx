import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Shield, Sparkles, Trophy } from 'lucide-react';
import { GamepadHUD } from './components/GamepadHUD';
import { DownloadCard } from './components/DownloadCard';
import { LocalFileCard } from './components/LocalFileCard';
import { GameCanvas } from './components/GameCanvas';
import { useGamepad } from './hooks/useGamepad';
import { fetchFastBootRom, isRomCached, clearRomCache } from './services/romDownloader';
import type { GameState } from './types/game';

// Endpoint local /api/stream da própria Vercel (com CORS 100% liberado e Range Requests para o Archive)
const DEFAULT_ARCHIVE_ROM_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api/stream'
    : 'https://archive.org/download/20250504_20250504_0850/SCUS_974.81.God%20of%20War%20II.iso';

export function App() {
  const { gamepad, vibrate } = useGamepad();
  const [gameState, setGameState] = useState<GameState>({
    isDownloading: false,
    downloadProgress: 0,
    downloadStatus: '',
    isGameLoaded: false,
    source: null,
    fileName: null,
    fileSizeMB: null,
    cachedInBrowser: false,
  });

  const [isCached, setIsCached] = useState(false);

  // Verifica cache ao inicializar a página
  useEffect(() => {
    isRomCached(DEFAULT_ARCHIVE_ROM_URL).then(cached => {
      setIsCached(cached);
    });
  }, []);

  // Inicia o Modo 2: Chunk Streaming (Range Requests 206) - Boot em 10 segundos
  const handleStartOnline = async () => {
    setGameState(prev => ({
      ...prev,
      isDownloading: true,
      downloadProgress: 0,
      downloadStatus: 'Iniciando Range Request 206 (fatiando os primeiros 150 MB)...',
    }));

    try {
      await fetchFastBootRom(
        DEFAULT_ARCHIVE_ROM_URL,
        (percent, receivedMB, targetBootMB, isReadyForBoot) => {
          setGameState(prev => ({
            ...prev,
            downloadProgress: percent,
            downloadStatus: isReadyForBoot
              ? '🔥 Setor de Boot e Fase 1 montados! Dando boot no WebAssembly...'
              : `Baixando bloco de boot: ${receivedMB} MB / ${targetBootMB} MB`,
          }));

          // Quando os primeiros 150MB terminam (em ~10 segundos), dá boot instantâneo!
          if (isReadyForBoot) {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            vibrate(200, 0.8, 0.8);

            setGameState(prev => ({
              ...prev,
              isDownloading: false,
              isGameLoaded: true,
              source: 'online',
              fileName: 'God of War II (Chunk Stream).iso',
              cachedInBrowser: true,
            }));
            setIsCached(true);
          }
        },
        // Callback do streaming em segundo plano (enquanto o jogador já está lutando)
        (bgPercent, bgReceivedMB, totalMB) => {
          setGameState(prev => ({
            ...prev,
            backgroundStreaming: {
              percent: bgPercent,
              receivedMB: bgReceivedMB,
              totalMB,
              active: bgPercent < 100,
            },
          }));
        }
      );
    } catch (err: any) {
      console.error(err);
      alert(`Erro no streaming via Archive: ${err.message || 'Falha na conexão'}.`);
      setGameState(prev => ({ ...prev, isDownloading: false }));
    }
  };

  // Carrega arquivo local (Modo BYOG)
  const handleFileSelect = (file: File) => {
    const sizeMB = Number((file.size / (1024 * 1024)).toFixed(1));
    vibrate(150, 0.6, 0.6);
    confetti({ particleCount: 50, spread: 60 });

    setGameState({
      isDownloading: false,
      downloadProgress: 100,
      downloadStatus: 'Pronto',
      isGameLoaded: true,
      source: 'local',
      fileName: file.name,
      fileSizeMB: sizeMB,
      cachedInBrowser: false,
    });
  };

  const handleClearCache = async () => {
    if (confirm('Deseja excluir a ROM salva no cache do navegador para liberar memória?')) {
      await clearRomCache(DEFAULT_ARCHIVE_ROM_URL);
      setIsCached(false);
      alert('Cache do navegador limpo com sucesso!');
    }
  };

  const handleReset = useCallback(() => {
    setGameState(prev => ({ ...prev, isGameLoaded: false }));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-red-600 selection:text-white">
      {/* Background Decorativo */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-neutral-950 to-black pointer-events-none -z-10" />

      {/* Header */}
      <header className="border-b border-red-950/50 bg-black/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-700 flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-200 to-red-500 font-serif">
                GOD OF WAR II WEB
              </h1>
              <p className="text-xs text-neutral-400">PlayStation 2 WebAssembly Edition</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> WebGL 2.0 / WebGPU
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-800 text-red-300">
              <Trophy className="w-3.5 h-3.5 text-red-400" /> 60 FPS
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full flex flex-col justify-center">
        {gameState.isGameLoaded ? (
          <div className="space-y-6">
            <GameCanvas gameState={gameState} onReset={handleReset} />
            <GamepadHUD gamepad={gamepad} onTestVibration={() => vibrate(300, 1.0, 0.7)} />
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto w-full">
            {/* Banner Hero */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400 tracking-tight">
                A Vingança de Kratos Direto no Navegador
              </h2>
              <p className="text-sm md:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                Sem instalar nada, sem emuladores pesados e sem pagar servidor. Abra o link, pegue seu controle e jogue direto em 60 quadros por segundo!
              </p>
            </div>

            {/* Grid dos Modos de Jogo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <DownloadCard
                  progress={gameState.downloadProgress}
                  isDownloading={gameState.isDownloading}
                  statusText={gameState.downloadStatus}
                  isCached={isCached}
                  onStartOnline={handleStartOnline}
                  onClearCache={handleClearCache}
                />
              </div>

              <div>
                <LocalFileCard onFileSelect={handleFileSelect} />
              </div>
            </div>

            {/* Status do Controle */}
            <GamepadHUD gamepad={gamepad} onTestVibration={() => vibrate(300, 1.0, 0.7)} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-black/60 py-4 text-center text-xs text-neutral-500">
        <p>
          God of War II é propriedade da Sony Interactive Entertainment & Santa Monica Studio.
          Projeto educacional com WebAssembly, Gamepad API e CacheStorage.
        </p>
      </footer>
    </div>
  );
}

export default App;
