# AIWIZN × WakeMed — Early Demo + Research Collaboration Agreement

**Effective date:** _____
**Parties:** Aten Inc. ("AIWIZN") and WakeMed Health & Hospitals ("WakeMed")
**Term:** 14 months from execution, extendable by mutual written consent
**Authorized signatories:** Thomas K Vaidhyan (AIWIZN, CEO) and _____ (WakeMed, _____)

---

## 1. Purpose

This agreement establishes a milestone-billed early demonstration of the AIWIZN clinical training platform at WakeMed, paired with a parallel research collaboration to characterize the platform's effect on nurse onboarding time-to-competency, knowledge retention, and 12-month retention. Both tracks run concurrently; the early demo provides the operational use case, and the research collaboration provides the published validation artifact.

## 2. Scope of the early demo

- WakeMed designates up to **80 newly hired registered nurses** (40 control + 40 intervention per the attached Research Study Protocol) for inclusion during the term.
- AIWIZN provisions WakeMed as a tenant in the platform with WakeMed-configured protocols (door-to-balloon ≤75 min, door-to-needle ≤45 min, WakeMed branding, "WakeMed Language Services" terminology, standing-orders aligned to WakeMed policy).
- AIWIZN supplies: platform access, configuration support, telemetry data, and statistical-analysis assistance.
- WakeMed Education supplies: preceptor sign-off records, baseline time-to-competency data, and operational coordination for cohort enrollment.
- Dr. Graham Snyder serves as Senior Author on resulting publications and as Medical Reviewer for any AIWIZN clinical content updates during the study window.

## 3. Pricing — milestone-billed structure

WakeMed pays a **total of $50,000** during the 14-month term, billed against four operational milestones (not calendar dates). This structure is designed so that WakeMed's outlay tracks delivered value:

| # | Milestone | Trigger | Amount | Approx. timing |
|---|---|---|---|---|
| 1 | **Execution and provisioning** | Agreement countersigned, WakeMed tenant configured, IRB submission package delivered | $5,000 | Day 0 |
| 2 | **Cohort 1 onboarded** | First 20 nurses enrolled, baseline assessment captured, telemetry pipeline confirmed | $15,000 | ~Day 30 |
| 3 | **Mid-study interim review** | 30+ nurses completed assigned scenarios, mid-study competency snapshot delivered, IRB interim report submitted | $20,000 | ~Day 90 |
| 4 | **Pre-publication data lock** | All cohorts completed onboarding curriculum, 6-month retention data captured for first cohort, final analysis dataset locked | $10,000 | ~Month 12 |

This is a **discounted founding-customer rate** — list pricing for an equivalent Pro-tier engagement is $250K annually. The discount reflects WakeMed's role as the named research-collaboration site, Graham's clinical advisor role, and the co-authored publication outcome.

Post-term commercial terms (if WakeMed wishes to continue) are addressed in a separate license agreement to be negotiated in good faith at month 12, with WakeMed receiving most-favored-customer rates for the first 24 months post-term.

## 4. Education license framing

The above $50,000 covers both **platform license** (seats, support, configuration, training) and **research participation** (statistical-analysis support, co-authored manuscript, data export). The license is **scoped to the 80-nurse cohort** participating in the study; if WakeMed wishes to expand access to additional staff during the term, AIWIZN extends seat coverage at a $200/seat-year incremental rate (capped at $5,000 total during the term).

## 5. Data ownership and handling

- **WakeMed's institutional data** (cohort identities, preceptor records, HR turnover data) remains the property of WakeMed and is not transferred to AIWIZN.
- **Platform telemetry** (decision selections, scoring profiles, time-on-task) is stored in AIWIZN's Supabase with WakeMed-scoped RLS and accessible to both parties.
- **Aggregate findings** (statistical summaries, anonymized analyses) are jointly owned and may be published by either party with co-author credit to the other.
- **No PHI** is transferred under this agreement; all scenario content is synthetic.
- AIWIZN agrees to standard Business Associate Agreement terms if any inadvertent PHI exposure arises (no PHI is anticipated).

