import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Card, CardContent,
} from '@blinkdotnew/ui'
import { Trophy, Star, Layers, Zap } from 'lucide-react'
import { useRegistry, useBestModel } from '../lib/db'
import { BestModelCard } from './registry/BestModelCard'
import { RegistryTable } from './registry/RegistryTable'

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold font-mono text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function RegistryPage() {
  const { data: registry = [], isLoading } = useRegistry()
  const { data: bestModel } = useBestModel()

  const totalModels = registry.length
  const bestScore = registry.length > 0
    ? Math.max(...registry.map(r => r.compositeScore)).toFixed(3)
    : '—'
  const productionCount = registry.filter(r => r.isProduction === '1').length

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />Model Registry
          </PageTitle>
          <PageDescription>Active model registry — always knows the best model</PageDescription>
        </div>
      </PageHeader>

      <PageBody className="space-y-6 animate-fade-in">
        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatPill icon={<Layers className="h-4 w-4" />} label="Total Models" value={totalModels} />
          <StatPill icon={<Star className="h-4 w-4" />} label="Best Composite" value={bestScore} />
          <StatPill icon={<Zap className="h-4 w-4" />} label="Production Models" value={productionCount} />
        </div>

        {/* ── Best Model Hero ── */}
        {bestModel && <BestModelCard model={bestModel} />}

        {/* ── Registry Table ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Registered Models</h2>
          <RegistryTable registry={registry} loading={isLoading} />
        </section>
      </PageBody>
    </Page>
  )
}
