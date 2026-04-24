import React, { useState, useMemo } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { hurstExponent, garch11, ouParameters, performanceRatios } from '../math/quantTools'
import { Card, MetricRow, Badge } from '../components/Card'
import { SliderRow } from '../components/SliderInput'
import { colors, spacing, radius } from '../theme'

type Tool = 'hurst' | 'garch' | 'ou' | 'performance'

const TEAL = '#00BCD4'

function generatePrices(n: number, trend = 0.0002, vol = 0.01, seed = 42): number[] {
  const prices = [100]
  let rng = seed
  for (let i = 1; i < n; i++) {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff
    const r = ((rng / 0xffffffff) - 0.5) * 2
    prices.push(prices[i - 1] * (1 + trend + vol * r))
  }
  return prices
}

export default function QuantScreen() {
  const [tool, setTool] = useState<Tool>('hurst')

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Quant Toolkit</Text>
        <Text style={styles.subtitle}>Hurst · GARCH · OU Process · Sharpe · VaR</Text>
      </View>

      <View style={styles.toolGrid}>
        {([
          { key: 'hurst',       label: '📡 Hurst Exponent' },
          { key: 'garch',       label: '🔥 GARCH Volatility' },
          { key: 'ou',          label: '⚙️ OU Process' },
          { key: 'performance', label: '📊 Performance' },
        ] as const).map(({ key, label }) => (
          <TouchableOpacity key={key}
            style={[styles.toolBtn, tool === key && styles.toolBtnActive]}
            onPress={() => setTool(key)}>
            <Text style={[styles.toolBtnText, tool === key && styles.toolBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tool === 'hurst'       && <HurstTool />}
      {tool === 'garch'       && <GARCHTool />}
      {tool === 'ou'          && <OUTool />}
      {tool === 'performance' && <PerformanceTool />}
    </ScrollView>
  )
}

// ── Hurst Exponent ────────────────────────────────────────────────────────────
function HurstTool() {
  const [n,     setN]     = useState(200)
  const [trend, setTrend] = useState(0.0002)
  const [vol,   setVol]   = useState(0.01)

  const prices = useMemo(() => generatePrices(n, trend, vol), [n, trend, vol])
  const result = useMemo(() => hurstExponent(prices), [prices])

  const regimeColor = result.regime === 'trending'      ? colors.green
                    : result.regime === 'mean_reverting' ? colors.red
                    : colors.yellow

  return (
    <>
      <Card title="Hurst Exponent (R/S Analysis)" subtitle="Measures persistence / anti-persistence" accentColor={TEAL}>
        <SliderRow label="Data Points (N)"  value={n}     min={50}    max={500}   step={10}     format={v => v.toFixed(0) + ' bars'}    onChange={setN}     color={TEAL} />
        <SliderRow label="Trend Strength"   value={trend} min={-0.001} max={0.001} step={0.0001} format={v => (v*100).toFixed(3) + '%/bar'} onChange={setTrend} color={TEAL} />
        <SliderRow label="Volatility"       value={vol}   min={0.001} max={0.05}  step={0.001}  format={v => (v*100).toFixed(1) + '%'}   onChange={setVol}   color={TEAL} />
      </Card>

      <Card title="Result" accentColor={regimeColor}>
        <View style={styles.hurstGauge}>
          <View style={styles.hurstTrack}>
            <View style={[styles.hurstFill, { width: `${result.hurst * 100}%` as any, backgroundColor: regimeColor }]} />
            <View style={[styles.hurstMarker, { left: '40%' }]} />
            <View style={[styles.hurstMarker, { left: '60%' }]} />
          </View>
          <View style={styles.hurstLabels}>
            <Text style={[styles.hurstLbl, { color: colors.red }]}>0 Mean-Rev</Text>
            <Text style={[styles.hurstLbl, { color: colors.yellow }]}>0.5 Random</Text>
            <Text style={[styles.hurstLbl, { color: colors.green }]}>1.0 Trend</Text>
          </View>
        </View>
        <View style={styles.hurstResultRow}>
          <Text style={styles.hurstBig}>H = </Text>
          <Text style={[styles.hurstBig, { color: regimeColor }]}>{result.hurst.toFixed(4)}</Text>
        </View>
        <Badge label={result.regime.replace('_', ' ').toUpperCase()} color={regimeColor} bg={regimeColor + '22'} />
        <Text style={[styles.interp, { marginTop: spacing.sm }]}>{result.interpretation}</Text>
      </Card>

      <Card title="Formula" accentColor={colors.textDim}>
        <Text style={styles.formula}>{'R/S(n) ~ c · n^H\nH = log(R/S) / log(n)  via OLS\n\nH > 0.6 → Trending (persistent)\nH ≈ 0.5 → Random walk\nH < 0.4 → Mean-reverting (anti-persistent)'}</Text>
      </Card>
    </>
  )
}

// ── GARCH(1,1) ────────────────────────────────────────────────────────────────
function GARCHTool() {
  const [n,     setN]     = useState(250)
  const [alpha, setAlpha] = useState(0.10)
  const [beta,  setBeta]  = useState(0.85)
  const [vol,   setVol]   = useState(0.015)

  const prices  = useMemo(() => generatePrices(n, 0, vol), [n, vol])
  const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]))
  const result  = useMemo(() => garch11(returns, 1e-6, alpha, beta), [returns, alpha, beta])

  const sparkLen = 40
  const spark    = result.conditional_vol.slice(-sparkLen)
  const maxV     = Math.max(...spark, 0.001)

  return (
    <>
      <Card title="GARCH(1,1) Volatility" subtitle="σ²_t = ω + α·ε²_{t-1} + β·σ²_{t-1}" accentColor={TEAL}>
        <SliderRow label="Data Points (N)"  value={n}     min={50}   max={500}  step={10}   format={v => v.toFixed(0)}            onChange={setN}     color={TEAL} />
        <SliderRow label="α (ARCH term)"    value={alpha} min={0.01} max={0.3}  step={0.01} format={v => v.toFixed(2)}            onChange={setAlpha} color={TEAL} />
        <SliderRow label="β (GARCH term)"   value={beta}  min={0.5}  max={0.99} step={0.01} format={v => v.toFixed(2)}            onChange={setBeta}  color={TEAL} />
        <SliderRow label="True Volatility"  value={vol}   min={0.001} max={0.05} step={0.001} format={v => (v*100).toFixed(2) + '%'} onChange={setVol} color={TEAL} />
      </Card>

      <Card title="Model Output" accentColor={TEAL}>
        <MetricRow label="Current Conditional Vol (ann.)" value={`${result.current_vol.toFixed(2)}%`}
          valueColor={result.current_vol > 30 ? colors.red : result.current_vol > 20 ? colors.yellow : colors.green} mono />
        <MetricRow label="Long-Run Vol (ann.)"   value={`${result.long_run_vol.toFixed(2)}%`} mono />
        <MetricRow label="Persistence (α + β)"   value={result.persistence.toFixed(4)}
          valueColor={result.persistence > 0.98 ? colors.red : colors.yellow} mono />
        <MetricRow label="Variance Reversion"    value={`${((1 - result.persistence) * 100).toFixed(2)}% / period`} mono />
        <MetricRow label="Vol Regime"            value={result.current_vol > result.long_run_vol ? 'HIGH VOL' : 'LOW VOL'}
          valueColor={result.current_vol > result.long_run_vol ? colors.red : colors.green} />
      </Card>

      <Card title="Conditional Volatility (last 40 obs)" accentColor={TEAL}>
        <View style={styles.sparkContainer}>
          {spark.map((v, i) => (
            <View key={i} style={[styles.sparkBar, {
              height: Math.max(2, (v / maxV) * 60),
              backgroundColor: v > result.long_run_vol ? colors.red + 'cc' : colors.green + 'cc',
            }]} />
          ))}
        </View>
        <View style={styles.sparkLabels}>
          <Text style={styles.sparkLbl}>Low vol</Text>
          <Text style={styles.sparkLbl}>High vol</Text>
        </View>
      </Card>
    </>
  )
}

