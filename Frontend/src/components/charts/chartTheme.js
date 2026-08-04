import { useSyncExternalStore } from 'react'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')

function subscribe(callback) {
  const mql = media()
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

/**
 * Reads EvalAI CSS tokens into concrete hex colors for chart libraries
 * (Recharts needs real values, not rgb() triplets). Re-resolves on theme change.
 */
export function useChartColors() {
  const dark = useSyncExternalStore(subscribe, () => media().matches, () => false)

  const read = (variable, alpha = 1) => {
    if (typeof document === 'undefined') return '#6366F1'
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim()
    const parts = raw.split(/\s+/).map(Number).filter(Number.isFinite)
    if (parts.length < 3) return '#6366F1'
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
  }

  return {
    dark,
    primary: read('--primary'),
    primarySoft: read('--primary-soft'),
    secondary: read('--secondary'),
    success: read('--success'),
    warning: read('--warning'),
    danger: read('--danger'),
    info: read('--info'),
    grid: read('--border', 0.6),
    tick: read('--muted'),
    tooltipBg: dark ? '#0d1530' : '#ffffff',
    tooltipBorder: dark ? '#1e293b' : '#e2e8f0',
    tooltipText: dark ? '#edf2f7' : '#0f172a',
  }
}

export const CHART_PALETTE = ['--primary', '--secondary', '--success', '--info', '--warning', '--danger']

/**
 * Shared tooltip style for all Recharts.
 */
export function chartTooltipStyle(colors) {
  return {
    contentStyle: {
      background: colors.tooltipBg,
      border: `1px solid ${colors.tooltipBorder}`,
      borderRadius: '0.75rem',
      boxShadow: '0 12px 32px -8px rgba(2, 6, 23, 0.18)',
      fontSize: '12px',
      fontWeight: 500,
      color: colors.tooltipText,
    },
    itemStyle: { color: colors.tooltipText },
    labelStyle: { color: colors.tick, fontWeight: 600 },
  }
}
