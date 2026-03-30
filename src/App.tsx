import { lazy, Suspense, useState } from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  Button,
  toast,
} from '@blinkdotnew/ui'
import {
  LayoutDashboard,
  Database,
  FlaskConical,
  Cpu,
  Headphones,
  Trophy,
  Brain,
  Code2,
  Zap,
  Loader2,
} from 'lucide-react'
import { Shell } from './Shell'
import { blink } from './blink/client'
import { seedDemoData } from './lib/seed'
import { useExperiments } from './lib/db'

// ─── Lazy page imports ────────────────────────────────────────────────────────

const DashboardPage    = lazy(() => import('./pages/DashboardPage'))
const DatasetsPage     = lazy(() => import('./pages/DatasetsPage'))
const ExperimentsPage  = lazy(() => import('./pages/ExperimentsPage'))
const TrainingPage     = lazy(() => import('./pages/TrainingPage'))
const EvaluatePage     = lazy(() => import('./pages/EvaluatePage'))
const RegistryPage     = lazy(() => import('./pages/RegistryPage'))
const StrategyPage     = lazy(() => import('./pages/StrategyPage'))
const SourcePage       = lazy(() => import('./pages/SourcePage'))

// ─── Page fallback ────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <span className="text-sm">Loading…</span>
    </div>
  )
}

// ─── Nav item config ─────────────────────────────────────────────────────────

const PIPELINE_ITEMS = [
  { to: '/',            label: 'Dashboard',   icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/datasets',    label: 'Datasets',    icon: <Database        className="h-4 w-4" /> },
  { to: '/experiments', label: 'Experiments', icon: <FlaskConical    className="h-4 w-4" /> },
  { to: '/training',    label: 'Training',    icon: <Cpu             className="h-4 w-4" />, badgeKey: 'training' },
  { to: '/evaluate',    label: 'Evaluate',    icon: <Headphones      className="h-4 w-4" /> },
  { to: '/registry',    label: 'Registry',    icon: <Trophy          className="h-4 w-4" /> },
] as const

const SYSTEM_ITEMS = [
  { to: '/strategy', label: 'Strategy', icon: <Brain className="h-4 w-4" /> },
  { to: '/source',   label: 'Source',   icon: <Code2 className="h-4 w-4" /> },
] as const

// ─── Sidebar content ──────────────────────────────────────────────────────────

function AppSidebar() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const { data: runningExperiments } = useExperiments({ status: 'running' })
  const runningCount = runningExperiments?.length ?? 0

  const [seeding, setSeeding] = useState(false)

  async function handleSeed() {
    setSeeding(true)
    try {
      await seedDemoData(blink)
      toast.success('Demo data seeded!', {
        description: 'All tables populated with sample ML training data.',
      })
    } catch (err) {
      toast.error('Seed failed', {
        description: err instanceof Error ? err.message : 'Unknown error occurred.',
      })
    } finally {
      setSeeding(false)
    }
  }

  // Exact-match for "/" to avoid it matching all routes
  function isActive(to: string) {
    if (to === '/') return currentPath === '/'
    return currentPath.startsWith(to)
  }

  return (
    <Sidebar>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 shrink-0">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground leading-tight">
              Catalyst RVC
            </span>
            <span className="text-xs text-muted-foreground leading-tight truncate">
              Self-Improving Trainer
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>PIPELINE</SidebarGroupLabel>
          {PIPELINE_ITEMS.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              badge={'badgeKey' in item && item.badgeKey === 'training' && runningCount > 0 ? runningCount : undefined}
              href={item.to}
              active={isActive(item.to)}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>SYSTEM</SidebarGroupLabel>
          {SYSTEM_ITEMS.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              href={item.to}
              active={isActive(item.to)}
            />
          ))}
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <SidebarFooter>
        <div className="px-1 pb-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? (
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            ) : (
              <Zap className="h-3 w-3 mr-2 text-primary" />
            )}
            {seeding ? 'Seeding…' : 'Seed Demo Data'}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

// ─── Root layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  return (
    <Shell sidebar={<AppSidebar />} appName="Catalyst RVC">
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </Shell>
  )
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardPage />
    </Suspense>
  ),
})

const datasetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/datasets',
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <DatasetsPage />
    </Suspense>
  ),
})

const experimentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/experiments',
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <ExperimentsPage />
    </Suspense>
  ),
})

const trainingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/training',
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <TrainingPage />
    </Suspense>
  ),
})

const evaluateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/evaluate',
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <EvaluatePage />
    </Suspense>
  ),
})

const registryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/registry',
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <RegistryPage />
    </Suspense>
  ),
})

const strategyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/strategy',
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <StrategyPage />
    </Suspense>
  ),
})

const sourceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/source',
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <SourcePage />
    </Suspense>
  ),
})

// ─── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  datasetsRoute,
  experimentsRoute,
  trainingRoute,
  evaluateRoute,
  registryRoute,
  strategyRoute,
  sourceRoute,
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// ─── App entry ────────────────────────────────────────────────────────────────

export default function App() {
  return <RouterProvider router={router} />
}
