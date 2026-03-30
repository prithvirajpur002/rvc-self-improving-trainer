import type { createClient, BlinkTable } from '@blinkdotnew/sdk'
import { generateId, computeCompositeScore } from './utils'
import type { Dataset, Experiment, TrainingRun, Registry, Comparison, Strategy } from '../types'

type BlinkClient = ReturnType<typeof createClient>

const now = () => new Date().toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

// ─── Datasets ────────────────────────────────────────────────────────────────

async function seedDatasets(t: BlinkTable<Dataset>) {
  await t.createMany([
    {
      id: 'ds_v1_clean',   name: 'v1_clean',   mode: 'natural',
      inputDir: '/data/v1_clean',   totalSegments: 412, rejectedSegments: 38,
      totalDurationMin: 82.4,  avgSnrDb: 28.1, snrMin: 18.5, snrMax: 41.2,
      pitchVariance: 0.12, loudnessVariance: 0.08, silenceRatio: 0.14,
      segmentConsistency: 0.81, qualityGrade: 'B',
      analysisReport: JSON.stringify({ notes: 'Good base quality, minor noise in session 3' }),
      createdAt: daysAgo(14), updatedAt: daysAgo(14),
    },
    {
      id: 'ds_v2_natural', name: 'v2_natural', mode: 'natural',
      inputDir: '/data/v2_natural', totalSegments: 631, rejectedSegments: 22,
      totalDurationMin: 126.2, avgSnrDb: 33.7, snrMin: 24.1, snrMax: 46.8,
      pitchVariance: 0.09, loudnessVariance: 0.06, silenceRatio: 0.11,
      segmentConsistency: 0.89, qualityGrade: 'A',
      analysisReport: JSON.stringify({ notes: 'High quality natural speech, minimal artifacts' }),
      createdAt: daysAgo(7), updatedAt: daysAgo(7),
    },
    {
      id: 'ds_v3_studio',  name: 'v3_studio',  mode: 'studio',
      inputDir: '/data/v3_studio',  totalSegments: 298, rejectedSegments: 8,
      totalDurationMin: 59.6, avgSnrDb: 42.5, snrMin: 38.0, snrMax: 51.3,
      pitchVariance: 0.05, loudnessVariance: 0.03, silenceRatio: 0.09,
      segmentConsistency: 0.96, qualityGrade: 'A',
      analysisReport: JSON.stringify({ notes: 'Studio recording, excellent SNR, consistent levels' }),
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
  ])
}

// ─── Experiments ─────────────────────────────────────────────────────────────

async function seedExperiments(t: BlinkTable<Experiment>) {
  await t.createMany([
    {
      id: 'exp_001', name: 'Baseline Natural', datasetId: 'ds_v1_clean',
      configName: 'baseline', mode: 'natural', status: 'completed', iteration: 1,
      epochs: 200, batchSize: 6, sampleRate: 40000,
      naturalnessScore: 0.612, clarityScore: 0.589, identityScore: 0.541,
      compositeScore: computeCompositeScore(0.612, 0.589, 0.541),
      rmsDb: -18.4, peakDb: -3.2, crestDb: 15.2, silenceRatio: 0.13,
      modelPath: '/models/exp_001/model.pth', indexPath: '/models/exp_001/index.faiss',
      logOutput: 'Training completed. Epoch 200/200.', errorMsg: '',
      elapsedSeconds: 7820, source: 'manual', createdAt: daysAgo(13), updatedAt: daysAgo(13),
    },
    {
      id: 'exp_002', name: 'High Epochs v1', datasetId: 'ds_v1_clean',
      configName: 'high_epochs', mode: 'natural', status: 'completed', iteration: 1,
      epochs: 400, batchSize: 6, sampleRate: 40000,
      naturalnessScore: 0.648, clarityScore: 0.621, identityScore: 0.573,
      compositeScore: computeCompositeScore(0.648, 0.621, 0.573),
      rmsDb: -17.9, peakDb: -3.0, crestDb: 14.9, silenceRatio: 0.12,
      modelPath: '/models/exp_002/model.pth', indexPath: '/models/exp_002/index.faiss',
      logOutput: 'Training completed. Epoch 400/400.', errorMsg: '',
      elapsedSeconds: 15640, source: 'manual', createdAt: daysAgo(12), updatedAt: daysAgo(12),
    },
    {
      id: 'exp_003', name: 'Natural v2 Optimised', datasetId: 'ds_v2_natural',
      configName: 'optimised', mode: 'natural', status: 'completed', iteration: 2,
      epochs: 300, batchSize: 8, sampleRate: 40000,
      naturalnessScore: 0.791, clarityScore: 0.754, identityScore: 0.703,
      compositeScore: computeCompositeScore(0.791, 0.754, 0.703),
      rmsDb: -16.2, peakDb: -2.8, crestDb: 13.4, silenceRatio: 0.10,
      modelPath: '/models/exp_003/model.pth', indexPath: '/models/exp_003/index.faiss',
      logOutput: 'Training completed. Epoch 300/300. Best composite score achieved.',
      errorMsg: '', elapsedSeconds: 11250, source: 'auto',
      createdAt: daysAgo(6), updatedAt: daysAgo(6),
    },
    {
      id: 'exp_004', name: 'Natural v2 Large Batch', datasetId: 'ds_v2_natural',
      configName: 'large_batch', mode: 'natural', status: 'completed', iteration: 2,
      epochs: 300, batchSize: 16, sampleRate: 40000,
      naturalnessScore: 0.762, clarityScore: 0.731, identityScore: 0.689,
      compositeScore: computeCompositeScore(0.762, 0.731, 0.689),
      rmsDb: -16.8, peakDb: -2.9, crestDb: 13.9, silenceRatio: 0.11,
      modelPath: '/models/exp_004/model.pth', indexPath: '/models/exp_004/index.faiss',
      logOutput: 'Training completed. Epoch 300/300.', errorMsg: '',
      elapsedSeconds: 9840, source: 'auto', createdAt: daysAgo(5), updatedAt: daysAgo(5),
    },
    {
      id: 'exp_005', name: 'Studio v3 Baseline', datasetId: 'ds_v3_studio',
      configName: 'baseline', mode: 'studio', status: 'completed', iteration: 3,
      epochs: 200, batchSize: 6, sampleRate: 48000,
      naturalnessScore: 0.821, clarityScore: 0.809, identityScore: 0.778,
      compositeScore: computeCompositeScore(0.821, 0.809, 0.778),
      rmsDb: -14.1, peakDb: -2.1, crestDb: 12.0, silenceRatio: 0.08,
      modelPath: '/models/exp_005/model.pth', indexPath: '/models/exp_005/index.faiss',
      logOutput: 'Training completed. Epoch 200/200.', errorMsg: '',
      elapsedSeconds: 8100, source: 'auto', createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      id: 'exp_006', name: 'Studio v3 Running', datasetId: 'ds_v3_studio',
      configName: 'high_quality', mode: 'studio', status: 'running', iteration: 3,
      epochs: 400, batchSize: 8, sampleRate: 48000,
      naturalnessScore: 0, clarityScore: 0, identityScore: 0, compositeScore: 0,
      rmsDb: 0, peakDb: 0, crestDb: 0, silenceRatio: 0,
      modelPath: '', indexPath: '',
      logOutput: 'Training in progress. Epoch 87/400...', errorMsg: '',
      elapsedSeconds: 3200, source: 'auto', createdAt: daysAgo(0), updatedAt: now(),
    },
  ])
}

// ─── Training runs ────────────────────────────────────────────────────────────

function buildRuns(
  expId: string, totalEpochs: number, points: number, startLoss: number, endLoss: number,
): Omit<TrainingRun, never>[] {
  return Array.from({ length: points }, (_, i) => {
    const progress = i / (points - 1)
    const epoch = Math.round(1 + progress * (totalEpochs - 1))
    const loss = startLoss - (startLoss - endLoss) * (1 - Math.exp(-3 * progress))
    return {
      id: generateId('run'),
      experimentId: expId, epoch, totalEpochs,
      genLoss: parseFloat((loss + Math.random() * 0.02 - 0.01).toFixed(4)),
      discLoss: parseFloat((loss * 0.8 + Math.random() * 0.015).toFixed(4)),
      melLoss: parseFloat((loss * 1.1 + Math.random() * 0.025).toFixed(4)),
      fmLoss: parseFloat((loss * 0.6 + Math.random() * 0.01).toFixed(4)),
      checkpointPath: epoch % 50 === 0 ? `/models/${expId}/ckpt_${epoch}.pth` : '',
      status: 'completed',
      gpuVramUsedGb: parseFloat((8.2 + Math.random() * 1.4).toFixed(2)),
      loggedAt: new Date(Date.now() - (points - i) * 300_000).toISOString(),
    }
  })
}

async function seedTrainingRuns(t: BlinkTable<TrainingRun>) {
  const specs = [
    ['exp_001', 200, 12, 2.41, 1.18],
    ['exp_002', 400, 16, 2.38, 0.98],
    ['exp_003', 300, 14, 2.29, 0.72],
    ['exp_004', 300, 14, 2.35, 0.79],
    ['exp_005', 200, 12, 2.11, 0.61],
    ['exp_006', 400, 10, 2.18, 1.44],
  ] as const
  for (const [expId, totalEpochs, points, startLoss, endLoss] of specs) {
    await t.createMany(buildRuns(expId, totalEpochs, points, startLoss, endLoss))
  }
}

// ─── Registry ─────────────────────────────────────────────────────────────────

async function seedRegistry(t: BlinkTable<Registry>) {
  await t.createMany([
    {
      id: 'reg_001', experimentId: 'exp_003',
      modelPath: '/models/exp_003/model.pth', indexPath: '/models/exp_003/index.faiss',
      configName: 'optimised', datasetId: 'ds_v2_natural',
      naturalnessScore: 0.791, clarityScore: 0.754, identityScore: 0.703,
      compositeScore: computeCompositeScore(0.791, 0.754, 0.703),
      isBest: '1', isProduction: '1', humanRating: 5,
      humanNotes: 'Best naturalness, production approved.', registeredAt: daysAgo(5),
    },
    {
      id: 'reg_002', experimentId: 'exp_005',
      modelPath: '/models/exp_005/model.pth', indexPath: '/models/exp_005/index.faiss',
      configName: 'baseline', datasetId: 'ds_v3_studio',
      naturalnessScore: 0.821, clarityScore: 0.809, identityScore: 0.778,
      compositeScore: computeCompositeScore(0.821, 0.809, 0.778),
      isBest: '0', isProduction: '0', humanRating: 4,
      humanNotes: 'Excellent studio clarity. Pending full review.', registeredAt: daysAgo(1),
    },
    {
      id: 'reg_003', experimentId: 'exp_002',
      modelPath: '/models/exp_002/model.pth', indexPath: '/models/exp_002/index.faiss',
      configName: 'high_epochs', datasetId: 'ds_v1_clean',
      naturalnessScore: 0.648, clarityScore: 0.621, identityScore: 0.573,
      compositeScore: computeCompositeScore(0.648, 0.621, 0.573),
      isBest: '0', isProduction: '0', humanRating: 3,
      humanNotes: 'Archived baseline reference.', registeredAt: daysAgo(11),
    },
  ])
}

// ─── Comparisons ──────────────────────────────────────────────────────────────

async function seedComparisons(t: BlinkTable<Comparison>) {
  await t.createMany([
    {
      id: 'cmp_001', expAId: 'exp_001', expBId: 'exp_002', winnerId: 'exp_002',
      testName: 'iter1_baseline_vs_high_epochs', humanVote: 'exp_002',
      metricWinner: 'exp_002', notes: 'Higher epochs improved all metrics moderately.',
      comparedAt: daysAgo(11),
    },
    {
      id: 'cmp_002', expAId: 'exp_002', expBId: 'exp_003', winnerId: 'exp_003',
      testName: 'iter2_v1_vs_v2_dataset', humanVote: 'exp_003',
      metricWinner: 'exp_003', notes: 'Better dataset quality yielded significantly higher naturalness.',
      comparedAt: daysAgo(5),
    },
    {
      id: 'cmp_003', expAId: 'exp_003', expBId: 'exp_004', winnerId: 'exp_003',
      testName: 'iter2_batch_size_ablation', humanVote: 'exp_003',
      metricWinner: 'exp_003', notes: 'Smaller batch size (8) outperformed batch 16.',
      comparedAt: daysAgo(4),
    },
  ])
}

// ─── Strategy ─────────────────────────────────────────────────────────────────

async function seedStrategy(t: BlinkTable<Strategy>) {
  await t.createMany([
    {
      id: 'strat_001', iteration: 2,
      decisions: JSON.stringify([
        'Switch to v2_natural dataset (higher SNR, more segments)',
        'Reduce batch size from 6 to 8 for better gradient estimates',
        'Target 300 epochs based on iter-1 convergence curve',
      ]),
      nextConfig: JSON.stringify({ datasetId: 'ds_v2_natural', batchSize: 8, epochs: 300, configName: 'optimised' }),
      reasoning: 'Iter-1 showed dataset quality as bottleneck. v2_natural has 53% more segments and 5dB better SNR.',
      applied: '1', createdAt: daysAgo(7),
    },
    {
      id: 'strat_002', iteration: 3,
      decisions: JSON.stringify([
        'Adopt studio dataset (v3_studio) for highest signal quality',
        'Increase sample rate to 48kHz to capture studio fidelity',
        'Run ablation: baseline vs high_quality config in parallel',
        'Promote exp_003 to production while iter-3 trains',
      ]),
      nextConfig: JSON.stringify({ datasetId: 'ds_v3_studio', batchSize: 8, epochs: 400, sampleRate: 48000, configName: 'high_quality' }),
      reasoning: 'Studio dataset eliminates background noise entirely. Expected +0.05–0.08 composite score gain.',
      applied: '1', createdAt: daysAgo(2),
    },
  ])
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export async function seedDemoData(blinkClient: BlinkClient): Promise<void> {
  const db = blinkClient.db
  await seedDatasets(db.table<Dataset>('datasets'))
  await seedExperiments(db.table<Experiment>('experiments'))
  await seedTrainingRuns(db.table<TrainingRun>('training_runs'))
  await seedRegistry(db.table<Registry>('registry'))
  await seedComparisons(db.table<Comparison>('comparisons'))
  await seedStrategy(db.table<Strategy>('strategy'))
  console.info('[seed] Demo data seeded successfully.')
}
