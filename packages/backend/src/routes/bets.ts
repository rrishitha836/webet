import { Router, type Router as RouterType } from 'express';
import { query, queryOne, transaction } from '../lib/db';
import { authenticateUser, optionalAuth } from '../middleware/auth';
import { betRateLimiter } from '../config/rateLimiter';
import { ERROR_CODES } from '@webet/shared';
import { SocketService } from '../config/socket';
import { v4 as uuidv4 } from 'uuid';

const router: RouterType = Router();

// GET /api/bets - List open bets (paginated, filterable)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, status = 'OPEN', cursor, limit = '20', sort = 'trending' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (category && category !== 'ALL') {
      whereClause += ` AND b.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (cursor) {
      whereClause += ` AND b.created_at < (SELECT created_at FROM bets WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    // Exclude bets where the authenticated user has already placed a wager
    if (req.user) {
      const user = req.user as any;
      whereClause += ` AND NOT EXISTS (SELECT 1 FROM wagers w WHERE w.bet_id = b.id AND w.user_id = $${paramIndex})`;
      params.push(user.id);
      paramIndex++;
    }

    let orderBy = 'b.created_at DESC';
    if (sort === 'trending') {
      orderBy = 'b.participant_count DESC, b.created_at DESC';
    } else if (sort === 'closing_soon') {
      orderBy = 'b.close_time ASC';
    }

    const betsResult = await query(
      `SELECT 
        b.*,
        u.display_name as creator_name,
        COALESCE(json_agg(
          json_build_object(
            'id', o.id, 'label', o.label, 
            'totalWagers', o.total_wagers, 'totalCoins', o.total_coins, 'sortOrder', o.sort_order
          ) ORDER BY o.sort_order
        ) FILTER (WHERE o.id IS NOT NULL), '[]') as outcomes
       FROM bets b
       LEFT JOIN users u ON b.created_by = u.id
       LEFT JOIN outcomes o ON b.id = o.bet_id
       WHERE ${whereClause}
       GROUP BY b.id, u.display_name
       ORDER BY ${orderBy}
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    const bets = betsResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      slug: row.slug,
      shortId: row.short_id,
      category: row.category,
      status: row.status,
      closeTime: row.close_time,
      totalPool: row.total_pool,
      participantCount: row.participant_count,
      createdAt: row.created_at,
      outcomes: row.outcomes,
      createdBy: {
        displayName: row.creator_name,
      },
    }));

    res.json({
      success: true,
      data: bets,
      pagination: {
        cursor: bets.length > 0 ? bets[bets.length - 1].id : null,
        hasMore: bets.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bets/:id - Get bet detail by ID
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const bet = await queryOne(
      `SELECT 
        b.*,
        u.display_name as creator_name, u.avatar_url as creator_avatar,
        (SELECT COUNT(*) FROM wagers WHERE bet_id = b.id) as wager_count,
        (SELECT COUNT(*) FROM comments WHERE bet_id = b.id AND is_deleted = false) as comment_count
       FROM bets b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Bet not found',
        },
      });
    }

    const outcomesResult = await query(
      'SELECT * FROM outcomes WHERE bet_id = $1 ORDER BY sort_order',
      [id]
    );

    const betData = {
      id: bet.id,
      title: bet.title,
      description: bet.description,
      slug: bet.slug,
      shortId: bet.short_id,
      category: bet.category,
      status: bet.status,
      closeTime: bet.close_time,
      totalPool: bet.total_pool,
      participantCount: bet.participant_count,
      createdAt: bet.created_at,
      outcomes: outcomesResult.rows.map((o: any) => ({
        id: o.id,
        label: o.label,
        totalWagers: o.total_wagers,
        totalCoins: o.total_coins,
        sortOrder: o.sort_order,
      })),
      createdBy: {
        displayName: bet.creator_name,
        avatarUrl: bet.creator_avatar,
      },
      _count: {
        wagers: parseInt(bet.wager_count),
        comments: parseInt(bet.comment_count),
      },
    };

    res.json({
      success: true,
      data: betData,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bets/slug/:slug-:shortId - Get bet by URL slug
router.get('/slug/:slugWithId', optionalAuth, async (req, res, next) => {
  try {
    const { slugWithId } = req.params;
    const parts = slugWithId.split('-');
    const shortId = parts.pop();

    const bet = await queryOne(
      `SELECT 
        b.*,
        u.display_name as creator_name, u.avatar_url as creator_avatar,
        (SELECT COUNT(*) FROM wagers WHERE bet_id = b.id) as wager_count,
        (SELECT COUNT(*) FROM comments WHERE bet_id = b.id AND is_deleted = false) as comment_count
       FROM bets b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.short_id = $1 OR b.slug = $2`,
      [shortId, slugWithId]
    );

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Bet not found',
        },
      });
    }

    const outcomesResult = await query(
      'SELECT * FROM outcomes WHERE bet_id = $1 ORDER BY sort_order',
      [bet.id]
    );

    const betData = {
      id: bet.id,
      title: bet.title,
      description: bet.description,
      slug: bet.slug,
      shortId: bet.short_id,
      category: bet.category,
      status: bet.status,
      closeTime: bet.close_time,
      totalPool: bet.total_pool,
      participantCount: bet.participant_count,
      createdAt: bet.created_at,
      outcomes: outcomesResult.rows.map((o: any) => ({
        id: o.id,
        label: o.label,
        totalWagers: o.total_wagers,
        totalCoins: o.total_coins,
        sortOrder: o.sort_order,
      })),
      createdBy: {
        displayName: bet.creator_name,
        avatarUrl: bet.creator_avatar,
      },
      _count: {
        wagers: parseInt(bet.wager_count),
        comments: parseInt(bet.comment_count),
      },
    };

    res.json({
      success: true,
      data: betData,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bets/:id/wager - Place a wager on a bet
router.post('/:id/wager', authenticateUser, betRateLimiter, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { id: betId } = req.params;
    const { outcomeId, amount } = req.body;

    // Validate amount
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Amount must be at least 1 coin',
        },
      });
    }

    // Get user with current balance
    const currentUser = await queryOne(
      'SELECT id, balance, is_suspended FROM users WHERE id = $1',
      [user.id]
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found',
        },
      });
    }

    if (currentUser.is_suspended) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Account is suspended',
        },
      });
    }

    if (parseFloat(currentUser.balance) < amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INSUFFICIENT_BALANCE,
          message: 'Insufficient balance',
        },
      });
    }

    // Get bet and validate
    const bet = await queryOne(
      'SELECT * FROM bets WHERE id = $1',
      [betId]
    );

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Bet not found',
        },
      });
    }

    if (bet.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.BET_CLOSED,
          message: 'Bet is not open for wagers',
        },
      });
    }

    // Validate outcome
    const outcome = await queryOne(
      'SELECT * FROM outcomes WHERE id = $1 AND bet_id = $2',
      [outcomeId, betId]
    );

    if (!outcome) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid outcome selected',
        },
      });
    }

    // Check if user already has a wager on this bet
    const existingWager = await queryOne(
      'SELECT id FROM wagers WHERE user_id = $1 AND bet_id = $2',
      [user.id, betId]
    );

    if (existingWager) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.DUPLICATE_WAGER,
          message: 'You have already placed a wager on this bet',
        },
      });
    }

    // Place wager in transaction
    const wager = await transaction(async (client) => {
      const wagerId = uuidv4();
      
      // Create wager
      const wagerResult = await client.query(
        `INSERT INTO wagers (id, user_id, bet_id, outcome_id, amount) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [wagerId, user.id, betId, outcomeId, amount]
      );

      // Update user balance and stats
      await client.query(
        'UPDATE users SET balance = balance - $1, total_bets = total_bets + 1 WHERE id = $2',
        [amount, user.id]
      );

      // Update bet totals
      await client.query(
        'UPDATE bets SET total_pool = total_pool + $1, participant_count = participant_count + 1 WHERE id = $2',
        [amount, betId]
      );

      // Update outcome totals
      await client.query(
        'UPDATE outcomes SET total_wagers = total_wagers + 1, total_coins = total_coins + $1 WHERE id = $2',
        [amount, outcomeId]
      );

      return wagerResult.rows[0];
    });

    // Emit real-time update using existing SocketService
    SocketService.emitBetPlaced(user.id, {
      betId,
      totalPool: parseFloat(bet.total_pool) + amount,
      participantCount: bet.participant_count + 1,
    });

    res.status(201).json({
      success: true,
      data: {
        id: wager.id,
        userId: wager.user_id,
        betId: wager.bet_id,
        outcomeId: wager.outcome_id,
        amount: wager.amount,
        status: wager.status,
        createdAt: wager.created_at,
      },
      message: 'Wager placed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bets/:id/comments - Get comments for a bet
router.get('/:id/comments', optionalAuth, async (req, res, next) => {
  try {
    const { id: betId } = req.params;
    const { cursor, limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    let whereClause = 'c.bet_id = $1 AND c.is_deleted = false AND c.parent_id IS NULL';
    const params: any[] = [betId];
    let paramIndex = 2;

    if (cursor) {
      whereClause += ` AND c.created_at < (SELECT created_at FROM comments WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    const commentsResult = await query(
      `SELECT 
        c.*,
        u.display_name, u.avatar_url
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    // Get replies for each comment
    const comments = await Promise.all(
      commentsResult.rows.map(async (c: any) => {
        const repliesResult = await query(
          `SELECT c.*, u.display_name, u.avatar_url
           FROM comments c
           LEFT JOIN users u ON c.user_id = u.id
           WHERE c.parent_id = $1 AND c.is_deleted = false
           ORDER BY c.created_at ASC`,
          [c.id]
        );

        return {
          id: c.id,
          betId: c.bet_id,
          userId: c.user_id,
          content: c.content,
          createdAt: c.created_at,
          user: {
            displayName: c.display_name,
            avatarUrl: c.avatar_url,
          },
          replies: repliesResult.rows.map((r: any) => ({
            id: r.id,
            betId: r.bet_id,
            userId: r.user_id,
            content: r.content,
            createdAt: r.created_at,
            user: {
              displayName: r.display_name,
              avatarUrl: r.avatar_url,
            },
          })),
        };
      })
    );

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bets/:id/comments - Post a comment on a bet
router.post('/:id/comments', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { id: betId } = req.params;
    const { content, parentId } = req.body;

    if (!content || content.length < 1 || content.length > 500) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Comment must be 1-500 characters',
        },
      });
    }

    const commentId = uuidv4();
    const commentResult = await query(
      `INSERT INTO comments (id, bet_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [commentId, betId, user.id, content, parentId || null]
    );

    const comment = commentResult.rows[0];

    const userInfo = await queryOne(
      'SELECT display_name, avatar_url FROM users WHERE id = $1',
      [user.id]
    );

    res.status(201).json({
      success: true,
      data: {
        id: comment.id,
        betId: comment.bet_id,
        userId: comment.user_id,
        content: comment.content,
        parentId: comment.parent_id,
        createdAt: comment.created_at,
        user: {
          displayName: userInfo?.display_name,
          avatarUrl: userInfo?.avatar_url,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bets/:id/report - Report a bet
router.post('/:id/report', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { id: betId } = req.params;
    const { reasonType, description } = req.body;

    const validReasons = ['INAPPROPRIATE', 'MISLEADING', 'DUPLICATE', 'OTHER'];
    if (!validReasons.includes(reasonType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid report reason',
        },
      });
    }

    const reportId = uuidv4();
    const reportResult = await query(
      `INSERT INTO reports (id, reporter_id, bet_id, reason_type, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [reportId, user.id, betId, reasonType, description]
    );

    res.status(201).json({
      success: true,
      data: {
        id: reportResult.rows[0].id,
        reporterId: reportResult.rows[0].reporter_id,
        betId: reportResult.rows[0].bet_id,
        reasonType: reportResult.rows[0].reason_type,
        description: reportResult.rows[0].description,
        createdAt: reportResult.rows[0].created_at,
      },
      message: 'Report submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
