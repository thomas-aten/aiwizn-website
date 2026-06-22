# WakeMed Pilot Plan — derived from Graham call synopsis

**Source:** Dr. Graham Snyder meeting synopsis, June 2026
**Next step:** intro to Diane Rhyne or Robin Jacob (Director of Innovations, WakeMed)
**Frame:** investigation / experiment — not a commercial purchase

---

## The Five Audiences (and what each hates)

| Audience | What they fear | How we disarm it |
|---|---|---|
| **CME / Medical Education chief** | This replaces my role / makes me look ineffective | Position as augmentation, not replacement. Show how it makes their existing program measurably better. |
| **CIO (Cameron at WakeMed)** | Insecure software, creates IT work, integration burden | SOC-2 roadmap doc. ScORM-compatible export for their LMS. Single-tenant deployment option. |
| **"Way we've always done it" old guard** | New tech = career risk | Lean on Aten's 25 years + Graham's Chief Medical Advisor backing. We're not a fly-by-night startup. |
| **Education team (the big-PPT people)** | Their PowerPoint-based model is obsolete | Don't fight it — frame as "evidence layer underneath your training program." |
| **Value-Add Committee** | Hospitals don't want to bet on a small co. that might disappear | 25-year operating history. Pilot framing limits their downside. Research paper as exit value even if pilot ends. |

**Tactical principle from Graham:** *say what they will say before they say it.* Pre-empt every objection in the meeting opener.

---

## Pre-Meeting Deliverables (must-have before the Diane / Robin call)

