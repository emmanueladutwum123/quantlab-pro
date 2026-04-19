/**
 * MT5 Trading Tools — Position sizing, pip values, margin, drawdown recovery
 */

export interface Instrument {
  symbol: string
  pip_size: number        // Size of 1 pip (e.g. 0.0001 for EURUSD)
  contract_size: number   // Units per lot (e.g. 100000 for forex)
  margin_pct: number      // Margin requirement as decimal (e.g. 0.02 = 2%)
  quote_currency: string  // e.g. 'USD', 'JPY'
}

export const INSTRUMENTS: Record<string, Instrument> = {
  EURUSD: { symbol: 'EURUSD', pip_size: 0.0001, contract_size: 100000, margin_pct: 0.02, quote_currency: 'USD' },
  GBPUSD: { symbol: 'GBPUSD', pip_size: 0.0001, contract_size: 100000, margin_pct: 0.02, quote_currency: 'USD' },
  USDJPY: { symbol: 'USDJPY', pip_size: 0.01,   contract_size: 100000, margin_pct: 0.02, quote_currency: 'JPY' },
  US30:   { symbol: 'US30',   pip_size: 1.0,     contract_size: 1,      margin_pct: 0.05, quote_currency: 'USD' },
  USTEC:  { symbol: 'USTEC',  pip_size: 1.0,     contract_size: 1,      margin_pct: 0.05, quote_currency: 'USD' },
}

// Kelly Criterion position sizing
export function kellyPositionSize(
  winRate: number,       // decimal, e.g. 0.55
  avgWin: number,        // average winning trade amount
  avgLoss: number,       // average losing trade amount (positive number)
  accountBalance: number,
  fractionMultiplier: number = 0.5  // half-Kelly is standard
): { kelly_fraction: number; recommended_risk_usd: number; full_kelly_pct: number } {
  const b = avgWin / avgLoss   // odds ratio
  const p = winRate
  const q = 1 - winRate
  const full_kelly = (b * p - q) / b
  const capped = Math.max(0, Math.min(full_kelly, 0.25))  // cap at 25%
  const fraction = capped * fractionMultiplier
  return {
    kelly_fraction: fraction,
    recommended_risk_usd: accountBalance * fraction,
    full_kelly_pct: full_kelly * 100,
  }
}

// Position size from risk amount
export function positionSizeFromRisk(
  accountBalance: number,
  riskPct: number,          // e.g. 1 = 1%
  stopLossPips: number,
  instrument: Instrument,
  price: number             // current price (for JPY quote currency conversion)
): { lots: number; units: number; risk_usd: number; pip_value_per_lot: number } {
  const riskUsd = accountBalance * (riskPct / 100)

  // Pip value in USD per standard lot
  let pip_value_per_lot: number
  if (instrument.quote_currency === 'USD') {
    pip_value_per_lot = instrument.pip_size * instrument.contract_size
  } else if (instrument.quote_currency === 'JPY') {
    pip_value_per_lot = (instrument.pip_size * instrument.contract_size) / price
  } else {
    pip_value_per_lot = instrument.pip_size * instrument.contract_size
  }

  const lots = riskUsd / (stopLossPips * pip_value_per_lot)
  return {
    lots: Math.floor(lots * 100) / 100,
    units: Math.round(lots * instrument.contract_size),
    risk_usd: riskUsd,
    pip_value_per_lot,
  }
}

// Required margin
export function requiredMargin(
  lots: number,
  price: number,
  instrument: Instrument,
  leverage: number = 50
): number {
  const notional = lots * instrument.contract_size * price
  return notional / leverage
}

// Drawdown recovery calculator
export function drawdownRecovery(drawdownPct: number): {
  required_gain_pct: number
  balance_after: (balance: number) => number
  trades_to_recover: (winRate: number, avgRR: number) => number
} {
  const factor = 1 - drawdownPct / 100
  const required_gain_pct = (1 / factor - 1) * 100
  return {
    required_gain_pct,
    balance_after: (balance) => balance * factor,
    trades_to_recover: (winRate, avgRR) => {
      // Expected value per trade as fraction of remaining balance
      const ev = winRate * avgRR - (1 - winRate)
      if (ev <= 0) return Infinity
      return Math.ceil(Math.log(1 / factor) / Math.log(1 + ev * 0.01))
    }
  }
}

// Risk/Reward analyzer
export function riskRewardAnalysis(
  entry: number,
  stopLoss: number,
  takeProfit: number,
  winRate: number  // decimal
): {
  rr_ratio: number
  expected_value: number
  break_even_win_rate: number
  risk_pips: number
  reward_pips: number
  profitable: boolean
} {
  const risk_pips   = Math.abs(entry - stopLoss)
  const reward_pips = Math.abs(takeProfit - entry)
  const rr_ratio    = reward_pips / risk_pips
  const break_even  = 1 / (1 + rr_ratio)
  const ev          = winRate * reward_pips - (1 - winRate) * risk_pips
  return {
    rr_ratio,
    expected_value: ev,
    break_even_win_rate: break_even,
    risk_pips,
    reward_pips,
    profitable: ev > 0,
  }
}
