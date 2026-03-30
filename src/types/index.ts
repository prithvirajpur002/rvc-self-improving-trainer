// TypeScript interfaces for all database tables.
// IDs are always strings. SQLite boolean columns (is_best, is_production, applied)
// are stored as "1"/"0" strings — query/filter with those string values.

export interface Dataset {
  id: string
  name: string
  mode: string                   // 'natural' | 'studio' | etc.
  inputDir: string
  totalSegments: number
  rejectedSegments: number
  totalDurationMin: number
  avgSnrDb: number
  snrMin: number
  snrMax: number
  pitchVariance: number
  loudnessVariance: number
  silenceRatio: number
  segmentConsistency: number
  qualityGrade: string           // 'A' | 'B' | 'C' | 'D' | 'unknown'
  analysisReport: string         // JSON string
  createdAt: string
  updatedAt: string
}

export interface Experiment {
  id: string
  name: string
  datasetId: string
  configName: string             // 'baseline' | 'high_quality' | etc.
  mode: string                   // 'natural' | 'studio'
  status: string                 // 'pending' | 'running' | 'completed' | 'failed'
  iteration: number
  epochs: number
  batchSize: number
  sampleRate: number
  naturalnessScore: number
  clarityScore: number
  identityScore: number
  compositeScore: number
  rmsDb: number
  peakDb: number
  crestDb: number
  silenceRatio: number
  modelPath: string
  indexPath: string
  logOutput: string
  errorMsg: string
  elapsedSeconds: number
  source: string                 // 'manual' | 'auto'
  createdAt: string
  updatedAt: string
}

export interface TrainingRun {
  id: string
  experimentId: string
  epoch: number
  totalEpochs: number
  genLoss: number
  discLoss: number
  melLoss: number
  fmLoss: number
  checkpointPath: string
  status: string                 // 'running' | 'completed' | 'failed'
  gpuVramUsedGb: number
  loggedAt: string
}

export interface Registry {
  id: string
  experimentId: string
  modelPath: string
  indexPath: string
  configName: string
  datasetId: string
  naturalnessScore: number
  clarityScore: number
  identityScore: number
  compositeScore: number
  isBest: string                 // SQLite boolean: "1" = true, "0" = false
  isProduction: string           // SQLite boolean: "1" = true, "0" = false
  humanRating: number            // 1–5 or 0 for unrated
  humanNotes: string
  registeredAt: string
}

export interface Comparison {
  id: string
  expAId: string
  expBId: string
  winnerId: string
  testName: string
  humanVote: string
  metricWinner: string
  notes: string
  comparedAt: string
}

export interface Strategy {
  id: string
  iteration: number
  decisions: string              // JSON string: string[]
  nextConfig: string             // JSON string: Record<string, unknown>
  reasoning: string
  applied: string                // SQLite boolean: "1" = true, "0" = false
  createdAt: string
}

// Parsed convenience types
export interface StrategyParsed extends Omit<Strategy, 'decisions' | 'nextConfig'> {
  decisions: string[]
  nextConfig: Record<string, unknown>
}
