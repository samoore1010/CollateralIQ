import type { Plugin } from 'vite';
import express from 'express';

export function collateralApiPlugin(): Plugin {
  return {
    name: 'collateral-api',
    async configureServer(server) {
      const { seedIfEmpty } = await import('./seed');
      const { createApi } = await import('./api');
      seedIfEmpty();
      const app = express();
      app.use('/api', createApi());
      server.middlewares.use(app);
    },
  };
}
