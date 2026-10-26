# ComplaintPath — what each piece does

## Live AI extract (what you need)

1. `SAMPLE_MODE=false` (no silent heuristic).  
2. Nightshift token **and/or** `XAI_API_KEY` backup.  
3. For reliable demo while Nemotron returns `empty_response`: `AI_PREFER=xai` in `.env.local`.  
4. Restart `npm run dev`.  
5. Extract Fact 03 must show **Nightshift AI** or **xAI Grok** — never Heuristic.

**Gates stay code** — AI only fills the form (sector, dates, FRL yes/no). `routeComplaint()` decides Eligible / Premature / etc.

---

## Sponsor / platform map

| Piece | Role in *this* product | Status |
|-------|------------------------|--------|
| **1. Nightshift** (Meterless Runtime) | Product LLM: letter → JSON tokens; optional pack polish; image OCR | Wired. Needs healthy Nemotron Lightning lane. |
| **2. Zetaris** | Scheme clocks / portals via SQL (`loadSchemeRules`) | Wired. Falls back to `sample/schemes.json` if Docker/table down. |
| **3. Cursor** | Build tool (this IDE). Not called at runtime by the app. | Build only. |
| **4. xAI** | Early prep option for an OpenAI-compatible LLM. **Not used in the shipped app** — Nightshift/Nemotron replaced it. | Unused at runtime. |
| **5. GenAI / GenAI.Works** | Hackathon organiser (HackOS, Discord, submission). Not an API in the app. | Event platform only. |
| **6. Bright Data** | Web Unlocker → live scheme portal text into pack §IV | Wired; needs `BRIGHTDATA_API_KEY` or uses sample excerpt. |
| **Meterless World Model** | In-process entities/observations/provenance per run | In code (`worldModel.ts`). |
| **Neo4j** | Prep-era idea for a scheme graph | **Not** in `app/src`. |

---

## Demo honesty

- **AI on:** Nightshift extract succeeds → Fact 03 says Nightshift AI.  
- **AI flaky:** Nemotron `empty_response` → heuristic + gate still run; summary notes AI failed.  
- **No Cursor credit / no xAI:** does not block submission; Cursor is the build environment, Nightshift is the power layer.
