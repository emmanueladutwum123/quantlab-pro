import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Slider from '@react-native-community/slider'
import { colors } from '../theme'

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  color?: string
}

export function SliderRow({ label, value, min, max, step, format, onChange, color }: SliderRowProps) {
  const c = color ?? colors.accent
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: c }]}>{format(value)}</Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        style={styles.slider}
        minimumTrackTintColor={c}
        maximumTrackTintColor={colors.cardBorder}
        thumbTintColor={c}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  row:       { flexDirection: 'row', justifyContent: 'space-between' },
  label:     { color: colors.textMuted, fontSize: 12 },
  value:     { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  slider:    { height: 32, marginHorizontal: -6 },
})
