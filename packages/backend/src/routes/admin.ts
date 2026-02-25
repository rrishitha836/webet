import { Router, type Router as RouterType } from 'express';
import { query, queryOne, transaction } from '../lib/db';
import { ERROR_CODES } from '@webet/shared';
import { authenticateAdmin } from '../middleware/auth';
import { SocketService } from '../config/socket';
import { v4 as uuidv4 } from 'uuid';

const router: RouterType = Router();

// GET /api/admin/stats - Get admin dashboard stats
router.get('/stats', authenticateAdmin, async (req, res, next) => {
  try {
    const stats = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_suspended = false) as active_users,
        (SELECT COUNT(*) FROM bets) as total_bets,
        (SELECT COUNT(*) FROM bets WHERE status = 'OPEN') as open_bets,
        (SELECT COUNT(*) FROM bets WHERE status = 'OPEN' AND close_time > NOW()) as active_bets,
        (SELECT COUNT(*) FROM bets WHERE source = 'AI_GENERATED' AND status = 'OPEN') as published_ai_bets,
        (SELECT COUNT(*) FROM ai_suggestions WHERE status = 'PENDING') as pending_ai,
        (SELECT COUNT(*) FROM ai_suggestions WHERE status = 'APPROVED') as approved_ai,
        (SELECT COUNT(*) FROM ai_suggestions WHERE status = 'REJECTED') as rejected_ai,
        (SELECT COUNT(*) FROM wagers) as total_wagers,
        (SELECT COUNT(*) FROM reports WHERE status = 'PENDING') as pending_reports,
        (SELECT COUNT(*) FROM bets WHERE source = 'AI_GENERATED') as ai_generated_bets,
        (SELECT COUNT(*) FROM bets WHERE source = 'MANUAL') as manual_bets,
        (SELECT COUNT(*) FROM bets WHERE status IN ('CLOSED', 'RESOLVED', 'CANCELLED')) as closed_bets,
        (SELECT COUNT(*) FROM bets WHERE status = 'CLOSED') as expired_bets,
        (SELECT COALESCE(SUM(balance), 0) FROM users) as total_coins
    `, []);

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(stats.total_users),
        activeUsers: parseInt(stats.active_users),
        totalBets: parseInt(stats.total_bets),
        openBets: parseInt(stats.open_bets),
        activeBets: parseInt(stats.active_bets),
        publishedAIBets: parseInt(stats.published_ai_bets),
        pendingAI: parseInt(stats.pending_ai),
        approvedAI: parseInt(stats.approved_ai),
        rejectedAI: parseInt(stats.rejected_ai),
        publishedBets: parseInt(stats.open_bets),
        expiredBets: parseInt(stats.expired_bets),
        aiGenerated: parseInt(stats.ai_generated_bets),
        manuallyCreated: parseInt(stats.manual_bets),
        totalWagers: parseInt(stats.total_wagers),
        pendingReports: parseInt(stats.pending_reports),
        pendingSuggestions: parseInt(stats.pending_ai),
        totalCoinsInCirculation: parseFloat(stats.total_coins) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - List all users
router.get('/users', authenticateAdmin, async (req, res, next) => {
  try {
    const { search, status, cursor, limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (email ILIKE $${paramIndex} OR display_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status === 'suspended') {
      whereClause += ' AND is_suspended = true';
    } else if (status === 'active') {
      whereClause += ' AND is_suspended = false';
    }

    if (cursor) {
      whereClause += ` AND created_at < (SELECT created_at FROM users WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    const usersResult = await query(
      `SELECT id, email, display_name, avatar_url, balance, role, is_suspended, 
              total_bets, total_wins, last_login_at, created_at
       FROM users WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause.replace(/AND created_at < .+/, '')}`,
      params.slice(0, paramIndex - (cursor ? 2 : 1))
    );

    const users = usersResult.rows.map((u: any) => ({
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      balance: u.balance,
      role: u.role,
      isSuspended: u.is_suspended,
      totalBets: u.total_bets,
      totalWins: u.total_wins,
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
    }));

    res.json({
      success: true,
      data: users,
      pagination: {
        total: parseInt(countResult.total),
        cursor: users.length > 0 ? users[users.length - 1].id : null,
        hasMore: users.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users/:id - Get detailed user info
router.get('/users/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get user basic info
    const userResult = await queryOne(
      `SELECT id, email, display_name, avatar_url, balance, role, is_suspended, 
              total_bets, total_wins, last_login_at, created_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (!userResult) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get user's bets with details
    const betsResult = await query(
      `SELECT b.id, b.title, b.description, b.status, b.close_time, 
              b.total_pool, b.created_at,
              COALESCE(
                (SELECT SUM(w.amount) 
                 FROM wagers w 
                 WHERE w.bet_id = b.id AND w.user_id = $1), 
                0
              ) as user_stake
       FROM bets b
       WHERE EXISTS (
         SELECT 1 FROM wagers w 
         WHERE w.bet_id = b.id AND w.user_id = $1
       )
       ORDER BY b.created_at DESC
       LIMIT 50`,
      [id]
    );

    // Get user's positions grouped by bet
    const positionsResult = await query(
      `SELECT w.id, w.bet_id, w.outcome_id, w.amount, w.created_at, w.status as wager_status,
              o.label as option_title,
              b.title as bet_title, b.status as bet_status
       FROM wagers w
       JOIN outcomes o ON w.outcome_id = o.id
       JOIN bets b ON w.bet_id = b.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC
       LIMIT 100`,
      [id]
    );

    // Calculate stats
    const wonBets = betsResult.rows.filter((b: any) => {
      // Check if user has winning position in this bet
      const userPositions = positionsResult.rows.filter((p: any) => p.bet_id === b.id);
      return userPositions.some((p: any) => b.status === 'CLOSED' && p.option_title); // Simplified check
    }).length;

    const totalStaked = positionsResult.rows.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

    res.json({
      success: true,
      data: {
        user: {
          id: userResult.id,
          email: userResult.email,
          displayName: userResult.display_name,
          avatarUrl: userResult.avatar_url,
          balance: userResult.balance,
          role: userResult.role,
          isSuspended: userResult.is_suspended,
          totalBets: userResult.total_bets,
          totalWins: userResult.total_wins,
          lastLoginAt: userResult.last_login_at,
          createdAt: userResult.created_at,
        },
        stats: {
          totalStaked,
          wonBets,
          lostBets: userResult.total_bets - wonBets - betsResult.rows.filter((b: any) => b.status === 'OPEN').length,
          activeBets: betsResult.rows.filter((b: any) => b.status === 'OPEN').length,
        },
        recentBets: betsResult.rows.map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          status: b.status,
          endDate: b.close_time,
          totalPool: b.total_pool,
          userStake: b.user_stake,
          createdAt: b.created_at,
        })),
        recentPositions: positionsResult.rows.map((p: any) => ({
          id: p.id,
          betId: p.bet_id,
          betTitle: p.bet_title,
          betStatus: p.bet_status,
          optionId: p.option_id,
          optionTitle: p.option_title,
          amount: p.amount,
          createdAt: p.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id/suspend - Suspend/unsuspend user
router.put('/users/:id/suspend', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { suspended } = req.body;
    const admin = req.user as any;

    const userResult = await queryOne(
      `UPDATE users SET is_suspended = $1 WHERE id = $2
       RETURNING id, email, display_name, is_suspended`,
      [suspended, id]
    );

    // Log the action
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, admin_id, metadata)
       VALUES ($1, $2, 'USER', $3, $4, $5)`,
      [uuidv4(), suspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED', id, admin.id, JSON.stringify({ suspended })]
    );

    res.json({
      success: true,
      data: {
        id: userResult.id,
        email: userResult.email,
        displayName: userResult.display_name,
        isSuspended: userResult.is_suspended,
      },
      message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/ai-suggestions - List AI suggestions
router.get('/ai-suggestions', authenticateAdmin, async (req, res, next) => {
  try {
    const { status = 'PENDING', cursor, limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'ALL') {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (cursor) {
      whereClause += ` AND created_at < (SELECT created_at FROM ai_suggestions WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    const suggestionsResult = await query(
      `SELECT * FROM ai_suggestions WHERE ${whereClause}
       ORDER BY confidence_score DESC, created_at DESC
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM ai_suggestions WHERE ${whereClause.replace(/AND created_at < .+/, '')}`,
      params.slice(0, paramIndex - (cursor ? 2 : 1))
    );

    const suggestions = suggestionsResult.rows.map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      resolutionCriteria: s.resolution_criteria,
      outcomes: s.outcomes,
      suggestedDeadline: s.suggested_deadline,
      confidenceScore: s.confidence_score,
      status: s.status,
      source: s.source,
      createdAt: s.created_at,
    }));

    res.json({
      success: true,
      data: suggestions,
      pagination: {
        total: parseInt(countResult.total),
        cursor: suggestions.length > 0 ? suggestions[suggestions.length - 1].id : null,
        hasMore: suggestions.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/ai-suggestions/:id/approve - Approve AI suggestion and create bet
router.post('/ai-suggestions/:id/approve', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = req.user as any;

    const suggestion = await queryOne(
      'SELECT * FROM ai_suggestions WHERE id = $1',
      [id]
    );

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Suggestion not found',
        },
      });
    }

    if (suggestion.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_STATUS,
          message: 'Suggestion is not pending',
        },
      });
    }

    // Create a slug and shortId for the new bet
    const title = (suggestion.title || '').slice(0, 120); // bets.title is varchar(120)
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create the bet and update suggestion in a transaction
    const result = await transaction(async (client) => {
      const betId = uuidv4();
      
      // Create the bet (include updated_at = NOW() to satisfy NOT NULL)
      await client.query(
        `INSERT INTO bets (id, slug, short_id, title, description, resolution_criteria, category, source, status, close_time, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'AI_GENERATED', 'OPEN', $8, $9, NOW(), NOW())`,
        [betId, slug, shortId, title, suggestion.description, suggestion.resolution_criteria, suggestion.category, suggestion.suggested_deadline, admin.id]
      );

      // Create outcomes – handle both ["Yes","No"] and [{"label":"Yes"},{"label":"No"}]
      const rawOutcomes = suggestion.outcomes || ['Yes', 'No'];
      const outcomes = rawOutcomes.map((o: any) =>
        typeof o === 'string' ? o : (o.label || o.option || String(o))
      );
      for (let i = 0; i < outcomes.length; i++) {
        await client.query(
          `INSERT INTO outcomes (id, bet_id, label, sort_order, current_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), betId, outcomes[i], i, 1 / outcomes.length]
        );
      }

      // Initialize LMSR outcome_shares (array of zeros = equal starting prices)
      const initialShares = new Array(outcomes.length).fill(0);
      await client.query(
        `UPDATE bets SET outcome_shares = $1 WHERE id = $2`,
        [JSON.stringify(initialShares), betId]
      );

      // Update suggestion status
      await client.query(
        `UPDATE ai_suggestions SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW(), published_bet_id = $2
         WHERE id = $3`,
        [admin.id, betId, id]
      );

      const bet = await client.query('SELECT * FROM bets WHERE id = $1', [betId]);
      const betOutcomes = await client.query('SELECT * FROM outcomes WHERE bet_id = $1 ORDER BY sort_order', [betId]);
      
      return { 
        suggestion: { ...suggestion, status: 'APPROVED' }, 
        bet: { ...bet.rows[0], outcomes: betOutcomes.rows }
      };
    });

    // Log the action
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, admin_id, metadata)
       VALUES ($1, 'AI_SUGGESTION_APPROVED', 'AI_SUGGESTION', $2, $3, $4)`,
      [uuidv4(), id, admin.id, JSON.stringify({ betId: result.bet.id })]
    );

    // Emit real-time update
    SocketService.emitAISuggestion({ ...result.suggestion, bet: result.bet });

    res.json({
      success: true,
      data: result,
      message: 'Suggestion approved and bet created',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/ai-suggestions/:id/reject - Reject AI suggestion
router.post('/ai-suggestions/:id/reject', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const admin = req.user as any;

    const suggestionResult = await queryOne(
      `UPDATE ai_suggestions SET status = 'REJECTED', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2
       WHERE id = $3 RETURNING *`,
      [admin.id, reason || 'OTHER', id]
    );

    // Log the action
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, admin_id, metadata)
       VALUES ($1, 'AI_SUGGESTION_REJECTED', 'AI_SUGGESTION', $2, $3, $4)`,
      [uuidv4(), id, admin.id, JSON.stringify({ reason })]
    );

    res.json({
      success: true,
      data: {
        id: suggestionResult.id,
        title: suggestionResult.title,
        status: suggestionResult.status,
      },
      message: 'Suggestion rejected',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/execute-agent - Trigger AI agent to generate new bet suggestions
router.post('/execute-agent', authenticateAdmin, async (req, res, next) => {
  try {
    const admin = req.user as any;
    const { prompt } = req.body;
    const agentUrl = process.env.AGENT_URL || 'http://localhost:8000';

    // Call the ADK agent API
    const agentResponse = await fetch(`${agentUrl}/api/agent/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt || 'Generate betting suggestions based on the latest Twitter trends',
      }),
    });
    console.log("👾👾👾👾AI agent response:", agentResponse);
    if (!agentResponse.ok) {
      throw new Error(`Agent returned error: ${agentResponse.statusText}`);
    }

    const data = await agentResponse.json() as {
      success?: boolean;
      message?: string;
      betsCreated?: number;
      betsSkipped?: number;
      bets?: any[];
    };

    // NOTE: Bets are already created by the ADK agent via POST /api/agent/bets/bulk
    // So we don't need to create them again here - just log and return the response

    // Log the action - use admin ID as entity_id since there's no specific entity for agent execution
    const executionId = uuidv4();
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, admin_id, metadata)
       VALUES ($1, 'AI_AGENT_EXECUTED', 'SYSTEM', $2, $3, $4)`,
      [uuidv4(), executionId, admin.id, JSON.stringify({ 
        executionId,
        betsCreated: data.betsCreated || 0, 
        betsSkipped: data.betsSkipped || 0,
        agentUrl: agentUrl
      })]
    );

    res.json({
      success: data.success ?? true,
      message: data.message || 'AI agent executed successfully. Bets created via agent webhook.',
      data: {
        betsCreated: data.betsCreated || 0,
        betsSkipped: data.betsSkipped || 0,
        bets: data.bets || [],
      },
      meta: {
        timestamp: new Date(),
        executedBy: admin.email,
      },
    });
  } catch (error: any) {
    console.error('Failed to trigger AI agent:', error?.message || error);
    
    // Return a friendly error instead of crashing
    res.status(502).json({
      success: false,
      message: `Failed to connect to AI agent: ${error?.message || 'Unknown error'}. Make sure the AI agent server is running on ${process.env.AGENT_URL || 'http://localhost:8000'}.`,
    });
  }
});

// GET /api/admin/bets - List all bets (admin view)
router.get('/bets', authenticateAdmin, async (req, res, next) => {
  try {
    const { status, category, source, search, cursor, limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (b.title ILIKE $${paramIndex} OR b.description ILIKE $${paramIndex} OR b.short_id ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status && status !== 'ALL') {
      whereClause += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (category && category !== 'ALL') {
      whereClause += ` AND b.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    if (source && source !== 'ALL') {
      whereClause += ` AND b.source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    if (cursor) {
      whereClause += ` AND b.created_at < (SELECT created_at FROM bets WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    const betsResult = await query(
      `SELECT 
        b.*,
        u.display_name as creator_name, u.email as creator_email,
        (SELECT COUNT(*) FROM wagers WHERE bet_id = b.id) as wager_count,
        (SELECT COUNT(*) FROM comments WHERE bet_id = b.id) as comment_count,
        (SELECT COUNT(*) FROM reports WHERE bet_id = b.id) as report_count
       FROM bets b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM bets b WHERE ${whereClause.replace(/AND b.created_at < .+/, '')}`,
      params.slice(0, paramIndex - (cursor ? 2 : 1))
    );

    // Get outcomes for each bet
    const bets = await Promise.all(betsResult.rows.map(async (b: any) => {
      const outcomesResult = await query(
        'SELECT * FROM outcomes WHERE bet_id = $1 ORDER BY sort_order',
        [b.id]
      );

      // Compute per-outcome trade volume from the trades table
      const tradeVolResult = await query(
        `SELECT outcome_index, COALESCE(SUM(ABS(cost)), 0) as trade_volume
         FROM trades WHERE bet_id = $1 AND side IN ('BUY', 'SELL')
         GROUP BY outcome_index`,
        [b.id]
      );
      const tradeVolMap: Record<number, number> = {};
      for (const tv of tradeVolResult.rows) {
        tradeVolMap[tv.outcome_index] = parseFloat(tv.trade_volume) || 0;
      }

      return {
        id: b.id,
        title: b.title,
        description: b.description,
        slug: b.slug,
        shortId: b.short_id,
        category: b.category,
        status: b.status,
        source: b.source,
        closeTime: b.close_time,
        totalPool: b.total_pool,
        totalVolume: parseFloat(b.total_volume) || 0,
        participantCount: b.participant_count,
        winningOutcomeId: b.winning_outcome_id,
        createdAt: b.created_at,
        outcomes: outcomesResult.rows.map((o: any) => ({
          id: o.id,
          label: o.label,
          totalWagers: o.total_wagers,
          totalCoins: parseFloat(o.total_coins) || 0,
          tradeVolume: tradeVolMap[o.sort_order] || 0,
          currentPrice: parseFloat(o.current_price) || 0,
          sortOrder: o.sort_order,
        })),
        createdBy: {
          displayName: b.creator_name,
          email: b.creator_email,
        },
        _count: {
          wagers: parseInt(b.wager_count),
          comments: parseInt(b.comment_count),
          reports: parseInt(b.report_count),
        },
      };
    }));

    res.json({
      success: true,
      data: bets,
      pagination: {
        total: parseInt(countResult.total),
        cursor: bets.length > 0 ? bets[bets.length - 1].id : null,
        hasMore: bets.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/bets/:id - Get single bet detail (admin view)
router.get('/bets/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const bet = await queryOne(
      `SELECT 
        b.*,
        u.display_name as creator_name, u.email as creator_email,
        (SELECT COUNT(*) FROM wagers WHERE bet_id = b.id) as wager_count,
        (SELECT COUNT(*) FROM comments WHERE bet_id = b.id) as comment_count,
        (SELECT COUNT(*) FROM reports WHERE bet_id = b.id) as report_count,
        (SELECT COUNT(DISTINCT user_id) FROM user_shares WHERE bet_id = b.id AND shares > 0.000001) as trader_count
       FROM bets b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Bet not found' },
      });
    }

    const outcomesResult = await query(
      'SELECT * FROM outcomes WHERE bet_id = $1 ORDER BY sort_order',
      [id]
    );

    // Get LMSR prices if outcome_shares exist
    let lmsrPrices: number[] = [];
    if (bet.outcome_shares) {
      const shares = typeof bet.outcome_shares === 'string' ? JSON.parse(bet.outcome_shares) : bet.outcome_shares;
      const b = parseFloat(bet.liquidity_param || '100');
      const maxShare = Math.max(...shares.map(Number));
      const expShares = shares.map((s: any) => Math.exp((Number(s) - maxShare) / b));
      const sumExp = expShares.reduce((a: number, b: number) => a + b, 0);
      lmsrPrices = expShares.map((e: number) => e / sumExp);
    }

    // Get recent trades
    const tradesResult = await query(
      `SELECT t.*, u.display_name as trader_name
       FROM trades t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.bet_id = $1
       ORDER BY t.created_at DESC
       LIMIT 20`,
      [id]
    );

    res.json({
      success: true,
      data: {
        id: bet.id,
        title: bet.title,
        description: bet.description,
        slug: bet.slug,
        shortId: bet.short_id,
        category: bet.category,
        status: bet.status,
        source: bet.source,
        closeTime: bet.close_time,
        totalPool: bet.total_pool,
        totalVolume: bet.total_volume,
        participantCount: bet.participant_count,
        createdAt: bet.created_at,
        updatedAt: bet.updated_at,
        resolvedAt: bet.resolved_at,
        winningOutcomeId: bet.winning_outcome_id,
        resolutionCriteria: bet.resolution_criteria,
        tags: bet.tags,
        referenceLinks: bet.reference_links,
        outcomeShares: bet.outcome_shares,
        liquidityParam: bet.liquidity_param,
        lmsrPrices,
        outcomes: outcomesResult.rows.map((o: any) => ({
          id: o.id,
          label: o.label,
          totalWagers: o.total_wagers,
          totalCoins: o.total_coins,
          sortOrder: o.sort_order,
          currentPrice: o.current_price,
        })),
        createdBy: {
          displayName: bet.creator_name,
          email: bet.creator_email,
        },
        _count: {
          wagers: parseInt(bet.wager_count),
          comments: parseInt(bet.comment_count),
          reports: parseInt(bet.report_count),
          traders: parseInt(bet.trader_count),
        },
        recentTrades: tradesResult.rows.map((t: any) => ({
          id: t.id,
          side: t.side,
          shares: parseFloat(t.shares),
          cost: parseFloat(t.cost),
          outcomeIndex: t.outcome_index,
          priceAtTrade: parseFloat(t.price_at_trade),
          createdAt: t.created_at,
          traderName: t.trader_name,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/bets/:id - Update bet details
router.put('/bets/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, resolutionCriteria, closeTime, tags, referenceLinks } = req.body;
    const admin = req.user as any;

    const existing = await queryOne('SELECT * FROM bets WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Bet not found' },
      });
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) { updates.push(`title = $${paramIndex}`); params.push(title); paramIndex++; }
    if (description !== undefined) { updates.push(`description = $${paramIndex}`); params.push(description); paramIndex++; }
    if (category !== undefined) { updates.push(`category = $${paramIndex}`); params.push(category); paramIndex++; }
    if (resolutionCriteria !== undefined) { updates.push(`resolution_criteria = $${paramIndex}`); params.push(resolutionCriteria); paramIndex++; }
    if (closeTime !== undefined) { updates.push(`close_time = $${paramIndex}`); params.push(new Date(closeTime)); paramIndex++; }
    if (tags !== undefined) { updates.push(`tags = $${paramIndex}`); params.push(tags); paramIndex++; }
    if (referenceLinks !== undefined) { updates.push(`reference_links = $${paramIndex}`); params.push(referenceLinks); paramIndex++; }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No fields to update' } });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const updated = await queryOne(
      `UPDATE bets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    // Log the action
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, admin_id, metadata)
       VALUES ($1, 'BET_UPDATED', 'BET', $2, $3, $4)`,
      [uuidv4(), id, admin.id, JSON.stringify({ fields: Object.keys(req.body) })]
    );

    res.json({ success: true, data: updated, message: 'Bet updated successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/bets/:id/status - Update bet status
router.put('/bets/:id/status', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const admin = req.user as any;

    const betResult = await queryOne(
      'UPDATE bets SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    const outcomesResult = await query(
      'SELECT * FROM outcomes WHERE bet_id = $1 ORDER BY sort_order',
      [id]
    );

    // Log the action
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, admin_id, metadata)
       VALUES ($1, 'BET_STATUS_CHANGED', 'BET', $2, $3, $4)`,
      [uuidv4(), id, admin.id, JSON.stringify({ newStatus: status })]
    );

    res.json({
      success: true,
      data: {
        ...betResult,
        outcomes: outcomesResult.rows,
      },
      message: `Bet status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/bets/:id/resolve - Resolve a bet with winning outcome
router.post('/bets/:id/resolve', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { winningOutcomeId } = req.body;
    const admin = req.user as any;

    // Get bet with outcomes
    const bet = await queryOne('SELECT * FROM bets WHERE id = $1', [id]);

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Bet not found',
        },
      });
    }

    if (bet.status === 'RESOLVED' || bet.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_STATUS,
          message: 'Bet is already resolved or cancelled',
        },
      });
    }

    const winningOutcome = await queryOne(
      'SELECT * FROM outcomes WHERE id = $1 AND bet_id = $2',
      [winningOutcomeId, id]
    );

    if (!winningOutcome) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.OUTCOME_NOT_FOUND,
          message: 'Winning outcome not found',
        },
      });
    }

    // Get all wagers for this bet
    const wagersResult = await query(
      'SELECT * FROM wagers WHERE bet_id = $1',
      [id]
    );

    const totalPool = parseFloat(bet.total_pool);
    const winningPool = parseFloat(winningOutcome.total_coins);

    // Find winning outcome's sort_order (index) for LMSR settlement
    const winningOutcomeIndex = winningOutcome.sort_order;

    await transaction(async (client) => {
      // Update bet status
      await client.query(
        `UPDATE bets SET status = 'RESOLVED', winning_outcome_id = $1, resolved_at = NOW() WHERE id = $2`,
        [winningOutcomeId, id]
      );

      // --- LEGACY: Process wagers (fixed-pool system) ---
      for (const wager of wagersResult.rows) {
        if (wager.outcome_id === winningOutcomeId) {
          const payout = winningPool > 0
            ? Math.floor((parseFloat(wager.amount) / winningPool) * totalPool)
            : parseFloat(wager.amount);

          await client.query(
            `UPDATE wagers SET status = 'WON', payout = $1 WHERE id = $2`,
            [payout, wager.id]
          );

          await client.query(
            `UPDATE users SET balance = balance + $1, total_wins = total_wins + 1 WHERE id = $2`,
            [payout, wager.user_id]
          );

          await client.query(
            `INSERT INTO notifications (id, user_id, type, title, message)
             VALUES ($1, $2, 'BET_RESOLVED', 'You won!', $3)`,
            [uuidv4(), wager.user_id, `Your bet on "${ bet.title}" won! You received $${ payout.toFixed(2)}.`]
          );
        } else {
          await client.query(
            `UPDATE wagers SET status = 'LOST', payout = 0 WHERE id = $1`,
            [wager.id]
          );

          await client.query(
            `INSERT INTO notifications (id, user_id, type, title, message)
             VALUES ($1, $2, 'BET_RESOLVED', 'Bet resolved', $3)`,
            [uuidv4(), wager.user_id, `Your bet on "${ bet.title}" did not win.`]
          );
        }
      }

      // --- NEW: Process LMSR share positions ($1/share for winners, $0 for losers) ---
      const allPositions = await client.query(
        `SELECT us.*, u.balance FROM user_shares us JOIN users u ON us.user_id = u.id WHERE us.bet_id = $1 AND us.shares > 0.000001`,
        [id]
      );

      for (const pos of allPositions.rows) {
        const shares = parseFloat(pos.shares);
        if (pos.outcome_index === winningOutcomeIndex) {
          // Winner: each share pays $1.00
          const payout = shares;

          await client.query(
            `UPDATE users SET balance = balance + $1, total_wins = total_wins + 1 WHERE id = $2`,
            [payout, pos.user_id]
          );

          await client.query(
            `INSERT INTO trades (id, user_id, bet_id, outcome_index, side, shares, cost, price_at_trade, avg_price)
             VALUES ($1, $2, $3, $4, 'SETTLE', $5, $6, 1.0, 1.0)`,
            [uuidv4(), pos.user_id, id, pos.outcome_index, shares, payout]
          );

          await client.query(
            `INSERT INTO notifications (id, user_id, type, title, message)
             VALUES ($1, $2, 'BET_RESOLVED', 'Your shares won!', $3)`,
            [uuidv4(), pos.user_id, `Your ${ shares.toFixed(1)} shares on "${ bet.title}" won! Payout: $${ payout.toFixed(2)}.`]
          );

          // Emit balance update
          const updatedUser = await client.query('SELECT balance FROM users WHERE id = $1', [pos.user_id]);
          SocketService.emitBalanceUpdate(pos.user_id, parseFloat(updatedUser.rows[0].balance));
        } else {
          // Loser: shares expire worthless
          await client.query(
            `INSERT INTO trades (id, user_id, bet_id, outcome_index, side, shares, cost, price_at_trade, avg_price)
             VALUES ($1, $2, $3, $4, 'SETTLE', $5, 0, 0, 0)`,
            [uuidv4(), pos.user_id, id, pos.outcome_index, shares]
          );

          await client.query(
            `INSERT INTO notifications (id, user_id, type, title, message)
             VALUES ($1, $2, 'BET_RESOLVED', 'Market resolved', $3)`,
            [uuidv4(), pos.user_id, `Your ${ shares.toFixed(1)} shares on "${ bet.title}" expired worthless.`]
          );
        }

        // Zero out the position
        await client.query(
          `UPDATE user_shares SET shares = 0, total_cost = 0, updated_at = NOW() WHERE id = $1`,
          [pos.id]
        );
      }
    });

    // Log the action
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, admin_id, metadata)
       VALUES ($1, 'BET_RESOLVED', 'BET', $2, $3, $4)`,
      [uuidv4(), id, admin.id, JSON.stringify({ winningOutcomeId })]
    );

    res.json({
      success: true,
      message: 'Bet resolved successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/reports - List reports
router.get('/reports', authenticateAdmin, async (req, res, next) => {
  try {
    const { status = 'PENDING', cursor, limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'ALL') {
      whereClause += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (cursor) {
      whereClause += ` AND r.created_at < (SELECT created_at FROM reports WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    const reportsResult = await query(
      `SELECT r.*, 
        b.id as bet_id, b.title as bet_title,
        u.id as reporter_id, u.display_name as reporter_name
       FROM reports r
       LEFT JOIN bets b ON r.bet_id = b.id
       LEFT JOIN users u ON r.reporter_id = u.id
       WHERE ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM reports r WHERE ${whereClause.replace(/AND r.created_at < .+/, '')}`,
      params.slice(0, paramIndex - (cursor ? 2 : 1))
    );

    const reports = reportsResult.rows.map((r: any) => ({
      id: r.id,
      reasonType: r.reason_type,
      description: r.description,
      status: r.status,
      createdAt: r.created_at,
      bet: { id: r.bet_id, title: r.bet_title },
      reporter: { id: r.reporter_id, displayName: r.reporter_name },
    }));

    res.json({
      success: true,
      data: reports,
      pagination: {
        total: parseInt(countResult.total),
        cursor: reports.length > 0 ? reports[reports.length - 1].id : null,
        hasMore: reports.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/reports/:id - Resolve report
router.put('/reports/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const admin = req.user as any;

    const reportResult = await queryOne(
      `UPDATE reports SET status = $1, resolved_by = $2, resolved_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, admin.id, id]
    );

    // Log the action
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, admin_id, metadata)
       VALUES ($1, 'REPORT_RESOLVED', 'REPORT', $2, $3, $4)`,
      [uuidv4(), id, admin.id, JSON.stringify({ status })]
    );

    res.json({
      success: true,
      data: reportResult,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/audit-log - Get audit log
router.get('/audit-log', authenticateAdmin, async (req, res, next) => {
  try {
    const { action, entityType, cursor, limit = '50' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (action) {
      whereClause += ` AND a.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }
    if (entityType) {
      whereClause += ` AND a.entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }

    if (cursor) {
      whereClause += ` AND a.created_at < (SELECT created_at FROM audit_logs WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    const logsResult = await query(
      `SELECT a.*, u.display_name as admin_name
       FROM audit_logs a
       LEFT JOIN users u ON a.admin_id = u.id
       WHERE ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    const logs = logsResult.rows.map((l: any) => ({
      id: l.id,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      metadata: l.metadata,
      createdAt: l.created_at,
      admin: { id: l.admin_id, displayName: l.admin_name },
    }));

    res.json({
      success: true,
      data: logs,
      pagination: {
        cursor: logs.length > 0 ? logs[logs.length - 1].id : null,
        hasMore: logs.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/bets - Create a new bet
router.post('/bets', authenticateAdmin, async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      resolutionCriteria,
      closeTime,
      tags,
      referenceLinks,
      outcomes,
    } = req.body;
    const admin = req.user as any;

    if (!title || !description || !closeTime || !outcomes || outcomes.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Missing required fields or insufficient outcomes',
        },
      });
    }

    const closeTimeDate = new Date(closeTime);
    if (closeTimeDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Close time must be in the future',
        },
      });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const bet = await transaction(async (client) => {
      const betId = uuidv4();
      
      await client.query(
        // include created_at/updated_at explicitly using NOW() to handle databases that may not have defaults set
        `INSERT INTO bets (id, slug, short_id, title, description, category, resolution_criteria, close_time, tags, reference_links, source, status, created_at, updated_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'MANUAL', 'OPEN', NOW(), NOW(), $11)`,
        // tags and reference_links are Postgres text[] columns; pass JS arrays (not JSON strings)
        [betId, slug, shortId, title, description, category, resolutionCriteria, closeTimeDate, tags || [], referenceLinks || [], admin.id]
      );

      for (let i = 0; i < outcomes.length; i++) {
        await client.query(
          `INSERT INTO outcomes (id, bet_id, label, sort_order, current_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), betId, outcomes[i].label, outcomes[i].sortOrder ?? i, 1 / outcomes.length]
        );
      }

      // Initialize LMSR outcome_shares (array of zeros = equal starting prices)
      const initialShares = new Array(outcomes.length).fill(0);
      await client.query(
        `UPDATE bets SET outcome_shares = $1 WHERE id = $2`,
        [JSON.stringify(initialShares), betId]
      );

      const betResult = await client.query('SELECT * FROM bets WHERE id = $1', [betId]);
      const outcomesResult = await client.query('SELECT * FROM outcomes WHERE bet_id = $1 ORDER BY sort_order', [betId]);
      
      return { ...betResult.rows[0], outcomes: outcomesResult.rows };
    });

    // Log the action
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, admin_id, metadata)
       VALUES ($1, 'BET_CREATED', 'BET', $2, $3, $4)`,
      [uuidv4(), bet.id, admin.id, JSON.stringify({ title: bet.title, category: bet.category, outcomes: bet.outcomes.length })]
    );

    res.status(201).json({
      success: true,
      data: {
        id: bet.id,
        slug: bet.slug,
        shortId: bet.short_id,
        title: bet.title,
        description: bet.description,
        category: bet.category,
        status: bet.status,
        closeTime: bet.close_time,
        outcomes: bet.outcomes.map((o: any) => ({
          id: o.id,
          label: o.label,
          sortOrder: o.sort_order,
        })),
      },
      message: 'Bet created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/categories/stats - Get category statistics
router.get('/categories/stats', authenticateAdmin, async (req, res, next) => {
  try {
    const statsResult = await query(`
      SELECT 
        category,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'OPEN') as active_count,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_count
      FROM bets
      GROUP BY category
    `, []);

    const totalsResult = await queryOne(`
      SELECT
        COUNT(*) as total_bets,
        COUNT(*) FILTER (WHERE status = 'OPEN') as active_bets,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_bets
      FROM bets
    `, []);

    const allCategories = ['SPORTS', 'POLITICS', 'ENTERTAINMENT', 'TECHNOLOGY', 'CULTURE', 'OTHER'];
    
    const categoryStatsMap = allCategories.map(category => {
      const stat = statsResult.rows.find((s: any) => s.category === category);
      return {
        category,
        count: parseInt(stat?.total_count || '0'),
        activeCount: parseInt(stat?.active_count || '0'),
        resolvedCount: parseInt(stat?.resolved_count || '0'),
      };
    });

    res.json({
      success: true,
      totalBets: parseInt(totalsResult.total_bets),
      activeBets: parseInt(totalsResult.active_bets),
      resolvedBets: parseInt(totalsResult.resolved_bets),
      categoryStats: categoryStatsMap,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
