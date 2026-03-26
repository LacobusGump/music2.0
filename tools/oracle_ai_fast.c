/*
 * ORACLE AI (C) — Streaming One-Pass Learner
 * Learns any signal in one forward pass. No gradient descent.
 * Same pattern as the prime oracle: scan → extract → predict.
 *
 * Compile: cc -O3 -o oracle_ai_fast oracle_ai_fast.c -lm
 * Usage:   ./oracle_ai_fast                    # built-in demo
 *          ./oracle_ai_fast data.csv            # learn from CSV
 *          ./oracle_ai_fast data.csv 2          # use column 2
 */
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#include <time.h>

#define MAX_FREQ 100
#define MAX_SIGNAL 100000

static double signal_data[MAX_SIGNAL];
static double residual[MAX_SIGNAL];
static int N;
static double dt = 1.0;

/* Model */
static double baseline;
static double freq_omega[MAX_FREQ];
static double freq_amp[MAX_FREQ];
static double freq_phase[MAX_FREQ];
static int n_freq = 0;

/* ─── DFT power at a single frequency ─────────────────── */
static double dft_power(const double *x, int n, double omega) {
    double re = 0.0, im = 0.0;
    for (int i = 0; i < n; i++) {
        double t = i * dt;
        re += x[i] * cos(omega * t);
        im += x[i] * sin(omega * t);
    }
    return (re*re + im*im) / ((double)n * n);
}

/* ─── Fit amplitude and phase for a single frequency ──── */
static void fit_frequency(const double *x, int n, double omega,
                          double *amp_out, double *phase_out) {
    double cos_sum = 0.0, sin_sum = 0.0;
    double cos2_sum = 0.0, sin2_sum = 0.0;
    for (int i = 0; i < n; i++) {
        double t = i * dt;
        double c = cos(omega * t);
        double s = sin(omega * t);
        cos_sum += x[i] * c;
        sin_sum += x[i] * s;
        cos2_sum += c * c;
        sin2_sum += s * s;
    }
    double a_cos = cos_sum / fmax(cos2_sum, 1e-30);
    double a_sin = sin_sum / fmax(sin2_sum, 1e-30);
    *amp_out = sqrt(a_cos*a_cos + a_sin*a_sin);
    *phase_out = atan2(-a_sin, a_cos);
}

/* ─── Subtract a frequency from residual ──────────────── */
static void subtract_freq(double *x, int n, double omega, double amp, double phase) {
    for (int i = 0; i < n; i++) {
        double t = i * dt;
        x[i] -= amp * cos(omega * t + phase);
    }
}

/* ─── Scan for dominant frequency (Z(t)-style peak hunt) ─ */
static double scan_peak(const double *x, int n, int n_scan, double *power_out) {
    double omega_max = M_PI / dt;
    double d_omega = omega_max / n_scan;
    double best_power = 0.0;
    double best_omega = 0.0;
    double prev_power = 0.0;
    double prev_deriv = 0.0;

    for (int k = 1; k < n_scan; k++) {
        double omega = k * d_omega;
        double power = dft_power(x, n, omega);
        double deriv = power - prev_power;

        if (prev_deriv > 0 && deriv < 0 && prev_power > best_power) {
            /* Peak detected — bisect to refine */
            double lo = (k > 1 ? (k-2) : 0) * d_omega + 0.001;
            double hi = (k+1) * d_omega;
            for (int j = 0; j < 30; j++) {
                double mid = (lo + hi) / 2.0;
                double eps = (hi - lo) * 0.01;
                double p_lo = dft_power(x, n, mid - eps);
                double p_hi = dft_power(x, n, mid + eps);
                if (p_hi > p_lo) lo = mid;
                else hi = mid;
            }
            best_omega = (lo + hi) / 2.0;
            best_power = dft_power(x, n, best_omega);
        }
        prev_deriv = deriv;
        prev_power = power;
    }
    *power_out = best_power;
    return best_omega;
}

/* ─── Learn: one pass ─────────────────────────────────── */
static void learn(int max_freq, double min_power_ratio) {
    /* Baseline */
    baseline = 0.0;
    for (int i = 0; i < N; i++) baseline += signal_data[i];
    baseline /= N;

    /* Residual = signal - baseline */
    for (int i = 0; i < N; i++) residual[i] = signal_data[i] - baseline;

    double total_power = 0.0;
    for (int i = 0; i < N; i++) total_power += residual[i] * residual[i];
    total_power /= N;

    if (total_power < 1e-30) return;

    n_freq = 0;
    int n_scan = N / 2;
    if (n_scan > 2000) n_scan = 2000;
    if (n_scan < 100) n_scan = 100;

    for (int round = 0; round < max_freq; round++) {
        double remaining = 0.0;
        for (int i = 0; i < N; i++) remaining += residual[i] * residual[i];
        remaining /= N;

        if (remaining / total_power < min_power_ratio) break;

        double power;
        double omega = scan_peak(residual, N, n_scan, &power);

        if (omega < 1e-10 || power / total_power < min_power_ratio) break;

        double amp, phase;
        fit_frequency(residual, N, omega, &amp, &phase);

        freq_omega[n_freq] = omega;
        freq_amp[n_freq] = amp;
        freq_phase[n_freq] = phase;
        n_freq++;

        subtract_freq(residual, N, omega, amp, phase);
    }
}

