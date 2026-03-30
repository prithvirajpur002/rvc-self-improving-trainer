// ─── Bug & Improvement Annotations ───────────────────────────────────────────

export type Severity = 'critical' | 'warning' | 'improvement' | 'info'

export interface Annotation {
  severity: Severity
  title: string
  detail: string
  fix?: string
}

export interface FileAnnotation {
  filename: string
  sizeKb: number
  purpose: string
  annotations: Annotation[]
  codeSnippet: string
}

export const FILE_ANNOTATIONS: FileAnnotation[] = [
  {
    filename: 'main.py',
    sizeKb: 8.4,
    purpose: 'Orchestrates the self-improving loop — runs experiments, collects results, triggers compare and strategy.',
    annotations: [
      {
        severity: 'warning',
        title: 'exec(open("main.py").read()) breaks relative imports',
        detail: '`_here = str(Path(__file__).parent)` returns the wrong path when exec\'d from a notebook context.',
        fix: 'Use `import importlib.util` or pass `_here` explicitly as a parameter.',
      },
      {
        severity: 'warning',
        title: 'No experiment ID format validation',
        detail: 'Spaces or special chars in experiment IDs break downstream file paths silently.',
        fix: 'Add: `assert re.match(r\'^[a-zA-Z0-9_-]+$\', exp_id)` before use.',
      },
      {
        severity: 'info',
        title: 'keep_ckpts logic is inverted',
        detail: '`keep_ckpts = "0"` means keep ALL in RVC, not latest. The condition mapping is flipped.',
        fix: 'Swap values: `"0"` → keep all, `"1"` → keep latest.',
      },
      {
        severity: 'improvement',
        title: 'RESULTS dict not persisted between crashes',
        detail: 'If the runner crashes after exp_003, all compare data is lost in memory.',
        fix: 'Write RESULTS to a JSON file after each experiment completes.',
      },
      {
        severity: 'improvement',
        title: 'build_test_clips picks only first 3 files',
        detail: 'No guarantee of clip variety — all may come from the same recording session/speaker state.',
        fix: 'Select clips stratified by duration quartile for representative evaluation.',
      },
    ],
    codeSnippet: `#!/usr/bin/env python3
"""
main.py — RVC Self-Improving Training Loop Orchestrator
Runs experiments end-to-end, collects metrics, drives strategy.
"""
import os, json, re, subprocess, shutil
from pathlib import Path
from typing import Dict, Any, List

# BUG: _here will resolve incorrectly when exec()'d from notebook
_here = str(Path(__file__).parent)

RESULTS: Dict[str, Any] = {}  # IMPROVEMENT: Not persisted — lost on crash

EXPERIMENT_CONFIGS = [
    {"id": "exp_001", "epochs": 200, "config": "baseline"},
    {"id": "exp_002", "epochs": 300, "config": "baseline"},
    {"id": "exp_003", "epochs": 200, "config": "high_quality"},
]

def build_test_clips(dataset_dir: str, n: int = 3) -> List[str]:
    """Pick test clips from dataset. IMPROVEMENT: only grabs first n sorted files."""
    wavs = sorted(Path(dataset_dir).glob("*.wav"))
    # BUG: no variety guarantee — picks first 3 alphabetically
    return [str(p) for p in wavs[:n]]

def run_experiment(config: Dict[str, Any]) -> Dict[str, float]:
    exp_id = config["id"]
    # WARNING: no validation — spaces in exp_id break paths
    # keep_ckpts logic BUG: "0" keeps ALL in RVC, not latest
    keep_ckpts = "0" if config.get("keep_ckpts", "all") == "latest" else "1"
    
    result = subprocess.run([
        "python", f"{_here}/train.py",
        "--exp_id", exp_id,
        "--epochs", str(config["epochs"]),
        "--keep_ckpts", keep_ckpts,
    ], capture_output=True, text=True)
    
    metrics = json.loads(result.stdout.strip().split("\\n")[-1])
    RESULTS[exp_id] = metrics  # lost if crash follows
    return metrics

def main():
    for cfg in EXPERIMENT_CONFIGS:
        metrics = run_experiment(cfg)
        print(f"[{cfg['id']}] composite={metrics.get('composite', 0):.3f}")
    
    import compare
    compare.save_comparison(RESULTS, output_dir=f"{_here}/runs/comparison")

if __name__ == "__main__":
    main()`,
  },
  {
    filename: 'preprocess.py',
    sizeKb: 12.1,
    purpose: 'Audio preprocessing pipeline — denoising with DeepFilterNet, source separation via Demucs, segmentation, and SNR filtering.',
    annotations: [
      {
        severity: 'critical',
        title: '_run_deepfilter re-initializes model on every call',
        detail: '`init_df()` loads the DeepFilter model from disk on each file (3-5s per call). For 1000-file datasets this adds hours of load time.',
        fix: 'Cache at module level: `_df_model = None; def get_df_model(): global _df_model; if _df_model is None: _df_model = init_df(); return _df_model`',
      },
      {
        severity: 'warning',
        title: '_segment() has no overlap between time chunks',
        detail: 'Hard cuts at segment boundaries create audible pops and discards phonemes that span chunk borders.',
        fix: 'Add 10% overlap between adjacent chunks and crossfade at boundaries.',
      },
      {
        severity: 'warning',
        title: '_run_demucs leaves htdemucs/ folder behind',
        detail: 'Cleanup only removes `*/{stem}` — the `htdemucs/` parent directory accumulates across runs consuming disk.',
        fix: 'Add: `shutil.rmtree(Path(tmp_dir) / "htdemucs", ignore_errors=True)`',
      },
      {
        severity: 'improvement',
        title: 'SNR check runs AFTER fade/segment (wasted work)',
        detail: 'Low-SNR files are processed through expensive fade and segmentation before being discarded.',
        fix: 'Move SNR filter to immediately after loading — before any processing step.',
      },
      {
        severity: 'improvement',
        title: 'gc.collect() not called inside segment loop',
        detail: 'For 1h+ audio files, memory pressure from numpy arrays builds across the full segment loop before GC runs.',
        fix: 'Call `gc.collect()` inside the per-segment loop, not just once at the end.',
      },
      {
        severity: 'info',
        title: 'PCM_16 subtype — quantization noise risk',
        detail: 'RVC expects 16-bit PCM at 40kHz (correct). High-dynamic-range sources may exhibit quantization noise.',
        fix: 'Consider `FLOAT` subtype for intermediate files; convert to PCM_16 only for final output.',
      },
    ],
    codeSnippet: `#!/usr/bin/env python3
"""
preprocess.py — Audio preprocessing pipeline for RVC training data.
Steps: denoise → separate → segment → SNR filter → fade → write
"""
import gc, shutil, numpy as np, soundfile as sf
from pathlib import Path
from df.enhance import init_df, enhance  # DeepFilterNet

# CRITICAL BUG: model re-initialized on every call (3-5s per file)
def _run_deepfilter(audio: np.ndarray, sr: int) -> np.ndarray:
    model, df_state, _ = init_df()  # ← loads from disk every call!
    return enhance(model, df_state, audio)

# FIX: cache at module level
# _df_model = None
# def get_df_model():
#     global _df_model
#     if _df_model is None:
#         _df_model, _df_state, _ = init_df()
#     return _df_model, _df_state

def _run_demucs(src: Path, tmp_dir: str, stem: str = "vocals") -> Path:
    import subprocess
    subprocess.run(["python", "-m", "demucs", "--two-stems", stem,
                    "-o", tmp_dir, str(src)], check=True)
    result = Path(tmp_dir) / "htdemucs" / src.stem / f"{stem}.wav"
    # WARNING: htdemucs/ parent NOT cleaned up after stem extraction
    # FIX: shutil.rmtree(Path(tmp_dir) / 'htdemucs', ignore_errors=True)
    return result

def _segment(audio: np.ndarray, sr: int, max_samp: int) -> list:
    """Chunk audio into segments. WARNING: no overlap — abrupt boundary cuts."""
    segments = []
    for start in range(0, len(audio), max_samp):  # BUG: stride == chunk (no overlap)
        chunk = audio[start:start + max_samp]
        segments.append(chunk)
    return segments

def process_file(src: Path, dst_dir: Path, cfg: dict) -> None:
    audio, sr = sf.read(str(src))
    
    # IMPROVEMENT: SNR check should be HERE, before any processing
    denoised = _run_deepfilter(audio, sr)  # expensive — wasted if SNR too low
    
    segments = _segment(denoised, sr, int(cfg["max_sec"] * sr))
    
    for i, seg in enumerate(segments):
        snr = _compute_snr(seg)
        if snr < cfg.get("min_snr_db", 20):
            continue  # too late — processing already done
        
        faded = _fade(seg, sr, ms=cfg.get("fade_ms", 10))
        out = dst_dir / f"{src.stem}_{i:04d}.wav"
        sf.write(str(out), faded, sr, subtype="PCM_16")
    
    gc.collect()  # IMPROVEMENT: call inside loop for large files`,
  },
  {
    filename: 'train.py',
    sizeKb: 9.7,
    purpose: 'Wraps RVC training subprocess — configures hyperparameters, launches training, finds best checkpoint, strips optimizer state.',
    annotations: [
      {
        severity: 'warning',
        title: 'capture_output=False swallows training crash details',
        detail: 'Silent RVC failures may return returncode=0 on some platforms, masking crashes.',
        fix: 'Use `capture_output=True` and add: `if result.returncode != 0: raise RuntimeError(result.stderr)`',
      },
      {
        severity: 'warning',
        title: '_find_best_checkpoint sorts by mtime — unreliable on NFS',
        detail: 'Google Drive / Colab networked filesystems have unreliable mtime, causing wrong checkpoint selection.',
        fix: 'Parse epoch number from filename as primary sort key; fall back to mtime only.',
      },
      {
        severity: 'improvement',
        title: '_strip_optimizer halves ALL weights including LayerNorm',
        detail: 'Using `.half()` on LayerNorm bias/weight loses precision needed for stable normalization.',
        fix: 'Only `.half()` conv and linear layer weights; keep normalization params as float32.',
      },
      {
        severity: 'improvement',
        title: 'No checkpoint validation after stripping',
        detail: 'Malformed .pth files (truncated writes) cause cryptic errors at inference time, not at save time.',
        fix: 'After saving, verify: `torch.load(dst_pth, map_location="cpu")` — catches truncated writes.',
      },
      {
        severity: 'info',
        title: '-c 0 flag disables GPU data cache',
        detail: 'Safe but 20-30% slower than cached mode for datasets under 5GB.',
        fix: 'Use `-c 1` for datasets < 5GB to enable GPU data caching.',
      },
    ],
    codeSnippet: `#!/usr/bin/env python3
"""
train.py — RVC training subprocess wrapper.
Configures params, launches training, finds + strips best checkpoint.
"""
import subprocess, torch
from pathlib import Path
from typing import Optional

RVC_TRAIN_SCRIPT = "rvc/train/train.py"

def launch_training(exp_id: str, epochs: int, batch_size: int = 8,
                    gpu_id: int = 0) -> subprocess.CompletedProcess:
    cmd = [
        "python", RVC_TRAIN_SCRIPT,
        "-e", exp_id,
        "-sr", "40k",
        "-f0", "1",
        "-bs", str(batch_size),
        "-g", str(gpu_id),
        "-te", str(epochs),
        "-se", "50",          # save every 50 epochs
        "-pg", "",            # no pretrained G
        "-pd", "",            # no pretrained D
        "-l", "0",            # not latest
        "-c", "0",            # WARNING: no GPU cache → 20-30% slower for <5GB datasets
        "-sw", "0",
        "-v", "v2",
    ]
    # WARNING: capture_output=False — crashes may be invisible (returncode=0 on some platforms)
    result = subprocess.run(cmd, capture_output=False, text=True)
    if result.returncode != 0:
        # FIX: should raise instead of just warning
        print(f"[WARN] Training exited {result.returncode}")
    return result

def _find_best_checkpoint(exp_dir: Path) -> Optional[Path]:
    """Find latest checkpoint. WARNING: mtime unreliable on NFS/Colab Drive."""
    ckpts = list(exp_dir.glob("G_*.pth"))
    if not ckpts:
        return None
    # BUG: sorts by mtime — wrong on network filesystems
    return max(ckpts, key=lambda p: p.stat().st_mtime)
    # FIX: parse epoch from filename first
    # return max(ckpts, key=lambda p: int(p.stem.split('_')[1]))

def _strip_optimizer(src_pth: Path, dst_pth: Path) -> None:
    """Strip optimizer state and half-precision weights for deployment."""
    ckpt = torch.load(str(src_pth), map_location="cpu")
    model_state = ckpt.get("model", ckpt)
    # IMPROVEMENT: .half() on ALL weights — loses precision for LayerNorm
    stripped = {k: v.half() for k, v in model_state.items()}
    torch.save({"model": stripped, "epoch": ckpt.get("epoch", 0)}, str(dst_pth))
    # IMPROVEMENT: no validation after save — add torch.load(dst_pth) check`,
  },
  {
    filename: 'evaluate.py',
    sizeKb: 7.2,
    purpose: 'Runs inference on test clips and computes audio quality metrics — MCD, UTMOS-proxy, crest factor, silence ratio.',
    annotations: [
      {
        severity: 'warning',
        title: 'build_test_clips is non-deterministic and biased',
        detail: 'First 3 sorted WAV files are often from the same recording session, making metrics identical across experiments.',
        fix: 'Select clips from different quartiles of the duration distribution.',
      },
      {
        severity: 'warning',
        title: 'Silence detection threshold is sample-value not dBFS',
        detail: '`np.abs(y) < 0.005` equates to ~-46 dBFS for normalized audio — misclassifies quiet speech as silence.',
        fix: 'Use `librosa.effects.split(y, top_db=40)` for dBFS-calibrated silence detection.',
      },
      {
        severity: 'improvement',
        title: 'crest_db used raw without normalization in scoring',
        detail: 'crest_db ranges 6-20dB but compare.py uses raw values — prevents fair cross-experiment weighting.',
        fix: 'Normalize: `crest_score = min(1.0, crest_db / 20.0)` before passing to compare.',
      },
      {
        severity: 'improvement',
        title: 'Missing test clips are silently skipped',
        detail: 'If a reference WAV is missing, the experiment silently produces fewer metrics with no alert.',
        fix: 'Log which clip was missing and suggest re-running `build_test_clips()`.',
      },
    ],
    codeSnippet: `#!/usr/bin/env python3
"""
evaluate.py — Inference + audio quality metrics for RVC experiment evaluation.
Metrics: MCD, crest factor (naturalness proxy), silence ratio, UTMOS-proxy.
"""
import numpy as np, librosa
from pathlib import Path
from typing import Dict, List, Optional

def build_test_clips(dataset_dir: str, n: int = 3) -> List[str]:
    """
    WARNING: non-deterministic — first n sorted files, often same session.
    FIX: select from duration quartiles for variety.
    """
    wavs = sorted(Path(dataset_dir).glob("*.wav"))
    return [str(p) for p in wavs[:n]]  # BUG: no variety guarantee

def _audio_metrics(y: np.ndarray, sr: int) -> Dict[str, float]:
    # WARNING: sample-value threshold, not dBFS
    # ~-46 dBFS — misclassifies quiet speech as silence for normalized audio
    silence_ratio = float(np.mean(np.abs(y) < 0.005))
    # FIX: use librosa.effects.split(y, top_db=40) for proper dBFS threshold
    
    rms = float(np.sqrt(np.mean(y ** 2)))
    peak = float(np.max(np.abs(y)))
    crest_db = 20 * np.log10(peak / (rms + 1e-9))
    # IMPROVEMENT: crest_db is raw — normalize before passing to compare.py
    # crest_score = min(1.0, crest_db / 20.0)
    
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))
    return {
        "silence_ratio": silence_ratio,
        "crest_db": float(crest_db),  # should be crest_score
        "zcr": zcr,
        "rms": rms,
    }

def evaluate_experiment(exp_id: str, model_path: str,
                         test_clips: List[str]) -> Dict[str, float]:
    all_metrics = []
    for clip in test_clips:
        if not Path(clip).exists():
            # IMPROVEMENT: silent skip — should log and suggest rebuild
            continue
        y, sr = librosa.load(clip, sr=None)
        metrics = _audio_metrics(y, sr)
        all_metrics.append(metrics)
    
    if not all_metrics:
        return {}
    
    aggregated = {k: float(np.mean([m[k] for m in all_metrics]))
                  for k in all_metrics[0]}
    return aggregated`,
  },
  {
    filename: 'compare.py',
    sizeKb: 5.8,
    purpose: 'Computes composite scores across experiments and generates comparison charts using matplotlib.',
    annotations: [
      {
        severity: 'improvement',
        title: 'Hardcoded score weight distribution (0.45/0.35/0.20)',
        detail: 'Weights for naturalness, identity, and audio quality are fixed in code — not configurable per project.',
        fix: 'Load weights from `config.json` or `strategy.json` with these values as defaults.',
      },
      {
        severity: 'improvement',
        title: 'matplotlib.use("Agg") called after pyplot import',
        detail: 'On headless environments (Kaggle, Colab), importing pyplot before setting backend triggers a display error.',
        fix: 'Move `matplotlib.use("Agg")` to BEFORE the `import matplotlib.pyplot as plt` line.',
      },
    ],
    codeSnippet: `#!/usr/bin/env python3
"""
compare.py — Composite scoring and chart generation for experiment comparison.
Aggregates naturalness, identity, and audio quality into a single rank.
"""
import matplotlib          # IMPROVEMENT: must set backend BEFORE pyplot import
matplotlib.use('Agg')      # ← this is correct position
import matplotlib.pyplot as plt
import numpy as np
from typing import Dict, Any

# IMPROVEMENT: hardcoded — should load from config.json or strategy.json
SCORE_WEIGHTS = {
    "naturalness": 0.45,   # FIX: make configurable
    "identity":    0.35,
    "audio_quality": 0.20,
}

def score_experiment(metrics: Dict[str, float],
                     weights: Dict[str, float] = SCORE_WEIGHTS) -> float:
    """Compute weighted composite score from eval metrics."""
    nat   = metrics.get("naturalness_score", 0.0)
    ident = metrics.get("identity_score", 0.0)
    qual  = metrics.get("audio_quality", 0.0)
    
    composite = (
        weights["naturalness"]    * nat   +
        weights["identity"]       * ident +
        weights["audio_quality"]  * qual
    )
    return round(composite, 4)

def save_comparison(results: Dict[str, Any], output_dir: str) -> str:
    """Render bar chart of composite scores per experiment."""
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    exp_ids = list(results.keys())
    scores  = [score_experiment(v) for v in results.values()]
    
    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.bar(exp_ids, scores, color="#f97316")
    ax.set_ylabel("Composite Score")
    ax.set_title("Experiment Comparison")
    ax.set_ylim(0, 1.0)
    
    for bar, score in zip(bars, scores):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                f"{score:.3f}", ha="center", va="bottom", fontsize=9)
    
    out_path = f"{output_dir}/comparison.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close(fig)
    return out_path`,
  },
  {
    filename: 'registry.py',
    sizeKb: 4.3,
    purpose: 'Maintains a JSON registry of deployed models — tracks composite scores, metadata, and exposes best-model queries.',
    annotations: [
      {
        severity: 'warning',
        title: 'get_best_model returns stale composite score',
        detail: 'Score is computed at registration time and never refreshed — retraining same ID with better params goes undetected.',
        fix: 'Add `registered_at` timestamp and warn if score is > 1 iteration old.',
      },
      {
        severity: 'improvement',
        title: 'Re-running same experiment_id creates duplicate entries',
        detail: 'Registry is append-only — no deduplication. The same ID appears multiple times after retrain.',
        fix: 'Implement upsert: check if `experiment_id` exists before appending.',
      },
      {
        severity: 'info',
        title: 'Whole-file JSON read/write on every operation',
        detail: 'Fine for < 100 experiments but reads and rewrites the full registry.json on every call.',
        fix: 'Consider per-experiment JSON files with an index file for large registries.',
      },
    ],
    codeSnippet: `#!/usr/bin/env python3
"""
registry.py — Model registry backed by registry.json.
Tracks deployed models with metadata and composite scores.
"""
import json
from pathlib import Path
from typing import Dict, Any, Optional, List

REGISTRY_PATH = Path("registry.json")

def _load() -> List[Dict[str, Any]]:
    """WARNING: reads full file on every operation — slow at scale."""
    if not REGISTRY_PATH.exists():
        return []
    return json.loads(REGISTRY_PATH.read_text())

def _save(entries: List[Dict[str, Any]]) -> None:
    """WARNING: rewrites full file on every operation."""
    REGISTRY_PATH.write_text(json.dumps(entries, indent=2))

def register_model(experiment_id: str, model_path: str,
                   composite_score: float, metadata: Dict[str, Any]) -> None:
    """
    IMPROVEMENT: append-only — duplicate entries created on retrain.
    FIX: check for existing experiment_id and upsert instead.
    """
    entries = _load()
    # BUG: no deduplication
    entries.append({
        "experiment_id": experiment_id,
        "model_path":    model_path,
        "composite_score": composite_score,
        "metadata":      metadata,
        # IMPROVEMENT: add "registered_at": datetime.utcnow().isoformat()
    })
    _save(entries)

def get_best_model() -> Optional[Dict[str, Any]]:
    """
    WARNING: returns stale score — computed at registration, never refreshed.
    If same exp_id is retrained with better params, old score persists.
    """
    entries = _load()
    if not entries:
        return None
    return max(entries, key=lambda e: e.get("composite_score", 0.0))

def list_models() -> List[Dict[str, Any]]:
    return sorted(_load(),
                  key=lambda e: e.get("composite_score", 0.0),
                  reverse=True)`,
  },
  {
    filename: 'utils.py',
    sizeKb: 3.9,
    purpose: 'Shared utilities — dataset hashing, structured logging with timestamps, elapsed time formatting.',
    annotations: [
      {
        severity: 'improvement',
        title: 'compute_dataset_hash uses size+mtime, not content',
        detail: 'Two datasets with identical sizes and mtimes (e.g. after a copy) appear as the same hash, silently skipping preprocessing.',
        fix: 'Use content hash (SHA-256) for datasets under 5GB; fall back to size+mtime for larger.',
      },
      {
        severity: 'improvement',
        title: 'Logger only timestamps the first line of multiline strings',
        detail: 'Tracebacks and multiline messages only get a `[timestamp]` prefix on the first line — hard to grep in log files.',
        fix: 'Split on newlines and prefix each line individually.',
      },
      {
        severity: 'info',
        title: 'elapsed_str does not show days for runs > 24h',
        detail: 'Long training runs (> 24h) display as huge hour counts (e.g. "73h 12m") instead of "3d 1h 12m".',
        fix: 'Add a days component: `days, rem = divmod(total_seconds, 86400)`',
      },
    ],
    codeSnippet: `#!/usr/bin/env python3
"""
utils.py — Shared utilities for the RVC self-improving trainer.
Includes: dataset hashing, structured logging, elapsed time formatting.
"""
import hashlib, os, time
from datetime import datetime
from pathlib import Path
from typing import List

def compute_dataset_hash(dataset_dir: str) -> str:
    """
    IMPROVEMENT: hashes size+mtime, NOT content.
    Identical sizes+mtimes after file copy → same hash → preprocessing skipped.
    FIX: use SHA-256 content hash for datasets < 5GB.
    """
    parts: List[str] = []
    for p in sorted(Path(dataset_dir).rglob("*.wav")):
        stat = p.stat()
        parts.append(f"{p.name}:{stat.st_size}:{stat.st_mtime}")  # BUG: not content
    return hashlib.md5("\\n".join(parts).encode()).hexdigest()

class Logger:
    def __init__(self, log_file: str):
        self.log_file = Path(log_file)
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        self._start = time.time()

    def _ts(self) -> str:
        return datetime.now().strftime("%H:%M:%S")

    def info(self, msg: str) -> None:
        """
        IMPROVEMENT: multiline strings only get timestamp on first line.
        Tracebacks become un-greppable in log files.
        FIX: prefix each line individually.
        """
        # BUG: only first line gets [timestamp]
        formatted = f"[{self._ts()}] {msg}"
        # FIX would be:
        # lines = msg.splitlines()
        # formatted = "\\n".join(f"[{self._ts()}] {l}" for l in lines)
        print(formatted)
        with self.log_file.open("a") as f:
            f.write(formatted + "\\n")

def elapsed_str(start_time: float) -> str:
    """
    INFO: does not handle runs > 24h — shows "73h 12m" instead of "3d 1h 12m".
    FIX: add days component.
    """
    total = int(time.time() - start_time)
    hours, rem  = divmod(total, 3600)
    minutes, _  = divmod(rem, 60)
    # FIX: days, hours = divmod(hours, 24) → "Xd Yh Zm"
    return f"{hours}h {minutes:02d}m"`,
  },
]

// Precomputed counts per file for badges
export function getCounts(file: FileAnnotation) {
  return {
    critical:    file.annotations.filter(a => a.severity === 'critical').length,
    warning:     file.annotations.filter(a => a.severity === 'warning').length,
    improvement: file.annotations.filter(a => a.severity === 'improvement').length,
    info:        file.annotations.filter(a => a.severity === 'info').length,
  }
}

export const TOTAL_COUNTS = FILE_ANNOTATIONS.reduce(
  (acc, f) => {
    const c = getCounts(f)
    acc.critical    += c.critical
    acc.warning     += c.warning
    acc.improvement += c.improvement
    acc.info        += c.info
    return acc
  },
  { critical: 0, warning: 0, improvement: 0, info: 0 }
)
