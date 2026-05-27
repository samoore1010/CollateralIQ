import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApi } from './api';
import { seedIfEmpty } from './seed';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

seedIfEmpty();

const app = express();
app.disable('x-powered-by');

app.use('/api', createApi());

app.get('/healthz', (_req, res) => res.json({ ok: true }));

const distDir = path.join(ROOT, 'dist');
app.use(express.static(distDir, { index: false, maxAge: '1y', immutable: true }));

// SPA fallback — let the React router handle client routes.
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`[collateraliq] listening on http://${HOST}:${PORT}`);
});
