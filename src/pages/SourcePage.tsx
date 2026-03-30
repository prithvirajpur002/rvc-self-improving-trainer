import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Card, CardContent, CardHeader, CardTitle,
  Badge, Tabs, TabsList, TabsTrigger, TabsContent, Separator,
} from '@blinkdotnew/ui'
import { Bug, AlertTriangle, Info, FileCode, Lightbulb, Shield, CheckCircle2 } from 'lucide-react'
import { FILE_ANNOTATIONS, TOTAL_COUNTS, getCounts, type Annotation, type Severity } from './source/annotations'
import { CodeViewer } from './source/CodeViewer'

// ─── Annotation severity config ───────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { icon: React.ReactNode; label: string; color: string; dot: string }> = {
  critical:    { icon: <Bug className="h-3.5 w-3.5" />,          label: 'Critical',     color: 'text-red-400',    dot: 'bg-red-500' },
  warning:     { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Warning',      color: 'text-amber-400',  dot: 'bg-amber-400' },
  improvement: { icon: <Lightbulb className="h-3.5 w-3.5" />,    label: 'Improvement',  color: 'text-sky-400',    dot: 'bg-sky-400' },
  info:        { icon: <Info className="h-3.5 w-3.5" />,          label: 'Info',         color: 'text-slate-400',  dot: 'bg-slate-400' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnnotationRow({ a }: { a: Annotation }) {
  const cfg = SEVERITY_CONFIG[a.severity]
  return (
    <div className="flex gap-3 py-3 group">
      <div className={`mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-current ${cfg.color} font-medium`}>
            {cfg.label}
          </Badge>
          <span className="text-sm font-medium text-foreground">{a.title}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{a.detail}</p>
        {a.fix && (
          <p className="text-xs font-mono text-green-400/80 leading-relaxed">
            <span className="text-green-500/60 mr-1">→</span>{a.fix}
          </p>
        )}
      </div>
    </div>
  )
}

function TabBadgeDot({ color, count }: { color: string; count: number }) {
  if (count === 0) return null
  return (
    <span className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-bold text-foreground ${color}`}>
      {count}
    </span>
  )
}

function SummaryCard() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-5 pb-4">
        <div className="flex flex-wrap items-start gap-6">
          {/* File count */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground leading-none">7</p>
              <p className="text-xs text-muted-foreground mt-0.5">Python files analyzed</p>
            </div>
          </div>

          <div className="w-px h-10 bg-border hidden sm:block" />

          {/* Severity breakdown */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">Critical</span>
              <span className="text-xs font-semibold text-red-400">{TOTAL_COUNTS.critical}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-muted-foreground">Warnings</span>
              <span className="text-xs font-semibold text-amber-400">{TOTAL_COUNTS.warning}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-xs text-muted-foreground">Improvements</span>
              <span className="text-xs font-semibold text-sky-400">{TOTAL_COUNTS.improvement}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-xs text-muted-foreground">Info</span>
              <span className="text-xs font-semibold text-slate-400">{TOTAL_COUNTS.info}</span>
            </div>
          </div>

          <div className="w-px h-10 bg-border hidden sm:block" />

          {/* Quality verdict */}
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs font-semibold text-green-400">Production-Ready with Enhancements</p>
              <p className="text-xs text-muted-foreground">No blockers — 1 critical perf issue</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SourcePage() {
  const tabIds = FILE_ANNOTATIONS.map(f => f.filename.replace('.', '_'))

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Python Source Viewer
          </PageTitle>
          <PageDescription>
            Static analysis of <a href="https://github.com/prithvirajpur002/RDP" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">github.com/prithvirajpur002/RDP</a> — bugs, warnings &amp; improvement notes
          </PageDescription>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          7 / 7 files analyzed
        </div>
      </PageHeader>

      <PageBody className="space-y-5 animate-fade-in">
        <SummaryCard />

        <Tabs defaultValue={tabIds[0]}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {FILE_ANNOTATIONS.map((file, idx) => {
              const counts = getCounts(file)
              return (
                <TabsTrigger
                  key={tabIds[idx]}
                  value={tabIds[idx]}
                  className="flex items-center gap-1.5 text-xs font-mono data-[state=active]:bg-card data-[state=active]:text-foreground"
                >
                  {file.filename}
                  {counts.critical > 0 && <TabBadgeDot color="bg-red-500" count={counts.critical} />}
                  {counts.warning > 0 && <TabBadgeDot color="bg-amber-400" count={counts.warning} />}
                  {counts.improvement > 0 && <TabBadgeDot color="bg-sky-500/80" count={counts.improvement} />}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {FILE_ANNOTATIONS.map((file, idx) => {
            const counts = getCounts(file)
            return (
              <TabsContent key={tabIds[idx]} value={tabIds[idx]} className="mt-4 space-y-4">
                {/* File header */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-mono text-primary flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        {file.filename}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground leading-relaxed">{file.purpose}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground font-mono">{file.sizeKb} KB</span>
                      <div className="flex gap-1.5">
                        {counts.critical > 0 && <Badge className="text-[10px] h-5 bg-red-500/15 text-red-400 border border-red-500/30">{counts.critical} critical</Badge>}
                        {counts.warning > 0 && <Badge className="text-[10px] h-5 bg-amber-400/15 text-amber-400 border border-amber-400/30">{counts.warning} warn</Badge>}
                        {counts.improvement > 0 && <Badge className="text-[10px] h-5 bg-sky-400/15 text-sky-400 border border-sky-400/30">{counts.improvement} improvements</Badge>}
                        {counts.info > 0 && <Badge className="text-[10px] h-5 bg-slate-400/15 text-slate-400 border border-slate-400/30">{counts.info} info</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Annotations */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Bug className="h-3.5 w-3.5" />
                      Annotations ({file.annotations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-1">
                    {file.annotations.map((a, i) => (
                      <div key={i}>
                        <AnnotationRow a={a} />
                        {i < file.annotations.length - 1 && <Separator className="bg-border/50" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Code viewer */}
                <CodeViewer code={file.codeSnippet} filename={file.filename} />
              </TabsContent>
            )
          })}
        </Tabs>
      </PageBody>
    </Page>
  )
}
