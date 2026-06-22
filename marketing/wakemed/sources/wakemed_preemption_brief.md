# WakeMed Pre-Emption Brief — internal use only

**Purpose:** Walk the room through every predictable objection before they raise it. Graham's principle from the call: *"Say what they will say before they say it. It defuses the resistance and earns the room."*

**Format:** Use this as the second slide / first five minutes of the meeting. Spend ≤ 90 seconds per item. Don't read it verbatim — internalize it, deliver it conversationally.

---

## Opener (60 seconds)

> "Before we show you anything, let me preempt the four conversations every hospital innovation team has when a new training platform shows up. We've thought about each of them. If we miss something, push back — that's the most useful thing you can do today."

Then walk through the four.

---

## 1. The CME / Medical Education concern

**What they'll think:** *"This is going to make our department look obsolete."*

**Your line:**
> "AIWIZN is the evidence layer underneath your existing program, not a replacement for it. Your education team still owns curriculum, accreditation, and the institutional voice. What we add is per-decision telemetry your team can't get from a slide deck — so your CME chief has data to show the C-suite that the program is working."

**Subtext you deliver implicitly:** their job gets *easier and more defensible*, not threatened.

---

## 2. The CIO / security concern (Cameron, per Graham)

**What they'll think:** *"Another insecure SaaS that creates IT work and leaks PHI."*

**Your line:**
> "Three things to know before you ask. One: no PHI touches AIWIZN — the patient cases are synthetic, by design. Two: our isolation model is row-level security in Postgres with per-customer policies, so WakeMed's session data cannot leak to any other tenant. Three: we ship ScORM exports for your existing LMS, and we're on a SOC-2 roadmap with single-tenant deployment available at enterprise tier. We've drafted a security one-pager — happy to send it to Cameron directly before any deeper conversation."

**Subtext:** you've already thought about him and you'll route around him cleanly.

---

## 3. The education / PowerPoint old guard

**What they'll think:** *"We have a 185-slide PDF. We've always done it this way."*

**Your line:**
> "Honest assessment: nobody finishes that PDF. The hospital pays for compliance check-boxes but the actual learning happens in shadowing. We're not replacing the PDF — we're replacing the shadowing-by-attrition piece, which is where time-to-competency actually lives. The 185 slides stay where they are. We measure what changes when nurses get scenario reps in parallel."

**Subtext:** you're not threatening the institutional artifact, you're solving the bottleneck *around* it.

---

## 4. The Value-Add Committee / "small vendor" concern

**What they'll think:** *"This little company will disappear in two years. We can't bet a workforce program on them."*

**Your line:**
> "Aten Inc. is 25 years old. We've held federal contracts for adaptive simulation training across pharma, aviation, and clinical for two decades, and we've won the NBME Centennial Competition, the JP Morgan Chase innovation award, and were Bill & Melinda Gates Foundation and MacArthur Foundation finalists. AIWIZN is the latest expression of that capability, not a new company. The continuity risk you're worried about doesn't apply here — and the structure of the engagement protects you regardless: it's a research collaboration with co-authored publication, not a vendor lock-in."

**Subtext:** the longevity question is wrong; here's the right frame.

---

## Bonus: things to volunteer, not wait for

Before they ask. Faster you give it, more confident you read.

- **Pricing** — *"We're pricing this pilot as a research collaboration, well below our standard pilot. The value we extract is the co-authored publication and the proof point. The value you extract is the institutional learning and the publication credit."*
- **Time commitment** — *"For Diane / Robin / Graham: ~30 minutes today, ~2 hours of design conversation if we move forward. For the nurse cohort: 20–25 minutes per scenario, ~5 scenarios total."*
- **Exit terms** — *"If at any point you decide the engine isn't working, you stop. You keep the data, you keep the institutional learning, you don't owe us anything. We don't want a customer that doesn't want us."*
- **IP terms (for the paper)** — *"WakeMed owns its institutional data and methodology. AIWIZN owns the engine and the synthesized aggregate findings. Graham is senior author. Both organizations publish freely from their portion."*

---

## Things to NOT say (failure modes)

- ❌ "We're using cutting-edge AI" — they hear *"another AI hype demo"*
- ❌ "This is the future of nursing education" — they hear *"vendor with messianic posture"*
- ❌ "We've been working really hard on this" — they hear *"vendor seeking validation"*
- ❌ "We just need a small commitment from you" — they hear *"asking permission to be a problem"*

Instead:
- ✅ "We've already done X. The question for you is whether Y is worth your team's 30 minutes."
- ✅ "Here's the trap we built around — we'd be curious whether it lines up with how you actually deploy."
- ✅ "Graham has been our clinical anchor — he's why we'd want to start with WakeMed."

---

## End of meeting close

If the meeting goes well, the close is:

> "Here's the working draft of the research collaboration MOU. One page. Read it tonight. If it makes sense, Graham introduces us to your IRB contact tomorrow and we scope the cohort design by Friday. If it doesn't, no follow-up, no awkward email chain. We respect your time either way."

If the meeting goes badly (rare given Graham as anchor):

> "Tell us specifically what's missing. We'd rather know the real objection now than spend two weeks chasing a 'let me circulate this internally.' What would make this a yes?"

---

**Meeting prep checklist**

- [ ] One-pager sent to Diane/Robin 48 hours before meeting (Graham's instinct: send the 1-page in advance, hold the full deck)
- [ ] Security one-pager drafted and ready to share post-meeting
- [ ] ScORM-export statement ready (even if it's a roadmap commitment, not a shipped feature)
- [ ] Research collaboration MOU drafted in skeleton form
- [ ] Graham confirmed attendance + has been briefed on this script
- [ ] WakeMed customer config sanity-checked in Supabase + dashboard works end-to-end
- [ ] Backup screenshare prepared in case live demo fails (you live-demo by default — backup is a Plan B)
- [ ] Aten 25-year credibility slide ready (one slide, four logos: NBME, JP Morgan, Gates, MacArthur)
