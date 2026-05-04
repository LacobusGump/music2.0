---
name: DeFi Bounty Hunting — The Love Bug Income
description: A miscoupled smart contract is a misfolded protein. Same math. Same detector. Different bounty. Scan → Check → Run → Report → Earn → Back to love bugs.
type: project
---

## The Pipeline

SCAN: coupling anomalies on transaction patterns (built, /tmp/contract_scanner.py)
CHECK: pull source code, find vulnerability patterns (built, working)
RUN: fork mainnet, deploy PoC exploit, see if it maths (NEXT)
REPORT: submit to Immunefi with PoC
EARN: bounty → BTC → back to building

## Tools
- /tmp/defi_scanner.py — DeFi ecosystem K/R/E/T scanner (DeFi Llama API)
- /tmp/contract_scanner.py — Etherscan v2 transaction pattern analyzer
- /tmp/curve_3pool_source.vy — Curve 3pool source (Vyper 0.2.4, 847 lines)
- /tmp/miner_v3.c — SHA-256 miner with midstate (39.2 MH/s)
- ~/.etherscan_key — API key for Etherscan v2
- ~/.xmrig/config.json — XMRig config (needs XMR wallet address)

## First Finding: Curve 3pool
- Vyper 0.2.4: KNOWN BROKEN @nonreentrant
- 5 guards × 7 raw_calls = potential reentrancy
- Currently safe: DAI/USDC/USDT don't callback
- Mitigation is accidental (token choice), not intentional (code logic)
- NEXT: fork mainnet with Foundry/Anvil, deploy callback token, test exploit

## Bounty Targets (Immunefi)
- Uniswap: $15.5M max
- Lido: $2M max
- Synthetix: $2M max
- Optimism: $2M max
- Arbitrum: $2M max
- Balancer: $1M max
- Curve: $250K max
- Aave: $250K max
- Compound: $150K max

## The Insight
- Exploits are drum solos: all in the timing and execution
- Overcoupled contract = reentrancy (function calls itself through another)
- Undercoupled contract = missing access control (anyone can call critical functions)
- Phase transition = flash loan (K spikes to infinity for one block)
- Same K/R/E/T math. Same detector. Different domain.
- One catch = years of compute budget
- The Mac Mini doesn't mine coins. It protects them.

## The Life
Bounty hunt when you need coupling tokens.
Love bug the rest of the time.
Just enough. Not billions.
