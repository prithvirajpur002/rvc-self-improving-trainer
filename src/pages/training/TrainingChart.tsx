import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { TrainingRun } from '../../types'

const FALLBACK_DATA = [
  { epoch: 0,   genLoss: 2.10, discLoss: 1.80, melLoss: 1.60 },
  { epoch: 20,  genLoss: 1.72, discLoss: 1.45, melLoss: 1.30 },
  { epoch: 40,  genLoss: 1.41, discLoss: 1.18, melLoss: 1.02 },
  { epoch: 60,  genLoss: 1.15, discLoss: 0.95, melLoss: 0.82 },
  { epoch: 80,  genLoss: 0.94, discLoss: 0.77, melLoss: 0.65 },
  { epoch: 100, genLoss: 0.78, discLoss: 0.63, melLoss: 0.52 },
  { epoch: 120, genLoss: 0.65, discLoss: 0.52, melLoss: 0.43 },
  { epoch: 140, genLoss: 0.55, discLoss: 0.44, melLoss: 0.36 },
  { epoch: 160, genLoss: 0.47, discLoss: 0.38, melLoss: 0.31 },
  { epoch: 180, genLoss: 0.41, discLoss: 0.33, melLoss: 0.27 },
  { epoch: 200, genLoss: 0.36, discLoss: 0.29, melLoss: 0.23 },
]

interface Props {
  runs: TrainingRun[]
}

interface ChartPayloadEntry {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: ChartPayloadEntry[]
  label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0D1117] border border-border rounded-md px-3 py-2 shadow-xl text-xs font-mono">
      <p className="text-muted-foreground mb-1.5">epoch {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-semibold">{Number(p.value).toFixed(4)}</span>
        </p>
      ))}
    </div>
  )
}

export function TrainingChart({ runs }: Props) {
  const data = runs.length > 0
    ? runs.map((r) => ({
        epoch: r.epoch,
        genLoss: Number(r.genLoss?.toFixed(4) ?? 0),
        discLoss: Number(r.discLoss?.toFixed(4) ?? 0),
        melLoss: Number(r.melLoss?.toFixed(4) ?? 0),
      }))
    : FALLBACK_DATA

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradGen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(25 95% 53%)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(25 95% 53%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradDisc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(45 96% 55%)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(45 96% 55%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradMel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(199 89% 48%)" stopOpacity={0.20} />
              <stop offset="100%" stopColor="hsl(199 89% 48%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 15% 20%)" vertical={false} />
          <XAxis
            dataKey="epoch"
            tick={{ fill: 'hsl(210 10% 45%)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <YAxis
            tick={{ fill: 'hsl(210 10% 45%)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toFixed(1)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="genLoss"
            stroke="hsl(25 95% 53%)"
            strokeWidth={2}
            fill="url(#gradGen)"
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(25 95% 53%)', stroke: 'transparent' }}
            name="gen_loss"
          />
          <Area
            type="monotone"
            dataKey="discLoss"
            stroke="hsl(45 96% 55%)"
            strokeWidth={1.5}
            fill="url(#gradDisc)"
            dot={false}
            activeDot={{ r: 3, fill: 'hsl(45 96% 55%)', stroke: 'transparent' }}
            name="disc_loss"
          />
          <Area
            type="monotone"
            dataKey="melLoss"
            stroke="hsl(199 89% 48%)"
            strokeWidth={1.5}
            fill="url(#gradMel)"
            dot={false}
            activeDot={{ r: 3, fill: 'hsl(199 89% 48%)', stroke: 'transparent' }}
            name="mel_loss"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
