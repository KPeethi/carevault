import re
import smtplib
from email.message import EmailMessage

from .config import env


def extract_email(value) -> str:
    match = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", value or "", re.IGNORECASE)
    return match.group(0) if match else ""


def is_email_configured() -> bool:
    password = env("SMTP_PASS")
    return bool(env("SMTP_HOST") and env("SMTP_USER") and password and password != "GMAIL_APP_PASSWORD_HERE")


def send_email(to: str, subject: str, text: str):
    if not is_email_configured() or not extract_email(to):
        return None

    try:
        message = EmailMessage()
        message["From"] = env("SMTP_FROM") or env("SMTP_USER")
        message["To"] = to
        message["Subject"] = subject
        message.set_content(text)

        timeout = int(env("SMTP_SOCKET_TIMEOUT_MS", "8000")) / 1000
        port = int(env("SMTP_PORT", "465"))
        secure = env("SMTP_SECURE", "true").lower() != "false"
        smtp_class = smtplib.SMTP_SSL if secure else smtplib.SMTP
        with smtp_class(env("SMTP_HOST"), port, timeout=timeout) as smtp:
            if not secure:
                smtp.starttls()
            smtp.login(env("SMTP_USER"), env("SMTP_PASS"))
            smtp.send_message(message)
        return True
    except Exception as error:
        print(f"Email send failed for {to}: {error}")
        return False
