# ComplaintPath

> **Track:** Solving Fragmented Intelligence (01)  
> **Sponsors:** Zetaris · Meterless (World Model + Nightshift) · Bright Data · Cursor  
> **Run:** `npm install && npm run dev` → http://localhost:3001  
> **Submit:** see [SUBMISSION.md](./SUBMISSION.md)

## 1. Problem

UK consumers stuck after a rejection or Final Response Letter face **fragmented** scheme rules (FOS, Energy Ombudsman, ICO, parking ADR, FSCS). Wrong door or late filing wastes months. ComplaintPath routes them to the correct path, **blocks** late/wrong-door filings in code, refreshes the official portal via Bright Data, and builds a pack they approve before export.

## 2. Agents

| Agent | Responsibility | Can block / retry? |
|-------|----------------|--------------------|
| `DataRetrieverAgent` | Loads scheme rules via Zetaris (or sample) | Yes (fallback sample) |
| `ExtractorAgent` | Letter → tokens (Nightshift or heuristic) | No inventing dates |
| `GateAgent` | Deterministic `routeComplaint()` | Yes |
| `EvidenceEvaluatorAgent` | Blocks undated FRL eligibility | Yes |
| `WebRetrieverAgent` | Bright Data unlock of scheme portal | Yes (sample excerpt fallback) |
| `PackWriterAgent` | Drafts pack sections I–IV | No |
| `FinalReviewerAgent` | Locks approvals when not eligible | Yes |
| Human | Approves each section before export | Yes |

Shared state: **Meterless World Model** (`src/lib/worldModel.ts`).

## 3. What makes this an agent system

- Extractor → Gate → Evaluator critique loop (undated FRL blocked)
- Zetaris timeout / missing table → sample rules fallback
- Bright Data portal fetch → World Model entity + pack §IV
- Gate authority over pack eligibility
- JSONL traces in `logs/`

## 4. Setup

```bash
cp .env.example .env.local
npm install
npm test                     # gate vectors (4/4)
npm run dev                  # http://localhost:3001
```

| Variable | Purpose |
|----------|---------|
| `SAMPLE_MODE=true` | Heuristic extract + sample schemes + sample portal notes |
| `SAMPLE_MODE=false` | Live Nightshift + Zetaris + Bright Data when configured |
| `METERLESS_BASE_URL` | Nightshift Console `…/v1` (default `http://127.0.0.1:8088/v1`) |
| `METERLESS_RUNTIME_TOKEN` | Nightshift Console API key |
| `METERLESS_MODEL` | `meterless/auto` (Nemotron Lightning lane) |
| `ZETARIS_*` | Local Zetaris REST |
| `BRIGHTDATA_API_KEY` | Web Unlocker API key |
| `BRIGHTDATA_UNLOCKER_ZONE` | Zone name (default `web_unlocker1`) |

## 5. Sponsor technology

**Zetaris (data).** Scheme clocks and portals through one SQL access point.

**Meterless engines (cognition).** World Model = entities, observations, provenance for the run.

**Meterless Nightshift (power).** Product LLM on local Runtime — Nemotron Lightning lane — never via Cursor model settings.

**Bright Data (web).** Web Unlocker pulls the live scheme portal into pack section IV so guidance stays current without DIY scrapers.

**Cursor (build).** Scaffolding, adapters, Monoline UI.

## 6. Demo

1. Paste sample FOS letter, as-of within 6 months → **Eligible**.  
2. Move as-of past the window → **Out of Time** (export locked).  
3. Show `logs/<trace_id>.jsonl` including `WebRetrieverAgent`.

## 7. Pre-existing / prep

Domain notes, golden letters, and router drafts under the parent prep folder were authored before the build window and are **declared** on the submission form. Product code in this `app/` directory is built from 22 Oct 2026.

## 8. Limitations

- Not legal advice. Not a claims management company.  
- Live Zetaris `complaintpath.scheme_rules` optional (sample JSON works).  
- Image OCR needs Nightshift (`SAMPLE_MODE=false`).  
- Bright Data optional at runtime — sample portal excerpt if no key.
