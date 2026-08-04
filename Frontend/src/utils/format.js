const DATE_FORMATS = {
  short: { day: 'numeric', month: 'short', year: 'numeric' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  time: { hour: 'numeric', minute: '2-digit' },
  datetime: { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' },
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function formatNumber(value, options) {
  const numeric = Number(value) || 0
  return new Intl.NumberFormat('en-US', options).format(numeric)
}

export function formatCompactNumber(value) {
  const numeric = Number(value) || 0
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(numeric)
}

export function formatPercent(value, fractionDigits = 1) {
  const numeric = Number(value) || 0
  return `${numeric.toFixed(fractionDigits)}%`
}

export function formatDate(date, format = 'short') {
  if (!date) return '—'
  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', DATE_FORMATS[format]).format(value)
}

export function formatRelativeTime(date, now = Date.now()) {
  if (!date) return ''
  const value = date instanceof Date ? date.getTime() : new Date(date).getTime()
  if (Number.isNaN(value)) return ''

  const seconds = Math.round((now - value) / 1000)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  const days = Math.round(hours / 24)
  if (days < 7) return rtf.format(-days, 'day')
  const weeks = Math.round(days / 7)
  if (weeks < 5) return rtf.format(-weeks, 'week')
  return formatDate(date, 'medium')
}

export function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function truncate(value = '', length = 60) {
  if (value.length <= length) return value
  return `${value.slice(0, length - 1)}…`
}
