import React from 'react'
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native'
import Slider from '@react-native-community/slider'
import { colors, spacing } from '../theme'

interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: (v: number) => string
  onChange: (v: number) => void
  unit?: string
}

export function SliderInput({ label, value, min, max, step, format, onChange, unit }: SliderInputProps) {
  const display = format ? format(value) : value.toFixed(2)

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueBox}>
          <Text style={styles.value}>{display}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${((value - min) / (max - min)) * 100}%` as any }]} />
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.cardBorder}
        thumbTintColor={colors.accent}
      />
      <View style={styles.rangRow}>
        <Text style={styles.rangeText}>{format ? format(min) : min}</Text>
        <Text style={styles.rangeText}>{format ? format(max) : max}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { color: colors.textMuted, fontSize: 12 },
  valueBox: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  value: { color: colors.accent, fontSize: 15, fontWeight: '700', fontFamily: 'monospace' },
  unit: { color: colors.textMuted, fontSize: 11 },
  track: {
    height: 4, backgroundColor: colors.cardBorder, borderRadius: 2,
    position: 'absolute', left: 0, right: 0, bottom: 22, top: 36,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  slider: { width: '100%', height: 36, marginTop: 2 },
  rangRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeText: { color: colors.textDim, fontSize: 10 },
})
