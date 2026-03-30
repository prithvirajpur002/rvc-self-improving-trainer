import { Card, CardHeader, CardTitle, CardContent } from '@blinkdotnew/ui'
import { Activity, Trophy, Brain } from 'lucide-react'
import type { Registry, Strategy, Experiment } from '../../types'
import { formatScore, scoreColor } from '../../lib/utils'

interface Props {
  bestModel: Registry | null
  strategy: Strategy | null
  experiments: Experiment[]
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-mono text-xs font-semibold ${scoreColor(value)}`}>
        {value > 0 ? formatScore(value) : '—'}
      </span>
    </div>
  )
}

export function DashboardSystemStatus({ bestModel, strategy, experiments }: Props) {
  const lastRun = experiments
    .filter((e) => e.status === 'completed' || e.status === 'failed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

  const pending = experiments.filter((e) => e.status === 'pending').length

  const truncatedReasoning = strategy?.reasoning
    ? strategy.reasoning.slice(0, 150) + (strategy.reasoning.length > 150 ? '…' : '')
    : null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Pipeline Status */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4 text-primary" />
            Pipeline Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Last run</span>
            <span className="text-xs">
              {lastRun
                ? new Date(lastRun.updatedAt).toLocaleString()
                : <span className="text-muted-foreground">—</span>}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pending queue</span>
            <span className="font-mono text-xs font-semibold text-primary">
              {pending} job{pending !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`status-dot ${pending > 0 ? 'bg-primary animate-pulse-orange' : 'bg-muted-foreground'}`}
            />
            <span className="text-xs text-muted-foreground">
              {pending > 0 ? 'Jobs waiting' : 'Idle'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Best Model */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Trophy className="h-4 w-4 text-primary" />
            Best Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bestModel ? (
            <div className="space-y-0.5">
              <ScoreRow label="Naturalness" value={bestModel.naturalnessScore} />
              <ScoreRow label="Clarity" value={bestModel.clarityScore} />
              <ScoreRow label="Identity" value={bestModel.identityScore} />
              <div className="mt-2 border-t border-border pt-2">
                <ScoreRow label="Composite" value={bestModel.compositeScore} />
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground truncate">
                {bestModel.configName}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No model registered yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Strategy */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Brain className="h-4 w-4 text-primary" />
            Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strategy ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Iteration</span>
                <span className="font-mono text-xs font-semibold text-primary">
                  #{strategy.iteration}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {truncatedReasoning}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No strategy generated yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
