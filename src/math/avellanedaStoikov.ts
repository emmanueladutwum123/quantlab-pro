/**
 * Avellaneda-Stoikov HFT Market Making Model
 * Computes optimal bid/ask quotes given inventory risk aversion and market parameters
 */

export interface ASInputs {
  S: number       // Mid price
  q: number       // Current inventory (signed, e.g. +3 = long 3 units)
  T: number       // Time horizon (seconds or minutes, normalized to [0,1])
  t: number       // Current time in [0, T]
  sigma: number   // Asset volatility (per unit time)
  gamma: number   // Risk aversion parameter (0.01 = low, 0.1 = moderate, 1 = high)
  k: number       // Order arrival rate intensity (market depth)
  A: number       // Order arrival rate constant
}

export interface ASResult {
  reservation_price: number   // r = S - q * gamma * sigma^2 * (T - t)
  optimal_spread: number      // delta = gamma * sigma^2 * (T-t) + (2/gamma) * ln(1 + gamma/k)
  bid: number                 // r - delta/2
  ask: number                 // r + delta/2
  bid_depth: number           // units on bid
  ask_depth: number           // units on ask
  pnl_expectation: number     // Expected P&L given current inventory
  inventory_risk: number      // sigma^2 * q^2 * gamma * (T-t)
  order_rate_bid: number      // lambda_b
  order_rate_ask: number      // lambda_a
}

export function avellanedaStoikov(inputs: ASInputs): ASResult {
  const { S, q, T, t, sigma, gamma, k, A } = inputs
  const tau = Math.max(T - t, 0.001)

  // Reservation price (inventory-adjusted mid)
  const reservation_price = S - q * gamma * sigma * sigma * tau

  // Optimal full spread
  const optimal_spread = gamma * sigma * sigma * tau + (2 / gamma) * Math.log(1 + gamma / k)

  const bid = reservation_price - optimal_spread / 2
  const ask = reservation_price + optimal_spread / 2

  // Arrival rates given spread distances from mid
  const delta_bid = S - bid
  const delta_ask = ask - S
  const order_rate_bid = A * Math.exp(-k * delta_bid)
  const order_rate_ask = A * Math.exp(-k * delta_ask)

  // Inventory risk (variance of P&L from holding q units)
  const inventory_risk = sigma * sigma * q * q * gamma * tau

  // Expected P&L (from market making spread capture, less inventory risk)
  const pnl_expectation = (order_rate_bid + order_rate_ask) * optimal_spread * tau * 0.5 - inventory_risk

  return {
    reservation_price,
    optimal_spread,
    bid: Math.max(bid, 0.01),
    ask,
    bid_depth: Math.max(1, Math.round(order_rate_bid * tau * 10)),
    ask_depth: Math.max(1, Math.round(order_rate_ask * tau * 10)),
    pnl_expectation,
    inventory_risk,
    order_rate_bid,
    order_rate_ask,
  }
}

// Monte Carlo P&L simulation for market making
export interface MCResult {
  paths: number[][]       // [path_index][time_step] = cumulative PnL
  mean_pnl: number
  std_pnl: number
  sharpe: number
  max_drawdown: number
  win_rate: number
}

export function simulateMMPnL(inputs: ASInputs, nPaths = 200, nSteps = 100): MCResult {
  const paths: number[][] = []
  const finalPnls: number[] = []

  for (let p = 0; p < nPaths; p++) {
    let pnl = 0
    let inventory = inputs.q
    const path: number[] = [0]
    const dt = inputs.T / nSteps

    for (let s = 0; s < nSteps; s++) {
      const t = s * dt
      const result = avellanedaStoikov({ ...inputs, t })

      // Simulate bid/ask fills (Poisson arrivals)
      const bidFill = Math.random() < result.order_rate_bid * dt ? 1 : 0
      const askFill = Math.random() < result.order_rate_ask * dt ? 1 : 0

      // Price diffusion
      const dS = inputs.sigma * Math.sqrt(dt) * (Math.random() > 0.5 ? 1 : -1)
      inputs = { ...inputs, S: inputs.S + dS }

      if (bidFill) { inventory += 1; pnl -= result.bid }
      if (askFill) { inventory -= 1; pnl += result.ask }

      // Mark to market
      const mtm = pnl + inventory * inputs.S
      path.push(mtm)
    }

    paths.push(path)
    finalPnls.push(path[path.length - 1])
  }

  const mean_pnl = finalPnls.reduce((a, b) => a + b, 0) / nPaths
  const variance = finalPnls.reduce((a, b) => a + (b - mean_pnl) ** 2, 0) / nPaths
  const std_pnl  = Math.sqrt(variance)
  const sharpe   = std_pnl > 0 ? mean_pnl / std_pnl : 0
  const win_rate = finalPnls.filter(p => p > 0).length / nPaths

  let maxDD = 0
  for (const path of paths) {
    let peak = path[0]
    for (const v of path) {
      if (v > peak) peak = v
      const dd = (peak - v) / (Math.abs(peak) + 1e-9)
      if (dd > maxDD) maxDD = dd
    }
  }

  return { paths: paths.slice(0, 30), mean_pnl, std_pnl, sharpe, max_drawdown: maxDD, win_rate }
}
