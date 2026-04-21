"""Document upload / list / download routes using Emergent object storage."""
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Header, Query, Response
from typing import Optional
from core import db, get_current_user, put_object, get_object, APP_NAME, audit

logger = logging.getLogger("ldc.docs")
router = APIRouter(tags=["documents"])

ALLOWED_DOC_TYPES = {
    "org_chart", "talent_scorecard", "psychometric_pdf", "annual_review",
    "mid_review", "data_summary", "presentation", "profile",
    "intune_scorecard", "360_report", "360_summary",
}

MAX_SIZE = 25 * 1024 * 1024  # 25 MB


@router.get("/cases/{case_id}/documents")
async def list_documents(case_id: str, user=Depends(get_current_user)):
    docs = await db.documents.find(
        {"case_id": case_id, "is_deleted": False},
        {"_id": 0, "parsed_text": 0},
    ).sort("uploaded_at", -1).to_list(500)
    # Group by doc_type → latest
    latest_by_type = {}
    for d in docs:
        t = d["doc_type"]
        if d.get("is_latest"):
            latest_by_type[t] = d
    return {"documents": docs, "latest_by_type": latest_by_type}


@router.post("/cases/{case_id}/documents")
async def upload_document(
    case_id: str,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(400, f"Unknown doc_type. Allowed: {sorted(ALLOWED_DOC_TYPES)}")
    case = await db.cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(404, "Case not found")
    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(400, f"File too large. Max {MAX_SIZE // (1024*1024)}MB")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/cases/{case_id}/{doc_type}/{uuid.uuid4()}.{ext}"
    content_type = file.content_type or "application/octet-stream"
    result = put_object(path, data, content_type)

    # Mark previous latest as not latest
    await db.documents.update_many(
        {"case_id": case_id, "doc_type": doc_type, "is_latest": True},
        {"$set": {"is_latest": False}},
    )
    # Determine next version
    prev_count = await db.documents.count_documents({"case_id": case_id, "doc_type": doc_type})
    doc = {
        "id": str(uuid.uuid4()),
        "case_id": case_id,
        "doc_type": doc_type,
        "original_filename": file.filename,
        "storage_path": result["path"],
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "version": prev_count + 1,
        "is_latest": True,
        "uploaded_by": user["id"],
        "uploaded_by_name": user["name"],
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "is_deleted": False,
    }
    await db.documents.insert_one(doc)
    doc.pop("_id", None)
    await audit(user, "upload", "document", case_id=case_id, details={"doc_type": doc_type, "filename": file.filename})
    return doc


@router.delete("/cases/{case_id}/documents/{doc_id}")
async def delete_document(case_id: str, doc_id: str, user=Depends(get_current_user)):
    await db.documents.update_one(
        {"id": doc_id, "case_id": case_id}, {"$set": {"is_deleted": True}}
    )
    await audit(user, "delete", "document", case_id=case_id, details={"doc_id": doc_id})
    return {"ok": True}


@router.get("/documents/{doc_id}/download")
async def download_document(
    doc_id: str,
    authorization: Optional[str] = Header(None),
    auth: Optional[str] = Query(None),
):
    # re-auth via either header or query param
    from core import decode_token
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    elif auth:
        token = auth
    if not token:
        raise HTTPException(401, "auth required")
    decode_token(token)  # validate
    doc = await db.documents.find_one({"id": doc_id, "is_deleted": False}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Document not found")
    data, content_type = get_object(doc["storage_path"])
    return Response(
        content=data,
        media_type=doc.get("content_type", content_type),
        headers={"Content-Disposition": f'inline; filename="{doc["original_filename"]}"'},
    )
