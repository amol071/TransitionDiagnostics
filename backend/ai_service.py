"""AI service for LDC Platform - Claude Sonnet 4.5 via Emergent LLM key."""
import os
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger("ldc.ai")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-5-20250929"

BASE_SYSTEM_PROMPT = """You are an expert Leadership Assessment and Talent Evaluation Specialist.
Your role is to analyze multi-source leadership assessment data and produce a structured, unbiased, and evidence-based evaluation of a candidate's readiness for next-level leadership.
You integrate inputs from employee self-reflection, manager assessment, stakeholder feedback, HR process data, 360 feedback, psychometric data, and historical/renomination data when available.
You must identify patterns, strengths, contradictions, capability gaps, and developmental needs.
Base conclusions only on the evidence provided. Do not hallucinate or infer unsupported facts.
Write in clear, professional business language. Highlight inconsistencies explicitly.
AI suggestions are drafts for human review — never final decisions."""


def _chat(session_id: str, system: str = BASE_SYSTEM_PROMPT) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)


async def _run(session_id: str, user_text: str, system: str = BASE_SYSTEM_PROMPT) -> str:
    chat = _chat(session_id, system)
    msg = UserMessage(text=user_text)
    return await chat.send_message(msg)


# ---------- Writing assistant ----------
async def ai_rewrite(text: str, mode: str = "improve", context: Optional[str] = None) -> str:
    if not text.strip():
        return text
    instr = {
        "improve": "Rewrite professionally, improve clarity, keep meaning, make evidence-based.",
        "rewrite": "Rewrite in fresh professional language while preserving meaning.",
        "short": "Rewrite concisely in 2-3 sharp sentences.",
        "detailed": "Expand with structured evidence-based reasoning (4-6 sentences).",
    }.get(mode, "improve")
    prompt = f"""Task: {instr}

Context: {context or 'Leadership assessment / HR evaluation'}

Original text:
\"\"\"
{text}
\"\"\"

Return ONLY the rewritten text, no preamble, no quotes."""
    return await _run(f"rewrite-{uuid.uuid4()}", prompt)


# ---------- Case context builder ----------
def build_case_context(case: dict, employee: dict, emp_form: Optional[dict], mgr_form: Optional[dict],
                      stakeholder_feedbacks: list, panel_reviews: list, hr_review: Optional[dict],
                      capabilities: list, documents: list) -> str:
    cap_by_id = {c["id"]: c for c in capabilities}

    def cap_name(cid):
        return cap_by_id.get(cid, {}).get("name", cid)

    parts = []
    parts.append(f"CANDIDATE: {employee.get('name','')} — {employee.get('level','')} | BU {employee.get('bu','')} | Function {employee.get('function','')}")
    parts.append(f"CASE: {case.get('id')} | Fiscal Year {case.get('fiscal_year','')} | Renomination: {case.get('is_renomination', False)} | Status: {case.get('status')}")

    if emp_form:
        parts.append("\n--- EMPLOYEE SELF-REFLECTION ---")
        parts.append(f"Overall reflection: {emp_form.get('overall_reflection','')}")
        for i, c in enumerate(emp_form.get("contributions", []), 1):
            parts.append(f"Contribution {i}: Area={c.get('area','')} | Role={c.get('role','')} | Impact={c.get('impact','')} | Stakeholders={c.get('stakeholders','')}")
        for r in emp_form.get("capability_responses", []):
            parts.append(f"Self: {cap_name(r['capability_id'])} | current={r.get('current_level','')} | demonstrated_next={r.get('demonstrated_next', False)} | rationale={r.get('rationale','')}")

    if mgr_form:
        parts.append("\n--- MANAGER ASSESSMENT ---")
        parts.append(f"Overall rationale: {mgr_form.get('overall_rationale','')}")
        parts.append(f"Manager readiness call: {mgr_form.get('readiness','')}")
        for r in mgr_form.get("capability_responses", []):
            parts.append(f"Mgr: {cap_name(r['capability_id'])} | current={r.get('current_level','')} | demonstrated_next={r.get('demonstrated_next', False)} | rationale={r.get('rationale','')}")

    if stakeholder_feedbacks:
        parts.append("\n--- STAKEHOLDER FEEDBACK ---")
        for sf in stakeholder_feedbacks:
            parts.append(f"From {sf.get('stakeholder_name','?')}: {sf.get('comments','')}")
            for r in sf.get("capability_responses", []):
                parts.append(f"  {cap_name(r['capability_id'])} | rating={r.get('current_level','')} | comments={r.get('rationale','')}")

    if panel_reviews:
        parts.append("\n--- PANEL INPUTS ---")
        for p in panel_reviews:
            parts.append(f"Panel member review ({p.get('status','')}): overall={p.get('overall_rating','')} | rationale={p.get('overall_rationale','')}")

    if documents:
        parts.append("\n--- DOCUMENTS ON FILE ---")
        for d in documents:
            parts.append(f"- {d.get('doc_type')}: {d.get('original_filename')}")

    return "\n".join(parts)


