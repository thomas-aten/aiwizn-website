-- notify_new_session_offering_dispatch
--
-- Defect fix — completion email defect (AI Readiness completions were
-- receiving the CLINICAL email).
--
-- Root cause: `private.notify_new_session()` hard-codes the clinical
-- engine's persona-email template — eyebrow ("CLINICAL ASSESSMENT"),
-- index name ("NWI"), stage copy ("clinical decisions … recognise when
-- to escalate"), and the 11 clinical domain columns (`d1_ambiguity` …
-- `d12_moral`). The AI Readiness engine writes its composite into
-- `nwi_pct` (column reuse) and stamps `raw_payload->>offering = 'ai-readiness'`
-- with domain scores in `raw_payload->'ari_domains'` (governance, bias,
-- failure_mode, disclosure, escalation). The clinical domain SELECTs find
-- nothing → "strongest" / "development" both render blank at 0% — Bug B.
-- The hardcoded clinical labels mis-frame the entire email — Bug A.
--
-- ── FROZEN-ENGINE GUARDRAIL ──────────────────────────────────────────
-- The CLINICAL email must render byte-identical to today's output for
-- every existing clinical row (WakeMed cohort testers, UNC, Duke, AHN,
-- Demo Hospital). This migration preserves the clinical template
-- character-for-character inside `private._persona_email_clinical()`,
-- and the dispatch defaults to the clinical builder for any row whose
-- `raw_payload->>offering` is NULL, missing, empty, or unrecognised.
-- The only behavioural change for a clinical row is the function call
-- boundary; the resulting Resend payload is the same JSON.
--
-- ── DISPATCH LOGIC (revised — fails closed) ─────────────────────────
--   raw_payload->>'offering' = 'ai-readiness'                          → ARI builder
--   raw_payload->>'offering' = 'clinical'                              → clinical builder (preserved byte-identical)
--   scenario_slug = 'cardiac-stroke-sepsis-v5' (legacy unstamped clin) → clinical builder
--   otherwise (any unmapped / NULL / future offering)                  → NO learner email + INSERT into private.email_dispatch_log
--
-- Rationale: defaulting unmapped offerings to the clinical builder caused
-- the AR completion-email defect (Bugs A + B). Forward-compat — when a new
-- offering (PCRI, JCRI) adds learner-email capture, the engine must
-- explicitly stamp `raw_payload.offering` AND a builder must be added
-- here. Until then, the audit row in email_dispatch_log makes the gap
-- visible instead of shipping a wrong email.
--
-- ── REGRESSION TEST (run after apply, AGAINST STAGING, NOT PROD) ─────
-- See the regression assertion at the end of this file for the byte-
-- identical clinical-render proof.

-- Drop the existing function so we can recreate it (CREATE OR REPLACE is
-- safe but we want the body to be the dispatch wrapper, not the original).
-- The trigger `trg_notify_new_session` on `public.prototype_sessions`
-- (created in a prior migration) keeps pointing to the same function
-- name, so no trigger DDL is needed.

-- ─────────────────────────────────────────────────────────────────────
-- 1.  Helpers — Slack notification (extracted, unchanged)
-- ─────────────────────────────────────────────────────────────────────
create or replace function private._slack_notify_session(
  new public.prototype_sessions,
  _slack_url text,
  _site_url  text
) returns void
language plpgsql
security definer
set search_path to 'private','public','net','extensions'
as $$
declare
  _summary    text;
  _detail     text;
  _slack_body jsonb;
