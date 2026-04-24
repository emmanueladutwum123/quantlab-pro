import React, { useState, useMemo } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { kellyPositionSize, positionSizeFromRisk, requiredMargin,
         drawdownRecovery, riskRewardAnalysis, INSTRUMENTS } from '../math/mt5Tools'
import { Card, MetricRow, Badge } from '../components/Card'
import { SliderRow } from '../components/SliderInput'
import { colors, spacing, radius } from '../theme'

type Tool = 'kelly' | 'position' | 'rr' | 'drawdown'

export default function MT5Screen() {
  const [tool, setTool] = useState<Tool>('position')

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>MT5 Trading Tools</Text>
        <Text style={styles.subtitle}>Position Sizing · Kelly · R:R · Drawdown Recovery</Text>
      </View>

      {/* Tool selector */}
      <View style={styles.toolGrid}>
        {([
          { key: 'position', label: '📊 Position Size' },
          { key: 'kelly',    label: '🎯 Kelly Criterion' },
          { key: 'rr',       label: '⚖️ Risk / Reward' },
          { key: 'drawdown', label: '📉 Drawdown Recovery' },
        ] as const).map(({ key, label }) => (
          <TouchableOpacity key={key}
            style={[styles.toolBtn, tool === key && styles.toolBtnActive]}
            onPress={() => setTool(key)}>
            <Text style={[styles.toolBtnText, tool === key && styles.toolBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tool === 'position' && <PositionSizeTool />}
      {tool === 'kelly'    && <KellyTool />}
      {tool === 'rr'       && <RRTool />}
      {tool === 'drawdown' && <DrawdownTool />}
    </ScrollView>
  )
}

// ── Position Size Tool ────────────────────────────────────────────────────────
function PositionSizeTool() {
  const [balance, setBalance]   = useState(10000)
  const [riskPct, setRiskPct]   = useState(1)
  const [slPips, setSlPips]     = useState(20)
  const [price, setPrice]       = useState(1.0850)
  const [leverage, setLeverage] = useState(50)
  const [symKey, setSymKey]     = useState<keyof typeof INSTRUMENTS>('EURUSD')
  const inst = INSTRUMENTS[symKey]

  const result = useMemo(() =>
    positionSizeFromRisk(balance, riskPct, slPips, inst, price),
    [balance, riskPct, slPips, inst, price]
  )
  const margin = useMemo(() =>
    requiredMargin(result.lots, price, inst, leverage),
    [result.lots, price, inst, leverage]
  )

  return (
    <>
      <Card title="Instrument" accentColor={colors.green}>
        <View style={styles.symGrid}>
          {Object.keys(INSTRUMENTS).map(s => (
            <TouchableOpacity key={s}
              style={[styles.symBtn, symKey === s && styles.symBtnActive]}
              onPress={() => setSymKey(s as any)}>
              <Text style={[styles.symBtnText, symKey === s && styles.symBtnTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card title="Parameters" accentColor={colors.green}>
        <SliderRow label="Account Balance" value={balance} min={500} max={100000} step={500}
          format={v => `$${v.toFixed(0)}`} onChange={setBalance} color={colors.green} />
        <SliderRow label="Risk %" value={riskPct} min={0.1} max={5} step={0.1}
          format={v => v.toFixed(1) + '%'} onChange={setRiskPct} color={colors.green} />
        <SliderRow label="Stop Loss (pips)" value={slPips} min={2} max={200} step={1}
          format={v => v.toFixed(0) + ' pips'} onChange={setSlPips} color={colors.green} />
        <SliderRow label="Current Price" value={price} min={0.5} max={200} step={0.0001}
          format={v => v.toFixed(4)} onChange={setPrice} color={colors.green} />
        <SliderRow label="Leverage" value={leverage} min={1} max={500} step={1}
          format={v => `1:${v.toFixed(0)}`} onChange={setLeverage} color={colors.green} />
      </Card>

      <Card title="Result" accentColor={colors.green}>
        <MetricRow label="Position Size (Lots)" value={result.lots.toFixed(2)}
          valueColor={colors.green} mono />
        <MetricRow label="Units" value={result.units.toLocaleString()} mono />
        <MetricRow label="Risk Amount" value={`$${result.risk_usd.toFixed(2)}`}
          valueColor={colors.yellow} mono />
        <MetricRow label="Pip Value / Lot" value={`$${result.pip_value_per_lot.toFixed(2)}`} mono />
        <MetricRow label="Required Margin" value={`$${margin.toFixed(2)}`}
          valueColor={margin > balance * 0.5 ? colors.red : colors.text} mono />
        <MetricRow label="Margin Used" value={`${(margin / balance * 100).toFixed(1)}%`}
          valueColor={margin / balance > 0.3 ? colors.red : colors.green} mono />
      </Card>
    </>
  )
}

// ── Kelly Criterion Tool ──────────────────────────────────────────────────────
function KellyTool() {
  const [winRate, setWinRate]   = useState(0.55)
  const [avgWin, setAvgWin]     = useState(150)
  const [avgLoss, setAvgLoss]   = useState(100)
  const [balance, setBalance]   = useState(10000)
  const [frac, setFrac]         = useState(0.5)

  const result = useMemo(() =>
    kellyPositionSize(winRate, avgWin, avgLoss, balance, frac),
    [winRate, avgWin, avgLoss, balance, frac]
  )

  const ev = winRate * avgWin - (1 - winRate) * avgLoss

  return (
    <>
      <Card title="Kelly Criterion Calculator" subtitle="Optimal position sizing via expected value" accentColor={colors.accent}>
        <SliderRow label="Win Rate" value={winRate} min={0.1} max={0.9} step={0.01}
          format={v => (v * 100).toFixed(0) + '%'} onChange={setWinRate} color={colors.accent} />
        <SliderRow label="Average Win ($)" value={avgWin} min={10} max={1000} step={10}
          format={v => `$${v.toFixed(0)}`} onChange={setAvgWin} color={colors.green} />
        <SliderRow label="Average Loss ($)" value={avgLoss} min={10} max={1000} step={10}
          format={v => `$${v.toFixed(0)}`} onChange={setAvgLoss} color={colors.red} />
        <SliderRow label="Account Balance" value={balance} min={500} max={100000} step={500}
          format={v => `$${v.toFixed(0)}`} onChange={setBalance} color={colors.accent} />
        <SliderRow label="Kelly Fraction" value={frac} min={0.1} max={1} step={0.05}
          format={v => (v * 100).toFixed(0) + '%  (' + (v === 1 ? 'Full' : v === 0.5 ? 'Half' : 'Frac') + ')'}
          onChange={setFrac} color={colors.yellow} />
      </Card>

      <Card title="Results" accentColor={colors.accent}>
        <MetricRow label="Full Kelly %" value={`${result.full_kelly_pct.toFixed(2)}%`}
          valueColor={result.full_kelly_pct > 20 ? colors.red : colors.green} mono />
        <MetricRow label="Applied Kelly %" value={`${(result.kelly_fraction * 100).toFixed(2)}%`}
          valueColor={colors.accent} mono />
        <MetricRow label="Recommended Risk $" value={`$${result.recommended_risk_usd.toFixed(2)}`}
          valueColor={colors.green} mono />
        <MetricRow label="Odds Ratio (b)" value={(avgWin / avgLoss).toFixed(3)} mono />
        <MetricRow label="Expected Value / Trade" value={`$${ev.toFixed(2)}`}
          valueColor={ev > 0 ? colors.green : colors.red} mono />
        <MetricRow label="Edge / Loss Ratio" value={(ev / avgLoss * 100).toFixed(2) + '%'}
          valueColor={ev > 0 ? colors.green : colors.red} mono />
      </Card>

      {result.full_kelly_pct > 25 && (
        <Card accentColor={colors.yellow}>
          <Text style={{ color: colors.yellow, fontSize: 12, lineHeight: 18 }}>
            ⚠️ Full Kelly = {result.full_kelly_pct.toFixed(1)}% — this is aggressive. Using {(frac * 100).toFixed(0)}% Kelly reduces variance while preserving most of the edge. Half-Kelly is the institutional standard.
          </Text>
        </Card>
      )}
    </>
  )
}

// ── Risk/Reward Tool ──────────────────────────────────────────────────────────
function RRTool() {
  const [entry, setEntry]   = useState(1.0850)
  const [sl, setSl]         = useState(1.0820)
  const [tp, setTp]         = useState(1.0910)
  const [wr, setWr]         = useState(0.5)

  const result = useMemo(() =>
    riskRewardAnalysis(entry, sl, tp, wr), [entry, sl, tp, wr]
  )

  return (
    <Card title="Risk / Reward Analyzer" accentColor={colors.yellow}>
      <SliderRow label="Entry Price" value={entry} min={0.5} max={200} step={0.0001}
        format={v => v.toFixed(4)} onChange={setEntry} color={colors.yellow} />
      <SliderRow label="Stop Loss" value={sl} min={0.4} max={entry} step={0.0001}
        format={v => v.toFixed(4)} onChange={setSl} color={colors.red} />
      <SliderRow label="Take Profit" value={tp} min={entry} max={200} step={0.0001}
        format={v => v.toFixed(4)} onChange={setTp} color={colors.green} />
      <SliderRow label="Expected Win Rate" value={wr} min={0.1} max={0.9} step={0.01}
        format={v => (v * 100).toFixed(0) + '%'} onChange={setWr} color={colors.yellow} />

      <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.sm }} />
      <MetricRow label="Risk (pips)" value={result.risk_pips.toFixed(1)} valueColor={colors.red} mono />
      <MetricRow label="Reward (pips)" value={result.reward_pips.toFixed(1)} valueColor={colors.green} mono />
      <MetricRow label="R:R Ratio" value={`1 : ${result.rr_ratio.toFixed(2)}`}
        valueColor={result.rr_ratio >= 2 ? colors.green : result.rr_ratio >= 1 ? colors.yellow : colors.red} mono />
      <MetricRow label="Break-even Win Rate" value={`${(result.break_even_win_rate * 100).toFixed(1)}%`} mono />
      <MetricRow label="Expected Value / pip" value={result.expected_value.toFixed(4)}
        valueColor={result.expected_value > 0 ? colors.green : colors.red} mono />
      <MetricRow label="Trade Profitable?" value={result.profitable ? '✅ YES' : '❌ NO'}
        valueColor={result.profitable ? colors.green : colors.red} />
    </Card>
  )
}

// ── Drawdown Recovery Tool ────────────────────────────────────────────────────
function DrawdownTool() {
  const [dd, setDd]         = useState(10)
  const [balance, setBal]   = useState(10000)
  const [wr, setWr]         = useState(0.55)
  const [rr, setRr]         = useState(2)

  const result = useMemo(() => drawdownRecovery(dd), [dd])
  const trades = result.trades_to_recover(wr, rr)
  const remaining = result.balance_after(balance)

  return (
    <Card title="Drawdown Recovery Calculator" accentColor={colors.red}>
      <SliderRow label="Drawdown %" value={dd} min={1} max={80} step={1}
        format={v => v.toFixed(0) + '%'} onChange={setDd} color={colors.red} />
      <SliderRow label="Account Balance" value={balance} min={500} max={100000} step={500}
        format={v => `$${v.toFixed(0)}`} onChange={setBal} color={colors.red} />
      <SliderRow label="Win Rate" value={wr} min={0.3} max={0.8} step={0.01}
        format={v => (v * 100).toFixed(0) + '%'} onChange={setWr} color={colors.accent} />
      <SliderRow label="Avg R:R" value={rr} min={0.5} max={5} step={0.1}
        format={v => '1:' + v.toFixed(1)} onChange={setRr} color={colors.green} />

      <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.sm }} />
      <MetricRow label="Balance After Drawdown" value={`$${remaining.toFixed(2)}`}
        valueColor={colors.red} mono />
      <MetricRow label="Required Gain to Recover" value={`${result.required_gain_pct.toFixed(2)}%`}
        valueColor={result.required_gain_pct > 50 ? colors.red : colors.yellow} mono />
      <MetricRow label="Recovery Gain on $" value={`$${(balance - remaining).toFixed(2)}`}
        valueColor={colors.yellow} mono />
      <MetricRow label="Trades to Recover*" value={isFinite(trades) ? trades.toFixed(0) : '∞ (negative EV)'}
        valueColor={isFinite(trades) && trades < 50 ? colors.green : colors.red} mono />
      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 8 }}>
        *Estimated at {(wr*100).toFixed(0)}% win rate with 1:{rr.toFixed(1)} R:R
      </Text>
    </Card>
  )
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  toolBtn: { width: '47%', paddingVertical: 10, paddingHorizontal: 8, borderRadius: radius.sm,
             borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  toolBtnActive: { backgroundColor: colors.green + '22', borderColor: colors.green },
  toolBtnText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  toolBtnTextActive: { color: colors.green },
  symGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm,
            borderWidth: 1, borderColor: colors.cardBorder },
  symBtnActive: { backgroundColor: colors.green + '22', borderColor: colors.green },
  symBtnText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  symBtnTextActive: { color: colors.green },
})
