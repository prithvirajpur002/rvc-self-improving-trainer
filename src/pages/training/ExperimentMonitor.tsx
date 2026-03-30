import { Card, CardHeader, CardTitle, CardContent, Badge, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Skeleton } from '@blinkdotnew/ui'
import { Activity, TrendingDown, Layers, Clock } from 'lucide-react'
import { TrainingChart } from './TrainingChart'
import { useTrainingRuns } from '../../lib/db'
import { formatScore, formatDuration } from '../../lib/utils'
import type { Experiment } from '../../types'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  running:   { label: 'Running',   className: 'bg-primary/15 text-primary border-primary/30 animate-pulse-orange' },
  completed: { label: 'Completed', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  pending:   { label: 'Pending',   className: 'bg-muted text-muted-foreground border-border' },
  failed:    { label: 'Failed',    className: 'bg-destructive/15 text-destructive border-destructive/30' },
}

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-md bg-muted/40 border border-border/60 min-w-0">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm font-semibold ${color}`}>{value}</span>
    </div>
  )
}

interface Props {
  experiments: Experiment[]
  selectedId: string
  onSelectId: (id: string) => void
  isLoading: boolean
}

export function ExperimentMonitor({ experiments, selectedId, onSelectId, isLoading }: Props) {
  const { data: runs = [], isLoading: runsLoading } = useTrainingRuns(selectedId)

  const experiment = experiments.find((e) => e.id === selectedId) ?? experiments[0] ?? null
  const lastRun = runs.length > 0 ? runs[runs.length - 1] : null

  const epochProgress = experiment
    ? Math.min(100, Math.round(((lastRun?.epoch ?? 0) / (lastRun?.totalEpochs ?? experiment.epochs)) * 100))
    : 0

  const statusCfg = STATUS_CONFIG[experiment?.status ?? 'pending'] ?? STATUS_CONFIG.pending

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            Active Experiment
          </CardTitle>
          <div className="flex items-center gap-2">
            {experiment && (
              <Badge className={`text-[10px] h-5 px-2 border ${statusCfg.className}`}>
                {statusCfg.label}
              </Badge>
            )}
            {experiments.length > 1 && (
              <Select value={selectedId} onValueChange={onSelectId}>
                <SelectTrigger className="h-7 w-52 text-xs">
                  <SelectValue placeholder="Select experiment" />
                </SelectTrigger>
                <SelectContent>
                  {experiments.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      <span className="font-mono">{e.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {experiment ? (
          <>
            {/* Experiment info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span className="font-mono">{experiment.configName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {experiment.elapsedSeconds > 0 ? formatDuration(experiment.elapsedSeconds) : '—'}
              </span>
              <span className="font-mono text-muted-foreground">
                iter #{experiment.iteration}
              </span>
            </div>

            {/* Epoch progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Epoch Progress</span>
                <span className="font-mono text-foreground">
                  {lastRun?.epoch ?? 0}
                  <span className="text-muted-foreground">/{lastRun?.totalEpochs ?? experiment.epochs}</span>
                  <span className="text-muted-foreground ml-1">({epochProgress}%)</span>
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                    experiment.status === 'running'
                      ? 'bg-primary shadow-[0_0_8px_hsl(25_95%_53%/0.6)]'
                      : experiment.status === 'completed'
                        ? 'bg-green-500'
                        : experiment.status === 'failed'
                          ? 'bg-destructive'
                          : 'bg-muted-foreground'
                  }`}
                  style={{ width: `${epochProgress}%` }}
                />
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-2">
              <MetricChip
                label="gen_loss"
                value={lastRun ? formatScore(lastRun.genLoss) : '—'}
                color="text-primary"
              />
              <MetricChip
                label="disc_loss"
                value={lastRun ? formatScore(lastRun.discLoss) : '—'}
                color="text-amber-400"
              />
              <MetricChip
                label="mel_loss"
                value={lastRun ? formatScore(lastRun.melLoss) : '—'}
                color="text-cyan-400"
              />
            </div>

            {/* Chart */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Loss Curve
                </span>
                <div className="flex items-center gap-3 ml-auto text-[10px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-primary inline-block rounded" />gen</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-amber-400 inline-block rounded" />disc</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-cyan-400 inline-block rounded" />mel</span>
                </div>
              </div>
              {runsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <TrainingChart runs={runs} />
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Activity className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No experiments found.</p>
            <p className="text-xs text-muted-foreground/60">Create an experiment to see live training progress.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
