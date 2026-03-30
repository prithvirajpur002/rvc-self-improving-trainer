import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions,
  Button, Card, CardContent, CardHeader, CardTitle, Badge, toast,
} from '@blinkdotnew/ui'
import { Brain, Zap, CheckCircle, Clock } from 'lucide-react'
import { tables } from '../blink/client'
import { useExperiments } from '../lib/db'
import { useCreateStrategy } from '../lib/mutations'
import type { Strategy } from '../types'

function useAllStrategies() {
  return useQuery({
    queryKey: ['strategy', 'all'],
    queryFn: () => tables.strategy().list({ orderBy: { iteration: 'desc' } }) as Promise<Strategy[]>,
  })
}

function parseJSON<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) } catch { return fallback }
}

interface Preview { iteration: number; reasoning: string; decisions: string[]; nextConfig: Record<string, unknown> }

function StrategyTimelineEntry({ strategy }: { strategy: Strategy }) {
  const decisions = parseJSON<string[]>(strategy.decisions, [])
  const nextConfig = parseJSON<Record<string, unknown>>(strategy.nextConfig, {})
  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: strategy.applied === '1' ? '#4ade80' : '#f59e0b', background: 'hsl(var(--background))' }}>
        {strategy.applied === '1' ? <CheckCircle className="h-2.5 w-2.5 text-green-400" /> : <Clock className="h-2.5 w-2.5 text-amber-400" />}
      </div>
      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border last:hidden" />
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm text-amber-400">Iteration {strategy.iteration}</CardTitle>
            <Badge className={strategy.applied === '1' ? 'bg-green-500/20 text-green-400 border-green-500/40 border text-xs' : 'bg-amber-500/20 text-amber-400 border-amber-500/40 border text-xs'}>
              {strategy.applied === '1' ? 'applied' : 'pending'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{new Date(strategy.createdAt).toLocaleString()}</span>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{strategy.reasoning}</p>
          {decisions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Decisions</p>
              <ul className="space-y-1">{decisions.map((d, i) => <li key={i} className="text-xs flex items-start gap-1.5"><span className="text-amber-400 mt-0.5">›</span><span className="text-foreground">{d}</span></li>)}</ul>
            </div>
          )}
          {Object.keys(nextConfig).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Next Config</p>
              <pre className="font-mono text-xs text-green-400 bg-muted rounded p-3 overflow-auto">{JSON.stringify(nextConfig, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function StrategyPage() {
  const { data: experiments = [] } = useExperiments()
  const { data: strategies = [], isLoading } = useAllStrategies()
  const createStrategy = useCreateStrategy()
  const [preview, setPreview] = useState<Preview | null>(null)

  const generatePreview = () => {
    const completed = experiments.filter(e => e.status === 'completed').slice(0, 3)
    const decisions: string[] = []
    const bestNat = completed.length ? Math.max(...completed.map(e => e.naturalnessScore)) : 0
    const bestId  = completed.length ? Math.max(...completed.map(e => e.identityScore)) : 0
    const bestComp = completed.length ? Math.max(...completed.map(e => e.compositeScore)) : 0
    if (bestNat < 0.6) decisions.push('Prioritize natural mode datasets')
    if (bestId < 0.5) decisions.push('Increase epochs by 100')
    if (bestComp > 0.7) decisions.push('Use high_quality config for next run')
    if (decisions.length === 0) decisions.push('Continue with current configuration')
    const nextConfig: Record<string, unknown> = { configName: bestComp > 0.7 ? 'high_quality' : 'baseline', epochs: bestId < 0.5 ? 300 : 200, mode: bestNat < 0.6 ? 'natural' : 'clean', batchSize: 8 }
    const iteration = (strategies[0]?.iteration ?? 0) + 1
    setPreview({ iteration, reasoning: `Analyzed ${completed.length} completed experiments. Best composite: ${bestComp.toFixed(3)}. Best naturalness: ${bestNat.toFixed(3)}. Recommending adjustments for iteration ${iteration}.`, decisions, nextConfig })
  }

  const applyStrategy = async () => {
    if (!preview) return
    await createStrategy.mutateAsync({ iteration: preview.iteration, reasoning: preview.reasoning, decisions: JSON.stringify(preview.decisions), nextConfig: JSON.stringify(preview.nextConfig), applied: '0' })
    toast.success('Strategy created!', { description: `Iteration ${preview.iteration} strategy saved.` })
    setPreview(null)
  }

  const latest = strategies[0]

  return (
    <Page>
      <PageHeader>
        <div><PageTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-amber-400" />Decision Engine</PageTitle><PageDescription>Strategy timeline and AI-driven training decisions</PageDescription></div>
        <PageActions>
          <Button onClick={generatePreview} disabled={createStrategy.isPending} className="gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold"><Zap className="h-4 w-4" />Generate Strategy</Button>
        </PageActions>
      </PageHeader>

      <PageBody className="space-y-6 animate-fade-in">
        {/* ── Preview card ── */}
        {preview && (
          <Card className="border-amber-500/50 bg-amber-500/5 glow-orange">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-amber-400">Preview — Iteration {preview.iteration}</CardTitle>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setPreview(null)} className="border-border text-muted-foreground">Discard</Button><Button size="sm" onClick={applyStrategy} disabled={createStrategy.isPending} className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold">{createStrategy.isPending ? 'Saving…' : 'Apply Strategy'}</Button></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{preview.reasoning}</p>
              <ul className="space-y-1">{preview.decisions.map((d, i) => <li key={i} className="text-xs flex items-start gap-1.5"><span className="text-amber-400">›</span><span>{d}</span></li>)}</ul>
            </CardContent>
          </Card>
        )}

        {/* ── Latest config JSON ── */}
        {latest && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest Strategy Config</h2>
            <pre className="font-mono text-xs text-green-400 bg-muted rounded-lg p-4 overflow-auto border border-border">{JSON.stringify(parseJSON(latest.nextConfig, {}), null, 2)}</pre>
          </section>
        )}

        {/* ── Timeline ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategy Timeline</h2>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />)}</div>
          ) : strategies.length === 0 ? (
            <Card className="bg-card border-border"><CardContent className="py-12 text-center"><Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No strategies yet. Click Generate Strategy to analyze experiments.</p></CardContent></Card>
          ) : (
            <div className="relative">{strategies.map(s => <StrategyTimelineEntry key={s.id} strategy={s} />)}</div>
          )}
        </section>
      </PageBody>
    </Page>
  )
}
