/**
 * Black-Scholes Options Pricing Engine
 * Supports European call/put pricing, full Greeks, IV solver via Newton-Raphson
 */

// Cumulative Normal Distribution (Abramowitz & Stegun approximation)
export function normCDF(x: number): number {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911
  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x)
  const t = 1.0 / (1.0 + p * absX)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX)
  return 0.5 * (1.0 + sign * y)
}

export function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

export interface BSInputs {
  S: number   // Spot price
  K: number   // Strike price
  T: number   // Time to expiry (years)
  r: number   // Risk-free rate (decimal)
  sigma: number // Volatility (decimal)
  q?: number  // Dividend yield (decimal), default 0
}

export interface BSResult {
  call: number
  put: number
  d1: number
  d2: number
  greeks: {
    delta_call: number
    delta_put: number
    gamma: number
    theta_call: number  // per day
    theta_put: number
    vega: number        // per 1% move in vol
    rho_call: number    // per 1% move in rate
    rho_put: number
  }
}

export function blackScholes(inputs: BSInputs): BSResult {
  const { S, K, T, r, sigma } = inputs
  const q = inputs.q ?? 0

  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    const intrinsicCall = Math.max(S - K, 0)
    const intrinsicPut  = Math.max(K - S, 0)
    return {
      call: intrinsicCall, put: intrinsicPut, d1: 0, d2: 0,
      greeks: { delta_call: intrinsicCall > 0 ? 1 : 0, delta_put: intrinsicPut > 0 ? -1 : 0,
                gamma: 0, theta_call: 0, theta_put: 0, vega: 0, rho_call: 0, rho_put: 0 }
    }
  }

  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT

  const Nd1  = normCDF(d1)
  const Nd2  = normCDF(d2)
  const Nnd1 = normCDF(-d1)
  const Nnd2 = normCDF(-d2)
  const nd1  = normPDF(d1)

  const eqT = Math.exp(-q * T)
  const erT = Math.exp(-r * T)

  const call = S * eqT * Nd1 - K * erT * Nd2
  const put  = K * erT * Nnd2 - S * eqT * Nnd1

  const gamma      = (eqT * nd1) / (S * sigma * sqrtT)
  const vega       = S * eqT * nd1 * sqrtT / 100        // per 1% vol move
  const theta_call = (-(S * eqT * nd1 * sigma) / (2 * sqrtT)
                      - r * K * erT * Nd2
                      + q * S * eqT * Nd1) / 365
  const theta_put  = (-(S * eqT * nd1 * sigma) / (2 * sqrtT)
                      + r * K * erT * Nnd2
                      - q * S * eqT * Nnd1) / 365
  const rho_call   = K * T * erT * Nd2  / 100
  const rho_put    = -K * T * erT * Nnd2 / 100

  return {
    call, put, d1, d2,
    greeks: {
      delta_call: eqT * Nd1,
      delta_put:  -eqT * Nnd1,
      gamma, theta_call, theta_put, vega, rho_call, rho_put
    }
  }
}

// Implied Volatility solver via Newton-Raphson
export function impliedVolatility(
  marketPrice: number,
  inputs: Omit<BSInputs, 'sigma'>,
  optionType: 'call' | 'put',
  maxIter = 100,
  tol = 1e-6
): number | null {
  let sigma = 0.2  // initial guess
  for (let i = 0; i < maxIter; i++) {
    const res = blackScholes({ ...inputs, sigma })
    const price = optionType === 'call' ? res.call : res.put
    const vega  = res.greeks.vega * 100  // back to raw (not per 1%)
    const diff  = price - marketPrice
    if (Math.abs(diff) < tol) return sigma
    if (Math.abs(vega) < 1e-10) return null
    sigma -= diff / vega
    if (sigma <= 0) sigma = 0.001
    if (sigma > 10) return null
  }
  return null
}
