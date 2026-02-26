from dataclasses import dataclass
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict

router = APIRouter(tags=["auth"])
me_router = APIRouter(tags=["auth"])


@dataclass
class UserRecord:
    id: int
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str


class MeResponse(BaseModel):
    id: int
    email: str
    model_config = ConfigDict(from_attributes=True)


_USERS_BY_EMAIL: dict[str, UserRecord] = {}
_USERS_BY_TOKEN: dict[str, UserRecord] = {}
_NEXT_USER_ID = 1


def _issue_token(user: UserRecord) -> str:
    token = secrets.token_urlsafe(24)
    _USERS_BY_TOKEN[token] = user
    return token


def _get_current_user(authorization: str | None = Header(default=None)) -> UserRecord:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = authorization.removeprefix("Bearer ").strip()
    user = _USERS_BY_TOKEN.get(token)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return user


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest) -> AuthResponse:
    global _NEXT_USER_ID

    if payload.email in _USERS_BY_EMAIL:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    user = UserRecord(id=_NEXT_USER_ID, email=payload.email, password=payload.password)
    _NEXT_USER_ID += 1
    _USERS_BY_EMAIL[user.email] = user
    token = _issue_token(user)
    return AuthResponse(token=token)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    user = _USERS_BY_EMAIL.get(payload.email)
    if user is None or user.password != payload.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = _issue_token(user)
    return AuthResponse(token=token)


@me_router.get("/me", response_model=MeResponse)
def read_me(current_user: UserRecord = Depends(_get_current_user)) -> MeResponse:
    return MeResponse.model_validate(current_user)
