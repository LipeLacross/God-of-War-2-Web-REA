import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function isoStreamPlugin(): Plugin {
  return {
    name: 'iso-stream-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/disc.iso' || url === '/disc.iso.gz') {
          const isoPaths = [
            path.resolve(import.meta.dirname, 'SCUS_974.81.God of War II.iso'),
            path.resolve(import.meta.dirname, '../ps2-web-recomp/games/gow2/disc.iso'),
            path.resolve(import.meta.dirname, 'public/disc.iso'),
          ];
          const found = isoPaths.find(p => fs.existsSync(p));
          if (!found) {
            res.statusCode = 404;
            res.end('PS2 God of War II ISO file not found');
            return;
          }
          const stat = fs.statSync(found);
          const range = req.headers.range;

          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

          if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
            const chunksize = end - start + 1;
            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
            res.setHeader('Content-Length', chunksize);
            fs.createReadStream(found, { start, end }).pipe(res);
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Length', stat.size);
            if (req.method === 'HEAD') {
              res.end();
            } else {
              fs.createReadStream(found).pipe(res);
            }
          }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    isoStreamPlugin(),
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
