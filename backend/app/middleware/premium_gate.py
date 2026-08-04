from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.auth import AuthError, get_demo_user, get_user_from_token, is_premium_user
from app.core.config import settings
from app.core.database import get_db


async def require_auth(request: Request, db: Session = Depends(get_db)):
    try:
        user = get_user_from_token(db, request.headers.get("Authorization"))
        if user:
            return user
    except AuthError as exc:
        if not settings.bypass_auth:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if settings.bypass_auth:
        return get_demo_user(db)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


async def require_premium(request: Request, db: Session = Depends(get_db)):
    user = await require_auth(request, db)
    if not settings.bypass_premium and not is_premium_user(db, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Premium subscription required")
    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)):
    try:
        user = get_user_from_token(db, request.headers.get("Authorization"))
        if user:
            return user
    except AuthError:
        pass

    if settings.bypass_auth:
        return get_demo_user(db)
    return None
