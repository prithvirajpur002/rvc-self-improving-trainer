import { Button, Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions, Skeleton } from '@blinkdotnew/ui'
import { Play, Zap } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useExperiments, useDatasets, useRegistry, useBestModel, useStrategy } from '../lib/db'
import { DashboardStats } from './dashboard/DashboardStats'
import { DashboardCharts } from './dashboard/DashboardCharts'
import { DashboardExperimentsTable } from './dashboard/DashboardExperimentsTable'
import { DashboardSystemStatus } from './dashboard/DashboardSystemStatus'
import type { TrainingRun } from '../types'

// Placeholder training runs derived from experiments (best experiment's runs)
function useBestExperimentRuns(experiments: ReturnType<typeof useExperiments>['data']): TrainingRun[] {
  if (!experiments || experiments.length === 0) return []
  const best = [...experiments]
    .filter((e) => e.status === 'completed')
    .sort((a, b) => b.compositeScore - a.compositeScore)[0]
  if (!best) return []
  // Synthesise approximate loss curve from elapsed time & score as placeholder
  const steps = 5
  return Array.from({ length: steps }, (_, i) => ({
    id: `synth_${i}`,
    experimentId: best.id,
    epoch: Math.round((best.epochs / steps) * i),
    totalEpochs: best.epochs,
    genLoss: parseFloat((2.1 * Math.pow(0.55, i)).toFixed(4)),
    discLoss: 0,
    melLoss: 0,
    fmLoss: 0,
    checkpointPath: '',
    status: 'completed',
    gpuVramUsedGb: 0,
    loggedAt: best.createdAt,
  }))
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: experiments = [], isLoading: expLoading } = useExperiments()
  const { data: datasets = [],   isLoading: dsLoading }  = useDatasets()
  const { data: registry = [],   isLoading: regLoading } = useRegistry()
  const { data: bestModel = null }                        = useBestModel()
  const { data: strategy = null }                         = useStrategy()

  const isLoading = expLoading || dsLoading || regLoading
  const trainingRuns = useBestExperimentRuns(experiments)

  return (
    <Page>
      <PageHeader>
        <div className="flex flex-col gap-0.5">
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>Catalyst RVC — Self-Improving Training System</PageDescription>
        </div>
        <PageActions>
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Coming soon"
            className="gap-2 cursor-not-allowed opacity-60"
          >
            <Zap className="h-4 w-4" />
            Run Iteration
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => navigate({ to: '/experiments' })}
          >
            <Play className="h-4 w-4" />
            New Experiment
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody className="space-y-8 animate-fade-in">
        {/* ── Stats row ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <DashboardStats
            experiments={experiments}
            datasets={datasets}
            registry={registry}
            bestModel={bestModel}
            loading={isLoading}
          />
        )}

        {/* ── Charts row ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : (
          <DashboardCharts experiments={experiments} trainingRuns={trainingRuns} />
        )}

        {/* ── Recent Experiments ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Experiments
          </h2>
          {isLoading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : (
            <DashboardExperimentsTable experiments={experiments} loading={isLoading} />
          )}
        </section>

        {/* ── System Status ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            System Status
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : (
            <DashboardSystemStatus
              bestModel={bestModel}
              strategy={strategy}
              experiments={experiments}
            />
          )}
        </section>
      </PageBody>
    </Page>
  )
}
