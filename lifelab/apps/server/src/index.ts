import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { api } from './routes/api.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  // Parse JSON với mọi content-type (Vercel đôi khi không set đúng).
  app.use(express.json({ limit: '256kb', type: () => true }));

  // Normalize body: trên serverless, req.body có thể là string/Buffer → ép về object.
  app.use((req, _res, next) => {
    if (typeof req.body === 'string') {
      try { req.body = req.body.length ? JSON.parse(req.body) : {}; } catch { req.body = {}; }
    } else if (Buffer.isBuffer(req.body)) {
      const s = req.body.toString('utf8');
      try { req.body = s.length ? JSON.parse(s) : {}; } catch { req.body = {}; }
    } else if (req.body == null) {
      req.body = {};
    }
    next();
  });

  // request id + server time
  app.use((req, res, next) => {
    res.locals.requestId = req.header('X-Request-Id') ?? randomUUID();
    res.setHeader('X-Request-Id', res.locals.requestId);
    next();
  });

  app.get('/health', (_req, res) => res.json({ ok: true, version: '8.7.2', provider: config.aiProvider }));

  // Chẩn đoán kết nối DB — fail nhanh (không treo tới function timeout).
  app.get('/health/db', async (_req, res) => {
    const started = Date.now();
    let host = 'unknown', port = 'unknown';
    try {
      const u = new URL(config.databaseUrl.replace(/^postgres(ql)?:\/\//, 'http://'));
      host = u.hostname; port = u.port;
    } catch { /* ignore */ }
    try {
      const { pool } = await import('./db/pool.js');
      const client = await pool.connect();
      try { await client.query('select 1'); } finally { client.release(); }
      res.json({ db: 'ok', host, port, ms: Date.now() - started });
    } catch (e) {
      res.status(503).json({ db: 'fail', host, port, ms: Date.now() - started, error: (e as Error).message.slice(0, 120) });
    }
  });

  app.use('/api/v1', api);

  // fallback error contract (không lộ stack)
  app.use((errAny: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[unhandled]', errAny);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Lỗi máy chủ' }, request_id: res.locals.requestId });
  });

  return app;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[lifelab] server on :${config.port} (provider=${config.aiProvider})`);
  });
}
