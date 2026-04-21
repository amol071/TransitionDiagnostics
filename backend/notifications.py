"""Notification + mocked email service."""
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional
from core import db

logger = logging.getLogger("ldc.notif")


def _now():
    return datetime.now(timezone.utc).isoformat()


async def notify(user_ids: List[str], n_type: str, title: str, body: str, case_id: Optional[str] = None):
    """Create in-app notifications and mocked email outbox entries for each recipient."""
    if not user_ids:
        return
    # Dedupe
    user_ids = list({u for u in user_ids if u})
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "password_hash": 0}).to_list(200)
    notifs = [{
        "id": str(uuid.uuid4()),
        "user_id": u["id"],
        "case_id": case_id,
        "type": n_type,
        "title": title,
        "body": body,
        "read": False,
        "created_at": _now(),
    } for u in users]
    if notifs:
        await db.notifications.insert_many(notifs)
    # Mocked email outbox
    emails = [{
        "id": str(uuid.uuid4()),
        "to": u["email"],
        "to_name": u.get("name", ""),
        "subject": title,
        "body": body,
        "case_id": case_id,
        "type": n_type,
        "status": "mocked_sent",
        "provider": "MOCKED",
        "created_at": _now(),
    } for u in users]
    if emails:
        await db.email_outbox.insert_many(emails)
    logger.info(f"[notify] {n_type} → {len(users)} recipients (MOCKED email)")


async def recipients_for_case(case: dict, roles: List[str]) -> List[str]:
    """Map role labels → user_ids for a case."""
    ids = []
    if "employee" in roles:
        emp = await db.employees.find_one({"id": case["employee_id"]}, {"_id": 0})
        if emp:
            u = await db.users.find_one({"email": emp["email"]}, {"_id": 0})
            if u:
                ids.append(u["id"])
    if "manager" in roles and case.get("assigned_manager_id"):
        ids.append(case["assigned_manager_id"])
    if "panel" in roles:
        ids.extend(case.get("assigned_panel_ids", []))
    if "hr" in roles or "hrbp" in roles:
        if case.get("assigned_hr_id"): ids.append(case["assigned_hr_id"])
        if case.get("assigned_hrbp_id"): ids.append(case["assigned_hrbp_id"])
    if "coordinator" in roles and case.get("coordinator_id"):
        ids.append(case["coordinator_id"])
    return list({i for i in ids if i})
