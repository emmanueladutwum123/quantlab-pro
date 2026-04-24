import React, { useState, useMemo } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { avellanedaStoikov, simulateMMPnL } from '../math/avellanedaStoikov'
import { Card, MetricRow, Badge } from '../components/Card'
import { SliderRow } from '../components/SliderInput'
import { colors, spacing, radius } from '../theme'

const fmt = (n: number, d = 4) => isFinite(n) ? n.toFixed(d) : '—'

export default function HFTScreen() {
  const [S, setS]         = useState(100)
  const [q, setQ]         = useState(0)
  const [T, setT]         = useState(1)
  const [t, setT_]        = useState(0)
  const [sigma, setSigma] = useState(0.02)
  const [gamma, setGamma] = useState(0.1)
  const [k, setK]         = useState(1.5)
  const [A, setA]         = useState(140)
  const [tab, setTab]       = useState<'quotes' | 'monte'>('quotes')
  const [simSeed, setSimSeed] = useState(0)

  const result = useMemo(() =>
    avellanedaStoikov({ S, q, T, t, sigma, gamma, k, A }),
    [S, q, T, t, sigma, gamma, k, A]
  )

  const sim = useMemo(() => {
    if (!simSeed) return null
    return simulateMMPnL({ S, q, T, t, sigma, gamma, k, A }, 150, 80)
  }, [simSeed, S, q, T, t, sigma, gamma, k, A])

  const spreadBps = (result.optimal_spread / S * 10000).toFixed(1)

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.header}>
        <Text style={styles.title}>HFT Market Making</Text>
        <Text style={styles.subtitle}>Avellaneda-Stoikov Optimal Quote Model</Text>
      </View>

      <View style={styles.tabs}>
        {(['quotes', 'monte'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'quotes' ? 'Optimal Quotes' : 'Monte Carlo P&L'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Parameters */}
      <Card title="Market Parameters" accentColor="#9C27B0">
        <SliderRow label="Mid Price (S)" value={S} min={10} max={500} step={1}
          format={v => `$${v.toFixed(0)}`} onChange={setS} />
        <SliderRow label="Inventory (q)" value={q} min={-10} max={10} step={1}
          format={v => (v >= 0 ? '+' : '') + v.toFixed(0) + ' units'} onChange={setQ} color={q > 0 ? colors.green : q < 0 ? colors.red : colors.textMuted} />
        <SliderRow label="Time Horizon (T)" value={T} min={0.1} max={5} step={0.1}
          format={v => v.toFixed(1) + ' hrs'} onChange={setT} />
        <SliderRow label="Current Time (t)" value={t} min={0} max={T} step={0.01}
          format={v => v.toFixed(2)} onChange={setT_} />
        <SliderRow label="Volatility (σ)" value={sigma} min={0.001} max={0.1} step={0.001}
          format={v => (v * 100).toFixed(2) + '%'} onChange={setSigma} />
        <SliderRow label="Risk Aversion (γ)" value={gamma} min={0.001} max={1} step={0.001}
          format={v => v.toFixed(3)} onChange={setGamma} />
        <SliderRow label="Market Depth (k)" value={k} min={0.1} max={5} step={0.1}
          format={v => v.toFixed(1)} onChange={setK} />
        <SliderRow label="Arrival Rate (A)" value={A} min={10} max={500} step={10}
          format={v => v.toFixed(0) + '/hr'} onChange={setA} />
      </Card>

      {tab === 'quotes' && (
        <>
          {/* Optimal Quotes */}
          <Card title="Optimal Quotes" accentColor="#9C27B0">
            <View style={styles.quoteRow}>
              <View style={[styles.quoteBox, { borderColor: colors.green + '55', backgroundColor: colors.green + '11' }]}>
                <Text style={styles.quoteLabel}>BID</Text>
                <Text style={[styles.quotePrice, { color: colors.green }]}>${fmt(result.bid, 4)}</Text>
                <Text style={styles.quoteSub}>Depth: {result.bid_depth} units</Text>
                <Text style={styles.quoteSub}>Rate: {fmt(result.order_rate_bid, 2)}/hr</Text>
              </View>
              <View style={styles.quoteMid}>
                <Text style={styles.quoteMidLabel}>MID</Text>
                <Text style={styles.quoteMidPrice}>${S.toFixed(2)}</Text>
                <Text style={styles.quoteSpread}>{spreadBps} bps</Text>
              </View>
              <View style={[styles.quoteBox, { borderColor: colors.red + '55', backgroundColor: colors.red + '11' }]}>
                <Text style={styles.quoteLabel}>ASK</Text>
                <Text style={[styles.quotePrice, { color: colors.red }]}>${fmt(result.ask, 4)}</Text>
                <Text style={styles.quoteSub}>Depth: {result.ask_depth} units</Text>
                <Text style={styles.quoteSub}>Rate: {fmt(result.order_rate_ask, 2)}/hr</Text>
              </View>
            </View>
          </Card>

          {/* Analytics */}
          <Card title="Model Output" accentColor={colors.accent}>
            <MetricRow label="Reservation Price" value={`$${fmt(result.reservation_price, 4)}`} mono />
            <MetricRow label="Optimal Full Spread" value={`$${fmt(result.optimal_spread, 4)} (${spreadBps} bps)`} mono />
            <MetricRow label="Inventory Risk" value={fmt(result.inventory_risk, 4)}
              valueColor={result.inventory_risk > 0.5 ? colors.red : colors.green} mono />
            <MetricRow label="Expected P&L" value={`$${fmt(result.pnl_expectation, 4)}`}
              valueColor={result.pnl_expectation >= 0 ? colors.green : colors.red} mono />
            <MetricRow label="Inventory Skew" value={`${(result.reservation_price - S).toFixed(4)}`}
              valueColor={colors.yellow} mono />
          </Card>

          {/* Interpretation */}
          <Card title="Interpretation" accentColor={colors.yellow}>
            <Text style={styles.interp}>
              {Math.abs(q) > 5
                ? `⚠️ High inventory (${q} units) — reservation price is ${q > 0 ? 'below' : 'above'} mid by $${Math.abs(result.reservation_price - S).toFixed(4)}, model is skewing quotes ${q > 0 ? 'lower' : 'higher'} to offload.`
                : q === 0
                  ? '✅ Zero inventory — symmetric quotes around mid price. No skew applied.'
                  : `📊 Inventory ${q > 0 ? 'long' : 'short'} ${Math.abs(q)} — mild skew applied. Quotes are shifted ${(result.reservation_price - S) < 0 ? 'below' : 'above'} mid by $${Math.abs(result.reservation_price - S).toFixed(4)}.`}
            </Text>
            <Text style={[styles.interp, { marginTop: 8 }]}>
              {`Optimal spread of ${spreadBps} bps = $${fmt(result.optimal_spread, 4)}. At current σ=${(sigma * 100).toFixed(2)}% and γ=${gamma.toFixed(3)}, the model charges ${spreadBps} bps to compensate for adverse selection and inventory risk.`}
            </Text>
          </Card>
        </>
      )}

      {tab === 'monte' && (
        <>
          <TouchableOpacity style={styles.simBtn} onPress={() => setSimSeed(s => s + 1)} activeOpacity={0.8}>
            <Text style={styles.simBtnText}>{simSeed === 0 ? '▶ Run Monte Carlo (150 paths)' : '▶ Re-run Simulation'}</Text>
          </TouchableOpacity>

          {sim && (
            <>
              <Card title="Simulation Results" accentColor="#9C27B0">
                <MetricRow label="Mean P&L" value={`$${fmt(sim.mean_pnl, 2)}`}
                  valueColor={sim.mean_pnl >= 0 ? colors.green : colors.red} mono />
                <MetricRow label="Std Dev" value={`$${fmt(sim.std_pnl, 2)}`} mono />
                <MetricRow label="Sharpe Ratio" value={fmt(sim.sharpe, 4)}
                  valueColor={sim.sharpe > 1 ? colors.green : sim.sharpe > 0 ? colors.yellow : colors.red} mono />
                <MetricRow label="Max Drawdown" value={`${(sim.max_drawdown * 100).toFixed(2)}%`}
                  valueColor={sim.max_drawdown < 0.1 ? colors.green : sim.max_drawdown < 0.3 ? colors.yellow : colors.red} mono />
                <MetricRow label="Win Rate" value={`${(sim.win_rate * 100).toFixed(1)}%`}
                  valueColor={sim.win_rate > 0.5 ? colors.green : colors.red} mono />
                <MetricRow label="Paths Simulated" value="150" />
              </Card>

              {/* ASCII P&L chart */}
              <Card title="P&L Distribution (sample paths)" accentColor={colors.accent}>
                <MiniChart paths={sim.paths} />
              </Card>
            </>
          )}
        </>
      )}

    </ScrollView>
  )
}

