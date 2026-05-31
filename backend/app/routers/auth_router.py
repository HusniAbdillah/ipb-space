from fastapi import APIRouter, Depends, status, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.auth_service import AuthService
from app.repositories import user_repository
from app.schemas.user import UserCreate, UserLogin
from app.schemas.http import HTTPResponse

# Create a login response schema compatible with OAuth2 / Swagger UI and Frontend
class LoginResponse(HTTPResponse):
    access_token: str
    token_type: str

router = APIRouter(prefix="/auth", tags=["auth"])

async def get_auth_service(db: AsyncSession = Depends(get_db)):
    repo = user_repository.UserRepository(db)
    return AuthService(repo)

@router.post("/register", response_model=HTTPResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    service: AuthService = Depends(get_auth_service)
) -> HTTPResponse:
    """
    Endpoint to register a new user.

    Example request body:
    {
        "fullname": "John Doe",
        "idnum": "12345678",
        "email": "john.doe@ipbspace.com",
        "password": "SecurePassword123", 
        "role": "civitas"
    }

    rules for password:
    - Cannot be empty
    - Must be at least 8 characters long
    - Must contain both letters and numbers
    - Cannot contain whitespace characters
    """
    response = await service.register(data)

    return HTTPResponse(
        success=True,
        data={}
    )

@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    service: AuthService = Depends(get_auth_service)
) -> LoginResponse:
    """
    Endpoint to log in a user and provide access and refresh tokens.
    Supports both JSON body (Frontend) and Form URL Encoded (Swagger Authorize).
    """
    content_type = request.headers.get("content-type", "")
    
    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form_data = await request.form()
        email = form_data.get("username")
        password = form_data.get("password")
    else:
        try:
            body = await request.json()
            email = body.get("email")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON body or content-type"
            )
            
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )
        
    user_login = UserLogin(email=email, password=password)
    auth_data = await service.login(user_login)
    
    return LoginResponse(
        success=True,
        data={
            "user": auth_data.data,
            "token": auth_data.token,
        },
        access_token=auth_data.token.access_token,
        token_type="bearer"
    )

@router.post("/refresh", response_model=HTTPResponse)
async def refresh_access_token(
    refresh_token: str,
    service: AuthService = Depends(get_auth_service)
) -> HTTPResponse:
    """
    Endpoint to refresh an access token using a valid refresh token.

    Example request body:
    {
        "refresh_token": "your_refresh_token_here"
    }
    """
    new_token = await service.refresh_access_token(refresh_token)
    return HTTPResponse(
        success=True,
        data={"token": new_token}
    )