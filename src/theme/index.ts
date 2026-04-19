export const colors = {
  bg:           '#0a0f1e',   // deep navy
  card:         '#111827',
  cardBorder:   '#1e2a45',
  accent:       '#4958E0',
  accentLight:  '#6c7eed',
  green:        '#00C853',
  greenDim:     '#1a3d2b',
  red:          '#FF3D57',
  redDim:       '#3d1a1f',
  yellow:       '#FFD600',
  yellowDim:    '#3d3400',
  text:         '#e2e8f0',
  textMuted:    '#8892b0',
  textDim:      '#4a5568',
  white:        '#ffffff',
  gold:         '#FFD700',
}

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
}

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24,
}

export const font = {
  mono: 'monospace' as const,
}

export const shadow = {
  card: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  }
}
