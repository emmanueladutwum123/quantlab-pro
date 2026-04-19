import React from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius } from '../theme'

const MODULES = [
  { icon: 'options' as const,       emoji: '📐', title: 'Options Lab',      subtitle: 'Black-Scholes · Greeks · IV Solver',       route: 'Options',   color: colors.accent },
  { icon: 'pulse' as const,         emoji: '⚡', title: 'HFT Simulator',    subtitle: 'Avellaneda-Stoikov · Market Making',        route: 'HFT',       color: '#9C27B0' },
  { icon: 'calculator' as const,    emoji: '📊', title: 'MT5 Tools',        subtitle: 'Kelly · Position Size · Margin · R:R',     route: 'MT5',       color: colors.green },
  { icon: 'leaf' as const,          emoji: '🌿', title: 'Cocoa Research',   subtitle: 'Futures Pricing · Hedge Ratio · Basis',    route: 'Cocoa',     color: '#FF9800' },
  { icon: 'analytics' as const,     emoji: '🔬', title: 'Quant Toolkit',    subtitle: 'Hurst · GARCH · OU · Sharpe · VaR',        route: 'Quant',     color: '#00BCD4' },
]

const HIGHLIGHTS = [
  { label: 'Black-Scholes Pricer',    detail: 'Full Greeks + IV Newton-Raphson solver' },
  { label: 'Avellaneda-Stoikov',      detail: 'Optimal bid/ask · Inventory risk · Monte Carlo P&L' },
  { label: 'Kelly Criterion',         detail: 'Full & fractional Kelly position sizing' },
  { label: 'GARCH(1,1)',              detail: 'Conditional volatility estimation' },
  { label: 'Hurst Exponent',         detail: 'R/S analysis — trend vs mean-reversion' },
  { label: 'Ornstein-Uhlenbeck',     detail: 'θ, μ, σ estimation + z-score + half-life' },
  { label: 'Cocoa Futures Pricing',  detail: 'Cost-of-carry · Basis risk · Optimal hedge' },
  { label: 'VaR & CVaR',             detail: 'Historical simulation at 95% confidence' },
]

interface Props {
  navigation: any
}

export default function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <LinearGradient colors={['#0d1b3e', '#0a0f1e']} style={styles.hero}>
        <Text style={styles.heroLabel}>QUANTLAB PRO</Text>
        <Text style={styles.heroTitle}>Institutional-Grade</Text>
        <Text style={styles.heroTitle2}>Financial Calculator</Text>
        <Text style={styles.heroSub}>
          Options Pricing · HFT Market Making · MT5 Position Tools · Ghana Cocoa Research · Quant Analytics
        </Text>
        <View style={styles.heroBadges}>
          {['Black-Scholes', 'Avellaneda-Stoikov', 'Kelly', 'GARCH', 'Hurst'].map(b => (
            <View key={b} style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{b}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Module Cards */}
      <Text style={styles.sectionTitle}>MODULES</Text>
      <View style={styles.grid}>
        {MODULES.map(m => (
          <TouchableOpacity
            key={m.route}
            style={styles.moduleCard}
            onPress={() => navigation.navigate(m.route)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[m.color + '22', m.color + '08']}
              style={styles.moduleGrad}
            >
              <View style={[styles.moduleIcon, { backgroundColor: m.color + '22', borderColor: m.color + '44' }]}>
                <Text style={styles.moduleEmoji}>{m.emoji}</Text>
              </View>
              <Text style={styles.moduleTitle}>{m.title}</Text>
              <Text style={styles.moduleSub}>{m.subtitle}</Text>
              <View style={[styles.moduleArrow, { backgroundColor: m.color + '22' }]}>
                <Ionicons name="arrow-forward" size={12} color={m.color} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feature highlights */}
      <Text style={styles.sectionTitle}>MODELS IMPLEMENTED</Text>
      <View style={styles.card}>
        {HIGHLIGHTS.map((h, i) => (
          <View key={i} style={[styles.hlRow, i === HIGHLIGHTS.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.hlDot} />
            <View style={styles.hlText}>
              <Text style={styles.hlLabel}>{h.label}</Text>
              <Text style={styles.hlDetail}>{h.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Built by Emmanuel Adutwum</Text>
        <Text style={styles.footerSub}>Quantitative Researcher · Software Engineer</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://emmanueladutwum123.github.io')}>
          <Text style={styles.footerLink}>emmanueladutwum123.github.io</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },

  hero: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  heroLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  heroTitle: { color: colors.white, fontSize: 32, fontWeight: '800', lineHeight: 36 },
  heroTitle2: { color: colors.accent, fontSize: 32, fontWeight: '800', marginBottom: spacing.sm },
  heroSub: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: spacing.md },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heroBadge: { backgroundColor: colors.accent + '22', borderWidth: 1, borderColor: colors.accent + '55', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { color: colors.accentLight, fontSize: 11, fontWeight: '600' },

  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  moduleCard: {
    width: '47%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  moduleGrad: { padding: spacing.md },
  moduleIcon: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  moduleEmoji: { fontSize: 22 },
  moduleTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 3 },
  moduleSub: { color: colors.textMuted, fontSize: 10, lineHeight: 14, marginBottom: spacing.sm },
  moduleArrow: {
    alignSelf: 'flex-start', padding: 6, borderRadius: 20,
  },

  card: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  hlRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    gap: spacing.sm,
  },
  hlDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.accent, marginTop: 4,
  },
  hlText: { flex: 1 },
  hlLabel: { color: colors.text, fontSize: 12, fontWeight: '600' },
  hlDetail: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  footer: { alignItems: 'center', padding: spacing.xl },
  footerText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  footerSub: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  footerLink: { color: colors.accent, fontSize: 11, marginTop: 6 },
})
