# ComplaintPath — HackOS submission pack

**Track:** Solving Fragmented Intelligence (01)  
**Deadline:** 27 Oct 2026, 23:45 UTC  
**One-liner:** Paste a UK rejection/FRL → hard gates in code → correct scheme or honest block → human-approved pack.

**Short description:** UK consumers face fragmented redress rules (FOS, Energy, ICO, parking ADR, FSCS). ComplaintPath extracts letter tokens via Nightshift (Nemotron), loads scheme clocks from Zetaris (or sample), applies deterministic gates, refreshes the official portal via Bright Data, and builds a pack the human must approve before export. Wrong door and late filings are blocked — not papered over by a chatbot.

## Sponsors used

| Sponsor | Role |
|---------|------|
| **Zetaris** | Scheme rules / clocks as queryable data (`loadSchemeRules`) |
| **Meterless World Model** | Shared entities + observations + provenance per run |
| **Meterless Nightshift** | Product LLM (extract + pack polish) on local Runtime `:8088` / Nemotron Lightning |
| **Bright Data** | Web Unlocker fetch of live scheme portal pages into pack §IV |
| **Cursor** | Build environment |

## Pre-existing code declaration

Domain notes, golden letters, and router drafts under the parent prep folder were authored **before** the build window and are declared here. Product code under `app/` was built from **22 Oct 2026**.

## Run (judges)

```bash
cd app
cp .env.example .env.local   # optional secrets
npm install
npm test                     # 4/4 gate vectors
SAMPLE_MODE=true npm run dev # http://localhost:3001
```

For live Nightshift + Bright Data: set `SAMPLE_MODE=false`, Nightshift Console token, and `BRIGHTDATA_API_KEY`.

## Demo script (≤3 min)

1. Home → Insert sample letter → **Analyse** → Extract → Gate **Eligible** (FOS) → approve I–IV → Export.  
2. Change as-of date past the 6-month window → **Out of Time** (export stays locked).  
3. Show `logs/<trace_id>.jsonl` (Extractor → Gate → WebRetriever → Pack → Human).  

## Failure modes (written)

| Failure | What happens |
|---------|----------------|
| Missing FRL date | EvidenceEvaluator **blocks** ELIGIBLE — refuses to invent a date |
| FOS >6 months from FRL | **TIME_BARRED** — no silent pack |
| FSCS path on solvent firm | **REDIRECT_REQUIRED** → FOS |
| ICO + damages-only | Redirect / advisory away from ICO money path |
| Nightshift down | Heuristic extract + sample mode still demos gates |
| Zetaris table missing | Falls back to `sample/schemes.json` |
| Bright Data key missing | Labelled sample portal excerpt (still shows WebRetriever in traces) |
| Non-eligible gate | Pack sections stay unapproved; export locked |

## Not claims

- Not legal advice; not a claims management company.  
- Does not auto-submit to any scheme.  
- Cursor credit was not received; build completed on existing Cursor access + local Nightshift.
