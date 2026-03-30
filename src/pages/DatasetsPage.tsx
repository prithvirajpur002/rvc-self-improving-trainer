import { useState } from 'react'
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions,
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  EmptyState, Skeleton, toast,
} from '@blinkdotnew/ui'
import { Database, Plus } from 'lucide-react'
import { useDatasets } from '../lib/db'
import { useCreateDataset } from '../lib/mutations'
import type { Dataset } from '../types'
import { DatasetCard } from './DatasetCard'

// ── Fake analysis generator ───────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function generateAnalysis(): Omit<Dataset, 'id' | 'name' | 'mode' | 'inputDir' | 'createdAt' | 'updatedAt'> {
  const avgSnrDb = rand(12, 25)
  const silenceRatio = rand(0.1, 0.4)
  const totalSegments = Math.round(rand(15, 60))
  const totalDurationMin = rand(5, 20)
  const segmentConsistency = rand(0.6, 1.0)

  let qualityGrade = 'C'
  if (avgSnrDb > 20 && silenceRatio < 0.2) qualityGrade = 'A'
  else if (avgSnrDb > 15) qualityGrade = 'B'

  const rejectedSegments = Math.round(totalSegments * rand(0.05, 0.25))
  const report = JSON.stringify({ avg_snr: avgSnrDb, silence_ratio: silenceRatio, total_segments: totalSegments })

  return {
    totalSegments,
    rejectedSegments,
    totalDurationMin,
    avgSnrDb,
    snrMin: avgSnrDb - rand(3, 8),
    snrMax: avgSnrDb + rand(3, 8),
    pitchVariance: rand(0.1, 0.6),
    loudnessVariance: rand(0.05, 0.4),
    silenceRatio,
    segmentConsistency,
    qualityGrade,
    analysisReport: report,
  }
}

// ── Add Dataset Dialog ────────────────────────────────────────────────────────

const MODE_OPTIONS = [
  { value: 'clean', label: 'Clean', desc: 'Demucs + DeepFilter noise removal' },
  { value: 'natural', label: 'Natural', desc: 'Minimal processing, preserve character' },
  { value: 'raw', label: 'Raw', desc: 'No preprocessing, use as-is' },
]

interface AddDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

function AddDatasetDialog({ open, onOpenChange }: AddDialogProps) {
  const [name, setName] = useState('')
  const [inputDir, setInputDir] = useState('')
  const [mode, setMode] = useState('natural')
  const createDataset = useCreateDataset()

  const handleSubmit = async () => {
    if (!name.trim() || !inputDir.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    await createDataset.mutateAsync({
      name: name.trim(),
      mode,
      inputDir: inputDir.trim(),
      ...generateAnalysis(),
    })
    toast.success('Dataset added', { description: `"${name.trim()}" analysis complete` })
    setName('')
    setInputDir('')
    setMode('natural')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Dataset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dataset Name</label>
            <Input
              placeholder="e.g. My Voice Dataset v1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Input Directory</label>
            <Input
              placeholder="/kaggle/input/rvc-voice-v1/"
              value={inputDir}
              onChange={(e) => setInputDir(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-foreground font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preprocessing Mode</label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {MODE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <div>
                      <span className="font-medium">{o.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{o.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={createDataset.isPending}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold"
          >
            {createDataset.isPending ? 'Analyzing…' : 'Add & Analyze'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DatasetsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: datasets = [], isLoading } = useDatasets()

  return (
    <Page>
      <PageHeader>
        <div className="flex flex-col gap-0.5">
          <PageTitle>Dataset Intelligence</PageTitle>
          <PageDescription>Analyze your voice datasets before training</PageDescription>
        </div>
        <PageActions>
          <Button
            size="sm"
            className="gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Dataset
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-72 rounded-lg bg-zinc-800/60" />
            ))}
          </div>
        ) : datasets.length === 0 ? (
          <EmptyState
            icon={<Database />}
            title="No datasets yet"
            description="Add your first voice dataset to begin analysis"
            action={{ label: 'Add Dataset', onClick: () => setDialogOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {datasets.map((ds) => (
              <DatasetCard key={ds.id} dataset={ds} />
            ))}
          </div>
        )}
      </PageBody>

      <AddDatasetDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Page>
  )
}
