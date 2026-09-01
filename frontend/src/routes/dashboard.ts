import { Router } from 'express';
import { PUBLIC_API_URL } from '../config';

const router = Router();

router.get('/', (_req, res) => {
  res.render('dashboard', { apiBase: PUBLIC_API_URL });
});

export default router;
