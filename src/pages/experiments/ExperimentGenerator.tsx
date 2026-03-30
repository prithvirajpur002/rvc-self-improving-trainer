import { Card, CardHeader, CardTitle, CardContent, CardDescription, Badge, Button, Separator, toast } from '@blinkdotnew/ui'
import { Sparkles, Wand2 } from 'lucide-react'
import type { Experiment, Dataset } from '../../types'
import { formatScore, scoreColor, computeCompositeScore } from '../../lib/utils'

interface Suggestion {
  title: string
  rationale: string
  configName: string
  mode: string
  epochs: number
  datasetId: string
}

function generateSuggestions(datasets: Dataset[], experiments: Experiment[]): Suggestion[] {
  const completed = experiments.filter(e => e.status === 'completed')
  const last3 = completed.slice(0, 3)
  const latest = completed[0]
  const datasetId = datasets[0]?.id ?? ''

  const suggestions: Suggestion[] = []

  // Baseline variant
  suggestions.push({
    title: 'Baseline Variant',
    rationale: 'Standard baseline run to establish a fresh reference point.',
    configName: 'baseline',
    mode: 'clean',
    epochs: 200,
    datasetId,
  })

  // Rule: low naturalness → natural mode
  if (!latest || latest.naturalnessScore < 0.5) {
    const score = latest ? latest.naturalnessScore : 0
    suggestions.push({
      title: 'Naturalness Boost',
      rationale: `Naturalness score was ${formatScore(score)} — switching to natural mode to improve expressiveness.`,
      configName: 'baseline',
      mode: 'natural',
      epochs: latest?.epochs ?? 200,
      datasetId: latest?.datasetId ?? datasetId,
    })
  } else if (!latest || latest.identityScore < 0.5) {
    // Rule: low identity → more epochs
    const moreEpochs = (latest?.epochs ?? 200) + 100
    suggestions.push({
      title: 'Identity Strengthening',
      rationale: `Identity score was ${formatScore(latest?.identityScore ?? 0)} — increasing epochs to ${moreEpochs} for better speaker similarity.`,
      configName: 'baseline',
      mode: latest?.mode ?? 'clean',
      epochs: moreEpochs,
      datasetId: latest?.datasetId ?? datasetId,
    })
  } else if (!latest || latest.clarityScore < 0.5) {
    // Rule: low clarity → clean mode
    suggestions.push({
      title: 'Clarity Enhancement',
      rationale: `Clarity score was ${formatScore(latest?.clarityScore ?? 0)} — using clean mode to reduce artifacts.`,
      configName: 'baseline',
      mode: 'clean',
      epochs: latest?.epochs ?? 200,
      datasetId: latest?.datasetId ?? datasetId,
    })
  } else {
    // Rule: good score → high_quality config
    suggestions.push({
      title: 'High Quality Push',
      rationale: `Composite score was ${formatScore(latest?.compositeScore ?? 0)} — applying high_quality config to maximize output.`,
      configName: 'high_quality',
      mode: latest?.mode ?? 'natural',
      epochs: (latest?.epochs ?? 200) + 50,
      datasetId: latest?.datasetId ?? datasetId,
    })
  }

  // Third variant: modified epochs
  const epochVariant = latest ? latest.epochs + 100 : 300
  suggestions.push({
    title: 'Extended Training',
    rationale: `Increasing epochs to ${epochVariant} to allow the model more time to converge.`,
    configName: latest?.configName ?? 'baseline',
    mode: latest?.mode === 'raw' ? 'natural' : (latest?.mode ?? 'natural'),
    epochs: epochVariant,
    datasetId: latest?.datasetId ?? datasetId,
  })

  return suggestions.slice(0, 3)
}

interface Props {
  datasets: Dataset[]
  experiments: Experiment[]
  onAddExperiment: (s: Suggestion) => void
}