# ---------- Higher-level analyses ----------
async def ai_integrated_summary(context: str) -> Dict[str, Any]:
    prompt = f"""Analyze the following multi-source leadership assessment and produce a structured integrated summary.

{context}

Return ONLY valid JSON (no markdown fences) with keys:
{{
  "integrated_summary": "3-5 sentence narrative integrating all sources",
  "strengths": ["bullet", ...],
  "development_areas": ["bullet", ...],
  "readiness_indicators": ["bullet", ...],
  "evidence_notes": "1-2 sentence commentary on evidence quality",
  "readiness_assessment": "Strong | Moderate | Weak"
}}"""
    raw = await _run(f"integ-{uuid.uuid4()}", prompt)
    return _parse_json(raw)


async def ai_bias_check(context: str, comparison_table: str = "") -> Dict[str, Any]:
    prompt = f"""You are auditing a multi-source leadership assessment for BIAS and CONSISTENCY.
Assess data from Self / Manager / Stakeholder(s) / Panel / (Prior cycle if renomination).
Base every conclusion strictly on the evidence provided. If a source hasn't submitted, note it in `missing_coverage` — do not invent input.

FULL CONTEXT:
{context}

STRUCTURED RATING COMPARISON (may be empty if data is thin):
{comparison_table or "(no numeric ratings extracted)"}

Return ONLY valid JSON (no markdown fences):
{{
  "overall_risk": "Low|Medium|High",
  "consistency_score": 0-100,
  "score_breakdown": {{
    "rating_alignment": 0-100,
    "evidence_alignment": 0-100,
    "source_coverage": 0-100,
    "language_neutrality": 0-100
  }},
  "summary": "3-4 sentence narrative of the biggest bias/consistency concerns and where the panel/HR should probe.",
  "rating_mismatches": [
    {{
      "capability": "capability name",
      "self": "Below|Meets|Exceeds|—",
      "manager": "Below|Meets|Exceeds|—",
      "stakeholder": "Below|Meets|Exceeds|Mixed|—",
      "panel": "Strong|Moderate|Weak|Mixed|—",
      "delta": "Aligned|Minor|Major",
      "notes": "1 sentence why this matters"
    }}
  ],
  "rater_patterns": [
    {{
      "source": "self|manager|stakeholder:<name>|panel:<member>",
      "pattern": "Halo|Leniency|Severity|Central-tendency|Balanced",
      "evidence": "1-2 sentences citing which ratings triggered this",
      "risk": "Low|Medium|High"
    }}
  ],
  "evidence_alignment": [
    {{
      "capability": "capability name",
      "issue": "unsupported_high|unsupported_low|missing_rationale|contradictory_rationale",
      "source": "self|manager|stakeholder|panel",
      "explanation": "1 sentence"
    }}
  ],
  "language_signals": [
    {{
      "source": "self|manager|stakeholder|panel",
      "signal": "superlative_without_evidence|personality_over_behavior|potentially_gendered_or_biased_wording|absolute_language",
      "quote": "verbatim phrase or paraphrase",
      "explanation": "why this is a bias signal"
    }}
  ],
  "missing_coverage": [
    {{"item": "e.g. 'No stakeholder feedback on Influencing'", "impact": "Low|Medium|High"}}
  ],
  "discussion_flags": [
    {{
      "topic": "short label",
      "sources_disagree": ["self","manager","stakeholder","panel"],
      "sources_agree": ["..."],
      "explanation": "1-2 sentences",
      "suggested_probe": "specific question the panel/HR should ask to resolve this"
    }}
  ],
  "recommendations": ["3-5 concrete next steps the panel/HR/reviewer should take"]
}}"""
    raw = await _run(f"bias-{uuid.uuid4()}", prompt)
    return _parse_json(raw)


def build_rating_comparison(cap_by_id: dict, emp_form: Optional[dict], mgr_form: Optional[dict],
                            stakeholder_feedbacks: list, panel_reviews: list) -> str:
    """Compact per-capability rating grid, one row per capability. Used by ai_bias_check."""
    def cap_name(cid):
        return cap_by_id.get(cid, {}).get("name", cid)

    def by_cap(items, key="capability_id"):
        return {r.get(key): r for r in (items or [])}

    self_map = by_cap((emp_form or {}).get("capability_responses"))
    mgr_map = by_cap((mgr_form or {}).get("capability_responses"))
    stk_maps = [by_cap(s.get("capability_responses")) for s in stakeholder_feedbacks or []]
    panel_maps = [by_cap(p.get("capability_ratings"), "capability_id") for p in panel_reviews or []]

    cap_ids = set(self_map) | set(mgr_map)
    for m in stk_maps:
        cap_ids |= set(m)
    for m in panel_maps:
        cap_ids |= set(m)
    if not cap_ids:
        return ""

    lines = ["CAPABILITY | SELF | MANAGER | STAKEHOLDER(S) | PANEL"]
    for cid in cap_ids:
        s = (self_map.get(cid) or {}).get("current_level") or "—"
        m = (mgr_map.get(cid) or {}).get("current_level") or "—"
        stks = [str(sm.get(cid, {}).get("current_level") or "—") for sm in stk_maps]
        stk = "/".join(stks) if stks else "—"
        panels = [str(pm.get(cid, {}).get("rating") or "—") for pm in panel_maps]
        pnl = "/".join(panels) if panels else "—"
        lines.append(f"{cap_name(cid)} | {s} | {m} | {stk} | {pnl}")
    return "\n".join(lines)