// ── Ornstein-Uhlenbeck ────────────────────────────────────────────────────────
function OUTool() {
  const [n,     setN]     = useState(200)
  const [mean,  setMean]  = useState(100)
  const [speed, setSpeed] = useState(0.05)

  const prices = useMemo(() => {
    const p = [mean]
    for (let i = 1; i < n; i++) {
      const rng   = Math.sin(i * 12.9898 + 78.233) * 43758.5453
      const noise = (rng - Math.floor(rng) - 0.5) * 2
      p.push(p[i - 1] + speed * (mean - p[i - 1]) + 1.5 * noise)
    }
    return p
  }, [n, mean, speed])

  const result = useMemo(() => ouParameters(prices), [prices])
  const zColor = Math.abs(result.z_score) > 2 ? colors.red
               : Math.abs(result.z_score) > 1 ? colors.yellow
               : colors.green

  return (
    <>
      <Card title="Ornstein-Uhlenbeck Estimator" subtitle="dX = θ(μ - X)dt + σdW" accentColor={TEAL}>
        <SliderRow label="Data Points (N)"       value={n}     min={30}  max={500} step={10}   format={v => v.toFixed(0) + ' obs'}    onChange={setN}     color={TEAL} />
        <SliderRow label="Long-Run Mean (μ)"     value={mean}  min={50}  max={200} step={1}    format={v => v.toFixed(0)}             onChange={setMean}  color={TEAL} />
        <SliderRow label="Mean-Reversion Speed"  value={speed} min={0.01} max={0.3} step={0.01} format={v => v.toFixed(2) + '/period'} onChange={setSpeed} color={TEAL} />
      </Card>

      <Card title="Estimated Parameters" accentColor={TEAL}>
        <MetricRow label="θ (reversion speed)" value={result.theta.toFixed(6)} mono />
        <MetricRow label="μ (long-run mean)"   value={result.mu.toFixed(4)} mono />
        <MetricRow label="σ (diffusion)"       value={result.sigma.toFixed(6)} mono />
        <MetricRow label="Half-Life"           value={`${result.half_life.toFixed(1)} periods`}
          valueColor={result.half_life < 20 ? colors.green : colors.yellow} mono />
        <MetricRow label="Current Z-Score"     value={result.z_score.toFixed(4)} valueColor={zColor} mono />
      </Card>

      <Card title="Trading Signal" accentColor={zColor}>
        <Text style={[styles.interp, { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 6 }]}>
          Z-Score: {result.z_score.toFixed(4)}
        </Text>
        <Text style={styles.interp}>
          {Math.abs(result.z_score) < 1
            ? '⚪ Within ±1σ — price near equilibrium. No strong signal.'
            : result.z_score > 2
              ? '🔴 Z > +2σ — price significantly ABOVE mean. Mean-reversion SHORT signal.'
              : result.z_score > 1
                ? '🟡 Z > +1σ — price above mean. Mild SHORT bias.'
                : result.z_score < -2
                  ? '🟢 Z < -2σ — price significantly BELOW mean. Mean-reversion LONG signal.'
                  : '🟡 Z < -1σ — price below mean. Mild LONG bias.'}
        </Text>
        <Text style={[styles.interp, { marginTop: 8 }]}>
          {`Half-life: ${result.half_life.toFixed(1)} periods — price expected to revert halfway to μ=${result.mu.toFixed(2)} in ${result.half_life.toFixed(1)} bars.`}
        </Text>
      </Card>
    </>
  )
}

