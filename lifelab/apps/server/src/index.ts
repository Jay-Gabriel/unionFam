import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { api } from './routes/api.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '256kb' }));

  // request id + server time
  app.use((req, res, next) => {
    res.locals.requestId = req.header('X-Request-Id') ?? randomUUID();
    res.setHeader('X-Request-Id', res.locals.requestId);
    next();
  });

  app.get('/health', (_req, res) => res.json({ ok: true, version: '8.7.2', provider: config.aiProvider }));

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
