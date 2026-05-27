import type { Plugin } from 'vite';
import express from 'express';
import { createApi } from './api';
import { seedIfEmpty } from './seed';

export function collateralApiPlugin(): Plugin {
  return {
    name: 'collateral-api',
    configureServer(server) {
      seedIfEmpty();
      const app = express();
      app.use('/api', createApi());
      server.middlewares.use(app);
    },
  };
}
