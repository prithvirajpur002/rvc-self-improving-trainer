import { Card, CardHeader, CardTitle, CardContent, Button } from '@blinkdotnew/ui'
import { Activity, Clock, Mic2, BarChart3, RefreshCw } from 'lucide-react'
import type { Dataset } from '../types'

interface Props {
  dataset: Dataset
}

function modeBadgeClass(mode: string) {
  if (mode === 'clean') return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  if (mode === 'natural') return 'bg-green-500/20 text-green-300 border-green-500/30'
  return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
}

function gradeBadgeClass(grade: string) {
  if (grade === 'A') return 'bg-green-500/20 text-green-300 border-green-500/30'
  if (grade === 'B') return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  if (grade === 'C') return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
}

function getRecommendations(ds: Dataset): string[] {
  const recs: string[] = []
  if (ds.avgSnrDb < 15) recs.push("⚠️ Low SNR: Consider 'clean' mode with Demucs + DeepFilter")
  if (ds.silenceRatio > 0.3) recs.push('⚠️ High silence: Check segmentation thresholds')
  if (ds.totalSegments < 20) recs.push('⚠️ Few segments: Add more recordings (aim for 10+ min)')
  if (ds.qualityGrade === 'A') recs.push("✅ Excellent quality: Use 'natural' or 'raw' mode")
  return recs
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground font-medium">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function DatasetCard({ dataset: ds }: Props) {
  const rejectionRate =
    ds.totalSegments > 0 ? (ds.rejectedSegments / ds.totalSegments) * 100 : 0
  const snrScore = Math.min(100, ((ds.avgSnrDb - 5) / 25) * 100)
  const consistencyScore = ds.segmentConsistency * 100
  const silenceScore = (1 - ds.silenceRatio) * 100
  const recs = getRecommendations(ds)
  const updatedAt = new Date(ds.updatedAt).toLocaleDateString()

  return (
    <Card className="bg-zinc-900/60 border-zinc-800 flex flex-col gap-0">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground leading-tight truncate">
            {ds.name}
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${modeBadgeClass(ds.mode)}`}>
              {ds.mode}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded border font-bold ${gradeBadgeClass(ds.qualityGrade)}`}>
              {ds.qualityGrade}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{ds.inputDir}</p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-0">
        {/* Mini stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <Mic2 className="h-3 w-3" />, label: 'Segments', value: String(ds.totalSegments) },
            { icon: <Clock className="h-3 w-3" />, label: 'Duration', value: `${ds.totalDurationMin.toFixed(1)}m` },
            { icon: <Activity className="h-3 w-3" />, label: 'Avg SNR', value: `${ds.avgSnrDb.toFixed(1)}dB` },
            { icon: <BarChart3 className="h-3 w-3" />, label: 'Rejected', value: `${rejectionRate.toFixed(0)}%` },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5 bg-zinc-800/60 rounded-md p-2">
              <span className="text-amber-400">{s.icon}</span>
              <span className="text-xs font-semibold text-foreground">{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Analysis metric bars */}
        <div className="space-y-2.5">
          <MetricBar label="SNR Quality" value={snrScore} />
          <MetricBar label="Segment Consistency" value={consistencyScore} />
          <MetricBar label="Silence Ratio (inverted)" value={silenceScore} />
        </div>

        {/* Recommendations */}
        {recs.length > 0 && (
          <div className="rounded-md bg-zinc-800/50 border border-zinc-700/50 p-2.5 space-y-1">
            {recs.map((r, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-snug">{r}</p>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
          <span className="text-[11px] text-muted-foreground">Updated {updatedAt}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-zinc-700 hover:border-amber-500/50 hover:text-amber-400">
            <RefreshCw className="h-3 w-3" />
            Run Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
