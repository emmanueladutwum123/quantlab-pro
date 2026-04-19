import React, { useState, useMemo } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Slider from '@react-native-community/slider'
import { blackScholes, impliedVolatility } from '../math/blackScholes'
import { Card, MetricRow, Badge } from '../components/Card'
import { colors, spacing, radius } from '../theme'

const fmt = (n: number, d = 4) => n.toFixed(d)
const fmtPct = (n: number) => (n * 100).toFixed(2) + '%'

export default function OptionsScreen() {
  const [S, setS]         = useState(2800)   // Cocoa spot ~$2800/tonne
  const [K, setK]         = useState(2800)
  const [T, setT]         = useState(0.25)   // 3 months
  const [r, setR]         = useState(0.05)
  const [sigma, setSigma] = useState(0.25)
  const [q, setQ]         = useState(0)
  const [tab, setTab]     = useState<'pricer' | 'greeks' | 'iv'>('pricer')

  const result = useMemo(() => blackScholes({ S, K, T, r, sigma, q }), [S, K, T, r, sigma, q])

  const moneyness = S > K ? 'ITM' : S < K ? 'OTM' : 'ATM'
  const moneynessColor = S > K ? colors.green : S < K ? colors.red : colors.yellow

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Options Pricing Lab</Text>
        <Text style={styles.subtitle}>Black-Scholes · European Options · Full Greeks</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['pricer', 'greeks', 'iv'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'pricer' ? 'Pricer' : t === 'greeks' ? 'Greeks' : 'IV Solver'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inputs */}
      <Card title="Parameters" accentColor={colors.accent}>
        <SliderRow label="Spot Price (S)" value={S} min={1000} max={5000} step={10}
          format={v => `$${v.toFixed(0)}`} onChange={setS} />
        <SliderRow label="Strike Price (K)" value={K} min={1000} max={5000} step={10}
          format={v => `$${v.toFixed(0)}`} onChange={setK} />
        <SliderRow label="Time to Expiry (T)" value={T} min={0.01} max={2} step={0.01}
          format={v => `${(v * 365).toFixed(0)} days`} onChange={setT} />
        <SliderRow label="Risk-Free Rate (r)" value={r} min={0} max={0.15} step={0.001}
          format={v => fmtPct(v)} onChange={setR} />
        <SliderRow label="Volatility (σ)" value={sigma} min={0.01} max={1.5} step={0.01}
          format={v => fmtPct(v)} onChange={setSigma} />
        <SliderRow label="Dividend Yield (q)" value={q} min={0} max={0.1} step={0.001}
          format={v => fmtPct(v)} onChange={setQ} />
      </Card>

      {/* Moneyness badge */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
        <Badge label={moneyness} color={moneynessColor} bg={moneynessColor + '22'} />
        <Badge label={`d1: ${fmt(result.d1, 4)}`} color={colors.textMuted} />
        <Badge label={`d2: ${fmt(result.d2, 4)}`} color={colors.textMuted} />
      </View>

      {tab === 'pricer' && (
        <>
          {/* Prices */}
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

          {/* Put-Call parity */}
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
            <GreekCard label="Δ Delta (Call)" value={fmt(result.greeks.delta_call)} sub="Price sensitivity" color={colors.accent} />
            <GreekCard label="Δ Delta (Put)"  value={fmt(result.greeks.delta_put)}  sub="Price sensitivity" color={colors.red} />
            <GreekCard label="Γ Gamma"         value={fmt(result.greeks.gamma, 6)}   sub="Delta rate of change" color={colors.yellow} />
            <GreekCard label="Θ Theta (Call)"  value={`$${fmt(result.greeks.theta_call, 4)}/day`} sub="Time decay" color={colors.red} />
            <GreekCard label="Θ Theta (Put)"   value={`$${fmt(result.greeks.theta_put, 4)}/day`}  sub="Time decay" color={colors.red} />
            <GreekCard label="ν Vega"          value={`$${fmt(result.greeks.vega, 4)}/1%σ`} sub="Vol sensitivity" color={colors.green} />
            <GreekCard label="ρ Rho (Call)"    value={`$${fmt(result.greeks.rho_call, 4)}/1%r`} sub="Rate sensitivity" color={colors.accent} />
            <GreekCard label="ρ Rho (Put)"     value={`$${fmt(result.greeks.rho_put, 4)}/1%r`}  sub="Rate sensitivity" color={colors.accent} />
          </View>
        </Card>
      )}

      {tab === 'iv' && (
        <IVSolver S={S} K={K} T={T} r={r} q={q} currentSigma={sigma} />
      )}

    </ScrollView>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SliderRow({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <View style={styles.sliderRow}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{format(value)}</Text>
      </View>
      <Slider minimumValue={min} maximumValue={max} step={step} value={value}
        onValueChange={onChange} style={{ height: 32, marginHorizontal: -6 }}
        minimumTrackTintColor={colors.accent} maximumTrackTintColor={colors.cardBorder}
        thumbTintColor={colors.accent} />
    </View>
  )
}

function GreekCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <View style={[styles.greekCard, { borderColor: color + '44' }]}>
      <Text style={[styles.greekLabel, { color }]}>{label}</Text>
      <Text style={styles.greekValue}>{value}</Text>
      <Text style={styles.greekSub}>{sub}</Text>
    </View>
  )
}

function IVSolver({ S, K, T, r, q, currentSigma }: any) {
  const [marketPrice, setMarketPrice] = useState(150)
  const [optionType, setOptionType]   = useState<'call' | 'put'>('call')

  const iv = useMemo(() => impliedVolatility(marketPrice, { S, K, T, r, q }, optionType), [marketPrice, S, K, T, r, q, optionType])

  return (
    <Card title="Implied Volatility Solver" subtitle="Newton-Raphson Method" accentColor={colors.yellow}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
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
      <View style={{ marginBottom: spacing.md }}>
        <Text style={styles.sliderLabel}>Market Option Price: ${marketPrice.toFixed(0)}</Text>
        <Slider minimumValue={1} maximumValue={500} step={1} value={marketPrice}
          onValueChange={setMarketPrice} style={{ height: 32 }}
          minimumTrackTintColor={colors.yellow} maximumTrackTintColor={colors.cardBorder}
          thumbTintColor={colors.yellow} />
      </View>
      <MetricRow label="Market Price" value={`$${marketPrice.toFixed(2)}`} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  tabs: { flexDirection: 'row', marginBottom: spacing.md, gap: 8 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accent + '22', borderColor: colors.accent },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: colors.accent },
  sliderRow: { marginBottom: 8 },
  sliderLabel: { color: colors.textMuted, fontSize: 12 },
  sliderValue: { color: colors.accent, fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  priceRow: { flexDirection: 'row', gap: spacing.sm },
  priceBox: { flex: 1, borderWidth: 1, borderRadius: radius.sm, padding: spacing.md, alignItems: 'center' },
  priceLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  priceValue: { fontSize: 24, fontWeight: '800', fontFamily: 'monospace', marginVertical: 4 },
  priceSub: { color: colors.textMuted, fontSize: 11 },
  greekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  greekCard: { width: '47%', borderWidth: 1, borderRadius: radius.sm, padding: 10 },
  greekLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  greekValue: { color: colors.text, fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  greekSub: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  typeBtnText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
})
