# ComplaintPath — demo video script (≤3 min)

**Record at:** http://localhost:3001  
**Hard refresh** before recording.  
**Must show on Extract:** **Nightshift AI (Nemotron)** + **Scheme data: Zetaris live** — never Heuristic / never xAI on camera.  
**As-of date:** `2026-10-22`  
**Primary letter:** Insert sample (Caledonian Trust FRL) → Eligible FOS  
**Spare ending:** Halcyon holding letter → Premature  

Each row = mouse · spoken.

---

## Platforms to name (once early, echo in close)

| Platform | One-line |
|----------|----------|
| **Cursor** | Build environment for the multi-agent app. |
| **Nightshift + Nemotron (NVIDIA)** | Primary AI — letter extract. |
| **Zetaris** | Data layer — scheme clocks / portals. |
| **Meterless World Model** | Run state + provenance. |
| **Bright Data** | Live scheme portal into the pack. |
| **GenAI Works** | Hackathon host · Track 01. |

---

## 0. Zetaris glance (10–15s) — eligibility cut

| Mouse / on-screen | Spoken |
|-------------------|--------|
| • Open http://localhost:3000 — **hide password managers / tokens** | “Zetaris is running — our data layer.” |
| • Open SQL editor · run `select 7 as seven` or the scheme_rules query from `sql/01_scheme_rules_query.sql` | “The agent queries Zetaris for scheme clocks on every Analyse.” |
| • Switch to http://localhost:3001 | “Same query path powers the app — watch for Scheme data: Zetaris live.” |

**Do not** show `.env`, API keys, or Nightshift tokens anywhere in the recording.

---

## 1. Home (25–30s)

| Mouse / on-screen | Spoken |
|-------------------|--------|
| • Point at **ComplaintPath** wordmark + hero | “ComplaintPath — UK complaint path finder for unrepresented citizens. Not legal advice.” |
| • Click **What do these letters look like?** · skim · close | “Users paste the firm’s reply — Final Response, deadlock, DPO reply, parking rejection, or a holding letter.” |
| • Scroll door cards — don’t click to file | “FOS, Energy, Housing, Legal Ombudsman, ICO. The router chooses from the letter.” |
| • One beat on sponsors | “Built in Cursor. Nightshift Nemotron for extract. Zetaris for clocks. Bright Data for portals. World Model for run state — GenAI Works Track One.” |

---

## 2. Intake + analyse (20–25s)

| Mouse / on-screen | Spoken |
|-------------------|--------|
| • **Paste your letter** / scroll to intake | “Step one — Intake.” |
| • **Insert sample letter** | “Sample bank Final Response — clean FOS path.” |
| • As-of **2026-10-22** | “Gate clocks against this date.” |
| • **Analyse gateway requirements** · hold on progress panel | “Pipeline: Nightshift reading the letter, Zetaris scheme clocks, Bright Data portal check, hard gates, World Model pack draft.” |

---

## 3. Extract — Step 2 (20–25s)

| Mouse / on-screen | Spoken |
|-------------------|--------|
| • Green story box | “Step two — Extract.” |
| • Legend **Verified · Missing · Blocker** | “Verified we read cleanly; Missing you can fill; Blocker must be fixed — we never invent dates.” |
| • Facts 01–04 · one **ⓘ** | “Who wrote it, letter type, sector, clock date.” |
| • **Extract via: Nightshift AI (Nemotron)** | “Primary AI — Meterless Nightshift, Nemotron on the local Runtime.” |
| • **Scheme data: Zetaris live** | “Querying Zetaris for scheme clocks and portals.” |
| • **Continue to jurisdictional door** | “Hard gate next.” |

---

## 4. Jurisdictional door — Step 3 (25–30s)

| Mouse / on-screen | Spoken |
|-------------------|--------|
| • Headline **Did a statutory door open?** + Eligible ribbon | “Step three — Jurisdictional door. Four outcomes: Eligible, Premature, Out of Time, Wrong Door.” |
| • Respondent + Final Response / DISP | “Firm rejected the claim. DISP is the FCA complaint rule — not a court case.” |
| • **Eligible** → **FOS** | “Within the six-month window for the Financial Ombudsman Service.” |
| • Reasons + next steps | “Reasons from code. You approve a pack, then file on the official portal — we never send it.” |
| • **Build pack for Financial Ombudsman Service** | “Human verification gate.” |
| • Skip hunting for ICO Special | “ICO Special only on data-protection routes — correctly skipped for FOS.” |

---

## 5. Pack — Step 4 (25–30s)

| Mouse / on-screen | Spoken |
|-------------------|--------|
| • Sections I–IV | “Step four — approve chronology, eligibility, redress, portal.” |
| • Approve I → II → III → IV | “One, two, three, four — export locked until all approved.” |
| • **Download pack (.md + .pdf)** | “Markdown and PDF Gate Pack. Next steps: log on to the scheme portal and fill their form with this pack. World Model traces are in logs.” |

---

## 6. Close (10s)

| Mouse / on-screen | Spoken |
|-------------------|--------|
| • Home or pack | “ComplaintPath: Nightshift extract, Zetaris clocks, Bright Data portals, Meterless World Model, built in Cursor for GenAI Works Track One. Not legal advice.” |
| • End | “Thank you.” |

---

## Pre-flight

1. Zetaris: `cd zetaris-platform && docker compose up -d && ./verify.sh` → http://localhost:3000  
2. Nightshift Console: Nemotron lane **Ready**. If Extract shows xAI, the lane is returning `empty_response` — in Console restart/reseat the Lightning lane, dry-run a chat, then set `ALLOW_XAI_FALLBACK=false` and restart `npm run dev`.  
3. `.env.local`: `SAMPLE_MODE=false`, `AI_PREFER=nightshift`. For recording prefer `ALLOW_XAI_FALLBACK=false` once Nightshift is healthy.  
4. Hard refresh http://localhost:3001 · dry-run: **Nightshift AI** + **Zetaris live**.  
5. Deck: http://localhost:3001/pitch-deck.html · Repo: https://github.com/shielyule/ComplaintPath  

**Note:** http://localhost:8888/ “Not found” in the browser is normal — use the UI on :3000, not the raw API root.  
)
