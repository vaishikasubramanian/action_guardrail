import logging
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.security.jwt_handler import verify_token
from app.database.database import SessionLocal
from app.models.user_model import User

logger = logging.getLogger("action_guardrail.auth")

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )

    username = payload.get("sub")
    role = payload.get("role")

    if not username or not role:
        raise HTTPException(
            status_code=401,
            detail="Malformed token."
        )

    # Check if user is still active in the database
    # This ensures disabled users cannot use old tokens
    db = SessionLocal()
    try:
        user = db.query(User).filter(
            User.username == username
        ).first()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User account not found."
            )

        if not user.enabled:
            logger.warning(f"Disabled user '{username}' attempted access.")
            raise HTTPException(
                status_code=403,
                detail="Your account has been disabled. Contact your administrator."
            )

    finally:
        db.close()

    return {"sub": username, "role": role}


def require_role(*allowed_roles: str):
    """
    Dependency factory for role-based access control.
    Usage: Depends(require_role("admin", "reviewer"))
    """
    def role_checker(current_user=Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role: {' or '.join(allowed_roles)}. Your role: {current_user['role']}"
            )
        return current_user
    return role_checker
