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

      // Instead of creating bets directly, create AI suggestion records so
      // they appear in the admin "Pending Review" list. Admins will review
      // suggestions and publish them as bets using the existing approve flow.
      const suggestionId = uuidv4();
      const safeTitle = (title || '').slice(0, 120); // ai_suggestions.title is varchar(120)
      const resolutionCriteria = `Resolves YES if "${safeTitle}" comes true. Resolves NO otherwise.`;
      const suggestedDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const outcomesJson = options.map((o: any) => ({ label: o.option }));
      const confidence = typeof betData.confidence === 'number' ? betData.confidence : 0.75;
      const sourceLinks = Array.isArray(betData.sourceLinks) ? betData.sourceLinks : (betData.twitter_url ? [betData.twitter_url] : []);

      const suggestion = await queryOne(
        `INSERT INTO ai_suggestions (id, title, description, outcomes, resolution_criteria, suggested_deadline, category, confidence_score, source_links, status, created_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::"BetCategory", $8, $9, 'PENDING', NOW())
         RETURNING id, title, description, outcomes, resolution_criteria, suggested_deadline, category, confidence_score, source_links, status, created_at`,
        [suggestionId, safeTitle, description, JSON.stringify(outcomesJson), resolutionCriteria, suggestedDeadline, normalizedCategory, confidence, sourceLinks]
      );

      createdBets.push({
        id: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        suggestedDeadline: suggestion.suggested_deadline,
        outcomes: suggestion.outcomes,
        twitterTrend: twitterTrend || null,
      });

      logger.info(`✅ Created AI suggestion: ${title} (${suggestion.id})`);
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