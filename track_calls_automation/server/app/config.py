import os
from dotenv import load_dotenv

# Load .env file (local dev). On Azure, these are set as OS environment variables.
load_dotenv()

# ── Database ───────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")


# ── JWT ────────────────────────────────────────────────────────────────────────
# No fallback default — the server will refuse to start if this is missing.
# Set it in .env (local) or as an OS env var on Azure.
_jwt_secret = os.getenv("JWT_SECRET_KEY")
if not _jwt_secret:
    raise RuntimeError(
        "JWT_SECRET_KEY is not set. "
        "Add it to your .env file or Azure environment variables."
    )
JWT_SECRET_KEY: str = _jwt_secret

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
except ValueError:
    ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# ── SMTP Mail Service ────────────────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
try:
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
except ValueError:
    SMTP_PORT = 587
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)
