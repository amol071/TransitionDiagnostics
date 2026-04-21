"""Core utilities: DB, auth, storage."""
import os
import uuid
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from functools import wraps
from typing import Optional, List

import jwt
import bcrypt
import requests
from fastapi import HTTPException, Depends, Header, status
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger("ldc")

# ---------- Database ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
_mongo_client = AsyncIOMotorClient(MONGO_URL)
db = _mongo_client[DB_NAME]


def close_db():
    _mongo_client.close()


# ---------- Auth ----------
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = os.environ.get("JWT_ALGORITHM", "HS256")


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, roles: List[str], email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "roles": roles,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing auth header")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_roles(*roles: str):
    async def checker(user=Depends(get_current_user)):
        if not any(r in user["roles"] for r in roles):
            raise HTTPException(status_code=403, detail=f"Requires role: {roles}")
        return user
    return checker


async def audit(user: dict, action: str, entity: str, case_id: Optional[str] = None, details: Optional[dict] = None):
    doc = {
        "id": str(uuid.uuid4()),
        "case_id": case_id,
        "user_id": user["id"],
        "user_name": user.get("name", user.get("email", "")),
        "action": action,
        "entity": entity,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.audit_logs.insert_one(doc)


# ---------- Emergent Object Storage ----------
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "ldc-ai-platform")
_storage_key: Optional[str] = None


def init_storage() -> Optional[str]:
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set - storage disabled")
        return None
    try:
        r = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        r.raise_for_status()
        _storage_key = r.json()["storage_key"]
        logger.info("Object storage initialized")
        return _storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    r = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    r.raise_for_status()
    return r.json()


def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    r = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    r.raise_for_status()
    return r.content, r.headers.get("Content-Type", "application/octet-stream")


# ---------- Helpers ----------
def strip_mongo(doc: dict) -> dict:
    if doc is None:
        return doc
    doc.pop("_id", None)
    return doc


async def find_list(coll, filter_: dict = None, sort: list = None, limit: int = 500):
    cursor = coll.find(filter_ or {}, {"_id": 0})
    if sort:
        cursor = cursor.sort(sort)
    return await cursor.to_list(limit)