export default function ExperimentGenerator({ datasets, experiments, onAddExperiment }: Props) {
  const completed = experiments.filter(e => e.status === 'completed')
  const last3 = completed.slice(0, 3)
  const suggestions = generateSuggestions(datasets, experiments)
  const selectedDataset = datasets[0]

  const handleAddAll = () => {
    suggestions.forEach(s => onAddExperiment(s))
    toast.success('All suggestions queued!', { description: `${suggestions.length} experiments added to queue.` })
  }

  return (
    <div className="space-y-6">
      {/* Section A: Dataset Context */}
      <Card className="border-amber-500/20 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-amber-400 uppercase tracking-wider">A · Dataset Context</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDataset ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <span className="text-zinc-400">Name</span><span className="text-zinc-200 font-medium">{selectedDataset.name}</span>
              <span className="text-zinc-400">Quality Grade</span><span className="text-zinc-200">{selectedDataset.qualityGrade}</span>
              <span className="text-zinc-400">Segments</span><span className="text-zinc-200">{selectedDataset.totalSegments}</span>
              <span className="text-zinc-400">Avg SNR</span><span className="text-zinc-200">{selectedDataset.avgSnrDb?.toFixed(1)} dB</span>
            </div>
          ) : <p className="text-sm text-zinc-500">No datasets available yet.</p>}
        </CardContent>
      </Card>

      {/* Section B: Previous Results */}
      <Card className="border-amber-500/20 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-amber-400 uppercase tracking-wider">B · Previous Results</CardTitle>
        </CardHeader>
        <CardContent>
          {last3.length === 0 ? (
            <p className="text-sm text-zinc-500">No completed experiments yet. Run one to unlock smart suggestions.</p>
          ) : (
            <div className="space-y-2">
              {last3.map(exp => {
                const composite = computeCompositeScore(exp.naturalnessScore, exp.clarityScore, exp.identityScore)
                return (
                  <div key={exp.id} className="flex items-center justify-between text-sm py-1 border-b border-zinc-800 last:border-0">
                    <span className="font-mono text-zinc-400 text-xs">{exp.id.slice(0, 16)}…</span>
                    <span className="flex gap-2 font-mono text-xs">
                      <span className={scoreColor(exp.naturalnessScore)}>{formatScore(exp.naturalnessScore)}</span>
                      <span className="text-zinc-600">/</span>
                      <span className={scoreColor(exp.clarityScore)}>{formatScore(exp.clarityScore)}</span>
                      <span className="text-zinc-600">/</span>
                      <span className={scoreColor(exp.identityScore)}>{formatScore(exp.identityScore)}</span>
                      <span className="text-zinc-600">→</span>
                      <span className={`font-semibold ${scoreColor(composite)}`}>{formatScore(composite)}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section C: Generated Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-amber-400 uppercase tracking-wider font-semibold">C · Generated Experiments</h3>
          <Button size="sm" onClick={handleAddAll} className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate All
          </Button>
        </div>
        <div className="grid gap-3">
          {suggestions.map((s, i) => {
            const ds = datasets.find(d => d.id === s.datasetId)
            return (
              <Card key={i} className="border-zinc-700 bg-zinc-900 hover:border-amber-500/40 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Wand2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="font-semibold text-zinc-100 text-sm">{s.title}</span>
                        <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">{s.configName}</Badge>
                      </div>
                      <p className="text-xs text-zinc-400 mb-2 leading-relaxed">{s.rationale}</p>
                      <div className="flex gap-2 flex-wrap text-xs">
                        <span className="text-zinc-500">Dataset:</span><span className="text-zinc-300">{ds?.name ?? s.datasetId.slice(0, 10)}</span>
                        <Separator orientation="vertical" className="h-3 self-center bg-zinc-700" />
                        <span className="text-zinc-500">Mode:</span><span className="text-zinc-300">{s.mode}</span>
                        <Separator orientation="vertical" className="h-3 self-center bg-zinc-700" />
                        <span className="text-zinc-500">Epochs:</span><span className="text-zinc-300">{s.epochs}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { onAddExperiment(s); toast.success('Added to queue') }}
                      className="shrink-0 border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                      Add to Queue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
