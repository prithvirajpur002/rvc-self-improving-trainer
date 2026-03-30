import { Card, CardHeader, CardTitle, CardContent, Progress } from '@blinkdotnew/ui'
import { Server, MemoryStick, Cpu, Activity } from 'lucide-react'
import type { TrainingRun } from '../../types'

interface Props {
  lastRun?: TrainingRun | null
}

function vramColor(pct: number): string {
  if (pct < 60) return 'bg-green-500'
  if (pct < 85) return 'bg-yellow-500'
  return 'bg-red-500'
}

function ResourceBar({
  label,
  used,
  total,
  unit,
  colorClass,
}: {
  label: string
  used: number
  total: number
  unit: string
  colorClass: string
}) {
  const pct = Math.min(100, Math.round((used / total) * 100))
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs text-foreground">
          {used.toFixed(1)}<span className="text-muted-foreground">/{total}{unit}</span>
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] font-mono text-muted-foreground text-right">{pct}%</div>
    </div>
  )
}

function StatRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-mono text-xs font-medium ${accent ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  )
}

export function ResourceMonitor({ lastRun }: Props) {
  const vramUsed = lastRun?.gpuVramUsedGb ?? 14.2
  const vramTotal = 24.0
  const vramPct = (vramUsed / vramTotal) * 100

  const diskUsed = 312.4
  const diskTotal = 500
  const diskPct = (diskUsed / diskTotal) * 100

  const cpuPct = 42
  const ramUsed = 28.6
  const ramTotal = 64

  return (
    <div className="space-y-3">
      {/* GPU VRAM */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Server className="h-3.5 w-3.5 text-primary" />
            GPU Memory
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <ResourceBar
            label="VRAM"
            used={vramUsed}
            total={vramTotal}
            unit=" GB"
            colorClass={vramColor(vramPct)}
          />
          <StatRow label="Device" value="RTX 4090" />
          <StatRow label="Utilization" value={`${Math.round(vramPct * 0.9)}%`} accent />
        </CardContent>
      </Card>

      {/* Disk */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MemoryStick className="h-3.5 w-3.5 text-primary" />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <ResourceBar
            label="Disk"
            used={diskUsed}
            total={diskTotal}
            unit=" GB"
            colorClass={diskPct > 85 ? 'bg-red-500' : diskPct > 65 ? 'bg-yellow-500' : 'bg-green-500'}
          />
          <StatRow label="Free" value={`${(diskTotal - diskUsed).toFixed(1)} GB`} />
          <StatRow label="Checkpoints" value="48 files" />
        </CardContent>
      </Card>

      {/* System */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-primary" />
            System
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Cpu className="h-3 w-3" /> CPU
              </span>
              <span className="font-mono text-xs text-foreground">{cpuPct}%</span>
            </div>
            <Progress value={cpuPct} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">RAM</span>
              <span className="font-mono text-xs text-foreground">
                {ramUsed}<span className="text-muted-foreground">/{ramTotal} GB</span>
              </span>
            </div>
            <Progress value={(ramUsed / ramTotal) * 100} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
