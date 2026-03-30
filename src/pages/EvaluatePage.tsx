import { useState } from 'react'
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Button, Card, CardHeader, CardTitle, CardContent,
  Badge, DataTable, EmptyState, Tabs, TabsList, TabsTrigger, TabsContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Separator, toast,
} from '@blinkdotnew/ui'
import { Headphones, ThumbsUp, Minus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useExperiments, useComparisons } from '../lib/db'
import { useCreateComparison } from '../lib/mutations'
import { formatScore, scoreColor, computeCompositeScore } from '../lib/utils'
import type { Comparison, Experiment } from '../types'

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-semibold ${color}`}>{formatScore(value)}</span>
      </div>
      <div className="score-bar"><div className="score-fill" style={{ width: `${value * 100}%`, background: value > 0.7 ? '#4ade80' : value > 0.4 ? '#facc15' : '#f87171' }} /></div>
    </div>
  )
}

function ExpCard({ label, experiments, selected, onSelect }: { label: string; experiments: Experiment[]; selected: string; onSelect: (id: string) => void }) {
  const exp = experiments.find(e => e.id === selected)
  return (
    <Card className="flex-1 bg-card border-border">
      <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-400">{label}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Select value={selected} onValueChange={onSelect}>
          <SelectTrigger className="bg-muted border-border text-xs"><SelectValue placeholder="Select experiment…" /></SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {experiments.map(e => <SelectItem key={e.id} value={e.id}><span className="font-mono text-xs">{e.id.slice(0, 16)}… ({e.configName})</span></SelectItem>)}
          </SelectContent>
        </Select>
        {exp && (
          <div className="space-y-2 pt-1">
            <ScoreBar label="Naturalness" value={exp.naturalnessScore} color={scoreColor(exp.naturalnessScore)} />
            <ScoreBar label="Clarity" value={exp.clarityScore} color={scoreColor(exp.clarityScore)} />
            <ScoreBar label="Identity" value={exp.identityScore} color={scoreColor(exp.identityScore)} />
            <Separator className="bg-border" />
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Composite</span><span className={`font-mono font-bold text-sm ${scoreColor(exp.compositeScore)}`}>{formatScore(computeCompositeScore(exp.naturalnessScore, exp.clarityScore, exp.identityScore))}</span></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function EvaluatePage() {
  const { data: experiments = [] } = useExperiments()
  const { data: comparisons = [], isLoading } = useComparisons()
  const createComparison = useCreateComparison()
  const [expA, setExpA] = useState('')
  const [expB, setExpB] = useState('')

  const vote = async (winner: 'A' | 'B' | 'tie') => {
    if (!expA || !expB) { toast.error('Select both experiments'); return }
    if (expA === expB) { toast.error('Select different experiments'); return }
    const winnerId = winner === 'A' ? expA : winner === 'B' ? expB : 'tie'
    await createComparison.mutateAsync({ expAId: expA, expBId: expB, winnerId, testName: 'human_eval', humanVote: winner.toLowerCase(), metricWinner: '', notes: '' })
    toast.success(`Voted: ${winner === 'tie' ? 'Tie' : `Experiment ${winner} wins!`}`)
    setExpA(''); setExpB('')
  }

  const matrixIds = [...new Set(comparisons.flatMap(c => [c.expAId, c.expBId]))].slice(0, 5)
  const cmpCols: ColumnDef<Comparison>[] = [
    { accessorKey: 'expAId', header: 'Exp A', cell: ({ row }) => <span className="font-mono text-xs text-zinc-400">{row.original.expAId.slice(0, 12)}…</span> },
    { accessorKey: 'expBId', header: 'Exp B', cell: ({ row }) => <span className="font-mono text-xs text-zinc-400">{row.original.expBId.slice(0, 12)}…</span> },
    { accessorKey: 'winnerId', header: 'Winner', cell: ({ row }) => <span className="font-mono text-xs text-amber-400">{row.original.winnerId.slice(0, 12)}{row.original.winnerId !== 'tie' ? '…' : ''}</span> },
    { accessorKey: 'testName', header: 'Test', cell: ({ row }) => <Badge variant="outline" className="text-xs border-border">{row.original.testName}</Badge> },
    { accessorKey: 'humanVote', header: 'Vote', cell: ({ row }) => <span className="text-sm">{row.original.humanVote === 'a' ? '🅰️' : row.original.humanVote === 'b' ? '🅱️' : '🤝'}</span> },
    { accessorKey: 'comparedAt', header: 'Date', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.comparedAt).toLocaleDateString()}</span> },
  ]

  const leaderboard = [...experiments].sort((a, b) => computeCompositeScore(b.naturalnessScore, b.clarityScore, b.identityScore) - computeCompositeScore(a.naturalnessScore, a.clarityScore, a.identityScore))
  const lbCols: ColumnDef<Experiment>[] = [
    { id: 'rank', header: '#', cell: ({ row }) => <span className="text-muted-foreground font-mono text-xs">{row.index + 1}</span> },
    { accessorKey: 'id', header: 'Experiment', cell: ({ row }) => <span className="font-mono text-xs text-zinc-300">{row.original.id.slice(0, 16)}…</span> },
    { accessorKey: 'configName', header: 'Config', cell: ({ row }) => <Badge variant="outline" className="text-xs border-border">{row.original.configName}</Badge> },
    { id: 'composite', header: 'Composite', cell: ({ row }) => { const s = computeCompositeScore(row.original.naturalnessScore, row.original.clarityScore, row.original.identityScore); return <span className={`font-mono font-bold ${scoreColor(s)}`}>{formatScore(s)}</span> } },
    { id: 'nat', header: 'Nat', cell: ({ row }) => <span className={`font-mono text-xs ${scoreColor(row.original.naturalnessScore)}`}>{formatScore(row.original.naturalnessScore)}</span> },
    { id: 'clar', header: 'Clar', cell: ({ row }) => <span className={`font-mono text-xs ${scoreColor(row.original.clarityScore)}`}>{formatScore(row.original.clarityScore)}</span> },
    { id: 'id', header: 'Id', cell: ({ row }) => <span className={`font-mono text-xs ${scoreColor(row.original.identityScore)}`}>{formatScore(row.original.identityScore)}</span> },
  ]

  return (
    <Page>
      <PageHeader>
        <div><PageTitle className="flex items-center gap-2"><Headphones className="h-5 w-5 text-amber-400" />Evaluate</PageTitle><PageDescription>Human-in-the-loop evaluation &amp; comparison</PageDescription></div>
      </PageHeader>
      <PageBody>
        <Tabs defaultValue="compare">
          <TabsList className="bg-muted border border-border"><TabsTrigger value="compare" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-900">A/B Compare</TabsTrigger><TabsTrigger value="history" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-900">Evaluation History</TabsTrigger><TabsTrigger value="analysis" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-900">Score Analysis</TabsTrigger></TabsList>

          <TabsContent value="compare" className="mt-4 space-y-4 animate-fade-in">
            <div className="flex gap-4 flex-col md:flex-row">
              <ExpCard label="Experiment A" experiments={experiments} selected={expA} onSelect={setExpA} />
              <div className="flex items-center justify-center text-2xl font-bold text-muted-foreground">VS</div>
              <ExpCard label="Experiment B" experiments={experiments} selected={expB} onSelect={setExpB} />
            </div>
            {expA && expB && expA !== expB && (
              <div className="flex gap-3 justify-center pt-2">
                <Button onClick={() => vote('A')} disabled={createComparison.isPending} className="bg-blue-600 hover:bg-blue-500 text-white gap-2"><ThumbsUp className="h-4 w-4" />Vote A</Button>
                <Button onClick={() => vote('tie')} disabled={createComparison.isPending} variant="outline" className="border-border gap-2"><Minus className="h-4 w-4" />Tie</Button>
                <Button onClick={() => vote('B')} disabled={createComparison.isPending} className="bg-purple-600 hover:bg-purple-500 text-white gap-2"><ThumbsUp className="h-4 w-4 rotate-180" />Vote B</Button>
              </div>
            )}
            {matrixIds.length > 0 && (
              <Card className="bg-card border-border mt-4">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Comparison Matrix</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <table className="text-xs w-full">
                      <thead><tr><th className="text-left text-muted-foreground p-1">Exp</th>{matrixIds.map(id => <th key={id} className="text-center text-muted-foreground p-1 font-mono">{id.slice(4, 10)}</th>)}</tr></thead>
                      <tbody>{matrixIds.map(rowId => <tr key={rowId}><td className="font-mono text-muted-foreground p-1">{rowId.slice(4, 10)}</td>{matrixIds.map(colId => { const c = comparisons.find(x => (x.expAId === rowId && x.expBId === colId) || (x.expAId === colId && x.expBId === rowId)); return <td key={colId} className="text-center p-1">{rowId === colId ? <span className="text-muted-foreground">—</span> : c ? (c.winnerId === rowId ? <span className="text-green-400">W</span> : c.winnerId === 'tie' ? <span className="text-yellow-400">T</span> : <span className="text-red-400">L</span>) : <span className="text-muted-foreground">·</span>}</td> })}</tr>)}</tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 animate-fade-in">
            {isLoading ? <div className="h-40 rounded-lg bg-muted animate-pulse" /> : comparisons.length === 0 ? <EmptyState icon={<Headphones />} title="No comparisons yet" description="Run an A/B comparison to see history here." /> : <DataTable columns={cmpCols} data={comparisons} />}
          </TabsContent>

          <TabsContent value="analysis" className="mt-4 space-y-6 animate-fade-in">
            {experiments.length === 0 ? <EmptyState icon={<Headphones />} title="No experiments" description="Run experiments to see score analysis." /> : <DataTable columns={lbCols} data={leaderboard} />}
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  )
}
