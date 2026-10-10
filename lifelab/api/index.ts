/**
 * Vercel Serverless entry — Life Lab V8.7.2.
 * Wrap Express app (createApp) để chạy như một function. Mọi /api/* đi vào đây.
 * Server-side only: AI key + DB url lấy từ env Vercel (D04/SEC02).
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../apps/server/dist/index.js';

const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Express app là một request listener hợp lệ.
  return (app as unknown as (q: IncomingMessage, s: ServerResponse) => void)(req, res);
}
