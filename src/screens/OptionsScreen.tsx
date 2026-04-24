import React, { useState, useMemo } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg'
import { blackScholes, impliedVolatility } from '../math/blackScholes'
import { Card, MetricRow, Badge } from '../components/Card'
import { SliderRow } from '../components/SliderInput'
import { colors, spacing, radius } from '../theme'

const fmt    = (n: number, d = 4) => n.toFixed(d)
const fmtPct = (n: number) => (n * 100).toFixed(2) + '%'
const SCREEN_W = Dimensions.get('window').width

export default function OptionsScreen() {
  const [S, setS]         = useState(2800)
  const [K, setK]         = useState(2800)
  const [T, setT]         = useState(0.25)
  const [r, setR]         = useState(0.05)
  const [sigma, setSigma] = useState(0.25)
  const [q, setQ]         = useState(0)
  const [tab, setTab]     = useState<'pricer' | 'greeks' | 'iv' | 'payoff'>('pricer')

  const result      = useMemo(() => blackScholes({ S, K, T, r, sigma, q }), [S, K, T, r, sigma, q])
  const moneyness   = S > K ? 'ITM' : S < K ? 'OTM' : 'ATM'
  const mColor      = S > K ? colors.green : S < K ? colors.red : colors.yellow

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.header}>
        <Text style={styles.title}>Options Pricing Lab</Text>
        <Text style={styles.subtitle}>Black-Scholes · European Options · Full Greeks</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['pricer', 'greeks', 'iv', 'payoff'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'pricer' ? 'Pricer' : t === 'greeks' ? 'Greeks' : t === 'iv' ? 'IV' : 'Payoff'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Parameters */}
      <Card title="Parameters" accentColor={colors.accent}>
        <SliderRow label="Spot Price (S)"    value={S}     min={1000} max={5000} step={10}   format={v => `$${v.toFixed(0)}`}   onChange={setS} />
        <SliderRow label="Strike Price (K)"  value={K}     min={1000} max={5000} step={10}   format={v => `$${v.toFixed(0)}`}   onChange={setK} />
        <SliderRow label="Time to Expiry"    value={T}     min={0.01} max={2}    step={0.01} format={v => `${(v*365).toFixed(0)} days`} onChange={setT} />
        <SliderRow label="Risk-Free Rate (r)" value={r}    min={0}    max={0.15} step={0.001} format={fmtPct} onChange={setR} />
        <SliderRow label="Volatility (σ)"    value={sigma} min={0.01} max={1.5}  step={0.01} format={fmtPct} onChange={setSigma} />
        <SliderRow label="Dividend Yield (q)" value={q}   min={0}    max={0.1}  step={0.001} format={fmtPct} onChange={setQ} />
      </Card>

      {/* Moneyness badges */}
      {tab !== 'iv' && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
          <Badge label={moneyness} color={mColor} bg={mColor + '22'} />
          <Badge label={`d1: ${fmt(result.d1, 4)}`} color={colors.textMuted} />
          <Badge label={`d2: ${fmt(result.d2, 4)}`} color={colors.textMuted} />
        </View>
      )}

      {tab === 'pricer' && (
        <>
          <Card title="Option Prices" accentColor={colors.green}>
            <View style={styles.priceRow}>
              <View style={[styles.priceBox, { borderColor: colors.green + '55', backgroundColor: colors.green + '11' }]}>
                <Text style={styles.priceLabel}>CALL</Text>
                <Text style={[styles.priceValue, { color: colors.green }]}>${fmt(result.call, 2)}</Text>
                <Text style={styles.priceSub}>Intrinsic: ${Math.max(S - K, 0).toFixed(2)}</Text>
                <Text style={styles.priceSub}>Time: ${Math.max(result.call - Math.max(S - K, 0), 0).toFixed(2)}</Text>
              </View>
              <View style={[styles.priceBox, { borderColor: colors.red + '55', backgroundColor: colors.red + '11' }]}>
                <Text style={styles.priceLabel}>PUT</Text>
                <Text style={[styles.priceValue, { color: colors.red }]}>${fmt(result.put, 2)}</Text>
                <Text style={styles.priceSub}>Intrinsic: ${Math.max(K - S, 0).toFixed(2)}</Text>
                <Text style={styles.priceSub}>Time: ${Math.max(result.put - Math.max(K - S, 0), 0).toFixed(2)}</Text>
              </View>
            </View>
          </Card>

          <Card title="Put-Call Parity Check" accentColor={colors.yellow}>
            <MetricRow label="C - P" value={`$${(result.call - result.put).toFixed(4)}`} mono />
            <MetricRow label="S·e^(-qT) - K·e^(-rT)"
              value={`$${(S * Math.exp(-q * T) - K * Math.exp(-r * T)).toFixed(4)}`} mono />
            <MetricRow label="Parity Error"
              value={`$${Math.abs((result.call - result.put) - (S * Math.exp(-q * T) - K * Math.exp(-r * T))).toExponential(2)}`}
              valueColor={colors.green} mono />
          </Card>
        </>
      )}

      {tab === 'greeks' && (
        <Card title="Option Greeks" accentColor={colors.accent}>
          <View style={styles.greekGrid}>
            <GreekCard label="Δ Delta (Call)" value={fmt(result.greeks.delta_call)}        sub="Price sensitivity"    color={colors.accent} />
            <GreekCard label="Δ Delta (Put)"  value={fmt(result.greeks.delta_put)}          sub="Price sensitivity"    color={colors.red} />
            <GreekCard label="Γ Gamma"         value={fmt(result.greeks.gamma, 6)}           sub="Delta rate of change" color={colors.yellow} />
            <GreekCard label="Θ Theta (Call)"  value={`$${fmt(result.greeks.theta_call, 4)}/day`} sub="Time decay"    color={colors.red} />
            <GreekCard label="Θ Theta (Put)"   value={`$${fmt(result.greeks.theta_put, 4)}/day`}  sub="Time decay"    color={colors.red} />
            <GreekCard label="ν Vega"          value={`$${fmt(result.greeks.vega, 4)}/1%σ`}  sub="Vol sensitivity"    color={colors.green} />
            <GreekCard label="ρ Rho (Call)"    value={`$${fmt(result.greeks.rho_call, 4)}/1%r`} sub="Rate sensitivity" color={colors.accent} />
            <GreekCard label="ρ Rho (Put)"     value={`$${fmt(result.greeks.rho_put, 4)}/1%r`}  sub="Rate sensitivity" color={colors.accent} />
          </View>
        </Card>
      )}

      {tab === 'iv' && <IVSolver S={S} K={K} T={T} r={r} q={q} currentSigma={sigma} />}

      {tab === 'payoff' && <PayoffDiagram S={S} K={K} result={result} />}

    </ScrollView>
  )
}

