import { DataTable, EmptyState, Badge } from '@blinkdotnew/ui'
import { FlaskConical } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Experiment } from '../../types'
import { formatScore, statusColor } from '../../lib/utils'

const columns: ColumnDef<Experiment>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.id.slice(0, 8)}…
      </span>
    ),
  },
  {
    accessorKey: 'datasetId',
    header: 'Dataset',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.datasetId.slice(0, 10)}…</span>
    ),
  },
  {
    accessorKey: 'configName',
    header: 'Config',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.original.configName}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={statusColor(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: 'compositeScore',
    header: 'Score',
    cell: ({ row }) => {
      const s = row.original.compositeScore
      return s > 0 ? (
        <span className="font-mono text-sm font-semibold text-primary">
          {formatScore(s)}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    },
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground capitalize">{row.original.mode}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    ),
  },
]

interface Props {
  experiments: Experiment[]
  loading: boolean
}

export function DashboardExperimentsTable({ experiments, loading }: Props) {
  const recent = [...experiments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  if (!loading && experiments.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical />}
        title="No experiments yet"
        description="Create your first experiment to start training an RVC model."
      />
    )
  }

  return (
    <DataTable
      columns={columns}
      data={recent}
      loading={loading}
    />
  )
}
