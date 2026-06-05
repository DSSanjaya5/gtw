from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import User
from schemas.auth import LoginRequest, LoginResponse

auth_router = APIRouter(tags=["Authentication"])


@auth_router.post(
    "/login",
    response_model=LoginResponse,
)
async def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.name == payload.username)
        .first()
    )

    if not user:
        user = User(name=payload.username)
        db.add(user)
        db.commit()
        db.refresh(user)

    return LoginResponse(
        access_token=user.id,
    )