## 6. IRB and regulatory

- WakeMed serves as the IRB of record (its IRB office reviews and approves the protocol).
- AIWIZN cooperates fully with any IRB queries and provides platform documentation as requested.
- Either party may suspend the study pending IRB or regulatory review without breach; any suspension exceeding 90 days pauses the milestone billing schedule pro-rata.

## 7. Intellectual property

- AIWIZN owns and retains all rights to the AIWIZN platform, engine code, scoring methodology, and clinical scenarios.
- WakeMed owns and retains all rights to its operational data, preceptor rubrics, and institutional methodology.
- Joint findings, aggregate analyses, and the resulting manuscript are jointly owned with equal author and publication rights.
- Neither party may use the other's name or trademarks in marketing materials without prior written consent, with the exception of factual references to this engagement in research, regulatory, or publication contexts.

## 8. Publication terms

- Target submission window: within 14 months of IRB approval.
- Senior author: Dr. Graham E. Snyder, MD FACEP.
- Co-authorship rights extend to any individual at either organization who meets ICMJE authorship criteria.
- Both organizations have right of first review of any draft manuscript prior to submission.
- Neither party may unilaterally publish primary outcome data without the other's reasonable consent (consent not to be unreasonably withheld; 30-day review window applies).

## 9. Deployment posture (CIO note)

- AIWIZN runs as **multi-tenant SaaS** on Vercel + Supabase. RLS-enforced per-tenant isolation. No PHI, by architecture.
- For WakeMed this means **zero net-new infrastructure**: no servers to provision, no AWS/Azure subscription to spin up, no on-prem deployment. Nurses log in at `aiwizn.com/dashboard` and the platform serves them their WakeMed-configured tenant.
- A **dedicated single-tenant Supabase project** is available as a no-cost option if WakeMed IT prefers; switching is a one-day provisioning task. Not required for the early demo and not recommended at this stage.
- See the AIWIZN Security & IT Posture one-pager (Exhibit C) for the full technical detail.

## 10. Confidentiality

- Each party will treat the other's non-public information as confidential under the terms of the existing mutual NDA (or, if none, the standard mutual NDA attached as Exhibit A).
- Aggregate study findings are NOT confidential once approved for publication.
- Underlying institutional data (WakeMed) and platform internals (AIWIZN) remain confidential indefinitely.

## 11. Termination

Either party may terminate this agreement with **30 days written notice**, without cause. On termination:
- AIWIZN provides WakeMed with a final telemetry export and a final invoice for milestones earned through the termination date.
- Already-paid milestones are non-refundable; unearned milestones are not owed.
- Data already collected may be used by either party for the contractually-permitted publication.
- All confidentiality, IP, and publication terms survive termination.

## 12. Limitations of liability

Each party's total liability under this agreement is capped at the total amounts paid hereunder. Neither party is liable for consequential, indirect, or punitive damages. Standard mutual indemnification for third-party IP claims applies.

## 13. Governing law

This agreement is governed by the laws of the State of North Carolina. Disputes will be resolved by good-faith negotiation, then by binding arbitration in Wake County, NC.

---

**Signed:**

**For Aten Inc. / AIWIZN:**
Thomas K Vaidhyan, CEO
Date: _____

**For WakeMed Health & Hospitals:**
_____ (Title)
Date: _____

---

**Attachments:**
- Exhibit A: Research Study Protocol (version-controlled separately)
- Exhibit B: Mutual NDA (if not previously executed)
- Exhibit C: AIWIZN Security & IT Posture (security one-pager)

**Notes for WakeMed counsel:**
- This is a **commercial license agreement with research collaboration overlay**, NOT a research grant or sponsored research agreement. The $50K is platform license + services, not a sponsorship.
- The milestone structure spreads payment so that **WakeMed never pays for a milestone that hasn't delivered.** First payment triggers only after tenant is provisioned and IRB submission package is in hand.
- **Pre-execution review** with WakeMed legal recommended; AIWIZN is open to fact-checks on any of these clauses.
