"""Case, employee, capability, and dashboard routes."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List, Optional
from core import db, get_current_user, require_roles, audit
from models import NomineeCaseCreate, LaunchBody
from notifications import notify, recipients_for_case


router = APIRouter(tags=["cases"])


def _now():
    return datetime.now(timezone.utc).isoformat()


# ---------- Capabilities ----------
@router.get("/capabilities")
async def list_capabilities(user=Depends(get_current_user)):
    caps = await db.capabilities.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return caps


# ---------- Employees ----------
@router.get("/employees")
async def list_employees(user=Depends(get_current_user)):
    emps = await db.employees.find({}, {"_id": 0}).to_list(500)
    return emps


@router.post("/employees")
async def create_employee(payload: dict, user=Depends(require_roles("admin", "coordinator"))):
    import uuid
    # Denormalize master data labels if IDs were provided
    if payload.get("company_id") and not payload.get("company"):
        comp = await db.master_companies.find_one({"id": payload["company_id"]}, {"_id": 0})
        if comp:
            payload["company"] = comp.get("short_name") or comp["name"]
    if payload.get("function_id") and not payload.get("function"):
        fn = await db.master_functions.find_one({"id": payload["function_id"]}, {"_id": 0})
        if fn:
            payload["function"] = fn["name"]
    if payload.get("bu_id") and not payload.get("bu"):
        bu = await db.master_business_units.find_one({"id": payload["bu_id"]}, {"_id": 0})
        if bu:
            payload["bu"] = bu["name"]
    if payload.get("level_id") and not payload.get("level"):
        lv = await db.master_levels.find_one({"id": payload["level_id"]}, {"_id": 0})
        if lv:
            payload["level"] = lv["code"]
    doc = {"id": str(uuid.uuid4()), **payload, "created_at": _now()}
    await db.employees.insert_one(doc)
    doc.pop("_id", None)
    await audit(user, "create", "employee", details={"emp_id": doc.get("emp_id")})
    return doc


# ---------- Cases ----------
async def _enrich_case(c: dict) -> dict:
    emp = await db.employees.find_one({"id": c["employee_id"]}, {"_id": 0})
    c["employee"] = emp
    return c


@router.get("/cases")
async def list_cases(user=Depends(get_current_user)):
    """Return cases filtered by role. Admin/coordinator/hr see all; manager sees assigned; panel sees assigned; employee sees their own."""
    roles = user["roles"]
    filter_: dict = {}
    or_filters = []
    if any(r in roles for r in ["admin", "coordinator", "hr", "hrbp"]):
        filter_ = {}
    else:
        if "manager" in roles:
            or_filters.append({"assigned_manager_id": user["id"]})
        if "panel" in roles:
            or_filters.append({"assigned_panel_ids": user["id"]})
        if "employee" in roles:
            emp = await db.employees.find_one({"email": user["email"]}, {"_id": 0})
            if emp:
                or_filters.append({"employee_id": emp["id"]})
        if "stakeholder" in roles:
            # find cases in manager's stakeholder list matching email
            mgr_forms = await db.manager_forms.find(
                {"stakeholders.email": user["email"]}, {"_id": 0, "case_id": 1}
            ).to_list(500)
            if mgr_forms:
                or_filters.append({"id": {"$in": [m["case_id"] for m in mgr_forms]}})
        if not or_filters:
            return []
        filter_ = {"$or": or_filters}

    cases = await db.cases.find(filter_, {"_id": 0}).sort("created_at", -1).to_list(500)
    for c in cases:
        await _enrich_case(c)
    return cases


@router.post("/cases")
async def create_case(payload: NomineeCaseCreate, user=Depends(require_roles("admin", "coordinator"))):
    import uuid
    # prevent duplicates for same employee+fy unless renomination
    exists = await db.cases.find_one(
        {"employee_id": payload.employee_id, "fiscal_year": payload.fiscal_year, "is_renomination": payload.is_renomination},
        {"_id": 0},
    )
    if exists:
        raise HTTPException(status_code=400, detail="Case already exists for this employee & fiscal year")
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "is_launched": False,
        "is_panel_launched": False,
        "status": "draft",
        "coordinator_id": user["id"],
        "created_at": _now(),
        "updated_at": _now(),
    }
    await db.cases.insert_one(doc)
    doc.pop("_id", None)
    await audit(user, "create", "case", case_id=doc["id"])
    return doc


@router.get("/cases/{case_id}")
async def get_case(case_id: str, user=Depends(get_current_user)):
    c = await db.cases.find_one({"id": case_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    await _enrich_case(c)
    return c


@router.get("/cases/{case_id}/prior")
async def prior_cycle(case_id: str, user=Depends(get_current_user)):
    """Return prior-cycle case + forms for a renomination. Looks up previous case for same employee."""
    c = await db.cases.find_one({"id": case_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Case not found")
    prior = await db.cases.find_one(
        {"employee_id": c["employee_id"], "id": {"$ne": case_id}, "created_at": {"$lt": c["created_at"]}},
        {"_id": 0}, sort=[("created_at", -1)]
    )
    if not prior:
        return {"prior": None}
    emp_form = await db.employee_forms.find_one({"case_id": prior["id"]}, {"_id": 0})
    mgr_form = await db.manager_forms.find_one({"case_id": prior["id"]}, {"_id": 0})
    hr = await db.hr_reviews.find_one({"case_id": prior["id"]}, {"_id": 0})
    panel = await db.panel_reviews.find({"case_id": prior["id"]}, {"_id": 0}).to_list(20)
    caps = await db.capabilities.find({}, {"_id": 0}).to_list(200)
    return {
        "prior": prior,
        "employee_form": emp_form,
        "manager_form": mgr_form,
        "hr_review": hr,
        "panel_reviews": panel,
        "capabilities": caps,
    }


@router.patch("/cases/{case_id}")
async def update_case(case_id: str, payload: dict, user=Depends(require_roles("admin", "coordinator"))):
    payload["updated_at"] = _now()
    await db.cases.update_one({"id": case_id}, {"$set": payload})
    c = await db.cases.find_one({"id": case_id}, {"_id": 0})
    await audit(user, "update", "case", case_id=case_id, details=payload)
    return c


@router.post("/cases/{case_id}/launch")
async def launch_case(case_id: str, body: LaunchBody, user=Depends(require_roles("admin", "coordinator"))):
    c = await db.cases.find_one({"id": case_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Case not found")
    update = {"updated_at": _now()}
    if body.stage == "case":
        update.update({"is_launched": True, "status": "employee_in_progress"})
    elif body.stage == "panel":
        update.update({"is_panel_launched": True, "status": "panel_launched"})
    await db.cases.update_one({"id": case_id}, {"$set": update})
    await audit(user, f"launch_{body.stage}", "case", case_id=case_id)
    c = await db.cases.find_one({"id": case_id}, {"_id": 0})
    emp = await db.employees.find_one({"id": c["employee_id"]}, {"_id": 0}) or {}
    if body.stage == "case":
        ids = await recipients_for_case(c, ["employee", "manager"])
        await notify(ids, "case_launched", f"LDC launched for {emp.get('name','')}",
                     f"The LDC case for {emp.get('name','')} ({c['fiscal_year']}) has been launched. Please complete your form.",
                     case_id=case_id)
    elif body.stage == "panel":
        ids = await recipients_for_case(c, ["panel", "hr", "hrbp"])
        await notify(ids, "panel_launched", f"Panel launched · {emp.get('name','')}",
                     f"Panel review is now open for {emp.get('name','')}.",
                     case_id=case_id)
    return c


@router.post("/cases/{case_id}/reopen")
async def reopen_case(case_id: str, payload: dict, user=Depends(require_roles("admin", "coordinator"))):
    """Reopen a form. payload={form: employee|manager|panel|hr}"""
    c = await db.cases.find_one({"id": case_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Case not found")
    form = payload.get("form")
    now = _now()
    notify_roles: list = []
    if form == "employee":
        await db.employee_forms.update_many({"case_id": case_id}, {"$set": {"status": "draft", "updated_at": now}})
        await db.cases.update_one({"id": case_id}, {"$set": {"status": "employee_in_progress", "updated_at": now}})
        notify_roles = ["employee"]
    elif form == "manager":
        await db.manager_forms.update_many({"case_id": case_id}, {"$set": {"status": "draft", "updated_at": now}})
        await db.cases.update_one({"id": case_id}, {"$set": {"status": "manager_in_progress", "updated_at": now}})
        notify_roles = ["manager"]
    elif form == "panel":
        await db.panel_reviews.update_many({"case_id": case_id}, {"$set": {"status": "draft", "updated_at": now}})
        await db.cases.update_one({"id": case_id}, {"$set": {"status": "panel_in_progress", "updated_at": now}})
        notify_roles = ["panel"]
    elif form == "hr":
        await db.hr_reviews.update_many({"case_id": case_id}, {"$set": {"status": "draft", "updated_at": now}})
        await db.cases.update_one({"id": case_id}, {"$set": {"status": "hr_in_progress", "updated_at": now}})
        notify_roles = ["hr", "hrbp"]
    else:
        raise HTTPException(400, "form must be one of employee|manager|panel|hr")
    await audit(user, "reopen", form, case_id=case_id, details=payload)
    c2 = await db.cases.find_one({"id": case_id}, {"_id": 0})
    emp = await db.employees.find_one({"id": c2["employee_id"]}, {"_id": 0}) or {}
    ids = await recipients_for_case(c2, notify_roles)
    await notify(ids, "form_reopened", f"{form.title()} form reopened · {emp.get('name','')}",
                 f"Your {form} form for {emp.get('name','')} has been reopened by {user['name']}.",
                 case_id=case_id)
    return c2


# ---------- Dashboard / Status ----------
@router.get("/dashboard/summary")
async def dashboard_summary(user=Depends(get_current_user)):
    # Totals relevant to current role
    total_cases = await db.cases.count_documents({})
    in_progress = await db.cases.count_documents({"status": {"$nin": ["closed", "draft"]}})
    finalized = await db.cases.count_documents({"status": "closed"})
    renominations = await db.cases.count_documents({"is_renomination": True})

    # role-specific pending counts
    my_pending = 0
    roles = user["roles"]
    if "employee" in roles:
        emp = await db.employees.find_one({"email": user["email"]}, {"_id": 0})
        if emp:
            cases = await db.cases.find({"employee_id": emp["id"], "is_launched": True}, {"_id": 0}).to_list(100)
            for c in cases:
                f = await db.employee_forms.find_one({"case_id": c["id"]}, {"_id": 0})
                if not f or f.get("status") != "submitted":
                    my_pending += 1
    if "manager" in roles:
        cases = await db.cases.find({"assigned_manager_id": user["id"], "is_launched": True}, {"_id": 0}).to_list(200)
        for c in cases:
            f = await db.manager_forms.find_one({"case_id": c["id"]}, {"_id": 0})
            if not f or f.get("status") != "submitted":
                my_pending += 1
    if "panel" in roles:
        cases = await db.cases.find({"assigned_panel_ids": user["id"], "is_panel_launched": True}, {"_id": 0}).to_list(200)
        for c in cases:
            f = await db.panel_reviews.find_one({"case_id": c["id"], "panel_member_id": user["id"]}, {"_id": 0})
            if not f or f.get("status") != "submitted":
                my_pending += 1
    if "hr" in roles or "hrbp" in roles:
        cases = await db.cases.find({"status": {"$in": ["panel_submitted", "hr_in_progress"]}}, {"_id": 0}).to_list(200)
        for c in cases:
            f = await db.hr_reviews.find_one({"case_id": c["id"]}, {"_id": 0})
            if not f or f.get("status") != "submitted":
                my_pending += 1

    return {
        "total_cases": total_cases,
        "in_progress": in_progress,
        "finalized": finalized,
        "renominations": renominations,
        "my_pending": my_pending,
    }


@router.get("/status")
async def status_matrix(user=Depends(get_current_user)):
    cases = await db.cases.find({}, {"_id": 0}).to_list(1000)
    rows = []
    for c in cases:
        emp = await db.employees.find_one({"id": c["employee_id"]}, {"_id": 0})
        ef = await db.employee_forms.find_one({"case_id": c["id"]}, {"_id": 0})
        mf = await db.manager_forms.find_one({"case_id": c["id"]}, {"_id": 0})
        stk_count = await db.stakeholder_feedbacks.count_documents({"case_id": c["id"], "status": "submitted"})
        pr_count = await db.panel_reviews.count_documents({"case_id": c["id"], "status": "submitted"})
        hr_form = await db.hr_reviews.find_one({"case_id": c["id"]}, {"_id": 0})
        presentation = await db.documents.find_one({"case_id": c["id"], "doc_type": "presentation", "is_latest": True, "is_deleted": False}, {"_id": 0})
        rows.append({
            "case": c, "employee": emp,
            "employee_form": ef["status"] if ef else "not_started",
            "manager_form": mf["status"] if mf else "not_started",
            "stakeholder_submitted": stk_count,
            "panel_submitted": pr_count,
            "panel_total": len(c.get("assigned_panel_ids", [])),
            "hr_form": hr_form["status"] if hr_form else "not_started",
            "presentation_uploaded": bool(presentation),
        })
    return rows


# ---------- Audit ----------
@router.get("/audit")
async def audit_logs(case_id: Optional[str] = None, user=Depends(require_roles("admin", "coordinator", "hr", "hrbp"))):
    q = {}
    if case_id:
        q["case_id"] = case_id
    logs = await db.audit_logs.find(q, {"_id": 0}).sort("timestamp", -1).to_list(500)
    return logs
