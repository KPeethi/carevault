import os
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
SUBMISSIONS_DIR = ROOT_DIR / "submissions"
UPLOADS_DIR = SUBMISSIONS_DIR / "uploads"
DIST_DIR = ROOT_DIR / "dist"
ENV_PATH = ROOT_DIR / ".env"

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def load_env_file(path: Path = ENV_PATH) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


load_env_file()


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def notification_to() -> str:
    return env("ADMIN_EMAIL") or env("NOTIFICATION_TO") or "kulkarni.preethi99@gmail.com"


def submissions_table() -> str:
    return env("MSSQL_SUBMISSIONS_TABLE", "CareVaultSubmissions")


def requests_table() -> str:
    return env("MSSQL_REQUESTS_TABLE", "CareVaultRequests")


def ensure_runtime_directories() -> None:
    SUBMISSIONS_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
