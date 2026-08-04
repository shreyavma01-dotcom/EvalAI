import {
  Area,
  AreaChart as RechartsAreaChart,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartColors, chartTooltipStyle, CHART_PALETTE } from './chartTheme'
import { cn } from '@/utils/cn'

const baseAxisProps = (colors) => ({
  stroke: 'transparent',
  tick: { fill: colors.tick, fontSize: 11, fontWeight: 500 },
  tickLine: false,
  axisLine: false,
  dy: 8,
})

/**
 * Reusable gradient area chart.
 */
export function AreaChart({ data, xKey = 'label', series = [{ key: 'value', name: 'Value' }], height = 240, smooth = true, className }) {
  const colors = useChartColors()
  const gradientId = `area-${series.map((s) => s.key).join('-')}`

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.primary} stopOpacity={0.28} />
              <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 8" stroke={colors.grid} vertical={false} />
          <XAxis dataKey={xKey} {...baseAxisProps(colors)} />
          <YAxis {...baseAxisProps(colors)} width={40} />
          <Tooltip cursor={{ stroke: colors.grid }} contentStyle={chartTooltipStyle(colors).contentStyle} itemStyle={chartTooltipStyle(colors).itemStyle} labelStyle={chartTooltipStyle(colors).labelStyle} />
          {series.map((s, index) => (
            <Area
              key={s.key}
              type={smooth ? 'monotone' : 'linear'}
              dataKey={s.key}
              name={s.name}
              stroke={s.color ?? colors.primary}
              strokeWidth={2.5}
              fill={index === 0 ? `url(#${gradientId})` : 'transparent'}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: colors.tooltipBg }}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Reusable grouped/stacked bar chart.
 */
export function BarChart({ data, xKey = 'label', series = [{ key: 'value', name: 'Value' }], height = 240, radius = 6, className }) {
  const colors = useChartColors()

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="4 8" stroke={colors.grid} vertical={false} />
          <XAxis dataKey={xKey} {...baseAxisProps(colors)} />
          <YAxis {...baseAxisProps(colors)} width={40} />
          <Tooltip cursor={{ fill: colors.grid, opacity: 0.3 }} contentStyle={chartTooltipStyle(colors).contentStyle} itemStyle={chartTooltipStyle(colors).itemStyle} labelStyle={chartTooltipStyle(colors).labelStyle} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color ?? colors.primary} radius={[radius, radius, 0, 0]} maxBarSize={34} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Reusable donut chart.
 */
export function DonutChart({ data = [], xKey = 'label', yKey = 'value', size = 180, thickness = 22, className }) {
  const colors = useChartColors()
  const palette = data.map((_, index) => {
    const variable = CHART_PALETTE[index % CHART_PALETTE.length]
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim().split(/\s+/).filter(Boolean).slice(0, 3).join(', ')
  })

  return (
    <div className={cn('w-full', className)} style={{ height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Tooltip contentStyle={chartTooltipStyle(colors).contentStyle} itemStyle={chartTooltipStyle(colors).itemStyle} labelStyle={chartTooltipStyle(colors).labelStyle} />
          <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" innerRadius={(size - thickness) / 2} outerRadius={size / 2} paddingAngle={3} strokeWidth={0}>
            {data.map((entry, index) => (
              <Cell key={entry[xKey]} fill={`rgb(${palette[index]})`} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