/* ─── Predict ─────────────────────────────────────────── */
static double predict(double t) {
    double v = baseline;
    for (int k = 0; k < n_freq; k++) {
        v += freq_amp[k] * cos(freq_omega[k] * t + freq_phase[k]);
    }
    return v;
}

/* ─── Generate demo signal ────────────────────────────── */
static void gen_composite(void) {
    double freqs[] = {1.0, 2.3, 5.7, 11.1, 17.0, 31.4, 50.0};
    double amps[] = {1.0, 0.7, 0.5, 0.3, 0.2, 0.15, 0.1};
    N = 2000;
    dt = 10.0 / N;
    for (int i = 0; i < N; i++) {
        double t = i * dt;
        double v = 0.0;
        for (int f = 0; f < 7; f++) {
            v += amps[f] * sin(2*M_PI*freqs[f]*t + freqs[f]);
        }
        signal_data[i] = v;
    }
}

/* ─── Main ────────────────────────────────────────────── */
int main(int argc, char **argv) {
    const char *name = "7-frequency composite (built-in)";

    if (argc > 1 && strcmp(argv[1], "--help") == 0) {
        printf("Oracle AI (C) — One-pass streaming learner.\n");
        printf("Usage: %s [data.csv] [column]\n", argv[0]);
        printf("       %s                    (built-in demo)\n", argv[0]);
        return 0;
    }

    if (argc > 1 && strcmp(argv[1], "--help") != 0) {
        /* Load CSV */
        int col = (argc > 2) ? atoi(argv[2]) : 0;
        FILE *f = fopen(argv[1], "r");
        if (!f) { perror("fopen"); return 1; }

        N = 0;
        char line[4096];
        while (fgets(line, sizeof(line), f) && N < MAX_SIGNAL) {
            char *tok = strtok(line, ",\t ");
            for (int c = 0; c < col && tok; c++) tok = strtok(NULL, ",\t ");
            if (tok) {
                char *end;
                double v = strtod(tok, &end);
                if (end != tok) signal_data[N++] = v;
            }
        }
        fclose(f);
        dt = 1.0;
        name = argv[1];
    } else {
        gen_composite();
    }

    printf("Oracle AI (C) | %s | %d samples\n\n", name, N);

    struct timespec t_start, t_end;
    clock_gettime(CLOCK_MONOTONIC, &t_start);

    learn(50, 0.001);

    clock_gettime(CLOCK_MONOTONIC, &t_end);
    double elapsed = (t_end.tv_sec - t_start.tv_sec)
                   + (t_end.tv_nsec - t_start.tv_nsec) / 1e9;

    /* Compute R² */
    double ss_res = 0.0, ss_tot = 0.0;
    for (int i = 0; i < N; i++) {
        double t = i * dt;
        double err = signal_data[i] - predict(t);
        ss_res += err * err;
        ss_tot += (signal_data[i] - baseline) * (signal_data[i] - baseline);
    }
    double r2 = 1.0 - ss_res / fmax(ss_tot, 1e-30);
    double rmse = sqrt(ss_res / N);

    printf("  Frequencies: %d extracted\n", n_freq);
    printf("  R²:          %.6f\n", r2);
    printf("  RMSE:        %.6f\n", rmse);
    printf("  Learn time:  %.3f ms\n", elapsed * 1000);
    printf("\n");

    printf("  %10s %10s %10s %8s\n", "ω", "freq(Hz)", "amp", "phase");
    printf("  ──────────────────────────────────────────\n");
    for (int k = 0; k < n_freq && k < 20; k++) {
        printf("  %10.4f %10.4f %10.4f %+8.3f\n",
               freq_omega[k], freq_omega[k]/(2*M_PI),
               freq_amp[k], freq_phase[k]);
    }

    int n_params = 1 + 3 * n_freq;
    printf("\n  Model: %d params | Compression: %d×\n", n_params, N / n_params);
    printf("  No gradient descent. One pass. %.3f ms.\n", elapsed * 1000);
    return 0;
}
