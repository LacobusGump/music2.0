#!/usr/bin/env python3
"""
Transition Rate on Tocography (Uterine Contractions)
=====================================================
Hypothesis: transition rate INCREASES as labor progresses.
  - Contractions get more frequent and stronger near delivery
  - Transition rate (significant changes per window) should track this

Data: CTU-UHB Intrapartum CTG Database (PhysioNet), 552 recordings
  - UC channel = uterine contraction pressure (tocography)
  - FHR channel = fetal heart rate (not used here)
  - 4 Hz sampling rate
  - Recordings end near delivery time
"""

import numpy as np
import wfdb
from scipy import signal as sp_signal
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

# ============================================================
# 1. LOAD A BATCH OF REAL RECORDS
# ============================================================
print("=" * 70)
print("LOADING CTU-UHB INTRAPARTUM CTG DATABASE")
print("=" * 70)

all_records = wfdb.get_record_list('ctu-uhb-ctgdb')
print(f"Total records available: {len(all_records)}")

# Load a meaningful sample
N_RECORDS = 50  # enough for statistics
FS = 4  # sampling rate (Hz)
WINDOW_MIN = 10  # transition rate window in minutes
WINDOW_SAMPLES = WINDOW_MIN * 60 * FS  # 2400 samples per 10-min window

loaded = []
failed = 0

for rec_id in all_records[:80]:  # try 80, expect some to fail
    if len(loaded) >= N_RECORDS:
        break
    try:
        rec = wfdb.rdrecord(rec_id, pn_dir='ctu-uhb-ctgdb')
        uc_idx = rec.sig_name.index('UC')
        uc = rec.p_signal[:, uc_idx].copy()
        duration_min = len(uc) / FS / 60

        # Skip very short recordings
        if duration_min < 30:
            continue

        loaded.append({
            'id': rec_id,
            'uc': uc,
            'duration_min': duration_min,
        })
    except Exception as e:
        failed += 1

print(f"Loaded: {len(loaded)} records, failed: {failed}")
durations = [r['duration_min'] for r in loaded]
print(f"Duration range: {min(durations):.0f} - {max(durations):.0f} min")
print(f"Mean duration: {np.mean(durations):.0f} min")


# ============================================================
# 2. DEFINE TRANSITION RATE
# ============================================================
def compute_transition_rate(uc_signal, fs=4, window_min=10, threshold_factor=1.5):
    """
    Transition rate: count of significant amplitude transitions
    per window.

    A "transition" = a change in the smoothed UC signal that exceeds
    threshold_factor * median absolute deviation of the signal.

    This captures both contraction frequency and amplitude changes.
    """
    # Smooth to remove noise (low-pass at ~0.05 Hz, well above contraction freq)
    # Contractions are ~0.01-0.03 Hz, so 0.1 Hz cutoff preserves them
    nyq = fs / 2
    cutoff = min(0.1, nyq * 0.9)  # safety
    b, a = sp_signal.butter(3, cutoff / nyq, btype='low')
    uc_smooth = sp_signal.filtfilt(b, a, uc_signal)

    # Compute derivative (rate of change)
    uc_diff = np.abs(np.diff(uc_smooth))

    # Threshold: transitions are above median + factor * MAD
    mad = np.median(np.abs(uc_diff - np.median(uc_diff)))
    if mad < 1e-6:
        mad = np.std(uc_diff) * 0.5  # fallback
    threshold = np.median(uc_diff) + threshold_factor * mad

    # Window-based counting
    window_samples = int(window_min * 60 * fs)
    n_windows = len(uc_diff) // window_samples

    rates = []
    for i in range(n_windows):
        start = i * window_samples
        end = start + window_samples
        chunk = uc_diff[start:end]
        # Count zero-crossings of (chunk - threshold) from below
        above = chunk > threshold
        transitions = np.sum(np.diff(above.astype(int)) == 1)  # rising edges
        rates.append(transitions)

    return np.array(rates)


