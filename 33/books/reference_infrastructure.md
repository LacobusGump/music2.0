---
name: Infrastructure Reference
description: All servers, ports, tunnels, API keys, Stripe config, LaunchAgents, Cloudflare tunnel. DO NOT LOSE.
type: reference
---

# GUMP INFRASTRUCTURE — COMPLETE REFERENCE
## Last updated: April 13, 2026

---

## PORTS

| Port | Service | File | LaunchAgent |
|------|---------|------|-------------|
| 8888 | Turbo Internet (spectral proxy) | turbo-internet/ | com.begump.turbo-internet |
| 8889 | Harmonia Reasoner | turbo-internet/harmonia_reasoner.py | com.begump.harmonia-reasoner |
| 8890 | License Server (Stripe webhook + key validation) | turbo-internet/license_server.py | com.begump.license-server |
| 11434 | Ollama (LLM, external) | system | system |

---

## LAUNCH AGENTS (~/Library/LaunchAgents/)

| Plist | Service | KeepAlive |
|-------|---------|-----------|
| com.begump.harmonia-reasoner.plist | Reasoning engine :8889 | yes |
| com.begump.license-server.plist | License/Stripe :8890 | yes |
| com.begump.turbo-internet.plist | Spectral proxy :8888 | yes |
| com.begump.grok-crawler.plist | Autonomous learning | yes |
| com.begump.harmonia-autonomous.plist | Understanding pipeline | yes |

Logs: /tmp/{service-name}.log and .err

---

## STRIPE

**Account:** beGump LLC
**Dashboard:** https://dashboard.stripe.com

**Webhook:**
- Destination ID: `we_1TLpLfGhQnEL3gS03G4YJeXt`
- Destination name: `begump_license`
- URL: `https://license.begump.com/webhook/stripe`
- Signing secret: `[REDACTED]`
- Events: `checkout.session.completed`, `customer.subscription.deleted`
- API version: 2026-03-25.dahlia

**Payment Links (12 products):**
Each link needs metadata key `product_id` with these values:

| Product | Price | product_id |
|---------|-------|-----------|
| Org X-Ray | $15/user/mo | orgxray |
| Learn Engine | $29/user/mo | learnengine |
| Knowledge Engine | $59/user/mo | knowledge |
| Turbo | $499/mo | turbo |
| AI Trainer | $2,500/mo | aitrainer |
| Universal Sensor | $2,999/mo | sensor |
| Dissonance | $2,999/mo | dissonance |
| Oracle | $3,500/mo | oracle |
| Accord | $3,999/mo | accord |
| Trace | $5,000/mo | trace |
| Fold Watch | $8,500/mo | foldwatch |
| Chip Fast | $25,000/mo | chipfast |

Sfumato = free, no Stripe link.

---

## CLOUDFLARE

**Account:** jamesmichaeldrum@gmail.com
**Domain:** begump.com
**Zone ID:** `ed93c139b430e2d491bb3f948cf1008b`

**API Token (cache purge):** `[REDACTED]` (name: dry-poetry-8467)

**Purge cache:**
```
curl -X POST "https://api.cloudflare.com/client/v4/zones/ed93c139b430e2d491bb3f948cf1008b/purge_cache" \
  -H "Authorization: Bearer [REDACTED]" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

**Tunnel:**
- Name: `begump-license`
- ID: `1197cc67-b653-4364-b498-1dafc50c0f64`
- Routes: `license.begump.com` → localhost:8890
- Config: `~/.cloudflared/config.yml`
- Credentials: `~/.cloudflared/1197cc67-b653-4364-b498-1dafc50c0f64.json`
- Cert: `~/.cloudflared/cert.pem`

**To start tunnel manually:**
```
cloudflared tunnel run begump-license
```

**To make it a LaunchAgent (TODO):**
Create com.begump.cloudflared.plist pointing to `cloudflared tunnel run begump-license`

---

## LICENSE SYSTEM

**Key generation:** `spectral_hash(email × product × timestamp)` → `GUMP-XXXX-XXXX-XXXX`
**Key storage:** `~/.gump/keys/` (JSON files, hashed filenames)
**Validation endpoint:** POST `https://license.begump.com/validate` with `{"key": "...", "machine_id": "..."}`
**Valid response:** `{"status": "valid", "K": 1.868, "resonance": "...", "product": "..."}`
**Invalid response:** `{"error": "Unknown key", "K": 0.002}`

**Flow:**
1. Customer clicks Stripe link → pays
2. Stripe sends webhook → license_server.py receives
3. Server generates key from spectral_hash(email × product × timestamp)
4. Server stores key in ~/.gump/keys/
5. Server emails key to customer
6. Customer: `license.activate('GUMP-XXXX-XXXX-XXXX')`
7. Key couples to hardware (machine fingerprint)
8. Weekly: coupling_license.py calls /validate → K stays at 1.868
9. No server for 14 days → K decays → results drift
10. Wrong hardware → calibration drift

**Coupling constants:**
- K_PEAK = 1.868 (fully licensed)
- K_DECAY_RATE = 0.003/hour
- K_MIN = 0.002 (never zero)
- RECOUPLE_INTERVAL = 7 days
- Grace period = 14 days (2× recouple interval)

---

## SECURITY (April 13, 2026)

**Fixed:**
- XSS: innerHTML → textContent for user input (soul.js)
- eval(): killed, replaced with ast.literal_eval + AST whitelist (harmonia_reasoner.py)
- CORS: wildcard * → restricted origins (begump.com + localhost)
- Rate limiting: 30/min reasoner, 5/min webhook, 30/min validate
- Input validation: 10KB body, 2000 char query, JSON type checks
- CSP header on harmonia/index.html
- Error messages sanitized (no stack traces)
- Stripe webhook signature verification active

---

## PyPI

**Package:** begump
**PyPI URL:** https://pypi.org/project/begump/
**Config:** ~/.pypirc
**Upload:** `python3 -m twine upload dist/*`

---

## gnomAD

**Index file:** /tmp/gnomad_index.json (320KB, 18,272 variants, 15 genes)
**Needs to be copied to:** gump-package/gump/gnomad_index.json for pip shipping
**API:** https://gnomad.broadinstitute.org/api (GraphQL)
**Version:** v4.1
**Auto-lookup in score_enhanced() — zero user input**

---

## CRITICAL FILES — BACK THESE UP

```
~/.cloudflared/config.yml
~/.cloudflared/cert.pem
~/.cloudflared/1197cc67-b653-4364-b498-1dafc50c0f64.json
~/.gump/keys/
~/Library/LaunchAgents/com.begump.*.plist
~/.pypirc
/tmp/gnomad_index.json (copy to permanent location)
/tmp/clean_variants.json (1,594 pathogenic variants)
/tmp/clinvar_benign.json (43 benign variants)
/tmp/*_deep.json (14 ortholog files)
```