// ── Payoff Diagram ────────────────────────────────────────────────────────────

function PayoffDiagram({ S, K, result }: { S: number; K: number; result: ReturnType<typeof blackScholes> }) {
  const [mode, setMode] = useState<'call' | 'put' | 'both'>('both')

  const CHART_W = SCREEN_W - 32   // scroll view horizontal padding
  const CHART_H = 210
  const PL = 46, PR = 8, PT = 22, PB = 26
  const iW = CHART_W - PL - PR
  const iH = CHART_H - PT - PB

  const lo = K * 0.6, hi = K * 1.4
  const N = 100
  const prices   = Array.from({ length: N }, (_, i) => lo + (hi - lo) * i / (N - 1))
  const callPnL  = prices.map(st => Math.max(st - K, 0) - result.call)
  const putPnL   = prices.map(st => Math.max(K - st, 0) - result.put)

  const active   = mode === 'call' ? callPnL : mode === 'put' ? putPnL : [...callPnL, ...putPnL]
  const rawMin   = Math.min(...active), rawMax = Math.max(...active)
  const yPad     = (rawMax - rawMin) * 0.08 || 5
  const yMin     = rawMin - yPad, yMax = rawMax + yPad
  const ySpan    = yMax - yMin || 1

  const toX = (p: number) => PL + ((p - lo) / (hi - lo)) * iW
  const toY = (v: number) => PT + (1 - (v - yMin) / ySpan) * iH
  const pts = (arr: number[]) => prices.map((p, i) => `${toX(p).toFixed(1)},${toY(arr[i]).toFixed(1)}`).join(' ')

  const zY   = toY(0)
  const kX   = toX(K)
  const sX   = toX(Math.max(lo, Math.min(hi, S)))

  const callBE = K + result.call
  const putBE  = K - result.put

  // 4 evenly-spaced Y-axis labels
  const yTicks = Array.from({ length: 4 }, (_, i) => {
    const v = yMin + (yMax - yMin) * i / 3
    return { y: toY(v), label: (v >= 0 ? '+' : '') + v.toFixed(1) }
  })

  const modeColors = { call: colors.green, put: colors.red, both: colors.accent } as const

  return (
    <>
      {/* Mode toggle */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.sm }}>
        {(['call', 'put', 'both'] as const).map(m => (
          <TouchableOpacity key={m}
            style={[styles.typeBtn, mode === m && { backgroundColor: modeColors[m] + '33', borderColor: modeColors[m] }]}
            onPress={() => setMode(m)}>
            <Text style={[styles.typeBtnText, mode === m && { color: modeColors[m] }]}>
              {m === 'call' ? 'LONG CALL' : m === 'put' ? 'LONG PUT' : 'BOTH'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SVG Chart */}
      <View style={styles.chartBox}>
        <Svg width={CHART_W} height={CHART_H}>
          {/* Zero line */}
          {zY >= PT && zY <= PT + iH && (
            <Line x1={PL} y1={zY} x2={PL + iW} y2={zY}
              stroke={colors.textDim} strokeWidth={1} strokeDasharray="4,3" />
          )}
          {/* Strike vertical */}
          <Line x1={kX} y1={PT} x2={kX} y2={PT + iH}
            stroke={colors.yellow} strokeWidth={1} strokeDasharray="3,3" strokeOpacity={0.9} />
          {/* Current spot vertical */}
          <Line x1={sX} y1={PT} x2={sX} y2={PT + iH}
            stroke={colors.accent} strokeWidth={1} strokeDasharray="2,4" strokeOpacity={0.55} />

          {/* Payoff lines */}
          {(mode === 'call' || mode === 'both') && (
            <Polyline points={pts(callPnL)} stroke={colors.green} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          )}
          {(mode === 'put' || mode === 'both') && (
            <Polyline points={pts(putPnL)} stroke={colors.red} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          )}

          {/* Y-axis labels */}
          {yTicks.map((t, i) => (
            <SvgText key={i} x={PL - 4} y={t.y + 4} fontSize={9} fill={colors.textDim} textAnchor="end">
              {t.label}
            </SvgText>
          ))}

          {/* X-axis labels */}
          {[lo, K, hi].map((v, i) => (
            <SvgText key={i} x={toX(v)} y={CHART_H - 5} fontSize={9} fill={colors.textDim} textAnchor="middle">
              {`$${v.toFixed(0)}`}
            </SvgText>
          ))}

          {/* Marker labels */}
          <SvgText x={kX} y={PT - 5} fontSize={9} fill={colors.yellow} textAnchor="middle">K</SvgText>
          <SvgText x={sX} y={PT - 5} fontSize={9} fill={colors.accent} textAnchor="middle">S</SvgText>
        </Svg>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
        {(mode === 'call' || mode === 'both') && (
          <View style={[styles.legendBox, { borderColor: colors.green + '55' }]}>
            <View style={[styles.legendDot, { backgroundColor: colors.green }]} />
            <Text style={styles.legendText}>Long Call</Text>
          </View>
        )}
        {(mode === 'put' || mode === 'both') && (
          <View style={[styles.legendBox, { borderColor: colors.red + '55' }]}>
            <View style={[styles.legendDot, { backgroundColor: colors.red }]} />
            <Text style={styles.legendText}>Long Put</Text>
          </View>
        )}
        <View style={[styles.legendBox, { borderColor: colors.yellow + '55' }]}>
          <View style={[styles.legendDot, { backgroundColor: colors.yellow }]} />
          <Text style={styles.legendText}>Strike (K)</Text>
        </View>
        <View style={[styles.legendBox, { borderColor: colors.accent + '55' }]}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Spot (S)</Text>
        </View>
      </View>

      {/* Break-even analysis */}
      <Card title="Break-Even Analysis" accentColor={colors.yellow}>
        {(mode === 'call' || mode === 'both') && <>
          <MetricRow label="Call Premium" value={`$${result.call.toFixed(4)}`} mono />
          <MetricRow label="Call Break-Even" value={`$${callBE.toFixed(2)}`} valueColor={colors.green} mono />
        </>}
        {(mode === 'put' || mode === 'both') && <>
          <MetricRow label="Put Premium" value={`$${result.put.toFixed(4)}`} mono />
          <MetricRow label="Put Break-Even" value={`$${putBE.toFixed(2)}`} valueColor={colors.red} mono />
        </>}
        {mode === 'both' && (
          <MetricRow label="Straddle Cost (C + P)" value={`$${(result.call + result.put).toFixed(4)}`}
            valueColor={colors.yellow} mono />
        )}
        <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 6 }}>
          Y-axis: P&amp;L at expiry after premium. X-axis: underlying price at expiry.
        </Text>
      </Card>
    </>
  )
}

