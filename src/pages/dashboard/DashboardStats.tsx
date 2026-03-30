import { StatGroup, Stat } from '@blinkdotnew/ui'
import { FlaskConical, Database, Trophy, BarChart3 } from 'lucide-react'
import type { Experiment, Dataset, Registry } from '../../types'
import { formatScore } from '../../lib/utils'

interface Props {
  experiments: Experiment[]
  datasets: Dataset[]
  registry: Registry[]
  bestModel: Registry | null
  loading: boolean
}

export function DashboardStats({ experiments, datasets, registry, bestModel, loading }: Props) {
  const iterationSet = new Set(experiments.map((e) => e.iteration))
  const iterationCount = iterationSet.size

  const bestScore = bestModel?.compositeScore ?? registry[0]?.compositeScore ?? 0

  const completedCount = experiments.filter((e) => e.status === 'completed').length
  const trendVal = completedCount > 0 ? Math.round((completedCount / Math.max(experiments.length, 1)) * 100) : 0

  return (
    <StatGroup>
      <Stat
        label="Experiments"
        value={loading ? '—' : String(experiments.length)}
        trend={trendVal}
        trendLabel="completion rate"
        icon={<FlaskConical className="h-4 w-4" />}
      />
      <Stat
        label="Datasets"
        value={loading ? '—' : String(datasets.length)}
        icon={<Database className="h-4 w-4" />}
      />
      <Stat
        label="Best Score"
        value={loading ? '—' : bestScore > 0 ? formatScore(bestScore) : '—'}
        icon={<Trophy className="h-4 w-4" />}
      />
      <Stat
        label="Iterations"
        value={loading ? '—' : String(iterationCount)}
        icon={<BarChart3 className="h-4 w-4" />}
      />
    </StatGroup>
  )
}