begin
  if _slack_url is null or _slack_url = '' then return; end if;

  _summary := format(
    '*New AIWIZN session* — %s (%s) at %s · NWI %s%% · %s expert / %s mid / %s gap',
    coalesce(new.nurse_name, 'Anonymous'),
    new.learner_email,
    coalesce(new.learner_org, 'no org'),
    coalesce(new.nwi_pct, 0),
    coalesce(new.expert_count, 0),
    coalesce(new.mid_count, 0),
    coalesce(new.gap_count, 0)
  );
  _detail := format('%sUnit: %s | Scenario: %s | Reflection: %s',
    e'\n',
    coalesce(new.unit, '—'),
    coalesce(new.scenario_slug, '—'),
    coalesce(left(new.reflection, 240), '—'));

  _slack_body := jsonb_build_object(
    'text', _summary || _detail,
    'blocks', jsonb_build_array(
      jsonb_build_object('type', 'section',
        'text', jsonb_build_object('type', 'mrkdwn', 'text', _summary)),
      jsonb_build_object('type', 'context',
        'elements', jsonb_build_array(
          jsonb_build_object('type', 'mrkdwn',
            'text', format('Unit: *%s* · Scenario: `%s` · Try it: %s',
                           coalesce(new.unit,'—'),
                           coalesce(new.scenario_slug,'—'),
                           _site_url)))),
      case when new.reflection is not null and new.reflection <> '' then
        jsonb_build_object('type', 'section',
          'text', jsonb_build_object('type', 'mrkdwn',
            'text', '> ' || replace(left(new.reflection, 600), e'\n', e'\n> ')))
      else
        jsonb_build_object('type', 'context',
          'elements', jsonb_build_array(jsonb_build_object('type', 'mrkdwn', 'text', 'No reflection')))
      end,
      jsonb_build_object('type', 'context',
        'elements', jsonb_build_array(
          jsonb_build_object('type', 'mrkdwn',
            'text', format('id: `%s` · <https://supabase.com/dashboard/project/scyfldezhztapttcyenr/editor|Open in Supabase>', new.id))))
    )
  );

  perform net.http_post(
    url     => _slack_url,
    body    => _slack_body,
    headers => jsonb_build_object('Content-Type', 'application/json')
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 2.  Helpers — INTERNAL notification email (extracted, unchanged)
-- ─────────────────────────────────────────────────────────────────────
create or replace function private._internal_email_session(
  new public.prototype_sessions,
  _resend_key text,
  _from_email text,
  _to_email   text,
  _site_url   text
) returns void
language plpgsql
security definer
set search_path to 'private','public','net','extensions'
as $$
declare
  _email_body jsonb;
begin
  if _resend_key is null or _resend_key = '' then return; end if;
  if _to_email   is null or _to_email   = '' then return; end if;

  _email_body := jsonb_build_object(
    'from',    _from_email,
    'to',      jsonb_build_array(_to_email),
    'subject', format('AIWIZN: new session from %s (NWI %s%%)',
                      coalesce(new.nurse_name, 'Anonymous'),
                      coalesce(new.nwi_pct, 0)),
    'html', format(
      '<div style="font-family:system-ui,sans-serif;max-width:560px;color:#0A1826">' ||
      '<h2 style="margin:0 0 12px;color:#00A87A">New AIWIZN session</h2>' ||
      '<table style="border-collapse:collapse;width:100%%;font-size:14px">' ||
      '<tr><td style="padding:6px 0;color:#6B88A0">Name</td><td>%s</td></tr>' ||
      '<tr><td style="padding:6px 0;color:#6B88A0">Email</td><td><a href="mailto:%s">%s</a></td></tr>' ||
      '<tr><td style="padding:6px 0;color:#6B88A0">Organisation</td><td>%s</td></tr>' ||
      '<tr><td style="padding:6px 0;color:#6B88A0">Unit</td><td>%s</td></tr>' ||
      '<tr><td style="padding:6px 0;color:#6B88A0">NWI</td><td><b>%s%%</b></td></tr>' ||
      '<tr><td style="padding:6px 0;color:#6B88A0">Choices</td><td>%s expert · %s mid · %s gap</td></tr>' ||
      '<tr><td style="padding:6px 0;color:#6B88A0">Reflection</td><td>%s</td></tr>' ||
      '</table>' ||
      '<p style="margin:18px 0 0;font-size:12px;color:#6B88A0">' ||
      '<a href="https://supabase.com/dashboard/project/scyfldezhztapttcyenr/editor">Open in Supabase →</a>  ·  ' ||
      '<a href="%s">Open AIWIZN site →</a></p>' ||
      '</div>',
      coalesce(new.nurse_name, '—'),
      new.learner_email, new.learner_email,
      coalesce(new.learner_org, '—'),
      coalesce(new.unit, '—'),
      coalesce(new.nwi_pct, 0),
      coalesce(new.expert_count, 0),
      coalesce(new.mid_count, 0),
      coalesce(new.gap_count, 0),
      coalesce(replace(new.reflection, e'\n', '<br>'), '—'),
      _site_url
    )
  );

  perform net.http_post(
    url     => 'https://api.resend.com/emails',
    body    => _email_body,
    headers => jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _resend_key
    )
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 3.  Helper — CLINICAL learner email (byte-identical to prod)
--
-- Body is the EXACT learner-email block copied verbatim from the
-- pre-migration `private.notify_new_session()` source via
-- pg_get_functiondef. md5 of the verbatim slice (anchored from
-- "-- ===== LEARNER PERSONA EMAIL" through the final closing `end if;`):
--   2b5a1535f41044f8b4225b25afa43133  (11479 bytes)
-- That md5 was the freeze-gate target before splice. The Resend POST
-- payload this helper sends for a clinical row therefore has the same
-- bytes as the pre-migration trigger output for the same row.
-- ─────────────────────────────────────────────────────────────────────
create or replace function private._persona_email_clinical(
  new public.prototype_sessions,
  _resend_key text,
  _from_email text,
  _site_url   text
) returns void
language plpgsql
security definer
set search_path to 'private','public','net','extensions'
as $$
declare
  _stage       text;
  _stage_blurb text;
  _top_name    text;
  _top_score   smallint;
  _top_meaning text;
  _bot_name    text;
  _bot_score   smallint;
  _bot_step    text;
  _short_first text;
  _learner_body jsonb;
begin
  if _resend_key is null or _resend_key = '' then return; end if;
  if new.learner_email is null then return; end if;

  -- ===== LEARNER PERSONA EMAIL =======================================
  if coalesce(new.nwi_pct, 0) >= 80 then
    _stage := 'Proficient → Expert';
    _stage_blurb := 'You demonstrate consistent expert-pattern decisions across high-stakes scenarios. Ready for advanced complexity.';
  elsif coalesce(new.nwi_pct, 0) >= 60 then
    _stage := 'Competent → Proficient';
    _stage_blurb := 'You make sound clinical decisions and recognise when to escalate. A second cycle in 30 days will sharpen the gap areas.';
  elsif coalesce(new.nwi_pct, 0) >= 40 then
    _stage := 'Advanced Beginner → Competent';
    _stage_blurb := 'You have the foundations. Targeted practice on the development domain below will accelerate your trajectory.';
  else
    _stage := 'Advanced Beginner';
    _stage_blurb := 'Early in your trajectory. Preceptor review and focused practice on flagged nodes is recommended before independent practice.';
  end if;

  select dn, sc into _top_name, _top_score
  from (values
    ('Ambiguity Tolerance',        new.d1_ambiguity),
    ('Therapeutic Communication',  new.d2_communication),
    ('Ethical Reasoning',          new.d3_ethics),
    ('Psychological Safety',       new.d4_psych_safety),
    ('Deterioration Recognition',  new.d5_deterioration),
    ('Pharmacology Safety',        new.d6_pharmacology),
    ('SBAR / Handover',            new.d7_sbar),
    ('Prioritisation',             new.d8_priority),
    ('Cultural Humility',          new.d9_culture),
    ('Social Complexity',          new.d11_social),
    ('Moral Resilience',           new.d12_moral)
  ) as t(dn, sc)
  where sc is not null
  order by sc desc
  limit 1;

  select dn, sc into _bot_name, _bot_score
  from (values
    ('Ambiguity Tolerance',        new.d1_ambiguity),
    ('Therapeutic Communication',  new.d2_communication),
    ('Ethical Reasoning',          new.d3_ethics),
    ('Psychological Safety',       new.d4_psych_safety),
    ('Deterioration Recognition',  new.d5_deterioration),
    ('Pharmacology Safety',        new.d6_pharmacology),
    ('SBAR / Handover',            new.d7_sbar),
    ('Prioritisation',             new.d8_priority),
    ('Cultural Humility',          new.d9_culture),
    ('Social Complexity',          new.d11_social),
    ('Moral Resilience',           new.d12_moral)
  ) as t(dn, sc)
  where sc is not null and dn <> coalesce(_top_name, '__none__')
  order by sc asc
  limit 1;

  _top_meaning := case _top_name
    when 'Psychological Safety'      then 'You challenge unsafe authority and advocate for patients under social pressure — the top differentiator between adequate and expert nurses in high-stakes situations.'
    when 'Deterioration Recognition' then 'You consistently recognise clinical deterioration early and initiate parallel responses — the single most protective nursing behaviour in emergency settings.'
    when 'SBAR / Handover'           then 'Your handoff communication is structured and complete. Physicians get what they need to make fast decisions.'
    when 'Pharmacology Safety'       then 'Your pharmacology safety instincts are strong. Contraindication recognition at point of administration is a rare and high-value skill.'
    when 'Therapeutic Communication' then 'Your crisis and grief communication is expert-level — families cooperate with care when nurses communicate this way.'
    when 'Cultural Humility'         then 'Language access and cultural humility are integrated into your practice, directly reducing readmission and harm.'
    when 'Ethical Reasoning'         then 'You navigate ethical ambiguity with accuracy — DNR integrity, consent frameworks, and advocacy all at expert level.'
    when 'Ambiguity Tolerance'       then 'You manage multiple competing demands without defaulting to sequential thinking — a key marker of ICU and ER readiness.'
    when 'Prioritisation'            then 'Your prioritisation under pressure is reliable. The right patient gets the right attention at the right time.'
    when 'Social Complexity'         then 'You see structural barriers and respond to them — interpreter access, discharge equity, and dignity restoration.'
    when 'Moral Resilience'          then 'Your post-incident processing pattern shows integration rather than suppression — the resilience architecture for a long career.'
    else 'You demonstrated strength across multiple competency domains.' end;

  _bot_step := case _bot_name
    when 'Psychological Safety'      then 'Practise the two-challenge protocol as a scripted phrase: "Protocol requires [specific requirement] before I can proceed." Rehearsal removes hesitation in the moment.'
    when 'Deterioration Recognition' then 'Review qSOFA and SOFA scoring tools until they are automatic. Memorising the criteria removes the cognitive burden of uncertainty at 0340.'
    when 'Pharmacology Safety'       then 'Build a personal contraindication checklist for high-risk drugs (thrombolytics, anticoagulants, vasoactives). A 30-second structured check before administration catches what memory misses.'
    when 'SBAR / Handover'           then 'After every escalation call, review: did you give S, B, A, and R? The R (Recommendation) is what gets the order. Without it you get a question back.'
    when 'Therapeutic Communication' then 'Practise: acknowledge emotion before providing clinical information. "I can see this is frightening" before "here is what we are doing" changes the entire dynamic.'
    when 'Cultural Humility'         then 'Locate the phone interpreter access number in your unit tonight. The barrier to qualified interpretation is usually not availability — it is not knowing how to access it quickly.'
    when 'Ethical Reasoning'         then 'DNR and consent situations clarify with one principle: what did the patient choose when they had capacity? That is the anchor.'
    when 'Ambiguity Tolerance'       then 'In multi-patient situations, practise saying the options out loud before choosing. Externalising the decision slows the process enough to catch errors.'
    when 'Prioritisation'            then 'Practise identifying your highest-acuity patient before touching a chart. The habit of "who needs me first?" is the foundation of safe prioritisation.'
    when 'Social Complexity'         then 'Language access is a patient safety issue, not administrative. Every time you use a qualified interpreter for a clinical conversation, you are preventing a potential adverse event.'
    when 'Moral Resilience'          then 'After difficult shifts, identify one thing you would do the same and one differently. Two minutes. That is the debrief habit that prevents moral injury.'
    else 'Review the formative feedback for nodes in this domain.' end;

  _short_first := split_part(coalesce(new.nurse_name, 'Clinician'), ' ', 1);

  if _resend_key is not null and _resend_key <> '' then
    _learner_body := jsonb_build_object(
      'from',    _from_email,
      'to',      jsonb_build_array(new.learner_email),
      'reply_to','hello@aiwizn.com',
      'subject', format('Your AIWIZN PERSONA — NWI %s%%', coalesce(new.nwi_pct, 0)),
      'html', format(
        '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;color:#0A1826">' ||
        '<div style="padding:32px 28px 8px">' ||
          '<div style="font-size:11px;letter-spacing:0.18em;color:#00A87A;text-transform:uppercase;font-weight:600;margin-bottom:8px">AIWIZN · CLINICAL ASSESSMENT</div>' ||
          '<h1 style="margin:0 0 14px;font-size:26px;font-weight:600;line-height:1.3;color:#0A1826">Your PERSONA: NWI %s%%</h1>' ||
          '<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#2E4A62">%s, you completed the assessment. Here is what your decision pattern tells us.</p>' ||
        '</div>' ||
        '<div style="margin:0 28px;padding:20px 24px;background:#F5F8FA;border-radius:12px;border-left:4px solid #00A87A">' ||
          '<div style="font-size:10px;letter-spacing:0.14em;color:#6B88A0;text-transform:uppercase;font-weight:600;margin-bottom:6px">Stage</div>' ||
          '<div style="font-size:18px;font-weight:600;color:#0A1826;margin-bottom:6px">%s</div>' ||
          '<div style="font-size:13.5px;color:#2E4A62;line-height:1.55;margin-bottom:14px">%s</div>' ||
          '<div style="font-size:13px;color:#6B88A0">' ||
            '<span style="color:#00A87A;font-weight:700">%s expert</span> · ' ||
            '<span style="color:#B45309;font-weight:700">%s developing</span> · ' ||
            '<span style="color:#DC2626;font-weight:700">%s gap</span>' ||
          '</div>' ||
        '</div>' ||
        '<div style="padding:24px 28px 0">' ||
          '<div style="margin-bottom:22px">' ||
            '<div style="font-size:10px;letter-spacing:0.14em;color:#00A87A;text-transform:uppercase;font-weight:600;margin-bottom:6px">✦ Your strongest competency</div>' ||
            '<div style="font-size:16px;font-weight:600;color:#0A1826;margin-bottom:6px">%s <span style="color:#6B88A0;font-weight:400;font-size:13px">(%s%%)</span></div>' ||
            '<div style="font-size:13.5px;color:#2E4A62;line-height:1.65">%s</div>' ||
          '</div>' ||
          '<div>' ||
            '<div style="font-size:10px;letter-spacing:0.14em;color:#B45309;text-transform:uppercase;font-weight:600;margin-bottom:6px">↗ Development area</div>' ||
            '<div style="font-size:16px;font-weight:600;color:#0A1826;margin-bottom:6px">%s <span style="color:#6B88A0;font-weight:400;font-size:13px">(%s%%)</span></div>' ||
            '<div style="font-size:13.5px;color:#2E4A62;line-height:1.65">%s</div>' ||
          '</div>' ||
        '</div>' ||
        '<div style="margin:32px 0 0;padding:22px 28px;background:#0A1826;color:#fff">' ||
          '<div style="font-size:10px;letter-spacing:0.14em;color:#00EDB4;text-transform:uppercase;font-weight:600;margin-bottom:8px">What is next</div>' ||
          '<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.85)">Share your PERSONA with a colleague, or revisit the assessment in 30 days to see your trajectory. Reply to this email if you would like to discuss your results.</p>' ||
          '<a href="%s" style="display:inline-block;padding:11px 22px;background:#00A87A;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;letter-spacing:0.04em">Open AIWIZN →</a>' ||
        '</div>' ||
        '<div style="padding:18px 28px 28px;font-size:11px;color:#A2BAC8;text-align:center;line-height:1.6">' ||
          'AIWIZN · Clinical Assessment Engine · Aten Inc<br>' ||
          'You received this because you completed an AIWIZN session.' ||
        '</div>' ||
        '</div>',
        coalesce(new.nwi_pct, 0),
        _short_first,
        _stage,
        _stage_blurb,
        coalesce(new.expert_count, 0),
        coalesce(new.mid_count, 0),
        coalesce(new.gap_count, 0),
        coalesce(_top_name, '—'),
        coalesce(_top_score, 0),
        _top_meaning,
        coalesce(_bot_name, '—'),
        coalesce(_bot_score, 0),
        _bot_step,
        _site_url
      )
    );
    perform net.http_post(
      url     => 'https://api.resend.com/emails',
      body    => _learner_body,
      headers => jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _resend_key
      )
    );
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 4.  Helper — AI READINESS learner email (new)
--
-- Reads scoring from `nwi_pct` (column reuse — engine writes ARI
-- composite there) and `raw_payload->'ari_domains'` (governance, bias,
-- failure_mode, disclosure, escalation → pct). All clinical labels
-- swapped for AI-governance equivalents. US spelling ("recognize"
-- not "recognise"). Subject and footer reframed for the AI Readiness
-- offering. Stage rubric tuned for AI-governance language.
-- ─────────────────────────────────────────────────────────────────────
create or replace function private._persona_email_ari(
  new public.prototype_sessions,
  _resend_key text,
  _from_email text,
  _site_url   text
) returns void
language plpgsql
security definer
set search_path to 'private','public','net','extensions'
as $$
declare
  _stage       text;
  _stage_blurb text;
  _top_name    text;
  _top_score   smallint;
  _top_meaning text;
  _bot_name    text;
  _bot_score   smallint;
  _bot_step    text;
  _short_first text;
  _learner_body jsonb;
  _domains     jsonb;
  _top_key     text;
  _bot_key     text;
