import { Router, type Router as RouterType } from 'express';
import { query, queryOne } from '../lib/db';
import { ERROR_CODES } from '@webet/shared';
import { authenticateUser } from '../middleware/auth';

const router: RouterType = Router();

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

// GET /api/users/bets - Get user's bet history (alias for wagers with transformed response)
router.get('/bets', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { status, cursor, limit = '20', search } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    let whereClause = 'w.user_id = $1';
    const params: any[] = [user.id];
    let paramIndex = 2;
    
    // Handle different filter types based on the new dashboard requirements
    if (status && status !== 'HISTORY') {
      switch (status) {
        case 'ACTIVE':
          // Open bets the user has joined
          whereClause += ` AND b.status = 'OPEN' AND w.status = 'ACTIVE'`;
          break;
        case 'PENDING':
          // Closed bets awaiting admin resolution
          whereClause += ` AND b.status = 'CLOSED' AND w.status = 'ACTIVE'`;
          break;
        case 'COMPLETED':
          // Resolved bets with outcome
          whereClause += ` AND b.status = 'RESOLVED' AND w.status IN ('WON', 'LOST', 'REFUNDED')`;
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
      whereClause += ` AND w.created_at < (SELECT created_at FROM wagers WHERE id = $${paramIndex})`;
      params.push(cursor);
      paramIndex++;
    }

    // Different sorting based on filter type
    let orderBy = 'w.created_at DESC';
    if (status === 'ACTIVE') {
      // Active bets sorted by closing time (soonest first)
      orderBy = 'b.close_time ASC, w.created_at DESC';
    }

    const wagersResult = await query(
      `SELECT 
        w.id, w.amount, w.status as wager_status, w.created_at,
        b.id as bet_id, b.title, b.description, b.category, b.status as bet_status, 
        b.close_time, b.slug, b.short_id, b.total_pool,
        o.id as outcome_id, o.label as outcome_label
       FROM wagers w
       JOIN bets b ON w.bet_id = b.id
       LEFT JOIN outcomes o ON w.outcome_id = o.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex}`,
      [...params, limitNum]
    );

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM wagers w JOIN bets b ON w.bet_id = b.id WHERE ${whereClause}`,
      params
    );

    // Transform wagers to bet-centric format expected by frontend
    const bets = wagersResult.rows.map((row: any) => ({
      id: row.bet_id,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.bet_status,
      closeTime: row.close_time,
      slug: row.slug,
      shortId: row.short_id,
      wager: {
        id: row.id,
        amount: row.amount,
        status: row.wager_status,
        outcome: row.outcome_id ? {
          id: row.outcome_id,
          label: row.outcome_label,
        } : null,
        createdAt: row.created_at,
      },
    }));

    res.json({
      success: true,
      data: bets,
      pagination: {
        total: parseInt(countResult.total),
        cursor: wagersResult.rows.length > 0 ? wagersResult.rows[wagersResult.rows.length - 1].id : null,
        hasMore: wagersResult.rows.length === limitNum,
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

export default router;
