import type { VercelRequest, VercelResponse } from '@vercel/node';

const ARCHIVE_DIRECT_URL =
  'https://dn720703.ca.archive.org/0/items/20250504_20250504_0850/SCUS_974.81.God%20of%20War%20II.iso';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers abertos para qualquer domínio ou subdomínio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rangeHeader = req.headers.range as string | undefined;
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    };

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const archiveRes = await fetch(ARCHIVE_DIRECT_URL, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: fetchHeaders,
      redirect: 'follow',
    });

    res.status(archiveRes.status);

    // Propaga os headers de tamanho e fatiamento
    const passHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
    for (const h of passHeaders) {
      const val = archiveRes.headers.get(h);
      if (val) {
        res.setHeader(h, val);
      }
    }

    if (req.method === 'HEAD' || !archiveRes.body) {
      return res.end();
    }

    // Stream direto dos chunks para o navegador
    const reader = archiveRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }

    res.end();
  } catch (error: any) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: error.message || 'Falha ao buscar ROM no Archive' });
  }
}
