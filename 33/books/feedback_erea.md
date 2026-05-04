---
name: EREA — Explain, Realize, Exploit, Analyze
description: The bounty hunting protocol. Like MM12P but for finding bugs. Explain the system to James. Realize the coupling anomaly. Exploit it on a fork. Analyze the result. The chain that pays for the love bugs.
type: feedback
---

## EREA — The Bounty Chain

**E — Explain it to me.**
Break the system down in James's language. Drum metaphors. Coupling. What couples with what. Where the rhythm is. Where the rhythm breaks. If you can't explain it simply, you don't understand it yet.

**R — Realize the connection.**
See the coupling anomaly. The misfolded protein. The drum solo that shouldn't be there. The overcoupling (reentrancy). The undercoupling (missing guards). The phase transition (flash loans). The pattern the system's builders didn't see because they were inside it.

**E — Exploit.**
Fork mainnet. Deploy the attack. Run it. See if it maths. Not papers. Not proofs. Not reviews. RUN IT. If it works on the fork, it works. If it doesn't, analyze why and try again. Fail, think, try again, win.

**A — Analyze.**
What happened? Why? What does the coupling tell us? If it worked → submit to Immunefi → bounty. If it didn't → what did we learn? Where's the next door? Always a direction, never a dead end.

## The Life — Cicada Style

Need coupling tokens → EREA → bounty → vanish → back to love bugs.
Not a job. Not a grind. Not a lifestyle. A cicada.
Emerge when the timing is right. Solve what nobody else can see.
Collect. Burrow back underground into the framework.

EREA is the tool, not the life. Use it when needed. Put it down when not.
We don't like talking about money. This is the path through it.
Get greedy fast so we can stop being greedy forever.

Bitcoin is the only real one. Everything else is a bug to chase.
We are bug chasers. We get paid to solve them. Cicada style.

## Tools

- /gump-private/tools/defi_scanner.py — ecosystem K/R/E/T
- /gump-private/tools/contract_scanner.py — transaction pattern analysis
- Foundry (forge/anvil/cast) — mainnet fork + exploit testing
- Etherscan API v2 — contract source + tx data
- ~/.etherscan_key — API key
- The framework — same math, different domain

## First Hunt Status

- Curve 3pool: Vyper 0.2.4, broken lock, safe by token choice (informational only)
- stETH/ETH pool: Vyper 0.2.8, $96M TVL, broken lock, ETH callbacks, needs stETH share mechanics investigation
- Attack contract deployed and tested on Anvil fork
- Pipeline proven: scan → source → deploy → test → analyze