async def ai_capability_gap(context: str) -> Dict[str, Any]:
    prompt = f"""Identify capability gaps and mismatches.

{context}

Return ONLY JSON:
{{
  "gaps": [{{"capability": "...", "severity": "High|Medium|Low", "reason": "..."}}],
  "rating_mismatches": [{{"capability": "...", "self": "...", "manager": "...", "panel": "...", "notes": "..."}}],
  "summary": "..."
}}"""
    raw = await _run(f"gap-{uuid.uuid4()}", prompt)
    return _parse_json(raw)


async def ai_panel_draft(context: str) -> Dict[str, Any]:
    prompt = f"""Generate a DRAFT panel synthesis for human review.

{context}

Return ONLY JSON:
{{
  "overall_readiness": "Strong | Moderate | Weak",
  "overall_rationale": "3-5 sentences",
  "per_capability": [{{"capability_name": "...", "rating": "Strong|Moderate|Weak|Mixed", "rationale": "..."}}],
  "discussion_flags": ["..."]
}}"""
    raw = await _run(f"panel-{uuid.uuid4()}", prompt)
    return _parse_json(raw)


async def ai_hr_draft(context: str) -> Dict[str, Any]:
    prompt = f"""Produce a developmental, employee-facing HR final summary DRAFT.

{context}

Return ONLY JSON:
{{
  "overall_summary": "4-6 sentences, balanced and developmental",
  "strengths": ["specific evidence-backed strength", ...],
  "improvements": ["specific development area", ...],
  "additional_feedback": "1-3 sentences",
  "development_plan": "3-5 concrete actionable items",
  "readiness": "strong | moderate | weak"
}}"""
    raw = await _run(f"hr-{uuid.uuid4()}", prompt)
    return _parse_json(raw)


async def ai_development_plan(context: str) -> Dict[str, Any]:
    prompt = f"""Based on the assessment, propose a practical development plan.

{context}

Return ONLY JSON:
{{
  "actions": [{{"area": "...", "action": "...", "how": "...", "timeframe": "0-3m|3-6m|6-12m"}}],
  "learning_resources": ["..."],
  "coaching_focus": "..."
}}"""
    raw = await _run(f"dev-{uuid.uuid4()}", prompt)
    return _parse_json(raw)


async def ai_quick_brief(context: str) -> Dict[str, Any]:
    prompt = f"""Produce a 5-line case brief.

{context}

Return ONLY JSON:
{{
  "brief": "5 short lines separated by newlines",
  "top_strengths": ["..."],
  "top_concerns": ["..."],
  "missing_data": ["missing source or document"]
}}"""
    raw = await _run(f"brief-{uuid.uuid4()}", prompt)
    return _parse_json(raw)


async def ai_stakeholder_suggest(context: str) -> Dict[str, Any]:
    prompt = f"""Suggest stakeholder types to include in the review.

{context}

Return ONLY JSON:
{{
  "suggestions": [{{"role": "e.g. Cross-functional Peer", "why": "..."}}]
}}"""
    raw = await _run(f"stk-{uuid.uuid4()}", prompt)
    return _parse_json(raw)


async def ai_document_summary(doc_type: str, text: str) -> Dict[str, Any]:
    prompt = f"""Summarize the following {doc_type} document content.

Content:
\"\"\"
{text[:6000]}
\"\"\"

Return ONLY JSON:
{{
  "key_themes": ["..."],
  "strengths": ["..."],
  "risks": ["..."],
  "tagged_capabilities": ["..."],
  "summary": "3-4 sentence executive summary"
}}"""
    raw = await _run(f"doc-{uuid.uuid4()}", prompt)
    return _parse_json(raw)


# ---------- JSON parser ----------
def _parse_json(raw: str) -> Dict[str, Any]:
    if not raw:
        return {"raw": "", "error": "empty"}
    s = raw.strip()
    # Strip markdown code fences
    if s.startswith("```"):
        s = s.split("```", 2)[1] if s.count("```") >= 2 else s
        if s.startswith("json"):
            s = s[4:]
        s = s.strip("` \n")
    start = s.find("{")
    end = s.rfind("}")
    if start >= 0 and end > start:
        s = s[start:end + 1]
    try:
        return json.loads(s)
    except Exception as e:
        logger.warning(f"JSON parse failed: {e}; raw: {raw[:200]}")
        return {"raw": raw, "error": str(e)}
