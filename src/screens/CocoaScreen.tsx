import React, { useState, useMemo } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { cocoaFuturesFairValue, optimalHedgeRatio } from '../math/quantTools'
import { blackScholes } from '../math/blackScholes'
import { Card, MetricRow, Badge } from '../components/Card'
import { SliderRow } from '../components/SliderInput'
import { colors, spacing, radius } from '../theme'

type Tool = 'futures' | 'options' | 'hedge'

const COCOA = '#FF9800'

// Approximate historical cocoa return data (monthly % changes, 2022-2024)
const COCOA_SPOT_RETURNS = [
  0.02, -0.01, 0.04, 0.08, 0.12, -0.03, 0.06, 0.15, 0.09, -0.02,
  0.18, 0.25, -0.08, 0.31, 0.22, -0.05, 0.14, 0.07, -0.03, 0.19
]
// Deterministic futures returns (correlated to spot, no Math.random())
const COCOA_FUT_RETURNS = COCOA_SPOT_RETURNS.map((r, i) =>
  r * 0.97 + Math.sin(i * 7.3 + 1.5) * 0.005
)

export default function CocoaScreen() {
  const [tool, setTool] = useState<Tool>('futures')

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Ghana Cocoa Research</Text>
        <Text style={styles.subtitle}>Futures Pricing · Options · Hedge Ratio · Basis Risk</Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>🌿 Ghana Cocoa Board · Derivative Research Lab</Text>
      </View>

      <View style={styles.toolGrid}>
        {([
          { key: 'futures', label: '📈 Futures Pricing' },
          { key: 'options', label: '📐 Options on Cocoa' },
          { key: 'hedge',   label: '🛡️ Optimal Hedge' },
        ] as const).map(({ key, label }) => (
          <TouchableOpacity key={key}
            style={[styles.toolBtn, tool === key && styles.toolBtnActive]}
            onPress={() => setTool(key)}>
            <Text style={[styles.toolBtnText, tool === key && styles.toolBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tool === 'futures' && <FuturesTool />}
      {tool === 'options' && <OptionsTool />}
      {tool === 'hedge'   && <HedgeTool />}
    </ScrollView>
  )
}

// ── Futures Fair Value ────────────────────────────────────────────────────────
function FuturesTool() {
  const [spot,    setSpot]    = useState(7200)
  const [rate,    setRate]    = useState(0.052)
  const [storage, setStorage] = useState(80)
  const [cyield,  setCyield]  = useState(0.03)
  const [expiry,  setExpiry]  = useState(0.25)
  const [futures, setFutures] = useState(7400)

  const result = useMemo(() =>
    cocoaFuturesFairValue(spot, rate, storage, cyield, expiry),
    [spot, rate, storage, cyield, expiry]
  )

  const mispricing    = futures - result.fair_value
  const mispricingPct = (mispricing / result.fair_value) * 100

  return (
    <>
      <Card title="Cost-of-Carry Futures Pricing" subtitle="F = S·e^(r+u-y)T" accentColor={COCOA}>
        <SliderRow label="Spot Price (S)"         value={spot}    min={2000} max={12000} step={50}   format={v => `$${v.toFixed(0)}/tonne`}    onChange={setSpot}    color={COCOA} />
        <SliderRow label="Risk-Free Rate"          value={rate}    min={0}    max={0.15}  step={0.001} format={v => (v*100).toFixed(2) + '%'}   onChange={setRate}    color={COCOA} />
        <SliderRow label="Storage Cost"            value={storage} min={0}    max={300}   step={5}    format={v => `$${v.toFixed(0)}/tonne/yr`}  onChange={setStorage} color={COCOA} />
        <SliderRow label="Convenience Yield"       value={cyield}  min={0}    max={0.15}  step={0.005} format={v => (v*100).toFixed(2) + '%'}   onChange={setCyield}  color={COCOA} />
        <SliderRow label="Time to Expiry"          value={expiry}  min={0.08} max={2}     step={0.08}  format={v => `${(v*12).toFixed(1)} months`} onChange={setExpiry} color={COCOA} />
        <SliderRow label="Observed Futures Price"  value={futures} min={2000} max={12000} step={50}   format={v => `$${v.toFixed(0)}`}          onChange={setFutures} color={COCOA} />
      </Card>

      <Card title="Fair Value Analysis" accentColor={COCOA}>
        <MetricRow label="Spot Price"          value={`$${spot.toLocaleString()}/t`} mono />
        <MetricRow label="Carry Cost (r + u)"  value={`$${result.carry_cost.toFixed(2)}`} mono />
        <MetricRow label="Convenience Yield"   value={`-$${result.net_convenience.toFixed(2)}`} valueColor={colors.green} mono />
        <MetricRow label="Fair Value (F*)"     value={`$${result.fair_value.toFixed(2)}/t`} valueColor={COCOA} mono />
        <MetricRow label="Basis (F - S)"       value={`$${result.basis.toFixed(2)}`} valueColor={result.basis > 0 ? colors.green : colors.red} mono />
        <MetricRow label="Observed Market"     value={`$${futures.toLocaleString()}/t`} mono />
        <MetricRow label="Mispricing vs Fair"
          value={`${mispricing > 0 ? '+' : ''}$${mispricing.toFixed(2)} (${mispricingPct.toFixed(2)}%)`}
          valueColor={Math.abs(mispricingPct) > 2 ? colors.yellow : colors.green} mono />
      </Card>

      <Card title="Interpretation" accentColor={colors.accent}>
        <Text style={styles.interp}>
          {Math.abs(mispricingPct) < 0.5
            ? '✅ Futures price is fairly valued. No significant arbitrage opportunity.'
            : mispricing > 0
              ? `📈 Futures OVERPRICED by $${mispricing.toFixed(2)} (${mispricingPct.toFixed(2)}%). Strategy: sell futures, buy spot (cash-and-carry arbitrage).`
              : `📉 Futures UNDERPRICED by $${Math.abs(mispricing).toFixed(2)} (${Math.abs(mispricingPct).toFixed(2)}%). Strategy: buy futures, sell spot (reverse cash-and-carry).`}
        </Text>
      </Card>
    </>
  )
}

// ── Cocoa Options ─────────────────────────────────────────────────────────────
function OptionsTool() {
  const [S,     setS]     = useState(7200)
  const [K,     setK]     = useState(7200)
  const [T,     setT]     = useState(0.25)
  const [r,     setR]     = useState(0.052)
  const [sigma, setSigma] = useState(0.35)

  const result  = useMemo(() => blackScholes({ S, K, T, r, sigma }), [S, K, T, r, sigma])
  const lotSize = 10
  const callVal = result.call * lotSize
  const putVal  = result.put  * lotSize

  return (
    <>
      <Card title="Black-Scholes on Cocoa Futures" subtitle="European options · 1 contract = 10 tonnes" accentColor={COCOA}>
        <SliderRow label="Futures Price (S)"  value={S}     min={2000} max={12000} step={50}  format={v => `$${v.toFixed(0)}`}        onChange={setS}     color={COCOA} />
        <SliderRow label="Strike Price (K)"   value={K}     min={2000} max={12000} step={50}  format={v => `$${v.toFixed(0)}`}        onChange={setK}     color={COCOA} />
        <SliderRow label="Time to Expiry"     value={T}     min={0.08} max={2}     step={0.08} format={v => `${(v*12).toFixed(1)} months`} onChange={setT} color={COCOA} />
        <SliderRow label="Risk-Free Rate"     value={r}     min={0}    max={0.15}  step={0.001} format={v => (v*100).toFixed(2) + '%'} onChange={setR}    color={COCOA} />
        <SliderRow label="Implied Volatility" value={sigma} min={0.05} max={1.2}   step={0.01} format={v => (v*100).toFixed(0) + '%'}  onChange={setSigma} color={COCOA} />
      </Card>

      <Card title="Option Prices" accentColor={COCOA}>
        <View style={styles.priceRow}>
          <View style={[styles.priceBox, { borderColor: colors.green + '55' }]}>
            <Text style={styles.priceLabel}>CALL / TONNE</Text>
            <Text style={[styles.priceVal, { color: colors.green }]}>${result.call.toFixed(2)}</Text>
            <Text style={styles.priceSub}>Per contract (10t): ${callVal.toFixed(2)}</Text>
          </View>
          <View style={[styles.priceBox, { borderColor: colors.red + '55' }]}>
            <Text style={styles.priceLabel}>PUT / TONNE</Text>
            <Text style={[styles.priceVal, { color: colors.red }]}>${result.put.toFixed(2)}</Text>
            <Text style={styles.priceSub}>Per contract (10t): ${putVal.toFixed(2)}</Text>
          </View>
        </View>
        <View style={{ marginTop: spacing.sm }}>
          <MetricRow label="Delta (Call)"      value={result.greeks.delta_call.toFixed(4)} mono />
          <MetricRow label="Gamma"             value={result.greeks.gamma.toFixed(6)} mono />
          <MetricRow label="Vega ($/1%σ)"      value={`$${result.greeks.vega.toFixed(4)}`} mono />
          <MetricRow label="Theta (Call/day)"  value={`$${result.greeks.theta_call.toFixed(4)}`} valueColor={colors.red} mono />
        </View>
      </Card>
    </>
  )
}

// ── Hedge Ratio Tool ──────────────────────────────────────────────────────────
function HedgeTool() {
  const [exposure,   setExposure]   = useState(1000)
  const [spotPrice,  setSpotPrice]  = useState(7200)
  const [futPrice,   setFutPrice]   = useState(7350)

  const hedge          = useMemo(() => optimalHedgeRatio(COCOA_SPOT_RETURNS, COCOA_FUT_RETURNS), [])
  const exposureValue  = exposure * spotPrice
  const contractsNeeded = Math.round(hedge.hedge_ratio * exposure / 10)
  const hedgeValue     = contractsNeeded * futPrice * 10
  const residualRisk   = exposureValue * (1 - hedge.r_squared / 100)

  return (
    <>
      <Card title="Optimal Hedge Ratio" subtitle="OLS regression on historical returns" accentColor={COCOA}>
        <SliderRow label="Physical Cocoa Exposure" value={exposure}  min={100}  max={10000} step={100} format={v => `${v.toFixed(0)} tonnes`} onChange={setExposure}  color={COCOA} />
        <SliderRow label="Spot Price"              value={spotPrice} min={2000} max={12000} step={50}  format={v => `$${v.toFixed(0)}/t`}    onChange={setSpotPrice} color={COCOA} />
        <SliderRow label="Futures Price"           value={futPrice}  min={2000} max={12000} step={50}  format={v => `$${v.toFixed(0)}/t`}    onChange={setFutPrice}  color={COCOA} />
      </Card>

      <Card title="Hedge Analysis" accentColor={COCOA}>
        <MetricRow label="Optimal Hedge Ratio (h*)"  value={hedge.hedge_ratio.toFixed(4)} valueColor={COCOA} mono />
        <MetricRow label="R² (hedge effectiveness)"  value={`${hedge.effectiveness.toFixed(1)}%`} valueColor={hedge.effectiveness > 80 ? colors.green : colors.yellow} mono />
        <MetricRow label="Physical Exposure Value"   value={`$${(exposureValue/1000).toFixed(1)}k`} mono />
        <MetricRow label="Contracts to Sell (Short)" value={`${contractsNeeded} contracts`} valueColor={colors.red} mono />
        <MetricRow label="Hedge Notional Value"      value={`$${(hedgeValue/1000).toFixed(1)}k`} mono />
        <MetricRow label="Residual (Basis) Risk"     value={`$${(residualRisk/1000).toFixed(1)}k`} valueColor={residualRisk > exposureValue * 0.2 ? colors.red : colors.yellow} mono />
      </Card>

      <Card title="Hedging Strategy" accentColor={colors.accent}>
        <Text style={styles.interp}>
          {`To hedge ${exposure.toLocaleString()} tonnes of physical cocoa (value: $${(exposureValue/1000).toFixed(1)}k), sell ${contractsNeeded} ICE cocoa futures contracts.\n\nThe hedge eliminates ${hedge.effectiveness.toFixed(1)}% of price risk (R² = ${(hedge.r_squared/100).toFixed(4)}). The remaining ${(100 - hedge.effectiveness).toFixed(1)}% is basis risk — the difference between spot and futures prices at expiry.`}
        </Text>
      </Card>
    </>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  header:  { marginBottom: spacing.sm },
  title:   { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle:{ color: colors.textMuted, fontSize: 12, marginTop: 3 },
  badge:   { backgroundColor: COCOA + '22', borderWidth: 1, borderColor: COCOA + '55', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 6, marginBottom: spacing.md },
  badgeText: { color: COCOA, fontSize: 12, fontWeight: '600' },
  toolGrid:  { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  toolBtn:   { flex: 1, paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  toolBtnActive:     { backgroundColor: COCOA + '22', borderColor: COCOA },
  toolBtnText:       { color: colors.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  toolBtnTextActive: { color: COCOA },
  priceRow:  { flexDirection: 'row', gap: spacing.sm },
  priceBox:  { flex: 1, borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' },
  priceLabel:{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  priceVal:  { fontSize: 20, fontWeight: '800', fontFamily: 'monospace', marginVertical: 4 },
  priceSub:  { color: colors.textMuted, fontSize: 10 },
  interp:    { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
})
