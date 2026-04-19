/**
 * Quantitative Analytics Toolkit
 * Hurst Exponent, GARCH(1,1), Ornstein-Uhlenbeck, Sharpe/Sortino/Calmar, VaR
 */

// ── Hurst Exponent (R/S Analysis) ────────────────────────────────────────────
export function hurstExponent(prices: number[]): {
  hurst: number
  regime: 'trending' | 'random_walk' | 'mean_reverting'
  interpretation: string
} {
  const n = prices.length
  if (n < 20) return { hurst: 0.5, regime: 'random_walk', interpretation: 'Insufficient data' }

  const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]))
  const lags = [8, 16, 32, Math.min(64, Math.floor(n / 2))]
  const logRS: number[] = []
  const logN: number[] = []

  for (const lag of lags) {
    const chunks = Math.floor(returns.length / lag)
    if (chunks < 2) continue
    const rs_values: number[] = []

    for (let c = 0; c < chunks; c++) {
      const chunk = returns.slice(c * lag, (c + 1) * lag)
      const mean  = chunk.reduce((a, b) => a + b, 0) / chunk.length
      const deviations = chunk.map(r => r - mean)
      const cumDev: number[] = []
      let cum = 0
      for (const d of deviations) { cum += d; cumDev.push(cum) }
      const R = Math.max(...cumDev) - Math.min(...cumDev)
      const S = Math.sqrt(chunk.reduce((a, b) => a + b * b, 0) / chunk.length - mean * mean)
      if (S > 0) rs_values.push(R / S)
    }

    if (rs_values.length > 0) {
      const avg_rs = rs_values.reduce((a, b) => a + b, 0) / rs_values.length
      logRS.push(Math.log(avg_rs))
      logN.push(Math.log(lag))
    }
  }

  if (logRS.length < 2) return { hurst: 0.5, regime: 'random_walk', interpretation: 'Insufficient data' }

  // OLS regression log(RS) ~ log(N)
  const meanX = logN.reduce((a, b) => a + b, 0) / logN.length
  const meanY = logRS.reduce((a, b) => a + b, 0) / logRS.length
  const num   = logN.reduce((s, x, i) => s + (x - meanX) * (logRS[i] - meanY), 0)
  const den   = logN.reduce((s, x) => s + (x - meanX) ** 2, 0)
  const hurst = den > 0 ? num / den : 0.5

  let regime: 'trending' | 'random_walk' | 'mean_reverting'
  let interpretation: string
  if (hurst > 0.6)      { regime = 'trending';       interpretation = 'Persistent trend — momentum strategies favoured' }
  else if (hurst < 0.4) { regime = 'mean_reverting'; interpretation = 'Anti-persistent — mean-reversion strategies favoured' }
  else                  { regime = 'random_walk';    interpretation = 'Random walk — no persistent pattern detected' }

  return { hurst: Math.min(Math.max(hurst, 0), 1), regime, interpretation }
}

// ── GARCH(1,1) Volatility Estimator ──────────────────────────────────────────
export function garch11(returns: number[], omega = 1e-6, alpha = 0.1, beta = 0.85): {
  conditional_vol: number[]
  current_vol: number
  long_run_vol: number
  persistence: number
} {
  const n = returns.length
  if (n < 5) return { conditional_vol: [], current_vol: 0, long_run_vol: 0, persistence: 0 }

  const sigma2: number[] = new Array(n)
  const sampleVar = returns.reduce((a, r) => a + r * r, 0) / n
  sigma2[0] = sampleVar

  for (let t = 1; t < n; t++) {
    sigma2[t] = omega + alpha * returns[t - 1] ** 2 + beta * sigma2[t - 1]
  }

  const persistence = alpha + beta
  const long_run_vol = Math.sqrt(omega / Math.max(1 - persistence, 1e-9)) * Math.sqrt(252)
  const conditional_vol = sigma2.map(v => Math.sqrt(v) * Math.sqrt(252))

  return {
    conditional_vol,
    current_vol: conditional_vol[n - 1],
    long_run_vol,
    persistence,
  }
}

