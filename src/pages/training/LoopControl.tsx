import { useState } from 'react'
import { Card, CardContent, Button, Badge, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, toast } from '@blinkdotnew/ui'
import { RotateCcw, Play, Square, CheckCircle, Clock, Zap } from 'lucide-react'

type StepStatus = 'pending' | 'running' | 'complete'

interface IterationStep {
  index: number
  status: StepStatus
}

function buildSteps(count: number, currentStep: number, running: boolean): IterationStep[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    status: i < currentStep
      ? 'complete'
      : i === currentStep && running
        ? 'running'
        : 'pending',
  }))
}

export function LoopControl() {
  const [cycles, setCycles] = useState('3')
  const [running, setRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null)

  const cycleCount = parseInt(cycles, 10)
  const steps = buildSteps(cycleCount, currentStep, running)

  function handleStart() {
    if (running) return
    setRunning(true)
    setCurrentStep(0)
    toast.success(`Iteration loop queued — ${cycles} cycles will run automatically`, {
      description: 'Each cycle trains, evaluates, and applies the next strategy.',
    })

    let step = 0
    const id = setInterval(() => {
      step += 1
      setCurrentStep(step)
      if (step >= cycleCount) {
        clearInterval(id)
        setRunning(false)
        setIntervalId(null)
        toast.success('Iteration loop complete', {
          description: `All ${cycleCount} cycles finished.`,
        })
      }
    }, 3000)
    setIntervalId(id)
  }

  function handleStop() {
    if (intervalId) clearInterval(intervalId)
    setIntervalId(null)
    setRunning(false)
    toast('Loop stopped', { description: 'Training loop was manually stopped.' })
  }

  function handleReset() {
    if (intervalId) clearInterval(intervalId)
    setIntervalId(null)
    setRunning(false)
    setCurrentStep(0)
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10">
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Iteration Loop Control</h3>
              <p className="text-xs text-muted-foreground">Run multiple self-improving cycles automatically</p>
            </div>
          </div>
          {running && (
            <Badge className="text-[10px] h-5 px-2 bg-primary/15 text-primary border-primary/30 animate-pulse-orange">
              <Zap className="h-2.5 w-2.5 mr-1" />
              RUNNING
            </Badge>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
          {steps.map((step, idx) => (
            <div key={step.index} className="flex items-center gap-1.5 shrink-0">
              <StepBubble step={step} />
              {idx < steps.length - 1 && (
                <div className={`h-px w-6 transition-colors duration-500 ${
                  step.status === 'complete' ? 'bg-primary' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Cycles:</span>
            <Select value={cycles} onValueChange={setCycles} disabled={running}>
              <SelectTrigger className="w-16 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['1', '2', '3', '4', '5'].map((n) => (
                  <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            onClick={handleStart}
            disabled={running}
          >
            <Play className="h-3.5 w-3.5" />
            Start Loop
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={handleStop}
            disabled={!running}
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground ml-auto"
            onClick={handleReset}
            disabled={running}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StepBubble({ step }: { step: IterationStep }) {
  if (step.status === 'complete') {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 border border-primary/40 transition-all duration-300">
        <CheckCircle className="h-4 w-4 text-primary" />
      </div>
    )
  }
  if (step.status === 'running') {
    return (
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary animate-pulse-orange">
        <span className="font-mono text-xs font-bold text-primary">{step.index}</span>
        <span className="absolute inset-0 rounded-full border border-primary/50 animate-ping opacity-60" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 border border-border">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  )
}
