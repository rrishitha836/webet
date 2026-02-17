import { Router, type Router as RouterType } from 'express';
import { query, queryOne } from '../lib/db';
import { SocketService } from '../config/socket';
import { v4 as uuidv4 } from 'uuid';

const router: RouterType = Router();

// POST /api/webhooks/ai-suggestion - Receive AI suggestion from external service
router.post('/ai-suggestion', async (req, res, next) => {
  try {
    const {
      title,
      description,
      resolutionCriteria,
      category,
      outcomes,
      suggestedDeadline,
      confidenceScore,
      sourceLinks,
    } = req.body;

    // Validate required fields
    if (!title || !outcomes || !suggestedDeadline) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: title, outcomes, suggestedDeadline',
        },
      });
    }

    // Create the AI suggestion
    const suggestionId = uuidv4();
    const suggestionResult = await queryOne(
      `INSERT INTO ai_suggestions (id, title, description, resolution_criteria, category, outcomes, suggested_deadline, confidence_score, source_links, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING') RETURNING *`,
      [
        suggestionId,
        title,
        description || '',
        resolutionCriteria || 'To be determined by admin review',
        category || 'OTHER',
        JSON.stringify(outcomes),
        new Date(suggestedDeadline),
        confidenceScore || 0.5,
        JSON.stringify(sourceLinks || []),
      ]
    );

    const suggestion = {
      id: suggestionResult.id,
      title: suggestionResult.title,
      description: suggestionResult.description,
      resolutionCriteria: suggestionResult.resolution_criteria,
      category: suggestionResult.category,
      outcomes: suggestionResult.outcomes,
      suggestedDeadline: suggestionResult.suggested_deadline,
      confidenceScore: suggestionResult.confidence_score,
      sourceLinks: suggestionResult.source_links,
      status: suggestionResult.status,
      createdAt: suggestionResult.created_at,
    };

    // Emit to admins
    SocketService.emitAISuggestion(suggestion);

    res.status(201).json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/webhooks/close-expired-bets - Close bets that have passed their close time
router.post('/close-expired-bets', async (req, res, next) => {
  try {
    const expiredBetsResult = await query(
      `UPDATE bets SET status = 'CLOSED' 
       WHERE status = 'OPEN' AND close_time < NOW()
       RETURNING id`,
      []
    );

    res.json({
      success: true,
      data: {
        closedCount: expiredBetsResult.rows.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
