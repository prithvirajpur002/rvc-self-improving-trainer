import { Card, CardHeader, CardTitle, CardContent } from '@blinkdotnew/ui'
import { AreaChart, BarChart } from '@blinkdotnew/ui'
import type { Experiment, TrainingRun } from '../../types'

const SAMPLE_LOSS = [
  { epoch: 0,   loss: 2.10 },
  { epoch: 50,  loss: 1.20 },
  { epoch: 100, loss: 0.80 },
  { epoch: 150, loss: 0.60 },
  { epoch: 200, loss: 0.48 },
]

const SAMPLE_SCORES = [
  { name: 'baseline', naturalness: 0.62, clarity: 0.58, identity: 0.55 },
  { name: 'high_q',   naturalness: 0.74, clarity: 0.71, identity: 0.68 },
  { name: 'tuned',    naturalness: 0.81, clarity: 0.78, identity: 0.73 },
]

interface Props {
  experiments: Experiment[]
  trainingRuns: TrainingRun[]
}

export function DashboardCharts({ experiments, trainingRuns }: Props) {
  const lossData =
    trainingRuns.length > 0
      ? trainingRuns.map((r) => ({ epoch: r.epoch, loss: Number(r.genLoss.toFixed(4)) }))
      : SAMPLE_LOSS

  const scoreData =
    experiments.length > 0
      ? experiments.slice(0, 6).map((e) => ({
          name: e.configName.slice(0, 10),
          naturalness: e.naturalnessScore,
          clarity: e.clarityScore,
          identity: e.identityScore,
        }))
      : SAMPLE_SCORES

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Loss chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Training Loss History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <AreaChart
            data={lossData}
            dataKey="loss"
            xAxisKey="epoch"
            height={220}
          />
        </CardContent>
      </Card>

      {/* Scores chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Experiment Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <BarChart
            data={scoreData}
            dataKey={['naturalness', 'clarity', 'identity']}
            xAxisKey="name"
            height={220}
            showLegend
          />
        </CardContent>
      </Card>
    </div>
  )
}
