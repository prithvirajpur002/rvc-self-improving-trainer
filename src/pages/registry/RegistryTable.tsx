import { DataTable, Badge, EmptyState, toast } from '@blinkdotnew/ui'
import { Trophy } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Registry } from '../../types'
import { useUpdateRegistry } from '../../lib/mutations'
import { formatScore, scoreColor, computeCompositeScore } from '../../lib/utils'

function StarRating({ id, rating }: { id: string; rating: number }) {
  const update = useUpdateRegistry(id)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => { update.mutateAsync({ humanRating: star }); toast.success(`Rated ${star} ★`) }}
          className={`text-base leading-none transition-colors hover:scale-110 ${star <= rating ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`}
        >★</button>
      ))}
    </div>
  )
}

interface Props { registry: Registry[]; loading?: boolean }

export function RegistryTable({ registry, loading }: Props) {
  const sorted = [...registry].sort((a, b) => b.compositeScore - a.compositeScore)

  const columns: ColumnDef<Registry>[] = [
    { id: 'rank', header: '#', cell: ({ row }) => <span className="text-muted-foreground font-mono text-xs w-6 inline-block">{row.index + 1}</span> },
    { accessorKey: 'experimentId', header: 'Experiment ID', cell: ({ row }) => <span className="font-mono text-xs text-zinc-300">{row.original.experimentId.slice(0, 16)}…</span> },
    { accessorKey: 'configName', header: 'Config', cell: ({ row }) => <Badge variant="outline" className="text-xs border-border">{row.original.configName}</Badge> },
    { accessorKey: 'datasetId', header: 'Dataset', cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.datasetId.slice(0, 10)}…</span> },
    {
      id: 'scores', header: 'N / C / I',
      cell: ({ row }) => {
        const r = row.original
        return (
          <span className="font-mono text-xs flex gap-0.5">
            <span className={scoreColor(r.naturalnessScore)}>{formatScore(r.naturalnessScore)}</span>
            <span className="text-zinc-600">/</span>
            <span className={scoreColor(r.clarityScore)}>{formatScore(r.clarityScore)}</span>
            <span className="text-zinc-600">/</span>
            <span className={scoreColor(r.identityScore)}>{formatScore(r.identityScore)}</span>
          </span>
        )
      },
    },
    {
      id: 'composite', header: 'Composite',
      cell: ({ row }) => {
        const s = computeCompositeScore(row.original.naturalnessScore, row.original.clarityScore, row.original.identityScore)
        return <span className={`font-mono font-bold ${scoreColor(s)}`}>{formatScore(s)}</span>
      },
    },
    { id: 'rating', header: 'Human Rating', cell: ({ row }) => <StarRating id={row.original.id} rating={row.original.humanRating ?? 0} /> },
    {
      id: 'status', header: 'Status',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.isBest === '1' && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 border text-xs">best</Badge>}
          {row.original.isProduction === '1' && <Badge className="bg-green-500/20 text-green-400 border-green-500/40 border text-xs">prod</Badge>}
          {row.original.isBest !== '1' && row.original.isProduction !== '1' && <Badge variant="outline" className="text-xs border-border text-muted-foreground">archived</Badge>}
        </div>
      ),
    },
  ]

  if (loading) return <div className="h-40 rounded-lg bg-muted animate-pulse" />
  if (sorted.length === 0) return <EmptyState icon={<Trophy />} title="No models registered" description="Register a completed experiment to see it here." />
  return <DataTable columns={columns} data={sorted} />
}
