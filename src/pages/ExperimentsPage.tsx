import { useState } from 'react'
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions,
  Button, Card, CardContent, Badge, Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter, Input, Select, SelectTrigger,
  SelectContent, SelectItem, SelectValue, DataTable, EmptyState, toast,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@blinkdotnew/ui'
import { FlaskConical, Plus, Play, RotateCcw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useExperiments, useDatasets } from '../lib/db'
import { useCreateExperiment } from '../lib/mutations'
import { generateId, formatScore, scoreColor, statusColor, computeCompositeScore } from '../lib/utils'
import type { Experiment } from '../types'
import ExperimentGenerator from './experiments/ExperimentGenerator'

const CONFIGS = ['baseline', 'fast_test', 'high_quality']
const MODES = ['clean', 'natural', 'raw']

const modeColor: Record<string, string> = {
  clean: 'border-blue-500/50 text-blue-400',
  natural: 'border-green-500/50 text-green-400',
  raw: 'border-zinc-500/50 text-zinc-400',
}

function StatusBadge({ status }: { status: string }) {
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3 w-3" />,
    running: <Play className="h-3 w-3" />,
    completed: <CheckCircle className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
  }
  return (
    <Badge variant={statusColor(status)}
      className={status === 'running' ? 'animate-pulse bg-amber-500/20 text-amber-400 border-amber-500/50' : ''}>
      <span className="flex items-center gap-1">{icons[status]}{status}</span>
    </Badge>
  )
}

