import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, spacing, radius } from '../theme'

interface CardProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  style?: ViewStyle
  accentColor?: string
}

export function Card({ title, subtitle, children, style, accentColor }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {accentColor && <View style={[styles.accent, { backgroundColor: accentColor }]} />}
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  )
}

interface MetricRowProps {
  label: string
  value: string
  valueColor?: string
  mono?: boolean
}

export function MetricRow({ label, value, valueColor, mono }: MetricRowProps) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, valueColor ? { color: valueColor } : {}, mono ? { fontFamily: 'monospace' } : {}]}>
        {value}
      </Text>
    </View>
  )
}

interface BadgeProps {
  label: string
  color?: string
  bg?: string
}

export function Badge({ label, color, bg }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg ?? colors.cardBorder }]}>
      <Text style={[styles.badgeText, { color: color ?? colors.textMuted }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  metricValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
})
