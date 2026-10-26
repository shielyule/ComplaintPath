# Submission prep day — what you do (in order)

Deadline: **Tue 27 Oct 2026, 23:45 UTC** · HackOS draft → Submit (you can edit after).

---

## 1. URLs (local — start these first)

| What | URL | Show on camera? |
|------|-----|-----------------|
| **ComplaintPath app** | http://localhost:3001 | **Yes — main demo** |
| **Nightshift Runtime API** | http://127.0.0.1:8088/v1 | Optional 2s glance at Console / Lanes (Nemotron) — not required if Fact 03 says Nightshift |
| **Nightshift Console UI** | whatever you open Nightshift with (often http://127.0.0.1:8088) | Optional — one cut: “this is our primary AI provider” |
| **Zetaris UI** | http://localhost:3000 (`ZETARIS_BASE_URL`) | Optional — SQL / table `complaintpath.scheme_rules` |
| **Zetaris REST** | http://localhost:8888/api/v1.0 | App calls this; judges see result as **Scheme data: Zetaris live** on Extract |
| **Pitch deck** | http://localhost:3001/pitch-deck.html | Export PDF for HackOS |

You do **not** need to dwell on Nightshift controls. Prefer: run Analyse → hold on Extract → **Extract via: Nightshift AI (Nemotron)** + **Scheme data: Zetaris live**.

---

## 2. Force Nightshift on camera (not xAI)

Already set in `.env.local`:

```bash
SAMPLE_MODE=false
AI_PREFER=nightshift
```

1. Nightshift must be running (Nemotron lane healthy).  
2. Restart app: `cd app && npm run dev` (port 3001).  
3. Hard refresh browser.  
4. Insert sample letter → Analyse → **Fact 03 must say Nightshift AI (Nemotron)**.  
5. If it says xAI or Heuristic — **do not record**. Fix Nightshift lane, retry.  
6. xAI key can stay in `.env.local` as silent backup **off-camera** only.

---

## 3. Show Zetaris live

1. Start Zetaris (UI :3000 + API :8888) with your usual stack.  
2. Confirm table / SQL for `complaintpath.scheme_rules` (or your seeded schemes).  
3. In the app with `SAMPLE_MODE=false`, run Analyse.  
4. On Extract, point at **Scheme data: Zetaris live (scheme clocks)** and say:  
   *“We’re querying Zetaris for scheme clocks and portals.”*  
5. If it says **Sample rules (Zetaris offline)** — Zetaris isn’t up or REST failed; start it and re-run before recording that line.

Progress panel already says “Loading scheme clocks · Zetaris…”.

---

## 4. GitHub (public repo)

`app/` already has an up-to-date **ComplaintPath README** (not the old Create-Next-App one). Git history still starts at “Initial commit” with **lots uncommitted** — you need one clean public push.

```bash
# 1) Fix GitHub auth (yours is expired)
gh auth login -h github.com

# 2) From the app folder
cd "/Users/shielyule/Desktop/ComplaintPath_Open Agent Hackathon 2026/app"

# 3) Confirm secrets will NOT commit
git check-ignore -v .env.local   # must say ignored
# Never add: .env.local, secrets/, API keys

# 4) Commit product (when you’re ready — ask the agent to commit if you want)
git status
git add -A
git status   # double-check no .env.local

# 5) Create public repo + push (example names)
gh repo create ComplaintPath --public --source=. --remote=origin --push
# If repo already exists:
# git remote add origin git@github.com:YOURUSER/ComplaintPath.git
# git push -u origin main
```

Root parent folder is **not** a git repo — push **`app/`** only (cleaner for judges).

---

## 5. Clean setup smoke (two passes)

### Pass A — gates without live AI (proves clone works)

```bash
git clone https://github.com/YOURUSER/ComplaintPath.git
cd ComplaintPath
cp .env.example .env.local
# set SAMPLE_MODE=true in .env.local
npm install
npm test          # gate vectors
npm run dev       # http://localhost:3001
```

Insert sample letter → Analyse → should complete (heuristic extract OK for this pass) → Eligible/gates still work.

### Pass B — live sponsors (what the video needs)

```bash
# Nightshift up on :8088 with Nemotron lane
# Zetaris up on :8888 (+ UI :3000)
# In .env.local: SAMPLE_MODE=false, AI_PREFER=nightshift, tokens filled
npm run dev
```

Analyse → Extract shows **Nightshift** + ideally **Zetaris live** → Gate → Pack → Download .md+.pdf.

---

## 6. Pitch deck

Open **http://localhost:3001/pitch-deck.html** → **Print / Save PDF** → upload that PDF to HackOS.

File on disk: `app/public/pitch-deck.html`

---

## 7. HackOS form (paste-ready)

Use `SUBMISSION.md` + README § Sponsor technology. Must mention:

- Zetaris = data layer (scheme clocks)  
- Meterless World Model = working engine  
- Nightshift = primary AI (Nemotron / NVIDIA)  
- Bright Data = portal unlock  
- Cursor = build (optional)

Then **Submit** the draft (edit until deadline).
