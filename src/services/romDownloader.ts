const CACHE_NAME = 'gow2-web-cache-v1';

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

export async function fetchRomWithProgress(
  url: string,
  onProgress: (percent: number, receivedMB: number, totalMB: number) => void
): Promise<Blob> {
  // Verifica se já está em cache
  if ('caches' in window) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      onProgress(100, 0, 0);
      return await cachedResponse.blob();
    }
  }

  // Faz download com streaming
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Falha no download da ROM: ${response.status} ${response.statusText}`);
  }

  const contentLength = Number(response.headers.get('content-length')) || 0;
  const totalMB = contentLength ? Number((contentLength / (1024 * 1024)).toFixed(1)) : 0;

  if (!response.body) {
    throw new Error('Navegador não suporta streaming de leitura.');
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    const receivedMB = Number((receivedLength / (1024 * 1024)).toFixed(1));
    const percent = contentLength ? Math.min(100, Math.round((receivedLength / contentLength) * 100)) : 0;

    onProgress(percent, receivedMB, totalMB);
  }

  const completeBlob = new Blob(chunks as BlobPart[], { type: 'application/octet-stream' });

  // Salva no cache local para nunca precisar baixar novamente
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, new Response(completeBlob.slice(0), {
        headers: { 'Content-Type': 'application/octet-stream' }
      }));
    } catch (e) {
      console.warn('Não foi possível gravar no CacheStorage:', e);
    }
  }

  return completeBlob;
}
