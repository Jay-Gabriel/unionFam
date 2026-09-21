import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.exr': 'image/aces',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm'
};

const RADIO_STATIONS_DATA = {
  presets: [
    {
      channel: 1,
      stationUuid: "unionfam-focus-1",
      name: "Life Lab Focus - Deep Thinking",
      genre: "Electronic / Deep Ambient",
      homepage: "https://unionfam.vn/",
      fallbackStreamUrl: "https://nr9.newradio.it/proxy/ebaruffa?mp=/stream",
      embeddingPermission: "granted",
      streamUrl: "https://nr9.newradio.it/proxy/ebaruffa?mp=/stream",
      source: "unionfam-radio"
    },
    {
      channel: 2,
      stationUuid: "unionfam-reflection-2",
      name: "Mindful Reflection - Calm Lo-Fi",
      genre: "Lo-Fi / Soul Reflection",
      homepage: "https://unionfam.vn/",
      fallbackStreamUrl: "https://funkyradio.streamingmedia.it/play.mp3",
      embeddingPermission: "granted",
      streamUrl: "https://funkyradio.streamingmedia.it/play.mp3",
      source: "unionfam-radio"
    },
    {
      channel: 3,
      stationUuid: "unionfam-ambient-3",
      name: "Quiet Ambient - Life Design",
      genre: "Classic Soul & Ambient",
      homepage: "https://unionfam.vn/",
      fallbackStreamUrl: "https://rblive.it:8040/radio.mp3",
      embeddingPermission: "granted",
      streamUrl: "https://rblive.it:8040/radio.mp3",
      source: "unionfam-radio"
    },
    {
      channel: 4,
      stationUuid: "unionfam-jazz-4",
      name: "Easy Jazz Soul - Evening Pause",
      genre: "Smooth Jazz & Chillout",
      homepage: "https://unionfam.vn/",
      fallbackStreamUrl: "https://sphera.fluidstream.eu/easy_jazz.mp3",
      embeddingPermission: "granted",
      streamUrl: "https://sphera.fluidstream.eu/easy_jazz.mp3",
      source: "unionfam-radio"
    },
    {
      channel: 5,
      stationUuid: "unionfam-clarity-5",
      name: "Classical Clarity - Decision Making",
      genre: "Italian Acoustic & Pop",
      homepage: "https://unionfam.vn/",
      fallbackStreamUrl: "https://stream.lolliradio.net/lolli_italia.mp3",
      embeddingPermission: "granted",
      streamUrl: "https://stream.lolliradio.net/lolli_italia.mp3",
      source: "unionfam-radio"
    }
  ],
  resolvedAt: new Date().toISOString()
};

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/radio/stations') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(RADIO_STATIONS_DATA));
    return;
  }

  if (pathname === '/api/radio/click') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Redirect any other route (like /app/world) to root
  if (pathname !== '/' && pathname !== '/index.html' && !path.extname(pathname) && !pathname.startsWith('/api/')) {
    res.writeHead(302, { 'Location': '/' });
    res.end();
    return;
  }

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(__dirname, pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);

    // Support Range headers for video/audio streaming safely
    const range = req.headers.range;
    if (range && (ext === '.webm' || ext === '.mp4' || ext === '.mp3') && stat.size > 0) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10) || 0;
      let end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      if (isNaN(end) || end >= stat.size) end = stat.size - 1;

      if (start >= stat.size || start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        res.end();
        return;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      file.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 Not Found: ${pathname}`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`UnionFam Life Lab 3D Studio running at http://localhost:${PORT}/`);
});
