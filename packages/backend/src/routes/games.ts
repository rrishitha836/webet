import { Router, type Router as RouterType } from 'express';

const router: RouterType = Router();

// This file is deprecated in favor of bets.ts
// Keeping minimal routes for backward compatibility

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Games endpoint deprecated. Use /api/bets instead.',
  });
});

export default router;
