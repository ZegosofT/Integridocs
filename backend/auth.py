from fastapi import APIRouter, HTTPException, Response, Request, Depends
import pyotp
import bcrypt
import os
import time
import secrets
import pymysql

router = APIRouter()

# ── Config ───────────────────────────────────────────────────────────────
SESSION_TTL = 8 * 3600  # 8 heures

# Sessions en mémoire : { token: { "expires_at": float, "user_id": int, "email": str } }
_sessions: dict = {}

# ── DB ───────────────────────────────────────────────────────────────────
def get_db():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=pymysql.cursors.DictCursor
    )

def get_user_by_email(email: str) -> dict | None:
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, nom, email, password_hash, totp_secret, actif FROM users WHERE email = %s",
                (email,)
            )
            return cursor.fetchone()
    finally:
        conn.close()

# ── Sessions ─────────────────────────────────────────────────────────────
def create_session_token(user_id: int, email: str) -> str:
    token = secrets.token_urlsafe(48)
    _sessions[token] = {
        "expires_at": time.time() + SESSION_TTL,
        "user_id": user_id,
        "email": email,
    }
    return token

def is_valid_session(token: str) -> bool:
    sess = _sessions.get(token)
    if not sess:
        return False
    if time.time() > sess["expires_at"]:
        del _sessions[token]
        return False
    return True

def get_session_token(request: Request) -> str | None:
    return request.cookies.get("integridocs_session")

def require_auth(request: Request):
    token = get_session_token(request)
    if not token or not is_valid_session(token):
        raise HTTPException(status_code=401, detail="Non authentifié")
    return token

# ── Routes ────────────────────────────────────────────────────────────────

@router.post("/auth/login")
def login(data: dict, response: Response):
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = get_user_by_email(email)

    if not user or not user["actif"]:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    try:
        ok = bcrypt.checkpw(password.encode(), user["password_hash"].encode())
    except Exception:
        ok = False

    if not ok:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    pre_token = secrets.token_urlsafe(32)
    _sessions[f"pre_{pre_token}"] = {
        "expires_at": time.time() + 300,
        "type": "pre",
        "user_id": user["id"],
        "email": user["email"],
        "totp_secret": user["totp_secret"],
    }

    response.set_cookie(
        key="integridocs_pre",
        value=pre_token,
        httponly=True,
        samesite="strict",
        max_age=300,
    )
    return {"step": "totp"}


@router.post("/auth/verify-totp")
def verify_totp(data: dict, request: Request, response: Response):
    code      = str(data.get("code", "")).strip()
    pre_token = request.cookies.get("integridocs_pre")

    pre_key = f"pre_{pre_token}" if pre_token else None
    if not pre_key or pre_key not in _sessions:
        raise HTTPException(status_code=401, detail="Session expirée, recommencez")
    if time.time() > _sessions[pre_key]["expires_at"]:
        del _sessions[pre_key]
        raise HTTPException(status_code=401, detail="Session expirée, recommencez")

    pre_sess     = _sessions[pre_key]
    totp_secret  = pre_sess["totp_secret"]
    user_id      = pre_sess["user_id"]
    email        = pre_sess["email"]

    totp = pyotp.TOTP(totp_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=401, detail="Code incorrect ou expiré")

    del _sessions[pre_key]
    session_token = create_session_token(user_id, email)

    response.delete_cookie("integridocs_pre")
    response.set_cookie(
        key="integridocs_session",
        value=session_token,
        httponly=True,
        samesite="strict",
        max_age=SESSION_TTL,
    )
    return {"message": "Authentifié avec succès"}


@router.post("/auth/logout")
def logout(request: Request, response: Response):
    token = get_session_token(request)
    if token and token in _sessions:
        del _sessions[token]
    response.delete_cookie("integridocs_session")
    return {"message": "Déconnecté"}


@router.get("/auth/me")
def me(token: str = Depends(require_auth)):
    sess = _sessions.get(token)
    return {"authenticated": True, "email": sess["email"] if sess else ""}