- [ ] **One-page pitch deck** (Graham's headline ask — "Need a minimum 1-pager pitch deck for the meeting")
  - Problem (workforce crisis numbers — $52K/nurse, 28% retention at 6 mo, $917B by 2030)
  - Solution (one paragraph + the 4-stage flywheel)
  - Proof (Aten 25 years, NBME finalist, JP Morgan award, MacArthur, Gates — Graham as Chief Medical Advisor)
  - The pilot ask (what WakeMed gets, what we get)
  - Research / publication framing
- [ ] **Pre-emption brief** — internal doc listing every objection above with the one-sentence response. Walk the room through them in order at minute one.
- [ ] **Polished 5-6 modules** (Graham specifically said "perfect them rather than have many half-baked")
  - Cardiac STEMI · Stroke tPA · Sepsis bundle are already there
  - Add: Authority Challenge (S1-B), DNR/Family Ethics (S1-C), Language Access (S2-C) — already shipped
  - UI/colors/copy passes at this polish-only stage; no new scenarios
- [ ] **Security posture one-pager** — for Cameron / CIO
  - Supabase RLS architecture, no PHI leakage
  - SOC-2 / HITRUST roadmap
  - Single-tenant deployment option
  - Authentication: SSO-ready (Okta / Azure AD per architecture doc)
- [ ] **LMS integration story (ScORM)**
  - Statement of intent + roadmap (if not already shipped)
  - Most hospital LMSs accept ScORM packages; map our session_traces → ScORM output
- [ ] **Pricing model**
  - Subscription, tiered (Starter / Pro / Enterprise per architecture doc)
  - WakeMed pilot framing: "research collaboration with co-author publication, not a vendor sale"
  - Reference price anchor so we don't undersell

---

## Research / Publication Track (Graham's "use the PR")

- [ ] **Study protocol design** (Graham as co-author)
  - Control: WakeMed's current nurse-onboarding pathway
  - Intervention: AIWIZN-augmented
  - Primary endpoint: time-to-competency (measurable via existing WakeMed KPIs)
  - Secondary: knowledge retention at 6 months, first-year turnover
  - IRB pathway / exempt determination
- [ ] **Pre-register the study** (osf.io or similar) before data collection — protects both sides
- [ ] **Target journal** — *Simulation in Healthcare* or *Nurse Educator*, or AAMC-side for cross-pollination
- [ ] **PR plan** — wait for the data, but pre-draft the storyline: "Research using agentic AI demonstrates X improvement in nurse competency development." Graham as senior author.
- [ ] **Endpoint goals visible up front** — Graham flagged: "Slick if already have all the end-point goals we want out of it so that they can see the research study answers as to why they should purchase it." Put the pre-specified outcomes on the deck.

---

## Engineering polish for the WakeMed-shaped meeting

These are 1-2 day items each, not multi-week sprints. Goal is to get the *visible* polish where any "but the UI is clunky" objection dies.

- [ ] **Real-device mobile QA** on iPad + iPhone Safari. The audience may pull it up on their own device.
- [ ] **Loading polish** — animations, transitions, no jarring repaints. Already mostly done in v6.9 work but a tour-mode pass would help.
- [ ] **Branding hook live** — when a logged-in WakeMed user (Diane / Robin) hits aiwizn.com/dashboard, they should see "WakeMed Raleigh" in the header. Already configured in Supabase, verify the chrome surfaces it.
- [ ] **Spanish toggle visible** — international expansion proof point. Mention in passing, don't lead with it.
- [ ] **Pedagogy reveal mechanic spotlighted** — Graham's pedagogy-reveal pattern (the "Show expert pattern" button) is the differentiator vs. PowerPoint-based training. Make sure it's the first thing visible when they click into a scene.
- [ ] **ARIA mentor visible** — the conversational coach. People remember it.

---

## What's the WakeMed-specific config?

Already seeded (via the multi-tenant work earlier today):

- Customer ID: `11111111-1111-1111-1111-111111111111`
- Slug: `wakemed`
- Display name: "WakeMed Raleigh"
- Accent color: `#A4174A` (WakeMed crimson)
- D2B target: **75 min** (faster than 90, matches Graham's "but at WakeMed we shoot for faster than that")
- D2N target: **45 min** (faster than 60)
- Standing orders: all enabled at Enterprise tier
- Interpreter: "WakeMed Language Services"
- All 3 engines enabled (clinical / care-support / jc2026)

When Diane or Robin signs in, the engine renders with these. The product story writes itself: *"Same engine code, but WakeMed sees its own protocols."*

---

## Pricing / commercial framing — the Graham principle

Graham's exact thought: *"Even if it's the best deal we ever give to anyone — that goes for them — the research papers and PR from it will be awesome for us."*

Translation: **WakeMed is a marquee logo and a research collaboration, not a margin play.** Price the pilot to land it. Use it to validate the multi-tenant story, generate the published paper, and use both as the lever for paid pilots at #2 and #3 customers.

| Tier | Annual price (proposed) | Seats | Engines | Notes |
|---|---|---|---|---|
| **Pilot (WakeMed)** | $50K (or symbolic) | 50 | All 3 | Research collaboration, includes Graham co-authorship terms |
| **Starter** | $75K | 25 | Clinical only | Single-engine entry |
| **Pro** | $250K | 250 | All 3 | Standard mid-tier hospital |
| **Enterprise** | $500K+ | unlimited | All 3 + SSO + audit logs + clinical_overrides editing | WakeMed-equivalent in any post-pilot deployment |

(Real numbers obviously depend on what Arvind comes back with on hospital-EdTech benchmarks. Above is a placeholder so the deck can show *a* price.)

---

## Timing / Sequence (suggested)

| Day | Action |
|---|---|
| **Day 0** (now) | Push Graham for the Diane Rhyne / Robin Jacob introduction email |
| **Days 1-3** | Author one-pager + pre-emption brief + security posture doc + pricing card |
| **Days 3-5** | Engineering polish pass + real-device QA + tour-mode |
| **Day 5-7** | Graham reviews deck and security doc; one redraft round |
| **Day 7-10** | Send 1-pager to Diane / Robin via Graham's intro. Do NOT include the deck up front (Graham's instinct — "Ideally don't give it prior"). Save the deck for the live meeting. |
| **Meeting day** | Open with the pre-emption brief. Tour the engine on Diane's screen, logged in as WakeMed. Show the pedagogy reveal. Show the Graham co-authorship slide. Hand over the deck only as the meeting wraps. |
| **Day +1** | Follow up with the deck PDF + the research study protocol draft |

---

## Done definition for "ready for the meeting"

- One-pager exists, reviewed by Graham
- Pre-emption brief exists with at least one disarming response per audience
- Security one-pager exists, reviewed by someone IT-fluent (Arvind?)
- WakeMed customer is functional end-to-end (login → engine → admin/config edit → engine reflects change)
- 5-6 modules visibly polished (no console errors, no obvious copy gaps, mobile-clean)
- Graham has emailed Diane Rhyne / Robin Jacob the introduction
- Pricing card drafted with at least proposed tier numbers
- Research study protocol drafted in skeleton form, Graham listed as senior author