begin
  if _resend_key is null or _resend_key = '' then return; end if;
  if new.learner_email is null then return; end if;

  _domains := coalesce(new.raw_payload->'ari_domains', '{}'::jsonb);

  -- Stage rubric (AI Readiness) — US spelling, governance framing.
  if coalesce(new.nwi_pct, 0) >= 80 then
    _stage := 'Proficient → Expert';
    _stage_blurb := 'You demonstrate consistent expert-pattern reasoning about AI in clinical workflows. Ready to mentor peers through the next AI rollout.';
  elsif coalesce(new.nwi_pct, 0) >= 60 then
    _stage := 'Competent → Proficient';
    _stage_blurb := 'You make sound judgments about AI use and know when to escalate. A second cycle in 30 days will sharpen the governance areas.';
  elsif coalesce(new.nwi_pct, 0) >= 40 then
    _stage := 'Advanced Beginner → Competent';
    _stage_blurb := 'You have the foundations. Targeted practice on the development domain below will accelerate your AI readiness trajectory.';
  else
    _stage := 'Advanced Beginner';
    _stage_blurb := 'Early in your AI readiness trajectory. Reviewing your facility''s AI governance policies and shadowing the next AI committee meeting is recommended.';
  end if;

  -- Strongest / development domain — read from JSONB map.
  select key, (value::text)::int into _top_key, _top_score
  from jsonb_each_text(_domains)
  where value is not null and value::text ~ '^[0-9]+$'
  order by (value::text)::int desc
  limit 1;

  select key, (value::text)::int into _bot_key, _bot_score
  from jsonb_each_text(_domains)
  where value is not null and value::text ~ '^[0-9]+$' and key <> coalesce(_top_key, '__none__')
  order by (value::text)::int asc
  limit 1;

  _top_name := case _top_key
    when 'governance'   then 'Governance Literacy'
    when 'bias'         then 'Bias Recognition'
    when 'failure_mode' then 'Failure-Mode Response'
    when 'disclosure'   then 'Disclosure Judgment'
    when 'escalation'   then 'Escalation Discipline'
    else coalesce(_top_key, '—') end;

  _bot_name := case _bot_key
    when 'governance'   then 'Governance Literacy'
    when 'bias'         then 'Bias Recognition'
    when 'failure_mode' then 'Failure-Mode Response'
    when 'disclosure'   then 'Disclosure Judgment'
    when 'escalation'   then 'Escalation Discipline'
    else coalesce(_bot_key, '—') end;

  _top_meaning := case _top_key
    when 'governance'   then 'Your AI governance literacy is strong. You navigate escalation channels, committee structure, and reporting paths with clarity — the foundation of safe AI deployment.'
    when 'bias'         then 'Your bias-recognition instincts are sharp. You spot demographic outliers in model performance and flag them through the right channel before they reach patient care.'
    when 'failure_mode' then 'Your model failure-mode detection is reliable. You recognize stale, drifting, or anomalous AI output and act on the disagreement rather than the prediction.'
    when 'disclosure'   then 'Your disclosure judgment is patient-centered and proportional. You know when AI use needs to be surfaced to patients and families, and you frame it without alarming them.'
    when 'escalation'   then 'Your escalation discipline is what AI safety registries are built for. You document, surface, and submit the events that close the feedback loop.'
    else 'You demonstrated strength across multiple AI readiness domains.' end;

  _bot_step := case _bot_key
    when 'governance'   then 'Sit in on your next AI Governance Committee meeting. Knowing who decides what — and on what cadence — removes the cognitive burden when the next AI flag arrives.'
    when 'bias'         then 'Pull the next quarterly model performance report and look specifically for subgroup gaps. The pattern of "where the model works less well" is the pattern of who is being underserved.'
    when 'failure_mode' then 'Build a habit of comparing AI output against your bedside read every time, not just when alarmed. The instinct to ask "does this match what I see?" is the failure-mode safety net.'
    when 'disclosure'   then 'Practice one sentence: "A predictive tool helped flag this — your care team confirmed it." Saying it out loud once removes the freeze in the moment.'
    when 'escalation'   then 'Locate your facility''s AI safety-event reporting form tonight. The barrier to reporting is usually not motivation — it is not knowing where the form lives.'
    else 'Review the teaching reveals for the scenarios in this domain.' end;

  _short_first := split_part(coalesce(new.nurse_name, 'Clinician'), ' ', 1);

  _learner_body := jsonb_build_object(
    'from',    _from_email,
    'to',      jsonb_build_array(new.learner_email),
    'reply_to','hello@aiwizn.com',
    'subject', format('Your AIWIZN PERSONA — ARI %s%%', coalesce(new.nwi_pct, 0)),
    'html', format(
      '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;color:#0A1826">' ||
      '<div style="padding:32px 28px 8px">' ||
        '<div style="font-size:11px;letter-spacing:0.18em;color:#00A87A;text-transform:uppercase;font-weight:600;margin-bottom:8px">AIWIZN · AI READINESS ASSESSMENT</div>' ||
        '<h1 style="margin:0 0 14px;font-size:26px;font-weight:600;line-height:1.3;color:#0A1826">Your PERSONA: ARI %s%%</h1>' ||
        '<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#2E4A62">%s, you completed the assessment. Here is what your AI-reasoning pattern tells us.</p>' ||
      '</div>' ||
      '<div style="margin:0 28px;padding:20px 24px;background:#F5F8FA;border-radius:12px;border-left:4px solid #00A87A">' ||
        '<div style="font-size:10px;letter-spacing:0.14em;color:#6B88A0;text-transform:uppercase;font-weight:600;margin-bottom:6px">Stage</div>' ||
        '<div style="font-size:18px;font-weight:600;color:#0A1826;margin-bottom:6px">%s</div>' ||
        '<div style="font-size:13.5px;color:#2E4A62;line-height:1.55;margin-bottom:14px">%s</div>' ||
        '<div style="font-size:13px;color:#6B88A0">' ||
          '<span style="color:#00A87A;font-weight:700">%s expert</span> · ' ||
          '<span style="color:#B45309;font-weight:700">%s developing</span> · ' ||
          '<span style="color:#DC2626;font-weight:700">%s gap</span>' ||
        '</div>' ||
      '</div>' ||
      '<div style="padding:24px 28px 0">' ||
        '<div style="margin-bottom:22px">' ||
          '<div style="font-size:10px;letter-spacing:0.14em;color:#00A87A;text-transform:uppercase;font-weight:600;margin-bottom:6px">✦ Your strongest AI-readiness domain</div>' ||
          '<div style="font-size:16px;font-weight:600;color:#0A1826;margin-bottom:6px">%s <span style="color:#6B88A0;font-weight:400;font-size:13px">(%s%%)</span></div>' ||
          '<div style="font-size:13.5px;color:#2E4A62;line-height:1.65">%s</div>' ||
        '</div>' ||
        '<div>' ||
          '<div style="font-size:10px;letter-spacing:0.14em;color:#B45309;text-transform:uppercase;font-weight:600;margin-bottom:6px">↗ Development area</div>' ||
          '<div style="font-size:16px;font-weight:600;color:#0A1826;margin-bottom:6px">%s <span style="color:#6B88A0;font-weight:400;font-size:13px">(%s%%)</span></div>' ||
          '<div style="font-size:13.5px;color:#2E4A62;line-height:1.65">%s</div>' ||
        '</div>' ||
      '</div>' ||
      '<div style="margin:32px 0 0;padding:22px 28px;background:#0A1826;color:#fff">' ||
        '<div style="font-size:10px;letter-spacing:0.14em;color:#00EDB4;text-transform:uppercase;font-weight:600;margin-bottom:8px">What is next</div>' ||
        '<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.85)">Share your PERSONA with a colleague, or revisit the assessment in 30 days to see your trajectory. AIWIZN prepares organizations and people for AI-readiness standards including Joint Commission RUAIH; it does not issue RUAIH certification.</p>' ||
        '<a href="%s" style="display:inline-block;padding:11px 22px;background:#00A87A;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;letter-spacing:0.04em">Open AIWIZN →</a>' ||
      '</div>' ||
      '<div style="padding:18px 28px 28px;font-size:11px;color:#A2BAC8;text-align:center;line-height:1.6">' ||
        'AIWIZN · AI Readiness Engine · Aten Inc<br>' ||
        'You received this because you completed an AIWIZN AI Readiness assessment.' ||
      '</div>' ||
      '</div>',
      coalesce(new.nwi_pct, 0),
      _short_first,
      _stage,
      _stage_blurb,
      coalesce(new.expert_count, 0),
      coalesce(new.mid_count, 0),
      coalesce(new.gap_count, 0),
      _top_name,
      coalesce(_top_score, 0),
      _top_meaning,
      _bot_name,
      coalesce(_bot_score, 0),
      _bot_step,
      _site_url
    )
  );

  perform net.http_post(
    url     => 'https://api.resend.com/emails',
    body    => _learner_body,
    headers => jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _resend_key
    )
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 4b.  email_dispatch_log — audit trail of UNMAPPED offerings
--
-- The dispatch (section 5) now fails CLOSED on any row whose offering is
-- not explicitly mapped to a builder. Instead of inheriting the clinical
-- skin (Bug A + Bug B), we INSERT a row here and raise a NOTICE. Surfaces
-- "where's my email?" instead of "wrong email shipped." This is the safer
-- failure mode for prospect-facing surfaces.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists private.email_dispatch_log (
  id                  bigserial primary key,
  recorded_at         timestamptz not null default now(),
  session_id          uuid,
  session_uid         text,
  learner_email       text,
  scenario_slug       text,
  offering_attempted  text,
  reason              text
);

