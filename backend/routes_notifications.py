"""Notification endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from core import db, get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/mine")
async def my_notifications(user=Depends(get_current_user), limit: int = 50):
    items = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"items": items, "unread": unread}


@router.post("/{nid}/read")
async def mark_read(nid: str, user=Depends(get_current_user)):
    r = await db.notifications.update_one({"id": nid, "user_id": user["id"]}, {"$set": {"read": True}})
    if r.matched_count == 0:
        raise HTTPException(404, "Notification not found")
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"ok": True}
