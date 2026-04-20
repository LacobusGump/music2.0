#!/usr/bin/env python3
"""
Sleep-EDF Transition Rate Analysis
===================================
Downloads one PSG recording from the Sleep-EDF database (PhysioNet),
computes a spectral transition rate metric, and tests whether it
tracks sleep stages.

Hypothesis: W > N1 > N2 > REM > N3 transition rates.
"""

import os
import numpy as np
from scipy import signal
from scipy import stats
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

# ─── Step 1: Download the data ──────────────────────────────────────
print("=" * 70)
print("STEP 1: Downloading Sleep-EDF data from PhysioNet")
print("=" * 70)

DATA_DIR = "/Users/jamesmccandless/gump/sleep_edf_data"
os.makedirs(DATA_DIR, exist_ok=True)

# We'll use wfdb to download from PhysioNet
# The Sleep-EDF Expanded database is at: sleep-edfx/1.0.0
# Subject SC4001: SC4001E0-PSG.edf (PSG) and SC4001EH-Hypnogram.edf (stages)
import urllib.request

BASE_URL = "https://physionet.org/files/sleep-edfx/1.0.0/sleep-cassette/"

files_to_download = [
    "SC4001E0-PSG.edf",
    "SC4001EC-Hypnogram.edf",  # C suffix = cassette hypnogram
]

for fname in files_to_download:
    fpath = os.path.join(DATA_DIR, fname)
    if os.path.exists(fpath):
        print(f"  Already downloaded: {fname}")
    else:
        url = BASE_URL + fname
        print(f"  Downloading: {url}")
        try:
            urllib.request.urlretrieve(url, fpath)
            fsize = os.path.getsize(fpath) / (1024 * 1024)
            print(f"  Saved: {fpath} ({fsize:.1f} MB)")
        except Exception as e:
            print(f"  ERROR downloading {fname}: {e}")
            # Try alternate naming
            raise

# ─── Step 2: Load the EEG channel (Fpz-Cz) ─────────────────────────
print("\n" + "=" * 70)
print("STEP 2: Loading EEG data (Fpz-Cz channel)")
print("=" * 70)

import pyedflib

psg_path = os.path.join(DATA_DIR, "SC4001E0-PSG.edf")
hyp_path = os.path.join(DATA_DIR, "SC4001EC-Hypnogram.edf")

# Load PSG
f = pyedflib.EdfReader(psg_path)
n_channels = f.signals_in_file
channel_labels = f.getSignalLabels()
print(f"  Channels ({n_channels}): {channel_labels}")

# Find Fpz-Cz
eeg_idx = None
for i, label in enumerate(channel_labels):
    if 'Fpz' in label or 'fpz' in label.lower():
        eeg_idx = i
        break

if eeg_idx is None:
    # Fallback: use first EEG channel
    eeg_idx = 0
    print(f"  WARNING: Fpz-Cz not found, using channel 0: {channel_labels[0]}")
else:
    print(f"  Using channel {eeg_idx}: {channel_labels[eeg_idx]}")

fs = f.getSampleFrequency(eeg_idx)
eeg_data = f.readSignal(eeg_idx)
duration_sec = len(eeg_data) / fs
print(f"  Sample rate: {fs} Hz")
print(f"  Duration: {duration_sec:.0f} s ({duration_sec/3600:.1f} hours)")
print(f"  Samples: {len(eeg_data)}")
f.close()

# ─── Load hypnogram annotations ─────────────────────────────────────
print("\n  Loading hypnogram annotations...")

h = pyedflib.EdfReader(hyp_path)
annotations = h.readAnnotations()
h.close()

# annotations is a tuple of (onsets, durations, texts)
onsets = annotations[0]      # in seconds
durations = annotations[1]   # in seconds
texts = annotations[2]       # stage labels

# Map annotation text to standard stage labels
stage_map = {
    'Sleep stage W': 'W',
    'Sleep stage 1': 'N1',
    'Sleep stage 2': 'N2',
    'Sleep stage 3': 'N3',
    'Sleep stage 4': 'N3',  # N3 and N4 are both "deep sleep"
    'Sleep stage R': 'REM',
    'Sleep stage ?': '?',
    'Movement time': 'MT',
}

