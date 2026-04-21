"""AI endpoints."""
from fastapi import APIRouter, HTTPException, Depends
from core import db, get_current_user, audit
from models import AIWriteRequest, AIAnalyzeRequest
from ai_service import (
    ai_rewrite, ai_integrated_summary, ai_bias_check, ai_capability_gap,
    ai_panel_draft, ai_hr_draft, ai_development_plan, ai_quick_brief,
    ai_stakeholder_suggest, ai_document_summary, build_case_context, MODEL_NAME,
)
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/ai", tags=["ai"])


def _now():
    return datetime.now(timezone.utc).isoformat()


async def _gather_case_ctx(case_id: str) -> str:
    case = await db.cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(404, "Case not found")
    emp = await db.employees.find_one({"id": case["employee_id"]}, {"_id": 0}) or {}
    emp_form = await db.employee_forms.find_one({"case_id": case_id}, {"_id": 0})
    mgr_form = await db.manager_forms.find_one({"case_id": case_id}, {"_id": 0})
    stk_fbs = await db.stakeholder_feedbacks.find({"case_id": case_id}, {"_id": 0}).to_list(100)
    panel_reviews = await db.panel_reviews.find({"case_id": case_id}, {"_id": 0}).to_list(50)
    hr_review = await db.hr_reviews.find_one({"case_id": case_id}, {"_id": 0})
    caps = await db.capabilities.find({}, {"_id": 0}).to_list(200)
    docs = await db.documents.find({"case_id": case_id, "is_deleted": False, "is_latest": True}, {"_id": 0}).to_list(100)
    return build_case_context(case, emp, emp_form, mgr_form, stk_fbs, panel_reviews, hr_review, caps, docs)


async def _save_analysis(case_id, analysis_type, content, structured, user):
    doc = {
        "id": str(uuid.uuid4()),
        "case_id": case_id,
        "analysis_type": analysis_type,
        "prompt_version": "v1",
        "model_name": MODEL_NAME,
        "content": content,
        "structured": structured,
        "created_by": user["id"],
        "created_at": _now(),
    }
    await db.ai_analyses.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.post("/write")
async def ai_write(body: AIWriteRequest, user=Depends(get_current_user)):
    try:
        out = await ai_rewrite(body.text, body.mode, body.context)
        return {"text": out, "mode": body.mode}
    except Exception as e:
        raise HTTPException(502, f"AI error: {e}")


@router.post("/analyze")
async def ai_analyze(body: AIAnalyzeRequest, user=Depends(get_current_user)):
    ctx = await _gather_case_ctx(body.case_id)
    try:
        if body.analysis_type == "integrated_summary":
            result = await ai_integrated_summary(ctx)
        elif body.analysis_type == "bias_check":
            result = await ai_bias_check(ctx)
        elif body.analysis_type == "capability_gap":
            result = await ai_capability_gap(ctx)
        elif body.analysis_type == "panel_draft":
            result = await ai_panel_draft(ctx)
        elif body.analysis_type == "hr_draft":
            result = await ai_hr_draft(ctx)
        elif body.analysis_type == "development_plan":
            result = await ai_development_plan(ctx)
        elif body.analysis_type == "quick_brief":
            result = await ai_quick_brief(ctx)
        elif body.analysis_type == "stakeholder_suggest":
            result = await ai_stakeholder_suggest(ctx)
        elif body.analysis_type == "document_summary":
            doc_type = body.extra.get("doc_type", "document")
            text = body.extra.get("text", "")
            result = await ai_document_summary(doc_type, text)
        else:
            raise HTTPException(400, f"Unknown analysis_type {body.analysis_type}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"AI error: {e}")

    saved = await _save_analysis(body.case_id, body.analysis_type, "", result, user)
    await audit(user, "analyze", "ai_analysis", case_id=body.case_id, details={"type": body.analysis_type})
    return saved


@router.get("/case/{case_id}/latest")
async def latest_analyses(case_id: str, user=Depends(get_current_user)):
    """Return latest AI output per analysis type for a case."""
    items = await db.ai_analyses.find({"case_id": case_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    latest = {}
    for it in items:
        t = it["analysis_type"]
        if t not in latest:
            latest[t] = it
    return latest
