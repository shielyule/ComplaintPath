# ComplaintPath

> **Track:** 01 · Solving Fragmented Intelligence  
> **Repo:** https://github.com/shielyule/ComplaintPath  
> **Demo template:** follows [Zetaris Prepare your demo](https://zetaris.github.io/getting-started/docs/guides/demo-template.html)  
> **Pitch deck:** open `/pitch-deck.html` when the app is running  

UK multi-scheme redress router: paste a firm’s Final Response / deadlock letter → **Nightshift** extracts facts → **Zetaris** supplies scheme clocks → hard gates in code → human-approved pack (.md + .pdf). Not legal advice. Never auto-files.

---

## What did you build?

**Question it answers:** After a UK firm’s written reply, which statutory door is open (FOS, Energy Ombudsman, ICO, parking ADR) — and should the citizen file now, wait, or choose another path?

**Working app:** Next.js agent pipeline at http://localhost:3001 — Intake → Extract → Jurisdictional door → Human gate pack → Export.

**Still missing / check:** Live Bright Data key optional (sample portal excerpt if unset). Nightshift Nemotron lane must be Ready for video (otherwise extract may use configured backup). Housing / Legal Ombudsman cards are explanatory; deep gates focus on FOS, Energy, ICO, parking.

### Agents (working feature)

| Agent | Role | Sponsor / mechanism |
|-------|------|---------------------|
| `DataRetrieverAgent` | **Queries Zetaris** for scheme clocks & portals | **Zetaris** (`src/lib/zetaris.ts`) |
| `ExtractorAgent` | Letter → structured tokens | **Nightshift** (Nemotron) |
| `GateAgent` + Evidence | Eligible / Premature / Out of Time / Wrong Door | Deterministic code |
| `WebRetrieverAgent` | Official portal excerpt into pack §IV | Bright Data Unlocker |
| `PackWriter` + Human | Approve I–IV before export | **Meterless World Model** |

---

## What data did you use?

| Source and version | Tables / views | What each row means | Dates & limitations |
|--------------------|----------------|---------------------|---------------------|
| **Zetaris** local platform (hackathon Docker bundle, API v1.0 / UI :3000) | Live SQL via UI proxy; catalog shaped as `scheme_rules` (see `sql/01_scheme_rules_query.sql`). Optional durable table: `complaintpath.scheme_rules` if you register one. | One row = one redress scheme: id, name, sector, letter window (months), wait days without FRL, portal URL, notes | Windows are scheme policy (e.g. FOS 6 months from FRL). Not case law. Attribution: scheme portals are public UK statutory / ADR sites. |
| Letter text (user paste / PDF / sample) | N/A — runtime input | One letter = one firm reply after a complaint | Demo as-of date `2026-10-22`; sample letters under `public/examples/` |
| Offline fallback | `src/lib/sample/schemes.json` | Same row shape | Used only if Zetaris is down / `SAMPLE_MODE=true` — **UI labels this** as sample, not live |

Example query output: [`sql/example_output.json`](./sql/example_output.json).

**How the agent queries Zetaris (working feature):** on every Analyse, `DataRetrieverAgent` logs into the local Zetaris UI API and runs SQL through `/api/proxy/query/sql/start`. Extract screen shows **Scheme data: Zetaris live** when that path succeeds.

---

## How can someone run it?

### 1. Access & tools (no credentials in this README)

- Docker Desktop (≈8 GB RAM) for **Zetaris** ([install locally](https://zetaris.github.io/getting-started/docs/install/updated_zetaris_installation_guide.html))
- **Nightshift** Runtime (Meterless Console) with a Nemotron lane
- Node 20+ / npm
- Optional: Bright Data Web Unlocker zone
- Copy `.env.example` → `.env.local` and fill **your own** tokens locally — **never commit `.env.local`**

### 2. Setup SQL (execution order)

1. Start Zetaris: `docker compose up -d` in your `zetaris-platform` folder → `./verify.sh`
2. Open http://localhost:3000 → sign in with the admin account from **your** Zetaris `.env` (not stored in this repo)
3. Run [`sql/01_scheme_rules_query.sql`](./sql/01_scheme_rules_query.sql) in the SQL editor (smoke `select 7`, then scheme catalog)

### 3. Query + example output

- Query file: `sql/01_scheme_rules_query.sql`
- Example rows: `sql/example_output.json`

### 4. Start the app

```bash
git clone https://github.com/shielyule/ComplaintPath.git
cd ComplaintPath
cp .env.example .env.local   # add your Nightshift / Zetaris / Bright Data values
npm install
npm test                     # gate vectors
npm run dev                  # http://localhost:3001
```

Live demo path: `SAMPLE_MODE=false`, Zetaris up, Nightshift token set, `AI_PREFER=nightshift`.

### 5. Checked when

| Check | Result (2026-10-26) |
|-------|---------------------|
| Zetaris `./verify.sh` | 9/9 pass · UI :3000 · API :8888 |
| `select 7 as seven` via UI proxy | Returns `7` |
| Scheme catalog SQL via Zetaris | Rows returned; app shows **Scheme data: Zetaris live** |
| Analyse sample FOS letter (as-of within 6 months) | Gate **Eligible → FOS** |
| Approve pack I–IV | Export .md + .pdf unlocks |
| Secrets in git | `.env*` gitignored — no credentials in README |

---

## Sponsor map (eligibility)

| Requirement | Where it shows |
|-------------|----------------|
| **Zetaris** data layer, agent queries it | `DataRetrieverAgent` + Extract badge **Zetaris live** |
| **Meterless Engine** | World Model (`src/lib/worldModel.ts`) |
| **Nightshift** primary AI | Extract badge **Nightshift AI (Nemotron)** |
| NVIDIA | Nemotron lane via Nightshift |
| Bright Data | Pack §IV portal fetch |
| Cursor (optional) | Build environment |

---

## Demo (one real request, keys hidden)

1. Zetaris UI http://localhost:3000 (no tokens on screen)  
2. App http://localhost:3001 → Insert sample letter → Analyse  
3. Point at **Extract via: Nightshift…** and **Scheme data: Zetaris live**  
4. Gate Eligible FOS → approve I–IV → Download pack  
5. Do not show `.env`, Nightshift token, or Zetaris password  

Script: [`DEMO_VIDEO_SCRIPT.md`](./DEMO_VIDEO_SCRIPT.md) · Submission notes: [`SUBMISSION.md`](./SUBMISSION.md)

---

## Before you finish (objects)

| Created | Keep / note |
|---------|-------------|
| This app repo | Keep |
| SQL under `sql/` | Keep |
| Zetaris org scheme catalog query | Re-run anytime; optional durable `complaintpath.scheme_rules` table |
| Local `.env.local` | **Do not publish** |

---

## Licence / claims

Not legal advice. Not a claims management company. Citizens file on official portals themselves.
