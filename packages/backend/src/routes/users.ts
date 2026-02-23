import { Router, type Router as RouterType } from 'express';
import { query, queryOne } from '../lib/db';
import { ERROR_CODES } from '@webet/shared';
import { authenticateUser, optionalAuth } from '../middleware/auth';

const router: RouterType = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/leaderboard - Public leaderboard
// ─────────────────────────────────────────────────────────────────────────────
router.get('/leaderboard', optionalAuth, async (req, res, next) => {
  try {
    const { period = 'all', limit = '50' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);

    // Portfolio value = balance + current value of all open positions
    const leaders = await query(
      `SELECT 
         u.id,
         u.display_name,
         u.avatar_url,
         u.balance,
         u.total_bets,
         u.total_wins,
         COALESCE(
           (SELECT SUM(us.shares * o.current_price)
            FROM user_shares us
            JOIN outcomes o ON o.bet_id = us.bet_id AND o.sort_order = us.outcome_index
            JOIN bets b ON b.id = us.bet_id AND b.status = 'OPEN'
            WHERE us.user_id = u.id AND us.shares > 0.001
           ), 0
         ) as portfolio_value,
         (SELECT COUNT(DISTINCT us.bet_id) FROM user_shares us WHERE us.user_id = u.id AND us.shares > 0.001) as active_positions,
         CASE WHEN u.total_bets > 0 THEN ROUND((u.total_wins::numeric / u.total_bets) * 100, 1) ELSE 0 END as win_rate
       FROM users u
       WHERE u.total_bets > 0 OR u.balance != 1000
       ORDER BY (u.balance + COALESCE(
           (SELECT SUM(us.shares * o.current_price)
            FROM user_shares us
            JOIN outcomes o ON o.bet_id = us.bet_id AND o.sort_order = us.outcome_index
            JOIN bets b ON b.id = us.bet_id AND b.status = 'OPEN'
            WHERE us.user_id = u.id AND us.shares > 0.001
           ), 0
         )) DESC
       LIMIT $1`,
      [limitNum],
    );

    const data = leaders.rows.map((row: any, idx: number) => ({
      rank: idx + 1,
      id: row.id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      balance: parseFloat(row.balance),
      portfolioValue: parseFloat(row.portfolio_value),
      netWorth: parseFloat(row.balance) + parseFloat(row.portfolio_value),
      totalBets: parseInt(row.total_bets),
      totalWins: parseInt(row.total_wins),
      activePositions: parseInt(row.active_positions),
      winRate: parseFloat(row.win_rate),
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/activity - Public activity feed (recent trades)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/activity', optionalAuth, async (req, res, next) => {
  try {
    const { limit = '30', cursor } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 30, 100);
    const params: any[] = [limitNum];
    let cursorClause = '';

    if (cursor) {
      cursorClause = 'AND t.created_at < $2';
      params.push(cursor);
    }

    const result = await query(
      `SELECT 
         t.id,
         t.side,
         t.shares,
         t.cost,
         t.avg_price,
         t.created_at,
         t.bet_id,
         t.outcome_index,
         u.display_name as user_name,
         u.avatar_url as user_avatar,
         b.title as bet_title,
         o.label as outcome_label
       FROM trades t
       JOIN users u ON t.user_id = u.id
       JOIN bets b ON t.bet_id = b.id
       JOIN outcomes o ON o.bet_id = t.bet_id AND o.sort_order = t.outcome_index
       WHERE 1=1 ${cursorClause}
       ORDER BY t.created_at DESC
       LIMIT $1`,
      params,
    );

    const activities = result.rows.map((row: any) => ({
      id: row.id,
      type: 'TRADE' as const,
      side: row.side,
      shares: parseFloat(row.shares),
      cost: parseFloat(row.cost),
      avgPrice: parseFloat(row.avg_price),
      createdAt: row.created_at,
      userName: row.user_name,
      userAvatar: row.user_avatar,
      betId: row.bet_id,
      betTitle: row.bet_title,
      outcomeIndex: row.outcome_index,
      outcomeLabel: row.outcome_label,
    }));

    const lastItem = activities[activities.length - 1];

    res.json({
      success: true,
      data: activities,
      pagination: {
        cursor: lastItem?.createdAt || null,
        hasMore: activities.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    
    const profile = await queryOne(
      `SELECT id, email, display_name, avatar_url, balance, total_bets, total_wins, created_at 
       FROM users WHERE id = $1`,
      [user.id]
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        },
      });
    }

    // Compute stats from wagers table
    const wagerStats = await queryOne(
      `SELECT 
        COUNT(*)::int as total_bets,
        COUNT(CASE WHEN w.status = 'WON' THEN 1 END)::int as wins,
        COUNT(CASE WHEN w.status = 'LOST' THEN 1 END)::int as losses,
        COALESCE(SUM(CASE WHEN w.status = 'WON' THEN w.payout ELSE 0 END), 0)::numeric as total_winnings,
        COALESCE(SUM(w.amount), 0)::numeric as total_staked
       FROM wagers w WHERE w.user_id = $1`,
      [user.id]
    );

    const totalBets = wagerStats?.total_bets || 0;
    const wins = wagerStats?.wins || 0;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

    res.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        balance: profile.balance,
        totalBets: totalBets,
        totalWins: wins,
        createdAt: profile.created_at,
        stats: {
          totalBets: totalBets,
          totalWins: wins,
          totalLosses: wagerStats?.losses || 0,
          winRate: parseFloat(winRate.toFixed(1)),
          totalWinnings: parseFloat(wagerStats?.total_winnings || 0),
          totalStaked: parseFloat(wagerStats?.total_staked || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { displayName } = req.body;
    
    const updatedUser = await queryOne(
      `UPDATE users SET display_name = $1 WHERE id = $2 
       RETURNING id, email, display_name, avatar_url, balance, total_bets, total_wins, created_at`,
      [displayName, user.id]
    );

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.display_name,
        avatarUrl: updatedUser.avatar_url,
        balance: updatedUser.balance,
        totalBets: updatedUser.total_bets,
        totalWins: updatedUser.total_wins,
        createdAt: updatedUser.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/wagers - Get user's wager history
router.get('/wagers', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { status, cursor, limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    let whereClause = 'w.user_id = $1';
    const params: any[] = [user.id];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND w.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (cursor) {
      whereClause += ` AND w.created_at < (SELECT created_at FROM wagers WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    const wagersResult = await query(
      `SELECT 
        w.id, w.amount, w.status, w.created_at,
        b.id as bet_id, b.title as bet_title, b.slug as bet_slug, b.short_id as bet_short_id, 
        b.status as bet_status, b.close_time as bet_close_time,
        o.id as outcome_id, o.label as outcome_label
       FROM wagers w
       JOIN bets b ON w.bet_id = b.id
       LEFT JOIN outcomes o ON w.outcome_id = o.id
       WHERE ${whereClause}
       ORDER BY w.created_at DESC
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM wagers w WHERE ${status ? 'w.user_id = $1 AND w.status = $2' : 'w.user_id = $1'}`,
      status ? [user.id, status] : [user.id]
    );

    const wagers = wagersResult.rows.map((row: any) => ({
      id: row.id,
      amount: row.amount,
      status: row.status,
      createdAt: row.created_at,
      bet: {
        id: row.bet_id,
        title: row.bet_title,
        slug: row.bet_slug,
        shortId: row.bet_short_id,
        status: row.bet_status,
        closeTime: row.bet_close_time,
      },
      outcome: row.outcome_id ? {
        id: row.outcome_id,
        label: row.outcome_label,
      } : null,
    }));

    res.json({
      success: true,
      data: wagers,
      pagination: {
        total: parseInt(countResult.total),
        cursor: wagers.length > 0 ? wagers[wagers.length - 1].id : null,
        hasMore: wagers.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/bets - Get user's bet history (wagers + LMSR trades unified)
router.get('/bets', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { status, cursor, limit = '20', search } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Build a unified query: bets where user has wagers OR user_shares
    let whereClause = `(
      EXISTS (SELECT 1 FROM wagers w2 WHERE w2.bet_id = b.id AND w2.user_id = $1)
      OR EXISTS (SELECT 1 FROM user_shares us2 WHERE us2.bet_id = b.id AND us2.user_id = $1 AND us2.shares > 0.001)
    )`;
    const params: any[] = [user.id];
    let paramIndex = 2;

    // Handle different filter types based on the new dashboard requirements
    if (status && status !== 'HISTORY') {
      switch (status) {
        case 'ACTIVE':
          whereClause += ` AND b.status = 'OPEN'`;
          break;
        case 'PENDING':
          whereClause += ` AND b.status = 'CLOSED'`;
          break;
        case 'COMPLETED':
          whereClause += ` AND b.status = 'RESOLVED'`;
          break;
      }
    }

    // Search functionality for History tab
    if (search) {
      whereClause += ` AND (b.title ILIKE $${paramIndex} OR b.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (cursor) {
      whereClause += ` AND b.created_at < (SELECT created_at FROM bets WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    // Different sorting based on filter type
    let orderBy = 'b.created_at DESC';
    if (status === 'ACTIVE') {
      orderBy = 'b.close_time ASC, b.created_at DESC';
    }

    const betsResult = await query(
      `SELECT DISTINCT ON (b.id)
        b.id as bet_id, b.title, b.description, b.category, b.status as bet_status,
        b.close_time, b.slug, b.short_id, b.total_pool, b.created_at,
        w.id as wager_id, w.amount as wager_amount, w.status as wager_status, w.created_at as wager_created_at,
        wo.id as wager_outcome_id, wo.label as wager_outcome_label,
        us_agg.total_shares, us_agg.total_cost as shares_cost, us_agg.outcome_indices,
        us_agg.shares_detail,
        lmsr_primary.lmsr_outcome_id, lmsr_primary.lmsr_outcome_label
       FROM bets b
       LEFT JOIN wagers w ON w.bet_id = b.id AND w.user_id = $1
       LEFT JOIN outcomes wo ON w.outcome_id = wo.id
       LEFT JOIN LATERAL (
         SELECT 
           SUM(us.shares) as total_shares,
           SUM(us.total_cost) as total_cost,
           array_agg(us.outcome_index) as outcome_indices,
           json_agg(json_build_object(
             'outcomeIndex', us.outcome_index,
             'shares', us.shares,
             'label', o.label
           )) as shares_detail
         FROM user_shares us
         JOIN outcomes o ON o.bet_id = us.bet_id AND o.sort_order = us.outcome_index
         WHERE us.bet_id = b.id AND us.user_id = $1 AND us.shares > 0.001
       ) us_agg ON true
       LEFT JOIN LATERAL (
         SELECT o.id as lmsr_outcome_id, o.label as lmsr_outcome_label
         FROM user_shares us
         JOIN outcomes o ON o.bet_id = us.bet_id AND o.sort_order = us.outcome_index
         WHERE us.bet_id = b.id AND us.user_id = $1 AND us.shares > 0.001
         ORDER BY us.shares DESC
         LIMIT 1
       ) lmsr_primary ON true
       WHERE ${whereClause}
       ORDER BY b.id, w.created_at DESC NULLS LAST
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    // Re-sort since DISTINCT ON forces ordering by b.id first
    const sortedRows = betsResult.rows.sort((a: any, b: any) => {
      if (status === 'ACTIVE') {
        return new Date(a.close_time).getTime() - new Date(b.close_time).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const countResult = await queryOne(
      `SELECT COUNT(DISTINCT b.id) as total FROM bets b WHERE ${whereClause}`,
      params
    );

    // Transform to bet-centric format expected by frontend
    const bets = sortedRows.map((row: any) => {
      // Determine wager status from wager or derive from shares
      let wagerStatus = row.wager_status;
      if (!wagerStatus && row.total_shares > 0) {
        // User only has LMSR shares, no legacy wager
        wagerStatus = row.bet_status === 'RESOLVED' ? 'COMPLETED' : 'ACTIVE';
      }

      return {
        id: row.bet_id,
        title: row.title,
        description: row.description,
        category: row.category,
        status: row.bet_status,
        closeTime: row.close_time,
        slug: row.short_id,
        shortId: row.short_id,
        wager: {
          id: row.wager_id || `shares-${row.bet_id}`,
          amount: row.wager_amount || (row.shares_cost ? parseFloat(row.shares_cost).toFixed(2) : 0),
          status: wagerStatus || 'ACTIVE',
          outcome: row.wager_outcome_id ? {
            id: row.wager_outcome_id,
            label: row.wager_outcome_label,
          } : row.lmsr_outcome_id ? {
            id: row.lmsr_outcome_id,
            label: row.lmsr_outcome_label,
          } : null,
          createdAt: row.wager_created_at || row.created_at,
          // LMSR-specific info
          shares: row.total_shares ? parseFloat(row.total_shares) : undefined,
          sharesDetail: row.shares_detail || [],
        },
      };
    });

    res.json({
      success: true,
      data: bets,
      pagination: {
        total: parseInt(countResult.total),
        cursor: betsResult.rows.length > 0 ? betsResult.rows[betsResult.rows.length - 1].bet_id : null,
        hasMore: betsResult.rows.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/created-bets - Get bets created by user
router.get('/created-bets', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { status, cursor, limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    let whereClause = 'b.created_by = $1';
    const params: any[] = [user.id];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (cursor) {
      whereClause += ` AND b.created_at < (SELECT created_at FROM bets WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    const betsResult = await query(
      `SELECT b.*, 
        COALESCE(json_agg(
          json_build_object(
            'id', o.id, 'label', o.label, 'sortOrder', o.sort_order
          ) ORDER BY o.sort_order
        ) FILTER (WHERE o.id IS NOT NULL), '[]') as outcomes
       FROM bets b
       LEFT JOIN outcomes o ON b.id = o.bet_id
       WHERE ${whereClause}
       GROUP BY b.id
       ORDER BY b.created_at DESC
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM bets b WHERE ${status ? 'b.created_by = $1 AND b.status = $2' : 'b.created_by = $1'}`,
      status ? [user.id, status] : [user.id]
    );

    const bets = betsResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status,
      closeTime: row.close_time,
      slug: row.slug,
      shortId: row.short_id,
      createdAt: row.created_at,
      outcomes: row.outcomes,
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

// GET /api/users/notifications - Get user notifications
router.get('/notifications', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { unreadOnly, cursor, limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    let whereClause = 'user_id = $1';
    const params: any[] = [user.id];
    let paramIndex = 2;
    
    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = false';
    }
    
    if (cursor) {
      whereClause += ` AND created_at < (SELECT created_at FROM notifications WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    const [notificationsResult, totalResult, unreadResult] = await Promise.all([
      query(
        `SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex}`,
        [...params, limitNum]
      ),
      queryOne(
        `SELECT COUNT(*) as total FROM notifications WHERE ${unreadOnly === 'true' ? 'user_id = $1 AND is_read = false' : 'user_id = $1'}`,
        [user.id]
      ),
      queryOne(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [user.id]
      ),
    ]);

    const notifications = notificationsResult.rows.map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      createdAt: n.created_at,
    }));

    res.json({
      success: true,
      data: notifications,
      meta: {
        unreadCount: parseInt(unreadResult.count),
      },
      pagination: {
        total: parseInt(totalResult.total),
        cursor: notifications.length > 0 ? notifications[notifications.length - 1].id : null,
        hasMore: notifications.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { id } = req.params;

    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, user.id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;

    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [user.id]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/stats - Get user statistics
router.get('/stats', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;

    const [profile, wagerStats, createdBetsResult] = await Promise.all([
      queryOne(
        'SELECT balance, total_bets, total_wins FROM users WHERE id = $1',
        [user.id]
      ),
      query(
        `SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount 
         FROM wagers WHERE user_id = $1 GROUP BY status`,
        [user.id]
      ),
      queryOne(
        'SELECT COUNT(*) as count FROM bets WHERE created_by = $1',
        [user.id]
      ),
    ]);

    const wagersByStatus: Record<string, { count: number; totalAmount: number }> = {};
    wagerStats.rows.forEach((row: any) => {
      wagersByStatus[row.status] = {
        count: parseInt(row.count),
        totalAmount: parseFloat(row.total_amount) || 0,
      };
    });

    const stats = {
      balance: profile?.balance || 0,
      totalBets: profile?.total_bets || 0,
      totalWins: profile?.total_wins || 0,
      winRate: profile && profile.total_bets > 0 
        ? ((profile.total_wins / profile.total_bets) * 100).toFixed(1) 
        : 0,
      createdBetsCount: parseInt(createdBetsResult?.count || '0'),
      wagersByStatus,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/proposals - Submit a market proposal
// ─────────────────────────────────────────────────────────────────────────────
router.post('/proposals', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { title, description, category, suggestedCloseTime, outcomes } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 200) {
      return res.status(400).json({ success: false, error: { message: 'Title must be 5-200 characters' } });
    }
    if (!outcomes || !Array.isArray(outcomes) || outcomes.length < 2 || outcomes.length > 10) {
      return res.status(400).json({ success: false, error: { message: 'Provide 2-10 outcomes' } });
    }

    // Rate limit: max 3 proposals per day
    const recent = await queryOne(
      `SELECT COUNT(*) as cnt FROM market_proposals WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day'`,
      [user.id]
    );
    if (parseInt(recent.cnt) >= 3) {
      return res.status(429).json({ success: false, error: { message: 'Max 3 proposals per day' } });
    }

    const result = await queryOne(
      `INSERT INTO market_proposals (user_id, title, description, category, suggested_close_time, outcomes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [user.id, title.trim(), description?.trim() || null, category || 'OTHER', suggestedCloseTime || null, outcomes]
    );

    res.status(201).json({
      success: true,
      data: { id: result.id, createdAt: result.created_at },
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/proposals - Get user's own proposals
// ─────────────────────────────────────────────────────────────────────────────
router.get('/proposals', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const result = await query(
      `SELECT id, title, description, category, suggested_close_time, outcomes, status, admin_notes, created_at
       FROM market_proposals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [user.id]
    );

    res.json({
      success: true,
      data: result.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        suggestedCloseTime: r.suggested_close_time,
        outcomes: r.outcomes,
        status: r.status,
        adminNotes: r.admin_notes,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