// ── Performance Ratios ────────────────────────────────────────────────────────
function PerformanceTool() {
  const [n,   setN]   = useState(252)
  const [mu,  setMu]  = useState(0.0008)
  const [vol, setVol] = useState(0.012)
  const [rfr, setRfr] = useState(0.05)

  const returns = useMemo(() => {
    const r = []
    for (let i = 0; i < n; i++) {
      const noise = Math.sin(i * 98.233 + 42.1) * 43758.5 % 1 - 0.5
      r.push(mu + vol * noise * 2)
    }
    return r
  }, [n, mu, vol])

  const result = useMemo(() => performanceRatios(returns, rfr), [returns, rfr])
  const sharpeColor  = result.sharpe  > 2 ? colors.green : result.sharpe  > 1 ? colors.yellow : colors.red
  const sortinoColor = result.sortino > 2 ? colors.green : result.sortino > 1 ? colors.yellow : colors.red

  return (
    <>
      <Card title="Strategy Performance Ratios" subtitle="Annualised · Risk-adjusted" accentColor={TEAL}>
        <SliderRow label="Sample Size (N)"      value={n}   min={30}     max={500}  step={10}     format={v => v.toFixed(0) + ' trades'}  onChange={setN}   color={TEAL} />
        <SliderRow label="Avg Return / Trade"   value={mu}  min={-0.002} max={0.003} step={0.0001} format={v => (v*100).toFixed(4) + '%'} onChange={setMu}  color={TEAL} />
        <SliderRow label="Return Volatility"    value={vol} min={0.001}  max={0.05} step={0.001}  format={v => (v*100).toFixed(2) + '%'}  onChange={setVol} color={TEAL} />
        <SliderRow label="Risk-Free Rate"       value={rfr} min={0}      max={0.10} step={0.005}  format={v => (v*100).toFixed(1) + '%'}  onChange={setRfr} color={TEAL} />
      </Card>

      <Card title="Ratios" accentColor={TEAL}>
        <MetricRow label="Annualised Return"     value={`${(result.annualised_return*100).toFixed(2)}%`} valueColor={result.annualised_return > 0 ? colors.green : colors.red} mono />
        <MetricRow label="Annualised Volatility" value={`${(result.annualised_vol*100).toFixed(2)}%`} mono />
        <MetricRow label="Sharpe Ratio"          value={result.sharpe.toFixed(4)} valueColor={sharpeColor} mono />
        <MetricRow label="Sortino Ratio"         value={result.sortino.toFixed(4)} valueColor={sortinoColor} mono />
        <MetricRow label="Calmar Ratio"          value={result.calmar.toFixed(4)} valueColor={result.calmar > 1 ? colors.green : colors.red} mono />
        <MetricRow label="Max Drawdown"          value={`${(result.max_drawdown*100).toFixed(2)}%`} valueColor={result.max_drawdown < 0.1 ? colors.green : result.max_drawdown < 0.2 ? colors.yellow : colors.red} mono />
        <MetricRow label="VaR (95%, 1 trade)"    value={`${(result.var_95*100).toFixed(4)}%`} mono />
        <MetricRow label="CVaR / ES (95%)"       value={`${(result.cvar_95*100).toFixed(4)}%`} valueColor={colors.red} mono />
      </Card>

      <Card title="Benchmark Thresholds" accentColor={colors.textDim}>
        <Text style={styles.formula}>
          {`Sharpe  > 2.0  → Excellent\n         1-2   → Good\n         < 1   → Poor\n\nSortino > 3.0  → Excellent (less penalises upside vol)\n\nCalmar  > 1.0  → Decent (return / max DD)\n\nMax DD  < 10%  → Institutional-grade risk mgmt`}
        </Text>
      </Card>
    </>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  header:  { marginBottom: spacing.md },
  title:   { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle:{ color: colors.textMuted, fontSize: 12, marginTop: 3 },
  toolGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  toolBtn:           { width: '47%', paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  toolBtnActive:     { backgroundColor: TEAL + '22', borderColor: TEAL },
  toolBtnText:       { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  toolBtnTextActive: { color: TEAL },
  hurstGauge:     { marginBottom: spacing.sm },
  hurstTrack:     { height: 12, backgroundColor: colors.cardBorder, borderRadius: 6, overflow: 'hidden', position: 'relative' },
  hurstFill:      { height: '100%', borderRadius: 6 },
  hurstMarker:    { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.bg },
  hurstLabels:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  hurstLbl:       { fontSize: 10 },
  hurstResultRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: spacing.sm },
  hurstBig:       { fontSize: 28, fontWeight: '800', fontFamily: 'monospace', color: colors.text },
  interp:         { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  formula:        { color: colors.textMuted, fontSize: 12, fontFamily: 'monospace', lineHeight: 20 },
  sparkContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 64, gap: 2 },
  sparkBar:       { flex: 1, borderRadius: 2 },
  sparkLabels:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sparkLbl:       { color: colors.textMuted, fontSize: 10 },
})
