from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.utils.security import hash_password, verify_password, create_access_token

router = APIRouter(tags=["auth"])


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(body: UserRegister, db: Session = Depends(get_db)):
    """
    Create a new user account.

    Steps:
      1. Check if email already exists.
      2. Hash the password.
      3. Save the new user to the database.
      4. Return safe user data (no password_hash).
    """
    # 1. Duplicate email check
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # 2. Hash password — never store plain text
    hashed = hash_password(body.password)

    # 3. Create user row
    new_user = User(
        name=body.name.strip(),
        email=body.email,
        password_hash=hashed,
        role=body.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)   # load auto-generated id / created_at from DB

    return new_user


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT access token.

    Steps:
      1. Look up the user by email.
      2. Verify the supplied password against the stored hash.
      3. Create a JWT with the user's id as the subject.
      4. Return the token and basic user info.
    """
    # 1. Find user
    user = db.query(User).filter(User.email == body.email).first()

    # 2. Check password  (same error for unknown email OR wrong password — security best practice)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # 3. Create JWT  — 'sub' (subject) stores the user id as a string
    token = create_access_token({"sub": str(user.id)})

    # 4. Return
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ---------------------------------------------------------------------------
# GET /api/auth/me   (protected)
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return the currently authenticated user's information.
    Requires a valid Bearer token in the Authorization header.
    """
    return current_user
