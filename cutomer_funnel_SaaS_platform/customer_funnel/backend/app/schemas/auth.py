from datetime import datetime

from pydantic import BaseModel

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    registration_code: str


class RegisterResponse(BaseModel):
    message: str
class RegistrationCodeResponse(BaseModel):
    code: str


class RegistrationCodeCreateResponse(BaseModel):
    id: str
    code: str
    expires_at: datetime
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str