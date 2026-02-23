/**
 * LMSR (Logarithmic Market Scoring Rule) Pricing Engine
 *
 * Provides continuous automated pricing for prediction markets.
 * Each market has N outcomes with outstanding share quantities q[].
 * The liquidity parameter `b` controls price sensitivity.
 *
 * Core formulas:
 *   Cost function:    C(q) = b · ln( Σ exp(qᵢ / b) )
 *   Marginal price:   pᵢ  = exp(qᵢ / b) / Σ exp(qⱼ / b)
 *   Buy cost:         C(q_after) − C(q_before)
 *   Sell proceeds:    C(q_before) − C(q_after)
 *
 * Properties:
 *   - Prices always sum to 1 (coherent probabilities)
 *   - Larger b → deeper liquidity, less price movement per trade
 *   - Market maker worst-case loss = b · ln(N)
 */

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

/**
 * Log-sum-exp with numeric stability.
 * Computes ln( Σ exp(xᵢ) ) without overflow/underflow.
 */
function logSumExp(xs: number[]): number {
  const maxX = Math.max(...xs);
  if (!isFinite(maxX)) return -Infinity;
  const sum = xs.reduce((s, x) => s + Math.exp(x - maxX), 0);
  return maxX + Math.log(sum);
}

// ---------------------------------------------------------------------------
// Core LMSR functions
// ---------------------------------------------------------------------------

/**
 * Cost function C(q, b).
 * Total "cost" the market has absorbed for the current share state.
 */
export function cost(q: number[], b: number): number {
  const scaled = q.map((qi) => qi / b);
  return b * logSumExp(scaled);
}

/**
 * Marginal price vector (probabilities).
 * p[i] = ∂C/∂q[i] = exp(q[i]/b) / Σⱼ exp(q[j]/b)
 *
 * Returns numbers in (0, 1) that sum to 1.
 */
export function prices(q: number[], b: number): number[] {
  const maxQ = Math.max(...q);
  const exps = q.map((qi) => Math.exp((qi - maxQ) / b));
  const sum = exps.reduce((s, e) => s + e, 0);
  return exps.map((e) => e / sum);
}

/**
 * Cost to buy `delta` shares of outcome `index`.
 * Always positive for delta > 0.
 */
export function buyCost(
  q: number[],
  b: number,
  index: number,
  delta: number,
): number {
  if (delta <= 0) throw new Error('delta must be positive');
  if (index < 0 || index >= q.length) throw new Error('invalid outcome index');

  const qAfter = [...q];
  qAfter[index] += delta;
  return cost(qAfter, b) - cost(q, b);
}

/**
 * Proceeds from selling `delta` shares of outcome `index`.
 * Always positive for delta > 0 (user receives this amount).
 */
export function sellProceeds(
  q: number[],
  b: number,
  index: number,
  delta: number,
): number {
  if (delta <= 0) throw new Error('delta must be positive');
  if (index < 0 || index >= q.length) throw new Error('invalid outcome index');

  const qAfter = [...q];
  qAfter[index] -= delta;
  return cost(q, b) - cost(qAfter, b);
}

/**
 * Average price per share for a buy of `delta` shares.
 */
export function avgBuyPrice(
  q: number[],
  b: number,
  index: number,
  delta: number,
): number {
  return buyCost(q, b, index, delta) / delta;
}

/**
 * Average price per share for selling `delta` shares.
 */
export function avgSellPrice(
  q: number[],
  b: number,
  index: number,
  delta: number,
): number {
  return sellProceeds(q, b, index, delta) / delta;
}

// ---------------------------------------------------------------------------
// Quote helpers (for API responses)
// ---------------------------------------------------------------------------

export interface TradeQuote {
  /** Total cost/proceeds in collateral (coins) */
  totalCost: number;
  /** Average price per share */
  avgPrice: number;
  /** Marginal price before the trade */
  priceBefore: number;
  /** Marginal price after the trade */
  priceAfter: number;
  /** Slippage = (avgPrice − priceBefore) / priceBefore for buys */
  slippage: number;
  /** New price vector after the trade */
  newPrices: number[];
  /** Max profit if this outcome wins (for buys) */
  maxProfit: number;
  /** Max loss (= total cost for buys) */
  maxLoss: number;
}

/**
 * Generate a full buy quote including slippage and projected P&L.
 */
export function buyQuote(
  q: number[],
  b: number,
  index: number,
  shares: number,
): TradeQuote {
  const pricesBefore = prices(q, b);
  const priceBefore = pricesBefore[index];

  const totalCost = buyCost(q, b, index, shares);
  const avgPx = totalCost / shares;

  const qAfter = [...q];
  qAfter[index] += shares;
  const newPrices = prices(qAfter, b);
  const priceAfter = newPrices[index];

  const slippage = priceBefore > 0 ? (avgPx - priceBefore) / priceBefore : 0;

  return {
    totalCost: round(totalCost),
    avgPrice: round(avgPx),
    priceBefore: round(priceBefore),
    priceAfter: round(priceAfter),
    slippage: round(slippage, 4),
    newPrices: newPrices.map((p) => round(p)),
    maxProfit: round(shares * 1 - totalCost), // wins pay $1/share
    maxLoss: round(totalCost),
  };
}

/**
 * Generate a full sell quote.
 */
export function sellQuote(
  q: number[],
  b: number,
  index: number,
  shares: number,
): TradeQuote {
  const pricesBefore = prices(q, b);
  const priceBefore = pricesBefore[index];

  const totalProceeds = sellProceeds(q, b, index, shares);
  const avgPx = totalProceeds / shares;

  const qAfter = [...q];
  qAfter[index] -= shares;
  const newPrices = prices(qAfter, b);
  const priceAfter = newPrices[index];

  const slippage = priceBefore > 0 ? (priceBefore - avgPx) / priceBefore : 0;

  return {
    totalCost: round(totalProceeds), // proceeds (positive)
    avgPrice: round(avgPx),
    priceBefore: round(priceBefore),
    priceAfter: round(priceAfter),
    slippage: round(slippage, 4),
    newPrices: newPrices.map((p) => round(p)),
    maxProfit: round(totalProceeds), // selling locks in proceeds
    maxLoss: round(shares * 1 - totalProceeds), // opportunity cost if outcome wins
  };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Round to `dp` decimal places (default 6). */
function round(n: number, dp: number = 6): number {
  const factor = 10 ** dp;
  return Math.round(n * factor) / factor;
}

/**
 * Compute initial neutral q vector for N outcomes.
 * All shares start at 0 → equal prices (1/N each).
 */
export function initialShares(numOutcomes: number): number[] {
  return new Array(numOutcomes).fill(0);
}

/**
 * Market maker worst-case subsidy (bounded loss).
 * = b · ln(N)
 */
export function maxSubsidy(b: number, numOutcomes: number): number {
  return b * Math.log(numOutcomes);
}