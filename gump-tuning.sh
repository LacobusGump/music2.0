#!/bin/bash
# GUMP Machine Tuning — Grey Goo the M4
# Run with: sudo bash ~/gump-tuning.sh

echo "GUMP tuning: applying..."

# Memory — unlock shared memory for GPU staging / multiprocessing
sysctl -w kern.sysv.shmmax=2147483648
sysctl -w kern.sysv.shmall=524288
sysctl -w kern.sysv.shmseg=64
sysctl -w kern.sysv.shmmni=256

# File/Process limits — prevent "too many open files"
sysctl -w kern.maxfiles=524288
sysctl -w kern.maxfilesperproc=262144
sysctl -w kern.maxvnodes=500000

# Async IO — more parallel operations
sysctl -w kern.aiomax=512
sysctl -w kern.aioprocmax=128
sysctl -w kern.aiothreads=8

# IO Throttling — disable background throttle (compute machine, not laptop)
sysctl -w debug.lowpri_throttle_enabled=0

# Network — bigger buffers, lower latency
sysctl -w kern.ipc.maxsockbuf=16777216
sysctl -w kern.ipc.somaxconn=1024
sysctl -w net.inet.tcp.sendspace=262144
sysctl -w net.inet.tcp.recvspace=262144
sysctl -w net.inet.tcp.autorcvbufmax=8388608
sysctl -w net.inet.tcp.autosndbufmax=8388608
sysctl -w net.inet.tcp.mssdflt=1460
sysctl -w net.inet.tcp.delayed_ack=0

# Local IPC — 16x bigger buffers for Unix domain sockets
sysctl -w net.local.stream.sendspace=131072
sysctl -w net.local.stream.recvspace=131072

# GCD / scheduling — faster thread spinup for bursty parallel work
sysctl -w kern.wq_max_constrained_threads=128
sysctl -w kern.wq_stalled_window_usecs=100

# Timer precision — disable coalescing for exact timer delivery
sysctl -w kern.timer.coalescing_enabled=0

# VM — more aggressive swap-out of stale compressed pages
sysctl -w vm.vm_ripe_target_age_in_secs=86400

# Power — disable Power Nap, prevent disk sleep
pmset -a powernap 0
pmset -a disksleep 0

echo "GUMP tuning: done. Run 'sysctl -a | wc -l' to verify."