// ── Greeks card ───────────────────────────────────────────────────────────────

function GreekCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <View style={[styles.greekCard, { borderColor: color + '44' }]}>
      <Text style={[styles.greekLabel, { color }]}>{label}</Text>
      <Text style={styles.greekValue}>{value}</Text>
      <Text style={styles.greekSub}>{sub}</Text>
    </View>
  )
}

// ── IV Solver ─────────────────────────────────────────────────────────────────

function IVSolver({ S, K, T, r, q, currentSigma }: { S: number; K: number; T: number; r: number; q: number; currentSigma: number }) {
  const [marketPrice, setMarketPrice] = useState(150)
  const [optionType,  setOptionType]  = useState<'call' | 'put'>('call')

  const iv = useMemo(() =>
    impliedVolatility(marketPrice, { S, K, T, r, q }, optionType),
    [marketPrice, S, K, T, r, q, optionType]
  )

  return (
    <Card title="Implied Volatility Solver" subtitle="Newton-Raphson Method" accentColor={colors.yellow}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.sm }}>
        {(['call', 'put'] as const).map(t => (
          <TouchableOpacity key={t}
            style={[styles.typeBtn, optionType === t && { backgroundColor: colors.accent + '33', borderColor: colors.accent }]}
            onPress={() => setOptionType(t)}>
            <Text style={[styles.typeBtnText, optionType === t && { color: colors.accent }]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <SliderRow label="Market Option Price" value={marketPrice} min={1} max={500} step={1}
        format={v => `$${v.toFixed(0)}`} onChange={setMarketPrice} color={colors.yellow} />
      <MetricRow label="Implied Volatility"
        value={iv !== null ? fmtPct(iv) : 'No solution found'}
        valueColor={iv !== null ? colors.green : colors.red} />
      <MetricRow label="Current σ (input)" value={fmtPct(currentSigma)} valueColor={colors.textMuted} />
      {iv !== null && (
        <MetricRow label="σ Difference" value={fmtPct(Math.abs(iv - currentSigma))}
          valueColor={Math.abs(iv - currentSigma) < 0.05 ? colors.green : colors.yellow} />
      )}
    </Card>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  header:  { marginBottom: spacing.md },
  title:   { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle:{ color: colors.textMuted, fontSize: 12, marginTop: 3 },

  tabs:       { flexDirection: 'row', marginBottom: spacing.md, gap: 6 },
  tab:        { flex: 1, paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  tabActive:  { backgroundColor: colors.accent + '22', borderColor: colors.accent },
  tabText:    { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: colors.accent },

  priceRow:   { flexDirection: 'row', gap: spacing.sm },
  priceBox:   { flex: 1, borderWidth: 1, borderRadius: radius.sm, padding: spacing.md, alignItems: 'center' },
  priceLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  priceValue: { fontSize: 24, fontWeight: '800', fontFamily: 'monospace', marginVertical: 4 },
  priceSub:   { color: colors.textMuted, fontSize: 11 },

  greekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  greekCard: { width: '47%', borderWidth: 1, borderRadius: radius.sm, padding: 10 },
  greekLabel:{ fontSize: 11, fontWeight: '700', marginBottom: 4 },
  greekValue:{ color: colors.text, fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  greekSub:  { color: colors.textMuted, fontSize: 10, marginTop: 2 },

  typeBtn:     { flex: 1, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  typeBtnText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },

  chartBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },

  legendBox:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.sm, padding: 7, backgroundColor: colors.card },
  legendDot:  { width: 9, height: 9, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
})
