"""Auth routes."""
from fastapi import APIRouter, HTTPException, Depends
from core import db, verify_password, create_token, get_current_user, audit
from models import LoginRequest, LoginResponse, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    user = await db.users.find_one({"email": body.email.lower().strip()}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["roles"], user["email"])
    return LoginResponse(
        token=token,
        user=UserPublic(
            id=user["id"], email=user["email"], name=user["name"],
            roles=user["roles"], emp_id=user.get("emp_id"),
        ),
    )


@router.get("/me", response_model=UserPublic)
async def me(user=Depends(get_current_user)):
    return UserPublic(
        id=user["id"], email=user["email"], name=user["name"],
        roles=user["roles"], emp_id=user.get("emp_id"),
    )


@router.get("/users")
async def list_users(user=Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return users