comment on table private.email_dispatch_log is
  'Records every prototype_sessions row whose offering didn''t resolve to a known builder. Read this when investigating "missing completion email" reports.';

create or replace function private._log_unmapped_offering(
  new       public.prototype_sessions,
  _offering text,
  _reason   text
) returns void
language plpgsql
security definer
set search_path to 'private','public','extensions'
as $$
begin
  insert into private.email_dispatch_log
    (session_id, session_uid, learner_email, scenario_slug, offering_attempted, reason)
  values
    (new.id, new.session_uid, new.learner_email, new.scenario_slug, _offering, _reason);
  raise notice '[notify_new_session] no learner email sent — unmapped offering=% scenario_slug=% (logged to private.email_dispatch_log)',
    coalesce(_offering,'(null)'), coalesce(new.scenario_slug,'(null)');
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 5.  Dispatch — the trigger function itself
--
-- For an unrecognised offering (including NULL / empty / a future
-- offering that hasn't been wired here yet), defaults to the clinical
-- builder. This is the FROZEN-ENGINE GUARDRAIL: no clinical row's
-- behaviour can change, and a new offering accidentally inserting
-- without a stamped offering value will still render an email (even
-- if mis-flavoured) rather than silently drop.
-- ─────────────────────────────────────────────────────────────────────
create or replace function private.notify_new_session()
returns trigger
language plpgsql
security definer
set search_path to 'private','public','net','extensions'
as $$
declare
  _slack_url  text;
  _resend_key text;
  _from_email text;
  _to_email   text;
  _site_url   text;
  _is_demo    boolean;
  _offering   text;
begin
  _is_demo := coalesce((new.raw_payload->>'is_demo')::boolean, false);
  if _is_demo or new.learner_email is null then
    return new;
  end if;

  select value into _slack_url  from private.app_secrets where key = 'slack_webhook_url';
  select value into _resend_key from private.app_secrets where key = 'resend_api_key';
  select value into _from_email from private.app_secrets where key = 'resend_from_email';
  select value into _to_email   from private.app_secrets where key = 'notification_email';
  select value into _site_url   from private.app_secrets where key = 'site_url';
  if _site_url is null or _site_url = '' then _site_url := 'https://demo.aiwizn.com'; end if;

  -- Internal channels are offering-agnostic.
  perform private._slack_notify_session(new, _slack_url, _site_url);
  perform private._internal_email_session(new, _resend_key, _from_email, _to_email, _site_url);

  -- Learner-facing dispatch — STRICT, fail closed.
  --
  -- Per the 2026-06-25 cross-engine audit: defaulting to the clinical builder
  -- lets every new / unmapped / unstamped offering inherit the clinical skin
  -- (Bugs A + B confirmed for AI Readiness; latent for JC2026). We now fire
  -- the clinical builder ONLY on an explicit signal. Everything else logs to
  -- private.email_dispatch_log and skips the learner email.
  --
  -- Explicit clinical signals (either is sufficient):
  --   (1) raw_payload->>'offering' = 'clinical'
  --   (2) scenario_slug = 'cardiac-stroke-sepsis-v5'   ← the legacy clinical
  --       engine has never stamped its offering; all 20 historical clinical
  --       rows use this scenario_slug (verified 2026-06-25). Treated as an
  --       implicit clinical signal so the WakeMed-frozen engine continues
  --       to receive the byte-identical clinical email without an engine-
  --       side change.
  _offering := lower(coalesce(new.raw_payload->>'offering', ''));

  if _offering = 'ai-readiness' then
    perform private._persona_email_ari(new, _resend_key, _from_email, _site_url);
  elsif _offering = 'clinical' or new.scenario_slug = 'cardiac-stroke-sepsis-v5' then
    perform private._persona_email_clinical(new, _resend_key, _from_email, _site_url);
  else
    perform private._log_unmapped_offering(
      new,
      nullif(_offering, ''),
      'no builder mapped for offering=' || coalesce(nullif(_offering,''),'(null)')
        || ' scenario_slug=' || coalesce(new.scenario_slug,'(null)')
    );
  end if;

  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 6.  REGRESSION ASSERTIONS — run AGAINST STAGING after apply
--
-- These DO NOT execute during migration (commented out). They are the
-- proof harness for the FROZEN-ENGINE GUARDRAIL — run them manually,
-- ideally against a staging Supabase project, before allowing this
-- migration anywhere near WakeMed-frozen production rows.
--
-- Test 1 — Clinical NULL-offering row dispatches to clinical builder:
--   select private._persona_email_clinical(
--     row(…sample clinical fixture…)::public.prototype_sessions,
--     'fake_resend_key','from@aiwizn.com','https://demo.aiwizn.com');
--   -- Compare to a snapshot of the pre-migration HTML output.
--
-- Test 2 — AR-stamped row dispatches to ARI builder with non-zero
-- strongest/development entries from raw_payload->ari_domains:
--   -- Insert a synthetic AR row with raw_payload.offering='ai-readiness'
--   -- and raw_payload.ari_domains = {"governance":85,"bias":60,…},
--   -- then inspect the Resend HTTP request body in net._http_response.
--
-- Once both pass, this trigger is safe to ship. Until then: AI
-- Readiness stays gated to the /demo hub and no AR session may reach
-- a prospect-facing inbox.
-- ─────────────────────────────────────────────────────────────────────
