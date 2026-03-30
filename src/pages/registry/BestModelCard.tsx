import { Card, CardContent, Button, Badge, toast } from '@blinkdotnew/ui'
import { Copy, Rocket } from 'lucide-react'
import type { Registry } from '../../types'
import { useUpdateRegistry } from '../../lib/mutations'
import { formatScore, scoreColor } from '../../lib/utils'

interface Props { model: Registry }

export function BestModelCard({ model }: Props) {
  const update = useUpdateRegistry(model.id)

  const setProduction = async () => {
    await update.mutateAsync({ isProduction: '1' })
    toast.success('Set as production model!')
  }

  const copyPath = () => {
    navigator.clipboard.writeText(model.modelPath)
    toast.success('Model path copied!')
  }

  return (
    <Card className="bg-card border-amber-500/40 glow-orange animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-lg text-amber-400">Current Best Model</span>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 border text-xs">BEST</Badge>
              {model.isProduction === '1' && <Badge className="bg-green-500/20 text-green-400 border-green-500/40 border text-xs">PRODUCTION</Badge>}
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-1 truncate max-w-lg">{model.experimentId}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={copyPath} className="gap-2 border-border text-muted-foreground hover:text-foreground">
              <Copy className="h-3.5 w-3.5" />Copy Model Path
            </Button>
            {model.isProduction !== '1' && (
              <Button size="sm" onClick={setProduction} disabled={update.isPending} className="gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold">
                <Rocket className="h-3.5 w-3.5" />{update.isPending ? 'Setting…' : 'Set as Production'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
          {[
            { label: 'Naturalness', val: model.naturalnessScore },
            { label: 'Clarity', val: model.clarityScore },
            { label: 'Identity', val: model.identityScore },
            { label: 'Composite', val: model.compositeScore },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <div className={`text-3xl font-bold font-mono ${scoreColor(val)}`}>{formatScore(val)}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Model Path</p>
            <pre className="font-mono text-xs text-green-400 bg-muted rounded px-3 py-2 truncate">{model.modelPath || '(not set)'}</pre>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Index Path</p>
            <pre className="font-mono text-xs text-green-400 bg-muted rounded px-3 py-2 truncate">{model.indexPath || '(not set)'}</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
