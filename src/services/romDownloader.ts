const CACHE_NAME = 'gow2-web-cache-v1';

// Tamanho do chunk inicial para dar Boot rápido (150 MB cobre setor de boot, ELF e fase 1)
export const FAST_BOOT_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB

export async function isRomCached(url: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(url);
    return !!match;
  } catch (err) {
    console.warn('Erro ao verificar cache do navegador:', err);
    return false;
  }
}

export async function clearRomCache(url: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    return await cache.delete(url);
  } catch (err) {
    console.warn('Erro ao limpar cache:', err);
    return false;
  }
}

/**
 * Modo 2: Chunk Streaming (HTTP 206 Partial Content)
 * Baixa apenas os primeiros 150 MB para dar Boot em 10 segundos,
 * e continua o streaming dos blocos restantes em background.
 */
export async function fetchFastBootRom(
  url: string,
  onProgress: (percent: number, receivedMB: number, targetBootMB: number, isReadyForBoot: boolean) => void,
  onBackgroundProgress?: (bgPercent: number, bgReceivedMB: number, totalMB: number) => void
): Promise<Blob> {
  // 1. Verifica se já está em cache completo
  if ('caches' in window) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      onProgress(100, 3500, 3500, true);
      return await cachedResponse.blob();
    }
  }

  // 2. Faz Range Request para obter os primeiros 150 MB
  const initialEnd = FAST_BOOT_SIZE_BYTES - 1;
  const initialRes = await fetch(url, {
    mode: 'cors',
    headers: {
      Range: `bytes=0-${initialEnd}`,
    },
  });

  if (!initialRes.ok && initialRes.status !== 206) {
    throw new Error(`Servidor não aceitou Range Request: ${initialRes.status}`);
  }

  // Descobre o tamanho total a partir do Content-Range (ex: bytes 0-157286399/3744399360)
  const contentRange = initialRes.headers.get('content-range') || '';
  const totalMatch = contentRange.match(/\/(\d+)/);
  const totalBytes = totalMatch ? parseInt(totalMatch[1], 10) : 3744399360;
  const targetBootMB = Number((FAST_BOOT_SIZE_BYTES / (1024 * 1024)).toFixed(1));

  // Leitura do stream inicial de 150 MB com atualização em tempo real
  if (!initialRes.body) {
    throw new Error('Navegador não suporta streaming de leitura.');
  }

  const reader = initialRes.body.getReader();
  const initialChunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    initialChunks.push(value);
    receivedBytes += value.length;

    const currentMB = Number((receivedBytes / (1024 * 1024)).toFixed(1));
    const percent = Math.min(100, Math.round((receivedBytes / FAST_BOOT_SIZE_BYTES) * 100));

    // Atualiza progresso da barra (0% a 100% dos 150MB iniciais de boot)
    onProgress(percent, currentMB, targetBootMB, false);
  }

  const bootBlob = new Blob(initialChunks as BlobPart[], { type: 'application/octet-stream' });
  
  // ⚡ AVISA QUE O BOOT JÁ ESTÁ PRONTO EM 10 SEGUNDOS!
  onProgress(100, targetBootMB, targetBootMB, true);

  // 3. INICIA STREAMING EM SEGUNDO PLANO DOS BLOCOS RESTANTES (Sem travar o jogo)
  startBackgroundStreaming(url, bootBlob, totalBytes, onBackgroundProgress);

  return bootBlob;
}

/**
 * Continua baixando o restante do jogo em segundo plano e consolida no CacheStorage
 */
async function startBackgroundStreaming(
  url: string,
  initialBlob: Blob,
  totalBytes: number,
  onBgProgress?: (bgPercent: number, bgReceivedMB: number, totalMB: number) => void
) {
  try {
    const remainingStart = FAST_BOOT_SIZE_BYTES;
    const remainingRes = await fetch(url, {
      mode: 'cors',
      headers: {
        Range: `bytes=${remainingStart}-${totalBytes - 1}`,
      },
    });

    if (!remainingRes.ok && remainingRes.status !== 206) return;
    if (!remainingRes.body) return;

    const reader = remainingRes.body.getReader();
    const remainingChunks: Uint8Array[] = [];
    let receivedRemaining = 0;
    const totalMB = Number((totalBytes / (1024 * 1024)).toFixed(1));

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      remainingChunks.push(value);
      receivedRemaining += value.length;

      const totalReceived = FAST_BOOT_SIZE_BYTES + receivedRemaining;
      const totalPercent = Math.min(100, Math.round((totalReceived / totalBytes) * 100));
      const receivedMB = Number((totalReceived / (1024 * 1024)).toFixed(1));

      if (onBgProgress) {
        onBgProgress(totalPercent, receivedMB, totalMB);
      }
    }

    // Monta o arquivo completo unindo as fatias e salva no CacheStorage
    const completeParts: BlobPart[] = [initialBlob, ...(remainingChunks as BlobPart[])];
    const completeBlob = new Blob(completeParts, { type: 'application/octet-stream' });

    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, new Response(completeBlob, {
        headers: { 'Content-Type': 'application/octet-stream' }
      }));
    }
  } catch (err) {
    console.warn('Background streaming parou ou foi interrompido:', err);
  }
}