# Build epoch-level stage array (30-second epochs)
epoch_duration = 30  # seconds
n_epochs = int(duration_sec // epoch_duration)
stages = np.full(n_epochs, '', dtype='U4')

for onset, dur, text in zip(onsets, durations, texts):
    stage_label = stage_map.get(text, '?')
    start_epoch = int(onset // epoch_duration)
    n_stage_epochs = int(dur // epoch_duration)
    for e in range(n_stage_epochs):
        idx = start_epoch + e
        if 0 <= idx < n_epochs:
            stages[idx] = stage_label

# Count stages
unique, counts = np.unique(stages[stages != ''], return_counts=True)
print(f"  Total epochs: {n_epochs}")
print(f"  Stage distribution:")
for s, c in zip(unique, counts):
    print(f"    {s:>3}: {c:>4} epochs ({c*30/60:.0f} min)")

# ─── Step 3: Compute Transition Rate ────────────────────────────────
print("\n" + "=" * 70)
print("STEP 3: Computing spectral transition rate")
print("=" * 70)

def compute_spectral_centroid(segment, fs):
    """Compute spectral centroid of a signal segment."""
    # Use Welch's method for a clean PSD
    freqs, psd = signal.welch(segment, fs=fs, nperseg=min(256, len(segment)),
                               noverlap=128)
    # Limit to 0.5-30 Hz (relevant EEG range)
    mask = (freqs >= 0.5) & (freqs <= 30)
    freqs = freqs[mask]
    psd = psd[mask]

    if psd.sum() == 0:
        return 0.0

    centroid = np.sum(freqs * psd) / np.sum(psd)
    return centroid

# Parameters
window_sec = 5 * 60   # 5-minute sliding window
step_sec = 30          # step by one epoch (30 s)
sub_window_sec = 10    # sub-windows within the 5-min window for spectral snapshots

window_samples = int(window_sec * fs)
step_samples = int(step_sec * fs)
sub_window_samples = int(sub_window_sec * fs)

print(f"  Window: {window_sec}s, Step: {step_sec}s, Sub-window: {sub_window_sec}s")
print(f"  Computing spectral centroids...")

# Compute spectral centroid for each sub-window across the entire recording
n_sub_windows = int((len(eeg_data) - sub_window_samples) / (sub_window_samples // 2)) + 1
sub_step = sub_window_samples // 2  # 50% overlap for sub-windows

centroids = []
centroid_times = []
for i in range(0, len(eeg_data) - sub_window_samples + 1, sub_step):
    segment = eeg_data[i:i + sub_window_samples]
    c = compute_spectral_centroid(segment, fs)
    centroids.append(c)
    centroid_times.append(i / fs)

centroids = np.array(centroids)
centroid_times = np.array(centroid_times)
print(f"  Computed {len(centroids)} spectral centroids")

# Global std of centroid for threshold
centroid_std = np.std(centroids)
centroid_mean = np.mean(centroids)
print(f"  Centroid mean: {centroid_mean:.2f} Hz, std: {centroid_std:.2f} Hz")

# Now compute transition rate per epoch
# For each epoch, look at a 5-min window centered on it
# Count transitions = number of times consecutive centroids differ by > 1 std

transition_rates = np.full(n_epochs, np.nan)

for epoch_idx in range(n_epochs):
    epoch_center_time = (epoch_idx + 0.5) * epoch_duration
    win_start = epoch_center_time - window_sec / 2
    win_end = epoch_center_time + window_sec / 2

    # Find centroids within this window
    mask = (centroid_times >= win_start) & (centroid_times < win_end)
    window_centroids = centroids[mask]

    if len(window_centroids) < 3:
        continue

    # Count transitions: consecutive centroid shifts > 1 std
    diffs = np.abs(np.diff(window_centroids))
    n_transitions = np.sum(diffs > centroid_std)

    # Normalize by number of possible transitions
    transition_rates[epoch_idx] = n_transitions / (len(window_centroids) - 1)

valid_mask = ~np.isnan(transition_rates) & (stages != '') & (stages != '?') & (stages != 'MT')
print(f"  Valid epochs with transition rate: {valid_mask.sum()}")

# ─── Step 4: Compare transition rate to sleep stages ─────────────────
print("\n" + "=" * 70)
print("STEP 4: Transition rate by sleep stage")
print("=" * 70)

results = {}
for stage_name in ['W', 'N1', 'N2', 'N3', 'REM']:
    mask = valid_mask & (stages == stage_name)
    n = mask.sum()
    if n > 0:
        vals = transition_rates[mask]
        results[stage_name] = {
            'n_epochs': n,
            'mean': np.mean(vals),
            'std': np.std(vals),
            'median': np.median(vals),
            'values': vals,
        }
        print(f"  {stage_name:>3}: n={n:>4}, mean={np.mean(vals):.4f}, "
              f"std={np.std(vals):.4f}, median={np.median(vals):.4f}")
    else:
        print(f"  {stage_name:>3}: no epochs")

# ─── Step 5: Statistical analysis ───────────────────────────────────
print("\n" + "=" * 70)
print("STEP 5: Statistical analysis (Cohen's d effect sizes)")
print("=" * 70)

def cohens_d(a, b):
    """Compute Cohen's d effect size."""
    na, nb = len(a), len(b)
    if na < 2 or nb < 2:
        return float('nan')
    pooled_std = np.sqrt(((na - 1) * np.std(a, ddof=1)**2 +
                           (nb - 1) * np.std(b, ddof=1)**2) / (na + nb - 2))
    if pooled_std == 0:
        return float('nan')
    return (np.mean(a) - np.mean(b)) / pooled_std

# Pairwise Cohen's d
stage_order = ['W', 'N1', 'N2', 'REM', 'N3']
available_stages = [s for s in stage_order if s in results]

print(f"\n  Pairwise Cohen's d (positive = first > second):")
print(f"  {'':>6}", end="")
for s2 in available_stages:
    print(f"  {s2:>8}", end="")
print()

for s1 in available_stages:
    print(f"  {s1:>6}", end="")
    for s2 in available_stages:
        if s1 == s2:
            print(f"  {'---':>8}", end="")
        else:
            d = cohens_d(results[s1]['values'], results[s2]['values'])
            print(f"  {d:>8.3f}", end="")
    print()

# Key comparisons for the hypothesis
print(f"\n  Key hypothesis tests:")
print(f"  Hypothesis: W > N1 > N2 > REM > N3")
print()

pairs = [('W', 'N1'), ('W', 'N3'), ('N1', 'N2'), ('N1', 'N3'),
         ('N2', 'N3'), ('REM', 'N3'), ('W', 'REM')]

for s1, s2 in pairs:
    if s1 in results and s2 in results:
        d = cohens_d(results[s1]['values'], results[s2]['values'])
        t_stat, p_val = stats.ttest_ind(results[s1]['values'], results[s2]['values'])
        # Mann-Whitney U for non-parametric
        u_stat, u_p = stats.mannwhitneyu(results[s1]['values'], results[s2]['values'],
                                          alternative='greater')
        direction = ">" if np.mean(results[s1]['values']) > np.mean(results[s2]['values']) else "<"
        print(f"  {s1:>3} vs {s2:<3}: d={d:>7.3f}, t={t_stat:>7.3f}, "
              f"p(t)={p_val:.1e}, U-p(>)={u_p:.1e}  "
              f"[{results[s1]['mean']:.4f} {direction} {results[s2]['mean']:.4f}]")

# ─── Rank order check ───────────────────────────────────────────────
print(f"\n  Observed ranking (highest to lowest transition rate):")
ranked = sorted(available_stages, key=lambda s: results[s]['mean'], reverse=True)
for i, s in enumerate(ranked, 1):
    print(f"    {i}. {s:>3}: {results[s]['mean']:.4f}")

predicted = ['W', 'N1', 'N2', 'REM', 'N3']
predicted_available = [s for s in predicted if s in available_stages]
print(f"\n  Predicted order: {' > '.join(predicted_available)}")
print(f"  Observed order:  {' > '.join(ranked)}")

# Spearman rank correlation
predicted_ranks = {s: i for i, s in enumerate(predicted_available)}
observed_ranks = {s: i for i, s in enumerate(ranked)}

pred_r = [predicted_ranks[s] for s in available_stages]
obs_r = [observed_ranks[s] for s in available_stages]
rho, rho_p = stats.spearmanr(pred_r, obs_r)
print(f"\n  Spearman rho (predicted vs observed rank): {rho:.3f} (p={rho_p:.3f})")

# ─── ANOVA ──────────────────────────────────────────────────────────
print(f"\n  One-way ANOVA across all stages:")
groups = [results[s]['values'] for s in available_stages]
f_stat, anova_p = stats.f_oneway(*groups)
print(f"    F = {f_stat:.3f}, p = {anova_p:.1e}")

# Eta-squared (effect size for ANOVA)
all_vals = np.concatenate(groups)
grand_mean = np.mean(all_vals)
ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in groups)
ss_total = np.sum((all_vals - grand_mean)**2)
eta_sq = ss_between / ss_total if ss_total > 0 else 0
print(f"    eta^2 = {eta_sq:.4f}")

# Kruskal-Wallis (non-parametric)
h_stat, kw_p = stats.kruskal(*groups)
print(f"    Kruskal-Wallis H = {h_stat:.3f}, p = {kw_p:.1e}")

# ─── Summary ────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

print(f"""
Recording: SC4001E0 (Sleep-EDF, PhysioNet)
Channel: {channel_labels[eeg_idx]}
Sample rate: {fs} Hz
Duration: {duration_sec/3600:.1f} hours
Epochs analyzed: {valid_mask.sum()}

Metric: Spectral transition rate
  - 5-minute sliding window, 30s step
  - 10s sub-windows for spectral centroid (Welch PSD, 0.5-30 Hz)
  - Transition = consecutive centroid shift > 1 std ({centroid_std:.2f} Hz)
  - Rate = fraction of consecutive pairs that are transitions

ANOVA: F={f_stat:.3f}, p={anova_p:.1e}, eta^2={eta_sq:.4f}
Kruskal-Wallis: H={h_stat:.3f}, p={kw_p:.1e}
Rank correlation with prediction: rho={rho:.3f}

Predicted: {' > '.join(predicted_available)}
Observed:  {' > '.join(ranked)}
""")

# Interpretation
if anova_p < 0.001 and eta_sq > 0.06:
    print("RESULT: Transition rate SIGNIFICANTLY differs between sleep stages")
    print(f"  with a {'large' if eta_sq > 0.14 else 'medium'} effect size.")
elif anova_p < 0.05:
    print("RESULT: Transition rate shows MODEST differences between stages.")
else:
    print("RESULT: Transition rate does NOT significantly differ between stages.")

if rho > 0.8:
    print(f"  The predicted rank order is strongly supported (rho={rho:.3f}).")
elif rho > 0.5:
    print(f"  The predicted rank order is partially supported (rho={rho:.3f}).")
else:
    print(f"  The predicted rank order is NOT supported (rho={rho:.3f}).")

print("\nDone.")