// ── Ornstein-Uhlenbeck Parameter Estimation ───────────────────────────────────
export function ouParameters(prices: number[]): {
  theta: number    // mean-reversion speed
  mu: number       // long-run mean
  sigma: number    // diffusion coefficient
  half_life: number  // days
  z_score: number  // current z-score
} {
  const n = prices.length
  if (n < 10) return { theta: 0, mu: 0, sigma: 0, half_life: 0, z_score: 0 }

  // OLS: X_t = a + b * X_{t-1} + eps
  const x  = prices.slice(0, n - 1)
  const y  = prices.slice(1)
  const mx = x.reduce((a, b) => a + b, 0) / x.length
  const my = y.reduce((a, b) => a + b, 0) / y.length
  const ss = x.reduce((a, xi) => a + (xi - mx) ** 2, 0)
  const sc = x.reduce((a, xi, i) => a + (xi - mx) * (y[i] - my), 0)
  const b  = sc / ss
  const a  = my - b * mx

  const theta     = -Math.log(b)           // annualised (assumes daily data)
  const mu        = a / (1 - b)
  const residuals = y.map((yi, i) => yi - (a + b * x[i]))
  const sigmaEps  = Math.sqrt(residuals.reduce((s, e) => s + e * e, 0) / (n - 2))
  const sigma_ou  = sigmaEps * Math.sqrt(2 * theta / (1 - b * b))
  const half_life = Math.log(2) / theta
  const lastPrice = prices[n - 1]
  const std_ou    = sigma_ou / Math.sqrt(2 * theta)
  const z_score   = (lastPrice - mu) / (std_ou || 1)

  return { theta, mu, sigma: sigma_ou, half_life, z_score }
}

// ── Performance Ratios ────────────────────────────────────────────────────────
export function performanceRatios(returns: number[], riskFreeRate = 0.05): {
  sharpe: number
  sortino: number
  calmar: number
  max_drawdown: number
  annualised_return: number
  annualised_vol: number
  var_95: number
  cvar_95: number
} {
  if (returns.length < 2) {
    return { sharpe: 0, sortino: 0, calmar: 0, max_drawdown: 0,
             annualised_return: 0, annualised_vol: 0, var_95: 0, cvar_95: 0 }
  }

  const n    = returns.length
  const mean = returns.reduce((a, b) => a + b, 0) / n
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (n - 1)
  const vol  = Math.sqrt(variance)

  const ann_return = mean * 252
  const ann_vol    = vol * Math.sqrt(252)
  const excess     = ann_return - riskFreeRate

  const sharpe = ann_vol > 0 ? excess / ann_vol : 0

  const downside = returns.filter(r => r < 0)
  const downVol  = downside.length > 0
    ? Math.sqrt(downside.reduce((a, r) => a + r ** 2, 0) / n) * Math.sqrt(252)
    : 1e-9
  const sortino = excess / downVol

  // Max drawdown from cumulative returns
  let peak = 1, nav = 1, maxDD = 0
  for (const r of returns) {
    nav *= (1 + r)
    if (nav > peak) peak = nav
    const dd = (peak - nav) / peak
    if (dd > maxDD) maxDD = dd
  }

  const calmar = maxDD > 0 ? ann_return / maxDD : 0

  // VaR & CVaR (95%)
  const sorted = [...returns].sort((a, b) => a - b)
  const idx    = Math.floor(0.05 * n)
  const var_95 = -sorted[idx]
  const cvar_95 = -sorted.slice(0, idx + 1).reduce((a, b) => a + b, 0) / (idx + 1)

  return { sharpe, sortino, calmar, max_drawdown: maxDD, annualised_return: ann_return,
           annualised_vol: ann_vol, var_95, cvar_95 }
}

// ── Cocoa Futures Fair Value ──────────────────────────────────────────────────
export function cocoaFuturesFairValue(
  spotPrice: number,         // USD per tonne
  riskFreeRate: number,      // annual, decimal
  storageCost: number,       // USD per tonne per year
  convenienceYield: number,  // decimal, seasonal benefit of holding physical
  timeToExpiry: number       // years
): {
  fair_value: number
  basis: number
  carry_cost: number
  net_convenience: number
} {
  const carry_cost       = spotPrice * riskFreeRate * timeToExpiry
  const storage_total    = storageCost * timeToExpiry
  const convenience      = spotPrice * convenienceYield * timeToExpiry
  const fair_value       = (spotPrice + carry_cost + storage_total - convenience)
  const basis            = fair_value - spotPrice
  return { fair_value, basis, carry_cost: carry_cost + storage_total, net_convenience: convenience }
}

// Optimal hedge ratio (OLS)
export function optimalHedgeRatio(spotReturns: number[], futuresReturns: number[]): {
  hedge_ratio: number
  r_squared: number
  effectiveness: number  // %
} {
  const n  = Math.min(spotReturns.length, futuresReturns.length)
  const sx = spotReturns.slice(0, n)
  const fy = futuresReturns.slice(0, n)
  const mx = sx.reduce((a, b) => a + b, 0) / n
  const my = fy.reduce((a, b) => a + b, 0) / n
  const cov = sx.reduce((a, xi, i) => a + (xi - mx) * (fy[i] - my), 0) / n
  const varF = fy.reduce((a, yi) => a + (yi - my) ** 2, 0) / n
  const varS = sx.reduce((a, xi) => a + (xi - mx) ** 2, 0) / n
  const hedge_ratio = varF > 0 ? cov / varF : 1
  const corr = varS > 0 && varF > 0 ? cov / Math.sqrt(varS * varF) : 0
  const r_squared = corr * corr
  return { hedge_ratio, r_squared, effectiveness: r_squared * 100 }
}
