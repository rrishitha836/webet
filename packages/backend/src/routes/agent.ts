import { Router, type Router as RouterType } from 'express';
import { query, queryOne } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

const router: RouterType = Router();

// Valid BetCategory enum values
const VALID_CATEGORIES = ['SPORTS', 'POLITICS', 'ENTERTAINMENT', 'TECHNOLOGY', 'CULTURE', 'OTHER'];

// Generate a URL-safe slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 180)
    + '-' + Date.now().toString(36);
}

// Generate a short 8-char ID
function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Middleware to authenticate agent requests
const authenticateAgent = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.AGENT_API_KEY || 'your-agent-api-key';
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }
  
  next();
};

// POST /api/agent/bets/bulk - Bulk create bets from AI agent
router.post('/bets/bulk', authenticateAgent, async (req, res, next) => {
  try {
    const bets = req.body;
    
    if (!Array.isArray(bets)) {
      return res.status(400).json({
        success: false,
        error: 'Expected an array of bets'
      });
    }

    logger.info(`🤖 Agent creating ${bets.length} bets in bulk`);
    
    const createdBets = [];
    
    for (const betData of bets) {
      const {
        title,
        description,
        categorySlug = 'other',
        twitterTrend,
        options = [{ option: 'Yes' }, { option: 'No' }]
      } = betData;

      if (!title || !description) {
        logger.warn(`🚨 Skipping bet with missing title/description: ${JSON.stringify(betData)}`);
        continue;
      }

      // Normalize category to valid enum value
      const normalizedCategory = VALID_CATEGORIES.includes(categorySlug.toUpperCase())
        ? categorySlug.toUpperCase()
        : 'OTHER';

      // Get an admin user for created_by
      const adminUser = await queryOne(
        `SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`,
        []
      );
      if (!adminUser) {
        logger.error('❌ No admin user found in database');
        return res.status(500).json({ success: false, error: 'No admin user found' });
      }

      // Create bet with all required fields
      const betId = uuidv4();
      const slug = generateSlug(title);
      const shortId = generateShortId();
      const closeTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const resolutionCriteria = `Resolves YES if "${title}" comes true. Resolves NO otherwise.`;
      
      const bet = await queryOne(
        `INSERT INTO bets (id, slug, short_id, title, description, resolution_criteria, category, close_time, source, status, created_by, total_pool, participant_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::\"BetCategory\", $8, 'AI_GENERATED'::\"BetSource\", 'OPEN'::\"BetStatus\", $9, 0, 0, NOW(), NOW())
         RETURNING id, title, description, category, close_time, source, status, created_at`,
        [betId, slug, shortId, title, description, resolutionCriteria, normalizedCategory, closeTime, adminUser.id]
      );

      // Create outcomes/options
      const outcomes = [];
      for (let i = 0; i < options.length; i++) {
        const outcomeId = uuidv4();
        const outcome = await queryOne(
          `INSERT INTO outcomes (id, bet_id, label, sort_order, total_wagers, total_coins)
           VALUES ($1, $2, $3, $4, 0, 0)
           RETURNING id, bet_id, label, sort_order`,
          [outcomeId, betId, options[i].option, i + 1]
        );
        outcomes.push(outcome);
      }

      createdBets.push({
        id: bet.id,
        title: bet.title,
        description: bet.description,
        category: bet.category,
        closeTime: bet.close_time,
        outcomes: outcomes,
        twitterTrend: twitterTrend || null,
      });

      logger.info(`✅ Created bet: ${title} (${bet.id})`);
    }

    logger.info(`🎯 Agent bulk creation complete: ${createdBets.length}/${bets.length} bets created`);

    res.json(createdBets);
  } catch (error) {
    logger.error('❌ Agent bulk bet creation failed:', error);
    next(error);
  }
});

// GET /api/agent/health - Agent health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'WeBet Agent API',
    timestamp: new Date().toISOString()
  });
});

export default router;