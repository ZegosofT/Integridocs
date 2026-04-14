from fastapi import APIRouter, HTTPException, Response, Request, Depends
from fastapi.responses import JSONResponse
import pyotp
import bcrypt
import os
import time
import secrets

router = APIRouter()

# ── Config ──────────────────────────────────────────────────────────────
# Ces valeurs doivent être dans votre .env
TOTP_SECRET   = os.getenv("TOTP_SECRET", "QFF5LKJ5GJSQ5PHEYOUW3GKFLHAKXLVL")
ADMIN_EMAIL   = os.getenv("ADMIN_EMAIL", "tom.gustin@integritech.fr")
ADMIN_HASH    = os.getenv("ADMIN_HASH",  "$2b$12$Piu8EUd4Mfeu.QHe.XQy8eYKGf4YoAFtXiODw5kMv5vj/vmRuEvKW")
SESSION_SECRET = os.getenv("SESSION_SECRET", secrets.token_hex(32))

# Sessions en mémoire (simple, suffisant pour 1 utilisateur admin)
# Format : { token: { "expires_at": timestamp } }
_sessions: dict = {}

SESSION_TTL = 8 * 3600  # 8 heures

# ── Helpers ──────────────────────────────────────────────────────────────
def create_session_token() -> str:
    token = secrets.token_urlsafe(48)
    _sessions[token] = {"expires_at": time.time() + SESSION_TTL}
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

# ── Routes ───────────────────────────────────────────────────────────────

@router.post("/auth/login")
def login(data: dict, response: Response):
    """
    Étape 1 : vérification email + mot de passe.
    Retourne { "step": "totp" } si OK → le frontend affiche le champ TOTP.
    """
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if email != ADMIN_EMAIL.lower():
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    try:
        ok = bcrypt.checkpw(password.encode(), ADMIN_HASH.encode())
    except Exception:
        ok = False

    if not ok:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    # Crée un token temporaire "pré-auth" (valide 5 min, seulement pour TOTP)
    pre_token = secrets.token_urlsafe(32)
    _sessions[f"pre_{pre_token}"] = {"expires_at": time.time() + 300, "type": "pre"}

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
    """
    Étape 2 : vérification du code TOTP.
    Crée la session finale si OK.
    """
    code      = str(data.get("code", "")).strip()
    pre_token = request.cookies.get("integridocs_pre")

    # Vérifier le token pré-auth
    pre_key = f"pre_{pre_token}" if pre_token else None
    if not pre_key or pre_key not in _sessions:
        raise HTTPException(status_code=401, detail="Session expirée, recommencez")
    if time.time() > _sessions[pre_key]["expires_at"]:
        del _sessions[pre_key]
        raise HTTPException(status_code=401, detail="Session expirée, recommencez")

    # Vérifier le code TOTP (fenêtre de ±1 intervalle de 30s)
    totp = pyotp.TOTP(TOTP_SECRET)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=401, detail="Code incorrect ou expiré")

    # Tout est bon → créer la session finale
    del _sessions[pre_key]
    session_token = create_session_token()

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
    """Vérifie si la session est valide (utilisé par le frontend au chargement)."""
    return {"authenticated": True, "email": ADMIN_EMAIL}
