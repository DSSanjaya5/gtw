from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import User

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    user_id = credentials.credentials

    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid user",
        )

    return user
