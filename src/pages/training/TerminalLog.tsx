import { useEffect, useRef, useState } from 'react'
import { Button } from '@blinkdotnew/ui'
import { Terminal, Copy, CheckCircle } from 'lucide-react'
import { toast } from '@blinkdotnew/ui'

const DEMO_LOGS = `[2024-01-15 14:23:01] INFO  Initializing RVC training pipeline v2.3.1
[2024-01-15 14:23:01] INFO  Loading dataset: studio_voice_v3 (4,820 segments)
[2024-01-15 14:23:03] INFO  Model architecture: SynthesizerTrnMs256NSFsid
[2024-01-15 14:23:03] INFO  Batch size: 16 | Sample rate: 40000 | Epochs: 200
[2024-01-15 14:23:04] INFO  GPU: NVIDIA RTX 4090 | VRAM: 24.0 GB
[2024-01-15 14:23:04] INFO  Mixed precision: fp16 enabled
[2024-01-15 14:23:05] INFO  ── Training started ──────────────────────────────
[2024-01-15 14:23:10] STEP  epoch=1/200  gen_loss=2.1034  disc_loss=1.8021  mel_loss=1.6102
[2024-01-15 14:23:24] STEP  epoch=5/200  gen_loss=1.8422  disc_loss=1.5810  mel_loss=1.3941
[2024-01-15 14:23:38] STEP  epoch=10/200 gen_loss=1.6115  disc_loss=1.3204  mel_loss=1.1820
[2024-01-15 14:24:12] STEP  epoch=20/200 gen_loss=1.3201  disc_loss=1.0811  mel_loss=0.9734
[2024-01-15 14:24:50] CKPT  Checkpoint saved: checkpoints/G_epoch20.pth
[2024-01-15 14:25:30] STEP  epoch=40/200 gen_loss=1.0742  disc_loss=0.8831  mel_loss=0.7810
[2024-01-15 14:26:14] STEP  epoch=60/200 gen_loss=0.8931  disc_loss=0.7243  mel_loss=0.6420
[2024-01-15 14:27:02] CKPT  Checkpoint saved: checkpoints/G_epoch60.pth
[2024-01-15 14:28:21] STEP  epoch=80/200 gen_loss=0.7524  disc_loss=0.6112  mel_loss=0.5401
[2024-01-15 14:29:40] STEP  epoch=100/200 gen_loss=0.6410  disc_loss=0.5201  mel_loss=0.4601
[2024-01-15 14:30:11] EVAL  Naturalness: 0.712 | Clarity: 0.698 | Identity: 0.654
[2024-01-15 14:30:11] INFO  Score improved: 0.641 → 0.692 (+0.051) ✓`

interface Props {
  logOutput?: string
  isRunning?: boolean
}

export function TerminalLog({ logOutput, isRunning = false }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const rawLog = logOutput && logOutput.trim().length > 0 ? logOutput : DEMO_LOGS
  const lines = rawLog.split('\n').filter(Boolean)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines.length])

  function handleCopy() {
    navigator.clipboard.writeText(rawLog).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function lineColor(line: string): string {
    if (line.includes('ERROR') || line.includes('FAIL')) return 'text-red-400'
    if (line.includes('WARN')) return 'text-yellow-400'
    if (line.includes('CKPT')) return 'text-amber-400'
    if (line.includes('EVAL') || line.includes('Score')) return 'text-cyan-400'
    if (line.includes('STEP')) return 'text-orange-300'
    if (line.includes('── ') || line.includes('──')) return 'text-orange-400/70'
    return 'text-green-400/80'
  }

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden border border-border">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <Terminal className="h-3.5 w-3.5 text-muted-foreground ml-2" />
          <span className="text-xs font-mono text-muted-foreground">training_output.log</span>
          {isRunning && (
            <span className="text-[10px] font-mono text-green-400 animate-pulse ml-1">● LIVE</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={handleCopy}
        >
          {copied
            ? <><CheckCircle className="h-3 w-3 text-green-400" /> Copied</>
            : <><Copy className="h-3 w-3" /> Copy</>
          }
        </Button>
      </div>

      {/* Log body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-[#0D1117] p-4 min-h-0"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="space-y-0.5">
          {lines.map((line, i) => (
            <div key={i} className={`font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all ${lineColor(line)}`}>
              {line}
            </div>
          ))}
          {isRunning && (
            <div className="font-mono text-[11px] text-green-400 flex items-center gap-0.5 mt-1">
              <span>$</span>
              <span className="w-2 h-3.5 bg-green-400 ml-0.5 animate-pulse inline-block" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