def compute_contraction_metrics(uc_signal, fs=4, window_min=10):
    """
    Also compute traditional metrics for comparison:
    - Contraction count per window (peaks in UC)
    - Mean contraction amplitude per window
    - Mean contraction duration per window
    """
    # Smooth
    nyq = fs / 2
    b, a = sp_signal.butter(3, 0.1 / nyq, btype='low')
    uc_smooth = sp_signal.filtfilt(b, a, uc_signal)

    # Remove baseline
    # Use a very low-pass filter as baseline
    b2, a2 = sp_signal.butter(2, 0.005 / nyq, btype='low')
    baseline = sp_signal.filtfilt(b2, a2, uc_signal)
    uc_detrended = uc_smooth - baseline

    window_samples = int(window_min * 60 * fs)
    n_windows = len(uc_smooth) // window_samples

    counts = []
    amplitudes = []

    for i in range(n_windows):
        start = i * window_samples
        end = start + window_samples
        chunk = uc_detrended[start:end]

        # Find peaks (contractions)
        # Min distance between contractions: ~1 min = 240 samples
        height_thresh = np.std(chunk) * 0.5
        peaks, props = sp_signal.find_peaks(chunk, distance=240,
                                             height=max(height_thresh, 2.0),
                                             prominence=2.0)
        counts.append(len(peaks))
        if len(peaks) > 0:
            amplitudes.append(np.mean(props['peak_heights']))
        else:
            amplitudes.append(0.0)

    return np.array(counts), np.array(amplitudes)


# ============================================================
# 3. COMPUTE TRANSITION RATE FOR ALL RECORDS
# ============================================================
print("\n" + "=" * 70)
print("COMPUTING TRANSITION RATES")
print("=" * 70)

results = []

