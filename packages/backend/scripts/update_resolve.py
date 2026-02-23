import sys

with open("src/routes/admin.ts", "r") as f:
    content = f.read()

old_block = """    await transaction(async (client) => {
      // Update bet status
      await client.query(
        `UPDATE bets SET status = 'RESOLVED', winning_outcome_id = $1, resolved_at = NOW() WHERE id = $2`,
        [winningOutcomeId, id]
      );

      // Process each wager
      for (const wager of wagersResult.rows) {
        if (wager.outcome_id === winningOutcomeId) {
          // Winner
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
            [uuidv4(), wager.user_id, `Your bet on "${bet.title}" won! You received ${payout} coins.`]
          );
        } else {
          // Loser
          await client.query(
            `UPDATE wagers SET status = 'LOST', payout = 0 WHERE id = $1`,
            [wager.id]
          );

          await client.query(
            `INSERT INTO notifications (id, user_id, type, title, message)
             VALUES ($1, $2, 'BET_RESOLVED', 'Bet resolved', $3)`,
            [uuidv4(), wager.user_id, `Your bet on "${bet.title}" did not win.`]
          );
        }
      }
    });"""

new_block = """    // Find winning outcome's sort_order (index) for LMSR settlement
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
            [uuidv4(), wager.user_id, `Your bet on "${ bet.title}" won! You received ${ payout} coins.`]
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
          // Winner: each share pays 1 coin
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
            [uuidv4(), pos.user_id, `Your ${ shares.toFixed(1)} shares on "${ bet.title}" won! Payout: ${ payout.toFixed(2)} coins.`]
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
    });"""

if old_block in content:
    content = content.replace(old_block, new_block, 1)
    with open("src/routes/admin.ts", "w") as f:
        f.write(content)
    print("SUCCESS: Resolution logic updated")
else:
    print("ERROR: Could not find the old block")
    # Debug
    lines = old_block.strip().split('\n')
    for i, line in enumerate(lines[:10]):
        if line and line not in content:
            print(f"  Line {i} not found: {repr(line)}")
