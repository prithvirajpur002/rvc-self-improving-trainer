import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tables } from '../blink/client'
import { QK } from './db'
import { generateId, computeCompositeScore } from './utils'
import type {
  Dataset,
  Experiment,
  TrainingRun,
  Registry,
  Comparison,
  Strategy,
} from '../types'

// ─── Dataset mutations ───────────────────────────────────────────────────────

export function useCreateDataset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      return tables.datasets().create({ ...data, id: generateId('ds'), createdAt: now, updatedAt: now })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.datasets }),
  })
}

export function useUpdateDataset(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Dataset>) =>
      tables.datasets().update(id, { ...data, updatedAt: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.datasets }),
  })
}

// ─── Experiment mutations ────────────────────────────────────────────────────

export function useCreateExperiment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      return tables.experiments().create({ ...data, id: generateId('exp'), createdAt: now, updatedAt: now })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.experiments() }),
  })
}

export function useUpdateExperiment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Experiment>) =>
      tables.experiments().update(id, { ...data, updatedAt: new Date().toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.experiments() })
      qc.invalidateQueries({ queryKey: QK.experiment(id) })
    },
  })
}

// ─── Training run mutations ──────────────────────────────────────────────────

export function useAddTrainingRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<TrainingRun, 'id'>) =>
      tables.trainingRuns().create({ ...data, id: generateId('run') }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: QK.trainingRuns(variables.experimentId) }),
  })
}

// ─── Registry mutations ──────────────────────────────────────────────────────

export function useRegisterModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Registry, 'id' | 'registeredAt'>) => {
      const composite = data.compositeScore > 0
        ? data.compositeScore
        : computeCompositeScore(data.naturalnessScore, data.clarityScore, data.identityScore)

      // Find current best to decide if this one beats it
      const existing = await tables.registry().list({
        orderBy: { compositeScore: 'desc' },
        limit: 1,
      }) as Registry[]
      const isNewBest = existing.length === 0 || composite > Number(existing[0].compositeScore)

      // Demote prior best if needed
      if (isNewBest && existing.length > 0) {
        const prevBest = existing.find((r: Registry) => r.isBest === '1')
        if (prevBest) {
          await tables.registry().update(prevBest.id, { isBest: '0' })
        }
      }

      return tables.registry().create({
        ...data,
        id: generateId('reg'),
        compositeScore: composite,
        isBest: isNewBest ? '1' : '0',
        registeredAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.registry })
      qc.invalidateQueries({ queryKey: QK.bestModel })
    },
  })
}

export function useUpdateRegistry(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Pick<Registry, 'humanRating' | 'humanNotes' | 'isProduction' | 'isBest'>>) =>
      tables.registry().update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.registry })
      qc.invalidateQueries({ queryKey: QK.bestModel })
    },
  })
}

// ─── Comparison mutations ────────────────────────────────────────────────────

export function useCreateComparison() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Comparison, 'id' | 'comparedAt'>) =>
      tables.comparisons().create({
        ...data,
        id: generateId('cmp'),
        comparedAt: new Date().toISOString(),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.comparisons }),
  })
}

// ─── Strategy mutations ──────────────────────────────────────────────────────

export function useCreateStrategy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Strategy, 'id' | 'createdAt'>) =>
      tables.strategy().create({
        ...data,
        id: generateId('strat'),
        createdAt: new Date().toISOString(),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.strategy }),
  })
}