for rec in loaded:
    uc = rec['uc']

    # Replace zeros/NaN (signal dropout) with interpolation
    bad = (uc == 0) | np.isnan(uc)
    if np.sum(~bad) < len(uc) * 0.3:
        continue  # too much dropout

    if np.any(bad):
        good_idx = np.where(~bad)[0]
        bad_idx = np.where(bad)[0]
        if len(good_idx) > 1:
            uc[bad_idx] = np.interp(bad_idx, good_idx, uc[good_idx])

    tr = compute_transition_rate(uc)
    counts, amps = compute_contraction_metrics(uc)

    # Ensure all series have the same length (use the shortest)
    min_len = min(len(tr), len(counts), len(amps))
    tr = tr[:min_len]
    counts = counts[:min_len]
    amps = amps[:min_len]

    if min_len < 3:
        continue

    # Normalize time to [0, 1] where 1 = end of recording (near delivery)
    n = min_len
    time_frac = np.linspace(0, 1, n)

    # Linear regression: transition rate vs time
    slope_tr, intercept_tr, r_tr, p_tr, _ = stats.linregress(time_frac, tr)
    slope_ct, intercept_ct, r_ct, p_ct, _ = stats.linregress(time_frac, counts)
    slope_amp, intercept_amp, r_amp, p_amp, _ = stats.linregress(time_frac,
                                                                   amps)

    # First third vs last third comparison
    third = max(1, n // 3)
    first_third_tr = np.mean(tr[:third])
    last_third_tr = np.mean(tr[-third:])

    first_third_ct = np.mean(counts[:third])
    last_third_ct = np.mean(counts[-third:])

    results.append({
        'id': rec['id'],
        'duration_min': rec['duration_min'],
        'n_windows': n,
        'tr_slope': slope_tr,
        'tr_r': r_tr,
        'tr_p': p_tr,
        'tr_first': first_third_tr,
        'tr_last': last_third_tr,
        'ct_slope': slope_ct,
        'ct_r': r_ct,
        'ct_p': p_ct,
        'ct_first': first_third_ct,
        'ct_last': last_third_ct,
        'amp_slope': slope_amp,
        'amp_r': r_amp,
        'amp_p': p_amp,
        'tr_series': tr,
        'ct_series': counts,
        'amp_series': amps,
    })

print(f"Analyzed: {len(results)} records")


# ============================================================
# 4. AGGREGATE RESULTS
# ============================================================
print("\n" + "=" * 70)
print("RESULTS: DOES TRANSITION RATE TRACK LABOR PROGRESSION?")
print("=" * 70)

# --- Transition Rate ---
slopes_tr = [r['tr_slope'] for r in results]
rs_tr = [r['tr_r'] for r in results]
ps_tr = [r['tr_p'] for r in results]
increasing_tr = sum(1 for s in slopes_tr if s > 0)
sig_increasing_tr = sum(1 for r in results if r['tr_slope'] > 0 and r['tr_p'] < 0.05)

print(f"\n--- TRANSITION RATE (changes per 10-min window) ---")
print(f"  Records with INCREASING trend: {increasing_tr}/{len(results)} "
      f"({100*increasing_tr/len(results):.1f}%)")
print(f"  Significantly increasing (p<0.05): {sig_increasing_tr}/{len(results)} "
      f"({100*sig_increasing_tr/len(results):.1f}%)")
print(f"  Mean slope: {np.mean(slopes_tr):.3f}")
print(f"  Median slope: {np.median(slopes_tr):.3f}")
print(f"  Mean correlation (r): {np.mean(rs_tr):.3f}")

# First third vs last third
first_thirds_tr = [r['tr_first'] for r in results]
last_thirds_tr = [r['tr_last'] for r in results]
t_stat_tr, p_paired_tr = stats.ttest_rel(last_thirds_tr, first_thirds_tr)
print(f"\n  Paired t-test (last third vs first third):")
print(f"    Mean first third: {np.mean(first_thirds_tr):.2f}")
print(f"    Mean last third:  {np.mean(last_thirds_tr):.2f}")
print(f"    t = {t_stat_tr:.3f}, p = {p_paired_tr:.4f}")
print(f"    Change: {100*(np.mean(last_thirds_tr)-np.mean(first_thirds_tr))/max(np.mean(first_thirds_tr),0.01):.1f}%")

# --- Contraction Count ---
slopes_ct = [r['ct_slope'] for r in results]
increasing_ct = sum(1 for s in slopes_ct if s > 0)
sig_increasing_ct = sum(1 for r in results if r['ct_slope'] > 0 and r['ct_p'] < 0.05)

print(f"\n--- CONTRACTION COUNT (peaks per 10-min window) ---")
print(f"  Records with INCREASING trend: {increasing_ct}/{len(results)} "
      f"({100*increasing_ct/len(results):.1f}%)")
print(f"  Significantly increasing (p<0.05): {sig_increasing_ct}/{len(results)} "
      f"({100*sig_increasing_ct/len(results):.1f}%)")
print(f"  Mean slope: {np.mean(slopes_ct):.3f}")
print(f"  Mean correlation (r): {np.mean([r['ct_r'] for r in results]):.3f}")

first_thirds_ct = [r['ct_first'] for r in results]
last_thirds_ct = [r['ct_last'] for r in results]
t_stat_ct, p_paired_ct = stats.ttest_rel(last_thirds_ct, first_thirds_ct)
print(f"\n  Paired t-test (last third vs first third):")
print(f"    Mean first third: {np.mean(first_thirds_ct):.2f}")
print(f"    Mean last third:  {np.mean(last_thirds_ct):.2f}")
print(f"    t = {t_stat_ct:.3f}, p = {p_paired_ct:.4f}")

# --- Contraction Amplitude ---
slopes_amp = [r['amp_slope'] for r in results]
increasing_amp = sum(1 for s in slopes_amp if s > 0)
sig_increasing_amp = sum(1 for r in results if r['amp_slope'] > 0 and r['amp_p'] < 0.05)

print(f"\n--- CONTRACTION AMPLITUDE (mean peak height per window) ---")
print(f"  Records with INCREASING trend: {increasing_amp}/{len(results)} "
      f"({100*increasing_amp/len(results):.1f}%)")
print(f"  Significantly increasing (p<0.05): {sig_increasing_amp}/{len(results)} "
      f"({100*sig_increasing_amp/len(results):.1f}%)")
print(f"  Mean slope: {np.mean(slopes_amp):.3f}")
print(f"  Mean correlation (r): {np.mean([r['amp_r'] for r in results]):.3f}")


# ============================================================
# 5. COMPARE TRANSITION RATE vs TRADITIONAL METRICS
# ============================================================
print("\n" + "=" * 70)
print("HEAD-TO-HEAD: TRANSITION RATE vs CONTRACTION COUNT vs AMPLITUDE")
print("=" * 70)

# For each record, which metric has the strongest positive correlation with time?
tr_wins = 0
ct_wins = 0
amp_wins = 0

for r in results:
    best = max(
        ('TR', r['tr_r'] if r['tr_slope'] > 0 else -abs(r['tr_r'])),
        ('CT', r['ct_r'] if r['ct_slope'] > 0 else -abs(r['ct_r'])),
        ('AMP', r['amp_r'] if r['amp_slope'] > 0 else -abs(r['amp_r'])),
        key=lambda x: x[1]
    )
    if best[0] == 'TR':
        tr_wins += 1
    elif best[0] == 'CT':
        ct_wins += 1
    else:
        amp_wins += 1

print(f"  Best positive tracker of labor progression:")
print(f"    Transition Rate wins: {tr_wins}/{len(results)} ({100*tr_wins/len(results):.1f}%)")
print(f"    Contraction Count wins: {ct_wins}/{len(results)} ({100*ct_wins/len(results):.1f}%)")
print(f"    Amplitude wins: {amp_wins}/{len(results)} ({100*amp_wins/len(results):.1f}%)")


# ============================================================
# 6. TIME-NORMALIZED POPULATION AVERAGE
# ============================================================
print("\n" + "=" * 70)
print("POPULATION-AVERAGED TRANSITION RATE CURVE")
print("=" * 70)

# Resample all series to 10 normalized time bins
N_BINS = 10
pop_tr = np.zeros((len(results), N_BINS))
pop_ct = np.zeros((len(results), N_BINS))
pop_amp = np.zeros((len(results), N_BINS))

for i, r in enumerate(results):
    # Resample to N_BINS
    x_orig = np.linspace(0, 1, len(r['tr_series']))
    x_new = np.linspace(0, 1, N_BINS)
    pop_tr[i] = np.interp(x_new, x_orig, r['tr_series'])
    pop_ct[i] = np.interp(x_new, x_orig, r['ct_series'])
    pop_amp[i] = np.interp(x_new, x_orig, r['amp_series'])

mean_tr = np.mean(pop_tr, axis=0)
std_tr = np.std(pop_tr, axis=0)
mean_ct = np.mean(pop_ct, axis=0)
mean_amp = np.mean(pop_amp, axis=0)

print("\n  Time ->  0%   10%   20%   30%   40%   50%   60%   70%   80%   90%")
print(f"  TR:   ", "  ".join(f"{v:.1f}" for v in mean_tr))
print(f"  CT:   ", "  ".join(f"{v:.1f}" for v in mean_ct))
print(f"  AMP:  ", "  ".join(f"{v:.1f}" for v in mean_amp))

# Overall trend in population average
slope_pop, _, r_pop, p_pop, _ = stats.linregress(np.arange(N_BINS), mean_tr)
print(f"\n  Population TR trend: slope={slope_pop:.3f}, r={r_pop:.3f}, p={p_pop:.4f}")
slope_pop_ct, _, r_pop_ct, p_pop_ct, _ = stats.linregress(np.arange(N_BINS), mean_ct)
print(f"  Population CT trend: slope={slope_pop_ct:.3f}, r={r_pop_ct:.3f}, p={p_pop_ct:.4f}")


# ============================================================
# 7. EFFECT SIZE AND CLINICAL SIGNIFICANCE
# ============================================================
print("\n" + "=" * 70)
print("EFFECT SIZE ANALYSIS")
print("=" * 70)

# Cohen's d for first third vs last third
def cohens_d(x, y):
    nx, ny = len(x), len(y)
    pooled_std = np.sqrt(((nx-1)*np.std(x,ddof=1)**2 + (ny-1)*np.std(y,ddof=1)**2) / (nx+ny-2))
    if pooled_std < 1e-10:
        return 0.0
    return (np.mean(y) - np.mean(x)) / pooled_std

d_tr = cohens_d(first_thirds_tr, last_thirds_tr)
d_ct = cohens_d(first_thirds_ct, last_thirds_ct)

print(f"  Cohen's d (last vs first third):")
print(f"    Transition Rate: d = {d_tr:.3f}", end="")
if abs(d_tr) < 0.2:
    print(" (negligible)")
elif abs(d_tr) < 0.5:
    print(" (small)")
elif abs(d_tr) < 0.8:
    print(" (medium)")
else:
    print(" (large)")

print(f"    Contraction Count: d = {d_ct:.3f}", end="")
if abs(d_ct) < 0.2:
    print(" (negligible)")
elif abs(d_ct) < 0.5:
    print(" (small)")
elif abs(d_ct) < 0.8:
    print(" (medium)")
else:
    print(" (large)")


# ============================================================
# 8. QUARTILE ANALYSIS - More robust than linear
# ============================================================
print("\n" + "=" * 70)
print("QUARTILE ANALYSIS (first quarter vs last quarter)")
print("=" * 70)

q1_tr = []
q4_tr = []
q1_ct = []
q4_ct = []

for r in results:
    n = len(r['tr_series'])
    q = max(1, n // 4)
    q1_tr.append(np.mean(r['tr_series'][:q]))
    q4_tr.append(np.mean(r['tr_series'][-q:]))
    q1_ct.append(np.mean(r['ct_series'][:q]))
    q4_ct.append(np.mean(r['ct_series'][-q:]))

pct_tr_increase = sum(1 for a, b in zip(q1_tr, q4_tr) if b > a)
pct_ct_increase = sum(1 for a, b in zip(q1_ct, q4_ct) if b > a)

t_q_tr, p_q_tr = stats.ttest_rel(q4_tr, q1_tr)
t_q_ct, p_q_ct = stats.ttest_rel(q4_ct, q1_ct)

print(f"  TRANSITION RATE:")
print(f"    Q1 mean: {np.mean(q1_tr):.2f}, Q4 mean: {np.mean(q4_tr):.2f}")
print(f"    Increased Q1->Q4: {pct_tr_increase}/{len(results)} ({100*pct_tr_increase/len(results):.1f}%)")
print(f"    Paired t: t={t_q_tr:.3f}, p={p_q_tr:.4f}")

print(f"  CONTRACTION COUNT:")
print(f"    Q1 mean: {np.mean(q1_ct):.2f}, Q4 mean: {np.mean(q4_ct):.2f}")
print(f"    Increased Q1->Q4: {pct_ct_increase}/{len(results)} ({100*pct_ct_increase/len(results):.1f}%)")
print(f"    Paired t: t={t_q_ct:.3f}, p={p_q_ct:.4f}")


# ============================================================
# 9. INDIVIDUAL RECORD EXAMPLES
# ============================================================
print("\n" + "=" * 70)
print("EXAMPLE RECORDS")
print("=" * 70)

# Best and worst transition rate trackers
results_sorted = sorted(results, key=lambda r: r['tr_r'], reverse=True)

print("\n  Top 5 (TR tracks labor progression best):")
for r in results_sorted[:5]:
    print(f"    Record {r['id']}: r={r['tr_r']:.3f}, p={r['tr_p']:.4f}, "
          f"duration={r['duration_min']:.0f}min, "
          f"TR: {r['tr_first']:.1f} -> {r['tr_last']:.1f}")

print("\n  Bottom 5 (TR does NOT track):")
for r in results_sorted[-5:]:
    print(f"    Record {r['id']}: r={r['tr_r']:.3f}, p={r['tr_p']:.4f}, "
          f"duration={r['duration_min']:.0f}min, "
          f"TR: {r['tr_first']:.1f} -> {r['tr_last']:.1f}")


# ============================================================
# 10. FINAL VERDICT
# ============================================================
print("\n" + "=" * 70)
print("VERDICT")
print("=" * 70)

print(f"""
  Database: CTU-UHB Intrapartum CTG (PhysioNet), {len(results)} recordings
  Method: Transition rate = significant amplitude transitions per 10-min window

  Key findings:
  1. {100*increasing_tr/len(results):.0f}% of recordings show INCREASING transition rate over time
  2. {100*sig_increasing_tr/len(results):.0f}% are statistically significant (p<0.05)
  3. Population-average TR goes from {mean_tr[0]:.1f} to {mean_tr[-1]:.1f} (start to end)
  4. Cohen's d = {d_tr:.2f} (first vs last third)
  5. Paired t-test (Q1 vs Q4): p = {p_q_tr:.4f}
""")

if p_q_tr < 0.05 and np.mean(q4_tr) > np.mean(q1_tr):
    print("  CONCLUSION: YES - transition rate significantly increases as labor progresses.")
    print("  The signal is real. Contraction transition rate tracks labor progression.")
elif p_q_tr < 0.05:
    print("  CONCLUSION: Significant but DECREASING - opposite to hypothesis.")
else:
    print("  CONCLUSION: NOT significant. Transition rate does not reliably track progression.")

if abs(d_tr) < 0.2:
    print("  CAVEAT: Effect size is negligible. Not clinically useful on its own.")
elif abs(d_tr) < 0.5:
    print("  CAVEAT: Effect size is small. May need combination with other metrics.")
elif abs(d_tr) < 0.8:
    print("  NOTE: Medium effect size. Potentially clinically useful.")
else:
    print("  NOTE: Large effect size. Strong candidate for clinical monitoring.")

# Compare to contraction count
print(f"\n  Compared to simple contraction counting:")
print(f"    TR Cohen's d = {d_tr:.3f}")
print(f"    CT Cohen's d = {d_ct:.3f}")
if abs(d_tr) > abs(d_ct):
    print(f"    Transition rate has LARGER effect size ({abs(d_tr)/max(abs(d_ct),0.001):.1f}x)")
else:
    print(f"    Contraction count has LARGER effect size ({abs(d_ct)/max(abs(d_tr),0.001):.1f}x)")
    print(f"    Transition rate does NOT beat simple peak counting.")
