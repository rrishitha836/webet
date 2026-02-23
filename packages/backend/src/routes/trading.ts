import { Router, type Router as RouterType } from 'express';
import { query, queryOne, transaction } from '../lib/db';
import { authenticateUser, optionalAuth } from '../middleware/auth';
import { ERROR_CODES } from '@webet/shared';
import { SocketService } from '../config/socket';
import { v4 as uuidv4 } from 'uuid';
import * as lmsr from '../utils/lmsr';

const router: RouterType = Router();

// ---------------------------------------------------------------------------
// GET /api/trading/:betId/prices — Current prices for all outcomes
// ---------------------------------------------------------------------------
router.get('/:betId/prices', optionalAuth, async (req, res, next) => {
  try {
    const { betId } = req.params;

    const bet = await queryOne(
      'SELECT id, liquidity_b, outcome_shares, total_volume, status FROM bets WHERE id = $1',
      [betId],
    );

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Bet not found' },
      });
    }

    const q: number[] = bet.outcome_shares || [];
    const b: number = parseFloat(bet.liquidity_b);

    if (q.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Market has no outcomes' },
      });
    }

    const outcomesResult = await query(
      'SELECT id, label, shares_qty, current_price, sort_order FROM outcomes WHERE bet_id = $1 ORDER BY sort_order',
      [betId],
    );

    const pricesVec = lmsr.prices(q, b);

    // Include user positions if authenticated
    let userPositions: any[] = [];
    if (req.user) {
      const user = req.user as any;
      const posResult = await query(
        'SELECT outcome_index, shares, total_cost FROM user_shares WHERE user_id = $1 AND bet_id = $2 ORDER BY outcome_index',
        [user.id, betId],
      );
      userPositions = posResult.rows;
    }

    res.json({
      success: true,
      data: {
        betId,
        status: bet.status,
        liquidityB: b,
        totalVolume: parseFloat(bet.total_volume),
        outcomes: outcomesResult.rows.map((o: any, i: number) => ({
          id: o.id,
          label: o.label,
          index: i,
          price: pricesVec[i],
          sharesQty: parseFloat(o.shares_qty),
        })),
        prices: pricesVec,
        userPositions: userPositions.map((p: any) => ({
          outcomeIndex: p.outcome_index,
          shares: parseFloat(p.shares),
          totalCost: parseFloat(p.total_cost),
          avgCost: parseFloat(p.shares) > 0
            ? parseFloat(p.total_cost) / parseFloat(p.shares)
            : 0,
          currentValue: parseFloat(p.shares) * pricesVec[p.outcome_index],
          unrealizedPnl:
            parseFloat(p.shares) * pricesVec[p.outcome_index] - parseFloat(p.total_cost),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/trading/:betId/quote — Get a trade quote (no execution)
// ---------------------------------------------------------------------------
router.post('/:betId/quote', optionalAuth, async (req, res, next) => {
  try {
    const { betId } = req.params;
    const { side, outcomeIndex, shares } = req.body;

    // Validate inputs
    if (!['BUY', 'SELL'].includes(side)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'side must be BUY or SELL' },
      });
    }
    if (typeof outcomeIndex !== 'number' || outcomeIndex < 0) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid outcomeIndex' },
      });
    }
    if (!shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'shares must be positive' },
      });
    }

    const bet = await queryOne(
      'SELECT id, liquidity_b, outcome_shares, status FROM bets WHERE id = $1',
      [betId],
    );

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Bet not found' },
      });
    }

    const q: number[] = bet.outcome_shares || [];
    const b: number = parseFloat(bet.liquidity_b);

    if (outcomeIndex >= q.length) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'outcomeIndex out of range' },
      });
    }

    const quote =
      side === 'BUY'
        ? lmsr.buyQuote(q, b, outcomeIndex, shares)
        : lmsr.sellQuote(q, b, outcomeIndex, shares);

    res.json({
      success: true,
      data: {
        side,
        outcomeIndex,
        shares,
        ...quote,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/trading/:betId/buy — Buy shares of an outcome
// ---------------------------------------------------------------------------
router.post('/:betId/buy', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { betId } = req.params;
    const { outcomeIndex, shares } = req.body;

    // --- Validate inputs ---
    if (typeof outcomeIndex !== 'number' || outcomeIndex < 0) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid outcomeIndex' },
      });
    }
    if (!shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.INVALID_AMOUNT, message: 'shares must be positive' },
      });
    }

    // --- Get bet ---
    const bet = await queryOne(
      'SELECT * FROM bets WHERE id = $1',
      [betId],
    );

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Bet not found' },
      });
    }
    if (bet.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.BET_CLOSED, message: 'Market is not open for trading' },
      });
    }

    const q: number[] = bet.outcome_shares || [];
    const b: number = parseFloat(bet.liquidity_b);

    if (outcomeIndex >= q.length) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'outcomeIndex out of range' },
      });
    }

    // --- Compute cost ---
    const tradeCost = lmsr.buyCost(q, b, outcomeIndex, shares);
    const priceBefore = lmsr.prices(q, b)[outcomeIndex];

    // --- Check balance ---
    const currentUser = await queryOne(
      'SELECT id, balance, is_suspended FROM users WHERE id = $1',
      [user.id],
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.USER_NOT_FOUND, message: 'User not found' },
      });
    }
    if (currentUser.is_suspended) {
      return res.status(403).json({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Account is suspended' },
      });
    }
    if (parseFloat(currentUser.balance) < tradeCost) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INSUFFICIENT_BALANCE,
          message: `Insufficient balance. Trade costs ${tradeCost.toFixed(2)} coins but you have ${parseFloat(currentUser.balance).toFixed(2)}.`,
        },
      });
    }

    // --- Execute trade in transaction ---
    const tradeId = uuidv4();
    const qAfter = [...q];
    qAfter[outcomeIndex] += shares;
    const newPrices = lmsr.prices(qAfter, b);
    const avgPrice = tradeCost / shares;

    const result = await transaction(async (client) => {
      // 1. Debit user balance
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [tradeCost, user.id],
      );

      // 2. Update bet outcome_shares and volume; increment participant_count if first trade
      const isFirstTrade = await client.query(
        `SELECT 1 FROM user_shares WHERE user_id = $1 AND bet_id = $2 AND shares > 0.001 LIMIT 1`,
        [user.id, betId],
      );
      const participantIncrement = isFirstTrade.rows.length === 0 ? 1 : 0;
      await client.query(
        'UPDATE bets SET outcome_shares = $1, total_volume = total_volume + $2, participant_count = participant_count + $3 WHERE id = $4',
        [JSON.stringify(qAfter), tradeCost, participantIncrement, betId],
      );

      // 3. Update outcome row
      await client.query(
        'UPDATE outcomes SET shares_qty = $1, current_price = $2 WHERE bet_id = $3 AND sort_order = $4',
        [qAfter[outcomeIndex], newPrices[outcomeIndex], betId, outcomeIndex],
      );

      // Update ALL outcome prices
      for (let i = 0; i < qAfter.length; i++) {
        if (i !== outcomeIndex) {
          await client.query(
            'UPDATE outcomes SET current_price = $1 WHERE bet_id = $2 AND sort_order = $3',
            [newPrices[i], betId, i],
          );
        }
      }

      // 4. Upsert user_shares
      await client.query(
        `INSERT INTO user_shares (id, user_id, bet_id, outcome_index, shares, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, bet_id, outcome_index)
         DO UPDATE SET shares = user_shares.shares + $5,
                       total_cost = user_shares.total_cost + $6,
                       updated_at = NOW()`,
        [uuidv4(), user.id, betId, outcomeIndex, shares, tradeCost],
      );

      // 5. Insert trade record
      await client.query(
        `INSERT INTO trades (id, user_id, bet_id, outcome_index, side, shares, cost, price_at_trade, avg_price)
         VALUES ($1, $2, $3, $4, 'BUY', $5, $6, $7, $8)`,
        [tradeId, user.id, betId, outcomeIndex, shares, tradeCost, priceBefore, avgPrice],
      );

      // 6. Insert price history snapshot
      await client.query(
        `INSERT INTO price_history (id, bet_id, prices, total_volume, triggered_by)
         VALUES ($1, $2, $3, (SELECT total_volume FROM bets WHERE id = $2), $4)`,
        [uuidv4(), betId, JSON.stringify(newPrices), tradeId],
      );

      // 7. Get updated user balance
      const updatedUser = await client.query(
        'SELECT balance FROM users WHERE id = $1',
        [user.id],
      );

      return { newBalance: parseFloat(updatedUser.rows[0].balance) };
    });

    // --- Emit real-time price update ---
    SocketService.emitBetUpdate(betId, {
      prices: newPrices,
      totalVolume: parseFloat(bet.total_volume) + tradeCost,
      outcomeShares: qAfter,
    });

    SocketService.emitBalanceUpdate(user.id, result.newBalance);

    res.status(201).json({
      success: true,
      data: {
        tradeId,
        side: 'BUY',
        outcomeIndex,
        shares,
        cost: parseFloat(tradeCost.toFixed(6)),
        avgPrice: parseFloat(avgPrice.toFixed(6)),
        priceBefore: parseFloat(priceBefore.toFixed(6)),
        priceAfter: parseFloat(newPrices[outcomeIndex].toFixed(6)),
        newPrices,
        newBalance: result.newBalance,
      },
      message: `Bought ${shares} shares at avg price ${avgPrice.toFixed(4)}`,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/trading/:betId/sell — Sell shares of an outcome
// ---------------------------------------------------------------------------
router.post('/:betId/sell', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { betId } = req.params;
    const { outcomeIndex, shares } = req.body;

    // --- Validate inputs ---
    if (typeof outcomeIndex !== 'number' || outcomeIndex < 0) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid outcomeIndex' },
      });
    }
    if (!shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.INVALID_AMOUNT, message: 'shares must be positive' },
      });
    }

    // --- Get bet ---
    const bet = await queryOne(
      'SELECT * FROM bets WHERE id = $1',
      [betId],
    );

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Bet not found' },
      });
    }
    if (bet.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.BET_CLOSED, message: 'Market is not open for trading' },
      });
    }

    const q: number[] = bet.outcome_shares || [];
    const b: number = parseFloat(bet.liquidity_b);

    if (outcomeIndex >= q.length) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'outcomeIndex out of range' },
      });
    }

    // --- Check user has enough shares ---
    const position = await queryOne(
      'SELECT shares, total_cost FROM user_shares WHERE user_id = $1 AND bet_id = $2 AND outcome_index = $3',
      [user.id, betId, outcomeIndex],
    );

    if (!position || parseFloat(position.shares) < shares) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: `Insufficient shares. You have ${position ? parseFloat(position.shares) : 0} but tried to sell ${shares}.`,
        },
      });
    }

    // --- Check user not suspended ---
    const currentUser = await queryOne(
      'SELECT id, is_suspended FROM users WHERE id = $1',
      [user.id],
    );
    if (currentUser?.is_suspended) {
      return res.status(403).json({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Account is suspended' },
      });
    }

    // --- Compute proceeds ---
    const proceeds = lmsr.sellProceeds(q, b, outcomeIndex, shares);
    const priceBefore = lmsr.prices(q, b)[outcomeIndex];

    const tradeId = uuidv4();
    const qAfter = [...q];
    qAfter[outcomeIndex] -= shares;
    const newPrices = lmsr.prices(qAfter, b);
    const avgPrice = proceeds / shares;

    // Cost basis for this sale (proportional)
    const positionShares = parseFloat(position.shares);
    const positionCost = parseFloat(position.total_cost);
    const costBasisForSale = (shares / positionShares) * positionCost;

    const result = await transaction(async (client) => {
      // 1. Credit user balance
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [proceeds, user.id],
      );

      // 2. Update bet outcome_shares and volume
      await client.query(
        'UPDATE bets SET outcome_shares = $1, total_volume = total_volume + $2 WHERE id = $3',
        [JSON.stringify(qAfter), proceeds, betId],
      );

      // 3. Update outcome rows
      for (let i = 0; i < qAfter.length; i++) {
        await client.query(
          'UPDATE outcomes SET shares_qty = $1, current_price = $2 WHERE bet_id = $3 AND sort_order = $4',
          [qAfter[i], newPrices[i], betId, i],
        );
      }

      // 4. Update user_shares (reduce)
      const remainingShares = positionShares - shares;
      const remainingCost = positionCost - costBasisForSale;

      if (remainingShares <= 0.000001) {
        // Position fully closed
        await client.query(
          'DELETE FROM user_shares WHERE user_id = $1 AND bet_id = $2 AND outcome_index = $3',
          [user.id, betId, outcomeIndex],
        );
      } else {
        await client.query(
          'UPDATE user_shares SET shares = $1, total_cost = $2, updated_at = NOW() WHERE user_id = $3 AND bet_id = $4 AND outcome_index = $5',
          [remainingShares, remainingCost, user.id, betId, outcomeIndex],
        );
      }

      // 5. Insert trade record
      await client.query(
        `INSERT INTO trades (id, user_id, bet_id, outcome_index, side, shares, cost, price_at_trade, avg_price)
         VALUES ($1, $2, $3, $4, 'SELL', $5, $6, $7, $8)`,
        [tradeId, user.id, betId, outcomeIndex, shares, proceeds, priceBefore, avgPrice],
      );

      // 6. Insert price history snapshot
      await client.query(
        `INSERT INTO price_history (id, bet_id, prices, total_volume, triggered_by)
         VALUES ($1, $2, $3, (SELECT total_volume FROM bets WHERE id = $2), $4)`,
        [uuidv4(), betId, JSON.stringify(newPrices), tradeId],
      );

      // 7. Get updated balance
      const updatedUser = await client.query(
        'SELECT balance FROM users WHERE id = $1',
        [user.id],
      );

      return { newBalance: parseFloat(updatedUser.rows[0].balance) };
    });

    // --- Emit real-time price update ---
    SocketService.emitBetUpdate(betId, {
      prices: newPrices,
      totalVolume: parseFloat(bet.total_volume) + proceeds,
      outcomeShares: qAfter,
    });

    SocketService.emitBalanceUpdate(user.id, result.newBalance);

    res.status(200).json({
      success: true,
      data: {
        tradeId,
        side: 'SELL',
        outcomeIndex,
        shares,
        proceeds: parseFloat(proceeds.toFixed(6)),
        avgPrice: parseFloat(avgPrice.toFixed(6)),
        priceBefore: parseFloat(priceBefore.toFixed(6)),
        priceAfter: parseFloat(newPrices[outcomeIndex].toFixed(6)),
        realizedPnl: parseFloat((proceeds - costBasisForSale).toFixed(6)),
        newPrices,
        newBalance: result.newBalance,
      },
      message: `Sold ${shares} shares at avg price ${avgPrice.toFixed(4)}`,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/trading/:betId/chart — Price history for charts
// ---------------------------------------------------------------------------
router.get('/:betId/chart', async (req, res, next) => {
  try {
    const { betId } = req.params;
    const { limit = '200' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10), 1000);

    const historyResult = await query(
      `SELECT prices, total_volume, created_at 
       FROM price_history 
       WHERE bet_id = $1 
       ORDER BY created_at ASC 
       LIMIT $2`,
      [betId, limitNum],
    );

    res.json({
      success: true,
      data: historyResult.rows.map((r: any) => ({
        prices: r.prices,
        volume: parseFloat(r.total_volume),
        timestamp: r.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/trading/portfolio — User's all positions with P&L
// ---------------------------------------------------------------------------
router.get('/portfolio/me', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;

    const positionsResult = await query(
      `SELECT 
        us.bet_id, us.outcome_index, us.shares, us.total_cost,
        b.title, b.status, b.liquidity_b, b.outcome_shares, b.winning_outcome_id,
        o.label as outcome_label
       FROM user_shares us
       JOIN bets b ON us.bet_id = b.id
       JOIN outcomes o ON o.bet_id = b.id AND o.sort_order = us.outcome_index
       WHERE us.user_id = $1 AND us.shares > 0.000001
       ORDER BY us.updated_at DESC`,
      [user.id],
    );

    const positions = positionsResult.rows.map((p: any) => {
      const q: number[] = p.outcome_shares || [];
      const b = parseFloat(p.liquidity_b);
      const sharesHeld = parseFloat(p.shares);
      const totalCost = parseFloat(p.total_cost);
      const avgCost = sharesHeld > 0 ? totalCost / sharesHeld : 0;

      let currentPrice = 0;
      let currentValue = 0;
      let unrealizedPnl = 0;

      if (q.length > 0 && p.status === 'OPEN') {
        const priceVec = lmsr.prices(q, b);
        currentPrice = priceVec[p.outcome_index];
        currentValue = sharesHeld * currentPrice;
        unrealizedPnl = currentValue - totalCost;
      } else if (p.status === 'RESOLVED') {
        // Check if this outcome won
        // We need to find the winning outcome's sort_order
        // For now, check if winning_outcome_id matches
        currentPrice = 0; // will be set below
        currentValue = 0;
        unrealizedPnl = -totalCost; // default: lost
      }

      return {
        betId: p.bet_id,
        betTitle: p.title,
        betStatus: p.status,
        outcomeIndex: p.outcome_index,
        outcomeLabel: p.outcome_label,
        shares: sharesHeld,
        totalCost,
        avgCost: parseFloat(avgCost.toFixed(6)),
        currentPrice: parseFloat(currentPrice.toFixed(6)),
        currentValue: parseFloat(currentValue.toFixed(6)),
        unrealizedPnl: parseFloat(unrealizedPnl.toFixed(6)),
        pnlPercent: totalCost > 0 ? parseFloat(((unrealizedPnl / totalCost) * 100).toFixed(2)) : 0,
      };
    });

    // Summary stats
    const totalInvested = positions.reduce((s, p) => s + p.totalCost, 0);
    const totalCurrentValue = positions.reduce((s, p) => s + p.currentValue, 0);
    const totalPnl = positions.reduce((s, p) => s + p.unrealizedPnl, 0);

    res.json({
      success: true,
      data: {
        positions,
        summary: {
          totalPositions: positions.length,
          totalInvested: parseFloat(totalInvested.toFixed(2)),
          totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
          totalUnrealizedPnl: parseFloat(totalPnl.toFixed(2)),
          totalPnlPercent: totalInvested > 0
            ? parseFloat(((totalPnl / totalInvested) * 100).toFixed(2))
            : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/trading/history/me — User's trade history
// ---------------------------------------------------------------------------
router.get('/history/me', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    const { limit = '50', cursor } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10), 200);

    let whereClause = 't.user_id = $1';
    const params: any[] = [user.id];
    let paramIdx = 2;

    if (cursor) {
      whereClause += ` AND t.created_at < (SELECT created_at FROM trades WHERE id = $${paramIdx})`;
      params.push(cursor);
      paramIdx++;
    }

    const tradesResult = await query(
      `SELECT 
        t.id, t.bet_id, t.outcome_index, t.side, t.shares, t.cost, t.price_at_trade, t.avg_price, t.created_at,
        b.title as bet_title,
        o.label as outcome_label
       FROM trades t
       JOIN bets b ON t.bet_id = b.id
       JOIN outcomes o ON o.bet_id = b.id AND o.sort_order = t.outcome_index
       WHERE ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${paramIdx}`,
      [...params, limitNum],
    );

    res.json({
      success: true,
      data: tradesResult.rows.map((t: any) => ({
        id: t.id,
        betId: t.bet_id,
        betTitle: t.bet_title,
        outcomeIndex: t.outcome_index,
        outcomeLabel: t.outcome_label,
        side: t.side,
        shares: parseFloat(t.shares),
        cost: parseFloat(t.cost),
        priceAtTrade: parseFloat(t.price_at_trade),
        avgPrice: parseFloat(t.avg_price),
        createdAt: t.created_at,
      })),
      pagination: {
        cursor: tradesResult.rows.length > 0
          ? tradesResult.rows[tradesResult.rows.length - 1].id
          : null,
        hasMore: tradesResult.rows.length === limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
