from fastapi import APIRouter, HTTPException
from database import SessionLocal
import models

from auth import create_token
from schemas import LoginRequest

router = APIRouter()


@router.post("/login")
def login(payload: LoginRequest):

    username = payload.username.strip()

    if not username:
        raise HTTPException(status_code=400, detail="Username required")

    db = SessionLocal()

    user = (
        db.query(models.User)
        .filter(models.User.username == username)
        .first()
    )

    if not user:
        user = models.User(username=username)

        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_token(user.id)

    return {
        "token": token,
        "user_id": user.id,
        "username": user.username,
    }