import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import jwt, JWTError

load_dotenv()

SECRET_KEY = os.getenv(
    "JWT_SECRET",
    "change-this-to-a-long-random-secret-before-deploying"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours — long enough for a full demo session


def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload

    except JWTError:
        return None
