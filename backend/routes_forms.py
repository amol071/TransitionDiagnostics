"""Form routes - employee, manager, stakeholder, panel, HR."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
import uuid
from core import db, get_current_user, audit

router = APIRouter(tags=["forms"])


def _now():
    return datetime.now(timezone.utc).isoformat()


# ---------- Employee Form ----------
@router.get("/cases/{case_id}/employee-form")
async def get_emp_form(case_id: str, user=Depends(get_current_user)):
    f = await db.employee_forms.find_one({"case_id": case_id}, {"_id": 0})
    if not f:
        return {"case_id": case_id, "contributions": [], "capability_responses": [],
                "overall_reflection": "", "status": "draft"}
    return f


@router.put("/cases/{case_id}/employee-form")
async def save_emp_form(case_id: str, payload: dict, user=Depends(get_current_user)):
    now = _now()
    existing = await db.employee_forms.find_one({"case_id": case_id}, {"_id": 0})
    payload["case_id"] = case_id
    payload["updated_at"] = now
    if existing and existing.get("status") == "submitted" and payload.get("status") != "submitted":
        # allow editing only if status is currently draft
        raise HTTPException(400, "Form is submitted; reopen to edit")
    if existing:
        await db.employee_forms.update_one({"case_id": case_id}, {"$set": payload})
        updated = await db.employee_forms.find_one({"case_id": case_id}, {"_id": 0})
    else:
        payload["id"] = str(uuid.uuid4())
        payload.setdefault("status", "draft")
        await db.employee_forms.insert_one(payload)
        updated = await db.employee_forms.find_one({"case_id": case_id}, {"_id": 0})
    # update case status
    if payload.get("status") == "submitted":
        await db.employee_forms.update_one({"case_id": case_id}, {"$set": {"submitted_at": now}})
        await db.cases.update_one({"id": case_id}, {"$set": {"status": "employee_submitted", "updated_at": now}})
        await audit(user, "submit", "employee_form", case_id=case_id)
    else:
        await audit(user, "save", "employee_form", case_id=case_id)
    return updated


# ---------- Manager Form ----------
@router.get("/cases/{case_id}/manager-form")
async def get_mgr_form(case_id: str, user=Depends(get_current_user)):
    f = await db.manager_forms.find_one({"case_id": case_id}, {"_id": 0})
    if not f:
        return {"case_id": case_id, "capability_responses": [], "stakeholders": [],
                "overall_rationale": "", "readiness": "", "status": "draft"}
    return f


@router.put("/cases/{case_id}/manager-form")
async def save_mgr_form(case_id: str, payload: dict, user=Depends(get_current_user)):
    now = _now()
    existing = await db.manager_forms.find_one({"case_id": case_id}, {"_id": 0})
    payload["case_id"] = case_id
    payload["updated_at"] = now
    if existing and existing.get("status") == "submitted" and payload.get("status") != "submitted":
        raise HTTPException(400, "Form is submitted; reopen to edit")
    if existing:
        await db.manager_forms.update_one({"case_id": case_id}, {"$set": payload})
    else:
        payload["id"] = str(uuid.uuid4())
        payload.setdefault("status", "draft")
        await db.manager_forms.insert_one(payload)
    if payload.get("status") == "submitted":
        await db.manager_forms.update_one({"case_id": case_id}, {"$set": {"submitted_at": now}})
        await db.cases.update_one({"id": case_id}, {"$set": {"status": "manager_submitted", "updated_at": now}})
        await audit(user, "submit", "manager_form", case_id=case_id)
    else:
        await audit(user, "save", "manager_form", case_id=case_id)
    return await db.manager_forms.find_one({"case_id": case_id}, {"_id": 0})


# ---------- Stakeholder Feedback ----------
@router.get("/cases/{case_id}/stakeholder-feedback")
async def list_stk_fb(case_id: str, user=Depends(get_current_user)):
    fbs = await db.stakeholder_feedbacks.find({"case_id": case_id}, {"_id": 0}).to_list(200)
    return fbs


@router.get("/cases/{case_id}/stakeholder-feedback/mine")
async def my_stk_fb(case_id: str, user=Depends(get_current_user)):
    fb = await db.stakeholder_feedbacks.find_one(
        {"case_id": case_id, "stakeholder_email": user["email"]}, {"_id": 0}
    )
    if not fb:
        return {"case_id": case_id, "stakeholder_name": user["name"], "stakeholder_email": user["email"],
                "capability_responses": [], "comments": "", "status": "draft"}
    return fb


@router.put("/cases/{case_id}/stakeholder-feedback/mine")
async def save_stk_fb(case_id: str, payload: dict, user=Depends(get_current_user)):
    now = _now()
    payload["case_id"] = case_id
    payload["stakeholder_email"] = user["email"]
    payload["stakeholder_name"] = payload.get("stakeholder_name") or user["name"]
    payload["updated_at"] = now
    existing = await db.stakeholder_feedbacks.find_one(
        {"case_id": case_id, "stakeholder_email": user["email"]}, {"_id": 0}
    )
    if existing and existing.get("status") == "submitted" and payload.get("status") != "submitted":
        raise HTTPException(400, "Feedback submitted")
    if existing:
        await db.stakeholder_feedbacks.update_one(
            {"case_id": case_id, "stakeholder_email": user["email"]}, {"$set": payload}
        )
    else:
        payload["id"] = str(uuid.uuid4())
        payload.setdefault("status", "draft")
        await db.stakeholder_feedbacks.insert_one(payload)
    if payload.get("status") == "submitted":
        await db.stakeholder_feedbacks.update_one(
            {"case_id": case_id, "stakeholder_email": user["email"]},
            {"$set": {"submitted_at": now}},
        )
        await audit(user, "submit", "stakeholder_feedback", case_id=case_id)
    return await db.stakeholder_feedbacks.find_one(
        {"case_id": case_id, "stakeholder_email": user["email"]}, {"_id": 0}
    )


# ---------- Panel Review ----------
@router.get("/cases/{case_id}/panel-reviews")
async def list_panel_reviews(case_id: str, user=Depends(get_current_user)):
    prs = await db.panel_reviews.find({"case_id": case_id}, {"_id": 0}).to_list(50)
    return prs


@router.get("/cases/{case_id}/panel-review/mine")
async def my_panel_review(case_id: str, user=Depends(get_current_user)):
    pr = await db.panel_reviews.find_one({"case_id": case_id, "panel_member_id": user["id"]}, {"_id": 0})
    if not pr:
        return {"case_id": case_id, "panel_member_id": user["id"],
                "capability_ratings": [], "overall_rating": "", "overall_rationale": "",
                "discussion_notes": "", "status": "draft"}
    return pr


@router.put("/cases/{case_id}/panel-review/mine")
async def save_panel_review(case_id: str, payload: dict, user=Depends(get_current_user)):
    now = _now()
    payload["case_id"] = case_id
    payload["panel_member_id"] = user["id"]
    payload["updated_at"] = now
    existing = await db.panel_reviews.find_one(
        {"case_id": case_id, "panel_member_id": user["id"]}, {"_id": 0}
    )
    if existing and existing.get("status") == "submitted" and payload.get("status") != "submitted":
        raise HTTPException(400, "Panel review submitted")
    if existing:
        await db.panel_reviews.update_one(
            {"case_id": case_id, "panel_member_id": user["id"]}, {"$set": payload}
        )
    else:
        payload["id"] = str(uuid.uuid4())
        payload.setdefault("status", "draft")
        await db.panel_reviews.insert_one(payload)
    if payload.get("status") == "submitted":
        await db.panel_reviews.update_one(
            {"case_id": case_id, "panel_member_id": user["id"]}, {"$set": {"submitted_at": now}}
        )
        # if all panel members submitted → case status panel_submitted
        case = await db.cases.find_one({"id": case_id}, {"_id": 0})
        panel_ids = case.get("assigned_panel_ids", [])
        submitted = await db.panel_reviews.count_documents(
            {"case_id": case_id, "status": "submitted"}
        )
        if panel_ids and submitted >= len(panel_ids):
            await db.cases.update_one({"id": case_id}, {"$set": {"status": "panel_submitted", "updated_at": now}})
        else:
            await db.cases.update_one({"id": case_id}, {"$set": {"status": "panel_in_progress", "updated_at": now}})
        await audit(user, "submit", "panel_review", case_id=case_id)
    return await db.panel_reviews.find_one(
        {"case_id": case_id, "panel_member_id": user["id"]}, {"_id": 0}
    )


# ---------- HR Final Review ----------
@router.get("/cases/{case_id}/hr-review")
async def get_hr_review(case_id: str, user=Depends(get_current_user)):
    f = await db.hr_reviews.find_one({"case_id": case_id}, {"_id": 0})
    if not f:
        return {"case_id": case_id, "strengths": [], "improvements": [],
                "overall_summary": "", "additional_feedback": "", "development_plan": "",
                "readiness": "", "status": "draft"}
    return f


@router.put("/cases/{case_id}/hr-review")
async def save_hr_review(case_id: str, payload: dict, user=Depends(get_current_user)):
    now = _now()
    existing = await db.hr_reviews.find_one({"case_id": case_id}, {"_id": 0})
    payload["case_id"] = case_id
    payload["updated_at"] = now
    if existing and existing.get("status") == "submitted" and payload.get("status") != "submitted":
        raise HTTPException(400, "HR review submitted")
    if existing:
        await db.hr_reviews.update_one({"case_id": case_id}, {"$set": payload})
    else:
        payload["id"] = str(uuid.uuid4())
        payload.setdefault("status", "draft")
        await db.hr_reviews.insert_one(payload)
    if payload.get("status") == "submitted":
        await db.hr_reviews.update_one({"case_id": case_id}, {"$set": {"submitted_at": now}})
        await db.cases.update_one({"id": case_id}, {"$set": {"status": "closed", "updated_at": now}})
        await audit(user, "submit", "hr_review", case_id=case_id)
    return await db.hr_reviews.find_one({"case_id": case_id}, {"_id": 0})
