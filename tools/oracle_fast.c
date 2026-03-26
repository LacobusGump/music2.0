/*
 * THE ORACLE — C Implementation
 * π(x) from nothing. No data files. No dependencies.
 * Generates zeros on the fly via Z(t) sign changes.
 *
 * Compile: cc -O3 -o oracle_fast oracle_fast.c -lm
 * Usage:   ./oracle_fast 1000000
 *          ./oracle_fast 1000000000 500
 *
 * First argument: x (count primes below this)
 * Second argument: K (number of zeros to use, default 5000)
 */
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <time.h>

/* Siegel theta function — asymptotic expansion */
static double theta(double t) {
    if (t < 1.0) return 0.0;
    double lt = log(t / (2.0 * M_PI));
    return (t / 2.0) * lt - t / 2.0 - M_PI / 8.0
           + 1.0 / (48.0 * t)
           + 7.0 / (5760.0 * t * t * t)
           + 31.0 / (80640.0 * t * t * t * t * t);
}

/* Hardy Z-function with RS C₀ correction */
static double Z(double t) {
    if (t < 2.0) return 0.0;
    double a = sqrt(t / (2.0 * M_PI));
    int N = (int)floor(a);
    if (N < 1) N = 1;
    double p = a - N;
    double th = theta(t);

    double s = 0.0;
    for (int n = 1; n <= N; n++) {
        s += cos(th - t * log((double)n)) / sqrt((double)n);
    }
    s *= 2.0;

    /* RS correction C₀(p) */
    double denom = cos(2.0 * M_PI * p);
    double C0;
    if (fabs(denom) > 1e-8) {
        C0 = cos(2.0 * M_PI * (p * p - p - 1.0 / 16.0)) / denom;
    } else {
        C0 = 0.5;
    }
    int sign = ((N - 1) % 2 == 0) ? 1 : -1;
    s += sign * pow(2.0 * M_PI / t, 0.25) * C0;

    return s;
}

/* Li(x) via Ramanujan series */
static double li_func(double x) {
    if (x <= 1.0) return 0.0;
    double gamma = 0.5772156649015329;
    double lnx = log(x);
    double total = gamma + log(fabs(lnx));
    double term = 1.0;
    for (int k = 1; k < 200; k++) {
        term *= lnx / k;
        double contrib = term / k;
        total += contrib;
        if (fabs(contrib) < 1e-15) break;
    }
    /* Subtract li(2) */
    double ln2 = log(2.0);
    double li2 = gamma + log(ln2);
    double term2 = 1.0;
    for (int k = 1; k < 100; k++) {
        term2 *= ln2 / k;
        li2 += term2 / k;
    }
    return total - li2;
}

/* Main oracle: streaming zero generation + pi(x) computation */
static double oracle(double x, int K_target, int *zeros_found) {
    double logx = log(x);
    double sqrtx = sqrt(x);
    double correction = 0.0;
    int count = 0;

    double t = 9.0;
    double prev_Z = Z(t);

    while (count < K_target && t < 5000000.0) {
        double step;
        if (t > 14.0) {
            double ls = log(t / (2.0 * M_PI));
            step = (2.0 * M_PI / (ls > 0.1 ? ls : 0.1)) / 8.0;
            if (step < 0.02) step = 0.02;
        } else {
            step = 0.3;
        }

        t += step;
        double curr_Z = Z(t);

        if (prev_Z * curr_Z < 0.0) {
            /* Bisect for the zero */
            double lo = t - step, hi = t;
            for (int i = 0; i < 50; i++) {
                double mid = (lo + hi) / 2.0;
                double z_mid = Z(mid);
                if (Z(lo) * z_mid < 0.0) {
                    hi = mid;
                } else {
                    lo = mid;
                }
            }
            double gamma_zero = (lo + hi) / 2.0;

            /* Use this zero immediately */
            double phase = gamma_zero * logx;
            double x_rho_re = sqrtx * cos(phase);
            double x_rho_im = sqrtx * sin(phase);
            double rho_re = 0.5;
            double rho_im = gamma_zero;
            double rho_mag2 = rho_re * rho_re + rho_im * rho_im;

            /* Re(x^rho / rho) = Re((x_re + i*x_im) / (rho_re + i*rho_im)) */
            double real_part = (x_rho_re * rho_re + x_rho_im * rho_im) / rho_mag2;
            correction += 2.0 * real_part / logx;

            count++;
        }

        prev_Z = curr_Z;
    }

    *zeros_found = count;

    /* Combine with Li(x) + Mobius corrections */
    double li_x = li_func(x);
    double mobius = -li_func(sqrt(x)) / 2.0 - li_func(pow(x, 1.0/3.0)) / 3.0;
    if (x > 32.0) mobius -= li_func(pow(x, 0.2)) / 5.0;
    if (x > 64.0) mobius += li_func(pow(x, 1.0/6.0)) / 6.0;
    double offset = li_func(2.001) - log(2.0);

    return li_x - correction + mobius + offset;
}

int main(int argc, char **argv) {
    if (argc < 2) {
        printf("The Oracle (C) — π(x) from nothing.\n");
        printf("Usage: %s <x> [K_zeros]\n", argv[0]);
        printf("Example: %s 1000000\n", argv[0]);
        return 0;
    }

    double x = atof(argv[1]);
    int K = (argc > 2) ? atoi(argv[2]) : 5000;

    printf("The Oracle (C) | π(%.0f) | K = %d\n\n", x, K);

    struct timespec t_start, t_end;
    clock_gettime(CLOCK_MONOTONIC, &t_start);

    int zeros_found;
    double result = oracle(x, K, &zeros_found);

    clock_gettime(CLOCK_MONOTONIC, &t_end);
    double elapsed = (t_end.tv_sec - t_start.tv_sec)
                   + (t_end.tv_nsec - t_start.tv_nsec) / 1e9;

    printf("  Result:  %.0f\n", result);
    printf("  Zeros:   %d\n", zeros_found);
    printf("  Time:    %.4f seconds\n", elapsed);
    printf("  Rate:    %.0f zeros/sec\n", zeros_found / elapsed);
    printf("\n");

    /* Known values for verification */
    struct { double x; long actual; } known[] = {
        {1e4, 1229}, {1e5, 9592}, {1e6, 78498}, {1e7, 664579},
        {1e8, 5761455}, {1e9, 50847534}, {1e10, 455052511},
        {0, 0}
    };

    for (int i = 0; known[i].x > 0; i++) {
        if (fabs(x - known[i].x) < 1.0) {
            double err = result - known[i].actual;
            printf("  Actual:  %ld\n", known[i].actual);
            printf("  Error:   %+.0f\n", err);
            break;
        }
    }

    printf("\n  No data files. No dependencies. Just C and math.\n");
    return 0;
}
