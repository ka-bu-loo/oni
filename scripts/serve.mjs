import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.md': 'text/plain',
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const file = path.resolve(
        root,
        '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname),
      );
      if (!file.startsWith(root + path.sep)) throw new Error('Invalid path');
      const bytes = await fs.readFile(file);
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  })
  .listen(Number(process.env.PORT) || 5173, '127.0.0.1', () =>
    console.log('Preview: http://127.0.0.1:' + (process.env.PORT || 5173)),
  );
