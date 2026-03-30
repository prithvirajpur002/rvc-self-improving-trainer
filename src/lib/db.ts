import { useQuery } from '@tanstack/react-query'
import { tables } from '../blink/client'
import type {
  Dataset,
  Experiment,
  TrainingRun,
  Registry,
  Comparison,
  Strategy,
} from '../types'

// ─── Query keys ──────────────────────────────────────────────────────────────

export const QK = {
  datasets: ['datasets'] as const,
  experiments: (filters?: { status?: string }) =>
    filters?.status ? ['experiments', filters.status] : (['experiments'] as const),
  experiment: (id: string) => ['experiments', id] as const,
  trainingRuns: (experimentId: string) => ['training_runs', experimentId] as const,
  registry: ['registry'] as const,
  bestModel: ['registry', 'best'] as const,
  comparisons: ['comparisons'] as const,
  strategy: ['strategy'] as const,
}

// ─── Query hooks ─────────────────────────────────────────────────────────────

export function useDatasets() {
  return useQuery({
    queryKey: QK.datasets,
    queryFn: () =>
      tables.datasets().list({ orderBy: { createdAt: 'desc' } }) as Promise<Dataset[]>,
  })
}

export function useExperiments(filters?: { status?: string }) {
  return useQuery({
    queryKey: QK.experiments(filters),
    queryFn: () =>
      tables.experiments().list({
        where: filters?.status ? { status: filters.status } : undefined,
        orderBy: { createdAt: 'desc' },
      }) as Promise<Experiment[]>,
  })
}

export function useExperiment(id: string) {
  return useQuery({
    queryKey: QK.experiment(id),
    queryFn: () => tables.experiments().get(id) as Promise<Experiment | null>,
    enabled: Boolean(id),
  })
}

export function useTrainingRuns(experimentId: string) {
  return useQuery({
    queryKey: QK.trainingRuns(experimentId),
    queryFn: () =>
      tables.trainingRuns().list({
        where: { experimentId },
        orderBy: { epoch: 'asc' },
      }) as Promise<TrainingRun[]>,
    enabled: Boolean(experimentId),
  })
}

export function useRegistry() {
  return useQuery({
    queryKey: QK.registry,
    queryFn: () =>
      tables.registry().list({ orderBy: { registeredAt: 'desc' } }) as Promise<Registry[]>,
  })
}

export function useBestModel() {
  return useQuery({
    queryKey: QK.bestModel,
    queryFn: async () => {
      const entries = await tables.registry().list({
        where: { isBest: '1' },
        limit: 1,
      }) as Registry[]
      return entries[0] ?? null
    },
  })
}

export function useComparisons() {
  return useQuery({
    queryKey: QK.comparisons,
    queryFn: () =>
      tables.comparisons().list({ orderBy: { comparedAt: 'desc' } }) as Promise<Comparison[]>,
  })
}

export function useStrategy() {
  return useQuery({
    queryKey: QK.strategy,
    queryFn: async () => {
      const entries = await tables.strategy().list({
        orderBy: { iteration: 'desc' },
        limit: 1,
      }) as Strategy[]
      return entries[0] ?? null
    },
  })
}
