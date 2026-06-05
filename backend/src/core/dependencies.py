from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import User


def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> User:

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    user_id = authorization.removeprefix(
        "Bearer "
    )

    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid user",
        )

    return user