function CreateDialog({ datasets, onClose }: { datasets: ReturnType<typeof useDatasets>['data'], onClose: () => void }) {
  const create = useCreateExperiment()
  const [form, setForm] = useState({
    id: generateId('exp'), datasetId: '', configName: 'baseline',
    mode: 'clean', epochs: 200, batchSize: 8,
  })
  const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.datasetId) { toast.error('Select a dataset'); return }
    await create.mutateAsync({
      ...form, name: form.id, status: 'pending', iteration: 1,
      sampleRate: 40000, naturalnessScore: 0, clarityScore: 0, identityScore: 0,
      compositeScore: 0, rmsDb: 0, peakDb: 0, crestDb: 0, silenceRatio: 0,
      modelPath: '', indexPath: '', logOutput: '', errorMsg: '', elapsedSeconds: 0, source: 'manual',
    })
    toast.success('Experiment created!'); onClose()
  }

  return (
    <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-md">
      <DialogHeader><DialogTitle className="text-amber-400">New Experiment</DialogTitle></DialogHeader>
      <div className="space-y-3 py-2">
        <div><label className="text-xs text-zinc-400 mb-1 block">Experiment ID</label>
          <Input value={form.id} onChange={e => set('id', e.target.value)} className="bg-zinc-800 border-zinc-700 font-mono text-sm" /></div>
        <div><label className="text-xs text-zinc-400 mb-1 block">Dataset</label>
          <Select onValueChange={v => set('datasetId', v)}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue placeholder="Select dataset…" /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {(datasets ?? []).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-400 mb-1 block">Config</label>
            <Select defaultValue="baseline" onValueChange={v => set('configName', v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {CONFIGS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select></div>
          <div><label className="text-xs text-zinc-400 mb-1 block">Mode</label>
            <Select defaultValue="clean" onValueChange={v => set('mode', v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-400 mb-1 block">Epochs (50–500)</label>
            <Input type="number" min={50} max={500} value={form.epochs} onChange={e => set('epochs', +e.target.value)} className="bg-zinc-800 border-zinc-700" /></div>
          <div><label className="text-xs text-zinc-400 mb-1 block">Batch Size (2–16)</label>
            <Input type="number" min={2} max={16} value={form.batchSize} onChange={e => set('batchSize', +e.target.value)} className="bg-zinc-800 border-zinc-700" /></div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancel</Button>
        <Button onClick={handleSubmit} disabled={create.isPending} className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold">
          {create.isPending ? 'Creating…' : 'Create'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export default function ExperimentsPage() {
  const { data: experiments = [], isLoading } = useExperiments()
  const { data: datasets = [] } = useDatasets()
  const create = useCreateExperiment()
  const [dialogOpen, setDialogOpen] = useState(false)

  const dsMap = Object.fromEntries(datasets.map(d => [d.id, d.name]))

  const columns: ColumnDef<Experiment>[] = [
    { accessorKey: 'id', header: 'ID', cell: ({ row }) => <span className="font-mono text-xs text-zinc-400">{row.original.id.slice(0, 14)}…</span> },
    { accessorKey: 'datasetId', header: 'Dataset', cell: ({ row }) => <span className="text-sm text-zinc-300">{dsMap[row.original.datasetId] ?? '—'}</span> },
    { accessorKey: 'configName', header: 'Config', cell: ({ row }) => <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">{row.original.configName}</Badge> },
    { accessorKey: 'mode', header: 'Mode', cell: ({ row }) => <Badge variant="outline" className={`text-xs ${modeColor[row.original.mode] ?? ''}`}>{row.original.mode}</Badge> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: 'scores', header: 'N / C / I', cell: ({ row }) => {
        const e = row.original
        return <span className="font-mono text-xs flex gap-0.5">
          <span className={scoreColor(e.naturalnessScore)}>{formatScore(e.naturalnessScore)}</span>
          <span className="text-zinc-600">/</span>
          <span className={scoreColor(e.clarityScore)}>{formatScore(e.clarityScore)}</span>
          <span className="text-zinc-600">/</span>
          <span className={scoreColor(e.identityScore)}>{formatScore(e.identityScore)}</span>
        </span>
      }
    },
    {
      id: 'composite', header: 'Composite', cell: ({ row }) => {
        const s = computeCompositeScore(row.original.naturalnessScore, row.original.clarityScore, row.original.identityScore)
        return <span className={`font-mono text-sm font-semibold ${scoreColor(s)}`}>{formatScore(s)}</span>
      }
    },
    { accessorKey: 'iteration', header: 'Iter', cell: ({ row }) => <span className="text-zinc-400 text-sm">{row.original.iteration}</span> },
    {
      id: 'actions', header: '', cell: () => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs text-zinc-400 hover:text-zinc-100">Logs</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-zinc-400 hover:text-amber-400"><RotateCcw className="h-3 w-3" /></Button>
        </div>
      )
    },
  ]

  const handleGeneratorAdd = async (s: { title: string; configName: string; mode: string; epochs: number; datasetId: string }) => {
    if (!s.datasetId) { toast.error('No dataset available'); return }
    await create.mutateAsync({
      name: s.title, datasetId: s.datasetId, configName: s.configName, mode: s.mode,
      status: 'pending', iteration: 1, epochs: s.epochs, batchSize: 8, sampleRate: 40000,
      naturalnessScore: 0, clarityScore: 0, identityScore: 0, compositeScore: 0,
      rmsDb: 0, peakDb: 0, crestDb: 0, silenceRatio: 0,
      modelPath: '', indexPath: '', logOutput: '', errorMsg: '', elapsedSeconds: 0, source: 'generated',
    })
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-amber-400" />Experiments</PageTitle>
          <PageDescription>Manage and auto-generate training experiments.</PageDescription>
        </div>
        <PageActions>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold"><Plus className="h-4 w-4 mr-1.5" />Create Experiment</Button>
            </DialogTrigger>
            <CreateDialog datasets={datasets} onClose={() => setDialogOpen(false)} />
          </Dialog>
        </PageActions>
      </PageHeader>
      <PageBody>
        <Tabs defaultValue="all">
          <TabsList className="bg-zinc-800 border border-zinc-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-900">All Experiments</TabsTrigger>
            <TabsTrigger value="generator" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-900">Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {isLoading
              ? <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded bg-zinc-800 animate-pulse" />)}</div>
              : experiments.length === 0
                ? <EmptyState icon={<FlaskConical />} title="No experiments yet" description="Create your first experiment or use the Generator tab to get smart suggestions." action={{ label: 'Create Experiment', onClick: () => setDialogOpen(true) }} />
                : <DataTable columns={columns} data={experiments} searchable searchColumn="configName" />
            }
          </TabsContent>

          <TabsContent value="generator" className="mt-4">
            <ExperimentGenerator datasets={datasets} experiments={experiments} onAddExperiment={handleGeneratorAdd} />
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  )
}
