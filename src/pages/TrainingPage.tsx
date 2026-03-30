import { useState } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions, Badge } from '@blinkdotnew/ui'
import { Cpu, Zap } from 'lucide-react'
import { useExperiments } from '../lib/db'
import { LoopControl } from './training/LoopControl'
import { ExperimentMonitor } from './training/ExperimentMonitor'
import { TerminalLog } from './training/TerminalLog'
import { ResourceMonitor } from './training/ResourceMonitor'

export default function TrainingPage() {
  const { data: experiments = [], isLoading } = useExperiments()

  // Default to most recently updated / running experiment
  const defaultId = (
    experiments.find((e) => e.status === 'running') ??
    experiments[0]
  )?.id ?? ''

  const [selectedId, setSelectedId] = useState<string>('')
  const activeId = selectedId || defaultId

  const activeExp = experiments.find((e) => e.id === activeId)
  const isRunning = activeExp?.status === 'running'
  const runningCount = experiments.filter((e) => e.status === 'running').length

  return (
    <Page>
      <PageHeader>
        <div className="flex flex-col gap-0.5">
          <PageTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Training Monitor
          </PageTitle>
          <PageDescription>Live training progress, iteration loops, and logs</PageDescription>
        </div>
        <PageActions>
          {runningCount > 0 && (
            <Badge className="h-6 px-2.5 text-xs bg-primary/15 text-primary border border-primary/30 animate-pulse-orange gap-1.5">
              <Zap className="h-3 w-3" />
              {runningCount} running
            </Badge>
          )}
        </PageActions>
      </PageHeader>

      <PageBody className="space-y-5 animate-fade-in">
        {/* ── Iteration Loop Control ── */}
        <LoopControl />

        {/* ── Main 3-column grid on large screens ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_220px]">
          {/* Left column: monitor + terminal */}
          <div className="flex flex-col gap-5 min-w-0">
            <ExperimentMonitor
              experiments={experiments}
              selectedId={activeId}
              onSelectId={setSelectedId}
              isLoading={isLoading}
            />

            {/* Terminal – fixed height on desktop */}
            <div className="h-72 lg:h-80">
              <TerminalLog
                logOutput={activeExp?.logOutput}
                isRunning={isRunning}
              />
            </div>
          </div>

          {/* Right column: resource monitor */}
          <div className="shrink-0">
            <ResourceMonitor
              lastRun={undefined}
            />
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