function MiniChart({ paths }: { paths: number[][] }) {
  if (!paths.length) return null
  const allVals = paths.flat()
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const range = max - min || 1
  const H = 80
  const steps = paths[0].length
  const W_PER_STEP = 3

  return (
    <View style={{ height: H + 20, marginTop: 8 }}>
      <View style={{ height: H, flexDirection: 'row', alignItems: 'flex-end', gap: 0 }}>
        {Array.from({ length: steps }).map((_, si) => {
          const vals = paths.map(p => p[si] ?? 0)
          const avgVal = vals.reduce((a, b) => a + b, 0) / vals.length
          const barH = Math.max(2, ((avgVal - min) / range) * H)
          const isPos = avgVal >= 0
          return (
            <View key={si} style={{
              width: W_PER_STEP, height: barH,
              backgroundColor: isPos ? colors.green + 'aa' : colors.red + 'aa',
              marginHorizontal: 0.5,
            }} />
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>t=0</Text>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>t=T</Text>
      </View>
    </View>
  )
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  tabs: { flexDirection: 'row', marginBottom: spacing.md, gap: 8 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  tabActive: { backgroundColor: '#9C27B0' + '22', borderColor: '#9C27B0' },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#9C27B0' },
  quoteRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  quoteBox: { flex: 2, borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' },
  quoteLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  quotePrice: { fontSize: 16, fontWeight: '800', fontFamily: 'monospace', marginVertical: 4 },
  quoteSub: { color: colors.textMuted, fontSize: 10, textAlign: 'center' },
  quoteMid: { flex: 1.5, alignItems: 'center' },
  quoteMidLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  quoteMidPrice: { color: colors.text, fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  quoteSpread: { color: colors.yellow, fontSize: 11, fontWeight: '700', marginTop: 3 },
  interp: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  simBtn: {
    backgroundColor: '#9C27B0' + '33', borderWidth: 1, borderColor: '#9C27B0',
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md,
  },
  simBtnText: { color: '#9C27B0', fontWeight: '700', fontSize: 14 },
})
