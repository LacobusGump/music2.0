---
name: Flash Loan Hunt — The Coupling Exploit
description: Every flash loan exploit is a coupling failure. Protocol A trusts Protocol B's price. Flash loan moves Protocol B. Extract from A. All in one transaction. $841M stolen historically from this pattern. Our scanner detects it.
type: project
---

## The Pattern (same every time)
1. BORROW: flash loan unlimited capital (zero collateral)
2. DISPLACE: move a price on a thin DEX pool
3. INTERACT: use the fake price on a DIFFERENT protocol
4. EXTRACT: borrow/mint/withdraw at inflated value
5. REPAY: return flash loan
6. PROFIT: keep the difference

## The Formula
profit = (price_displacement × target_TVL × CF) - (flash_fee + gas + slippage)

If borrowable_assets / oracle_pool_liquidity > 10 → profitable exploit.

## Historical Exploits
- bZx: $950K (Feb 2020)
- Harvest Finance: $34M (Oct 2020)
- Pancake Bunny: $45M (May 2021)
- Cream Finance: $130M (Oct 2021)
- Mango Markets: $114M (Oct 2022)
- Euler Finance: $197M (Mar 2023)
- Total: $841M+ from coupling failures

## What We Need to Scan
108 small Ethereum lending/yield protocols ($500K-$50M TVL)

For each:
1. What collateral do they accept?
2. How is that collateral priced? (Chainlink = safe, DEX = target)
3. If DEX: which pool? How much liquidity?
4. How much can be borrowed against it?
5. If borrowable > 10 × pool_liquidity → flash loan exploitable

## Tools
- Anvil mainnet fork running (Foundry installed)
- Etherscan API v2 with key
- DeFi Llama API for protocol data
- Cast/Forge for on-chain interaction
- All in gump-private/tools/

## Flux Finance Finding (Session 36)
- Three EOA wallets control OUSG pricing
- 23-hour oracle update window
- 92% collateral factor on illiquid permissioned token
- MM12P: 70% confidence, medium-to-critical
- NOT a flash loan exploit — a design coupling bug

## Next Session Priority
1. Scan the 108 targets for thin oracle pools
2. Check: Gearbox, Silo V2, Revert Lend, Fira — these accept exotic collateral
3. For each: find oracle → find DEX pool → check liquidity → calculate profit
4. If profitable → build flash loan chain → test on fork → EREA
