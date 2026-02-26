from pydantic import BaseModel, ConfigDict, EmailStr


class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    owner_id: int

    model_config = ConfigDict(from_attributes=True)
