import { createClient, BlinkTable } from '@blinkdotnew/sdk'
import type {
  Dataset,
  Experiment,
  TrainingRun,
  Registry,
  Comparison,
  Strategy,
} from '../types'

// No auth required — security_policy has require_auth: false for db
export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID as string,
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY as string,
})

// Typed table accessors — the SDK Proxy supports blink.db.tableName at runtime,
// but TypeScript needs explicit types. Using blink.db.table<T>() is the proper
// typed path; these helpers centralise the casing so callers never repeat it.
export const tables = {
  datasets:     () => blink.db.table<Dataset>('datasets'),
  experiments:  () => blink.db.table<Experiment>('experiments'),
  trainingRuns: () => blink.db.table<TrainingRun>('training_runs'),
  registry:     () => blink.db.table<Registry>('registry'),
  comparisons:  () => blink.db.table<Comparison>('comparisons'),
  strategy:     () => blink.db.table<Strategy>('strategy'),
} satisfies Record<string, () => BlinkTable<unknown>>
