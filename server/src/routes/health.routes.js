// =======================
// Rota de disponibilidade da API e do banco
// =======================
import { Router } from 'express';
import { pool } from '../db/pool.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1');
    response.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});
