import json
import mimetypes
import os
import re
import smtplib
import uuid
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from threading import Thread

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename

try:
    import pyodbc
except ImportError:
    pyodbc = None


ROOT_DIR = Path(__file__).resolve().parents[1]
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


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


load_env_file(ENV_PATH)

SUBMISSIONS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def notification_to() -> str:
    return env("ADMIN_EMAIL") or env("NOTIFICATION_TO") or "kulkarni.preethi99@gmail.com"


def submissions_table() -> str:
    return env("MSSQL_SUBMISSIONS_TABLE", "CareVaultSubmissions")


def requests_table() -> str:
    return env("MSSQL_REQUESTS_TABLE", "CareVaultRequests")


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/api/health", methods=["GET"])
def health():
    db_info = get_database_info()
    return jsonify(
        {
            "ok": True,
            "backend": "python-flask",
            "notificationTo": notification_to(),
            "emailConfigured": is_email_configured(),
            "databaseConfigured": is_database_configured(),
            "databaseServer": db_info["server"],
            "databaseName": db_info["database"],
            "requestsTable": requests_table(),
            "submissionsTable": submissions_table(),
        }
    )


@app.route("/api/contact", methods=["POST", "OPTIONS"])
def contact():
    if request.method == "OPTIONS":
        return ("", 204)

    payload = pick(request.get_json(silent=True) or {}, ["name", "organization", "role", "email", "phone", "service", "message"])
    require_fields(payload, ["name", "email", "message"])

    submission = save_submission("contact", payload)
    owner_email_sent = send_email(
        to=notification_to(),
        subject=f"New CareVault consultation request: {payload['name']}",
        text="\n".join(
            [
                "A new consultation request was submitted.",
                "",
                f"Submission ID: {submission['id']}",
                f"Name: {payload['name']}",
                f"Organization: {payload.get('organization') or 'Not provided'}",
                f"Role: {payload.get('role') or 'Not provided'}",
                f"Email: {payload['email']}",
                f"Phone: {payload.get('phone') or 'Not provided'}",
                f"Service: {payload.get('service') or 'Not provided'}",
                "",
                "Message:",
                payload["message"],
            ]
        ),
    )
    requester_email_sent = send_email(
        to=payload["email"],
        subject=f"CareVault request submitted: {submission['id']}",
        text="\n".join(
            [
                "Thank you for contacting CareVault.",
                "",
                f"Your request was submitted successfully. Your unique request ID is {submission['id']}.",
                "",
                "Please keep this ID for future reference.",
                "CareVault",
                "Protecting Patient Records, Preserving Trust.",
            ]
        ),
    )

    return jsonify(
        response_payload(
            submission,
            owner_email_sent=owner_email_sent,
            requester_email_sent=requester_email_sent,
            upload_saved=False,
        )
    )


@app.route("/api/records-request", methods=["POST", "OPTIONS"])
def records_request():
    if request.method == "OPTIONS":
        return ("", 204)

    payload = pick(
        request.form,
        [
            "patientName",
            "dateOfBirth",
            "requesterEmail",
            "phone",
            "contact",
            "provider",
            "recordType",
            "purpose",
            "delivery",
            "consent",
        ],
    )
    require_fields(payload, ["patientName", "dateOfBirth", "provider", "recordType", "purpose", "delivery", "consent"])
    require_at_least_one_field(payload, ["requesterEmail", "phone", "contact"], "requester email or phone")
    if payload["consent"].lower() != "yes":
        return api_error("Consent is required before submitting a records request.", 400)

    attachment = save_upload(request.files.get("authorization"))
    requester_email = payload.get("requesterEmail") or extract_email(payload.get("contact"))
    submission = save_submission("records-request", payload, attachment)

    owner_email_sent = send_email(
        to=notification_to(),
        subject=f"New CareVault records request: {submission['id']}",
        text="\n".join(
            [
                "A new medical records request was submitted.",
                "",
                f"Submission ID: {submission['id']}",
                f"Provider/Clinic: {payload['provider']}",
                f"Record Type: {payload['recordType']}",
                f"Delivery Preference: {payload['delivery']}",
                f"Authorization Upload: {attachment['originalName'] if attachment else 'Not uploaded'}",
                "",
                "Patient details were intentionally not included in this email.",
                f"Review the stored submission on the server at: {submission['filePath']}",
            ]
        ),
    )
    requester_email_sent = send_email(
        to=requester_email,
        subject=f"CareVault records request submitted: {submission['id']}",
        text="\n".join(
            [
                "Your CareVault records request was submitted successfully.",
                "",
                f"Your unique request ID is {submission['id']}.",
                "",
                "For privacy, this confirmation email does not include patient details.",
                "Please keep this ID for future reference.",
                "",
                "CareVault",
                "Protecting Patient Records, Preserving Trust.",
            ]
        ),
    )

    return jsonify(
        response_payload(
            submission,
            owner_email_sent=owner_email_sent,
            requester_email_sent=requester_email_sent,
            upload_saved=attachment is not None,
        )
    )


@app.route("/api/<path:_path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def api_not_found(_path):
    return api_error("API endpoint not found.", 404)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and (DIST_DIR / path).is_file():
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


@app.errorhandler(RequestEntityTooLarge)
def upload_too_large(_error):
    return api_error("Authorization upload must be 10MB or smaller.", 400)


@app.errorhandler(ValueError)
def validation_error(error):
    return api_error(str(error), 400)


@app.errorhandler(Exception)
def unexpected_error(error):
    print(f"Submission failed: {error}")
    return api_error("Submission failed. Please try again.", 500)


def api_error(message: str, status: int):
    return jsonify({"ok": False, "error": message}), status


def clean(value) -> str:
    if isinstance(value, list):
        return ", ".join(clean(item) for item in value)
    return str(value or "").strip()


def pick(source, keys):
    return {key: clean(source.get(key)) for key in keys}


def require_fields(payload, fields):
    missing = [field for field in fields if not payload.get(field)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def require_at_least_one_field(payload, fields, label):
    if not any(payload.get(field) for field in fields):
        raise ValueError(f"Missing required field: {label}")


def save_upload(file_storage):
    if not file_storage or not file_storage.filename:
        return None

    original_name = file_storage.filename
    extension = Path(original_name).suffix.lower()
    mime_type = file_storage.mimetype or mimetypes.guess_type(original_name)[0] or ""
    if extension not in ALLOWED_EXTENSIONS or mime_type not in ALLOWED_MIME_TYPES:
        raise ValueError("Authorization upload must be a PDF, JPG, JPEG, PNG, DOC, or DOCX file.")

    stored_name = f"{int(datetime.now(timezone.utc).timestamp() * 1000)}-{uuid.uuid4()}{extension}"
    stored_name = secure_filename(stored_name)
    stored_path = UPLOADS_DIR / stored_name
    file_storage.save(stored_path)

    return {
        "originalName": original_name,
        "storedName": stored_name,
        "size": stored_path.stat().st_size,
        "mimeType": mime_type,
        "path": str(stored_path),
    }


def save_submission(submission_type, payload, attachment=None):
    now = datetime.now(timezone.utc)
    submission_id = f"{now.isoformat(timespec='milliseconds').replace('+00:00', 'Z').replace(':', '-').replace('.', '-')}-{uuid.uuid4().hex[:8]}"
    submission = {
        "id": submission_id,
        "type": submission_type,
        "receivedAt": now.isoformat().replace("+00:00", "Z"),
        "payload": payload,
        "attachment": attachment,
    }
    file_path = SUBMISSIONS_DIR / f"{submission_id}.json"
    file_path.write_text(json.dumps(submission, indent=2) + "\n", encoding="utf-8")
    with (SUBMISSIONS_DIR / "submissions.jsonl").open("a", encoding="utf-8") as handle:
        handle.write(json.dumps({"id": submission_id, "type": submission_type, "receivedAt": submission["receivedAt"], "filePath": str(file_path)}) + "\n")

    saved_database = save_submission_to_database({**submission, "filePath": str(file_path)})
    return {"id": submission_id, "filePath": str(file_path), "savedLocal": True, "savedDatabase": saved_database}


def response_payload(submission, owner_email_sent, requester_email_sent, upload_saved):
    email_results = [result for result in [owner_email_sent, requester_email_sent] if result is not None]
    email_sent = bool(email_results) and all(email_results)
    return {
        "ok": True,
        "id": submission["id"],
        "savedLocal": submission["savedLocal"],
        "savedDatabase": submission["savedDatabase"],
        "emailSent": email_sent,
        "uploadSaved": upload_saved,
        "emailConfigured": is_email_configured(),
        "ownerEmailSent": owner_email_sent,
        "requesterEmailSent": requester_email_sent,
        "databaseConfigured": is_database_configured(),
        "databaseSaved": submission["savedDatabase"],
    }


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


def is_database_configured() -> bool:
    return bool(get_database_connection_string()) and pyodbc is not None


def get_database_connection_string() -> str:
    explicit = env("CAREVAULT_MSSQL_CONNECTION_STRING")
    if explicit:
        return explicit

    server = env("DB_SERVER")
    database = env("DB_DATABASE", "CareVault")
    if not server or not database:
        return ""

    driver = env("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    parts = [f"Driver={{{driver}}}", f"Server={server}", f"Database={database}", "Connection Timeout=5"]
    if env("DB_USER") and env("DB_PASSWORD"):
        parts.extend([f"Uid={env('DB_USER')}", f"Pwd={env('DB_PASSWORD')}"])
    else:
        parts.append(f"Trusted_Connection={env('DB_TRUSTED_CONNECTION', 'yes')}")
    if env("DB_ENCRYPT"):
        parts.append(f"Encrypt={env('DB_ENCRYPT')}")
    if env("DB_TRUST_SERVER_CERTIFICATE"):
        parts.append(f"TrustServerCertificate={env('DB_TRUST_SERVER_CERTIFICATE')}")
    return ";".join(parts) + ";"


def get_database_info():
    return {
        "server": env("DB_SERVER") or parse_connection_value("Server") or None,
        "database": env("DB_DATABASE") or parse_connection_value("Database") or None,
    }


def parse_connection_value(key: str) -> str:
    connection_string = env("CAREVAULT_MSSQL_CONNECTION_STRING")
    match = re.search(rf"{re.escape(key)}=([^;]+)", connection_string, re.IGNORECASE)
    return match.group(1) if match else ""


def get_db_connection():
    if pyodbc is None:
        raise RuntimeError("pyodbc is not installed.")
    return pyodbc.connect(get_database_connection_string(), timeout=int(env("DB_QUERY_TIMEOUT_MS", "8000")) // 1000, autocommit=True)


def save_submission_to_database(submission) -> bool:
    if not is_database_configured():
        return False

    try:
        ensure_database_tables()
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                f"""
                INSERT INTO {safe_sql_identifier(submissions_table())}
                  (Id, SubmissionType, ReceivedAt, PayloadJson, AttachmentJson, LocalFilePath)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                submission["id"],
                submission["type"],
                submission["receivedAt"],
                json.dumps(submission["payload"]),
                json.dumps(submission["attachment"]) if submission.get("attachment") else None,
                submission["filePath"],
            )
            save_request_to_database(cursor, submission)
        return True
    except Exception as error:
        print(f"MSSQL submission save failed: {error}")
        if env("MSSQL_REQUIRE_SUCCESS", "false").lower() == "true":
            raise
        return False


def ensure_database_tables():
    if not is_database_configured():
        return
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            f"""
            IF OBJECT_ID(N'{submissions_table().replace("'", "''")}', N'U') IS NULL
            BEGIN
              CREATE TABLE {safe_sql_identifier(submissions_table())} (
                Id NVARCHAR(100) NOT NULL PRIMARY KEY,
                SubmissionType NVARCHAR(50) NOT NULL,
                ReceivedAt DATETIME2 NOT NULL,
                PayloadJson NVARCHAR(MAX) NOT NULL,
                AttachmentJson NVARCHAR(MAX) NULL,
                LocalFilePath NVARCHAR(1024) NULL
              );
            END
            """
        )
        cursor.execute(
            f"""
            IF OBJECT_ID(N'{requests_table().replace("'", "''")}', N'U') IS NULL
            BEGIN
              CREATE TABLE {safe_sql_identifier(requests_table())} (
                Id NVARCHAR(100) NOT NULL PRIMARY KEY,
                RequestType NVARCHAR(50) NOT NULL,
                Status NVARCHAR(50) NOT NULL DEFAULT N'New',
                PatientName NVARCHAR(250) NULL,
                DateOfBirth DATE NULL,
                RequesterName NVARCHAR(250) NULL,
                RequesterEmail NVARCHAR(320) NULL,
                Phone NVARCHAR(80) NULL,
                Organization NVARCHAR(250) NULL,
                Role NVARCHAR(150) NULL,
                ProviderName NVARCHAR(250) NULL,
                RecordType NVARCHAR(250) NULL,
                Purpose NVARCHAR(500) NULL,
                DeliveryPreference NVARCHAR(100) NULL,
                ServiceInterested NVARCHAR(250) NULL,
                Message NVARCHAR(MAX) NULL,
                AuthorizationFileName NVARCHAR(512) NULL,
                AuthorizationStoredName NVARCHAR(512) NULL,
                AuthorizationPath NVARCHAR(1024) NULL,
                PayloadJson NVARCHAR(MAX) NOT NULL,
                LocalFilePath NVARCHAR(1024) NULL,
                CreatedAt DATETIME2 NOT NULL,
                UpdatedAt DATETIME2 NOT NULL
              );
            END
            """
        )


def save_request_to_database(cursor, submission):
    payload = submission.get("payload") or {}
    attachment = submission.get("attachment") or {}
    requester_name = payload.get("name") if submission["type"] == "contact" else ""
    requester_email = payload.get("email") if submission["type"] == "contact" else payload.get("requesterEmail")
    phone = payload.get("phone") or payload.get("contact") or ""
    cursor.execute(
        f"""
        IF NOT EXISTS (SELECT 1 FROM {safe_sql_identifier(requests_table())} WHERE Id = ?)
        BEGIN
          INSERT INTO {safe_sql_identifier(requests_table())}
            (Id, RequestType, Status, PatientName, DateOfBirth, RequesterName, RequesterEmail, Phone,
             Organization, Role, ProviderName, RecordType, Purpose, DeliveryPreference, ServiceInterested,
             Message, AuthorizationFileName, AuthorizationStoredName, AuthorizationPath, PayloadJson,
             LocalFilePath, CreatedAt, UpdatedAt)
          VALUES (?, ?, N'New', ?, TRY_CONVERT(date, ?, 23), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        END
        """,
        submission["id"],
        submission["id"],
        submission["type"],
        payload.get("patientName"),
        payload.get("dateOfBirth"),
        requester_name,
        requester_email,
        phone,
        payload.get("organization"),
        payload.get("role"),
        payload.get("provider"),
        payload.get("recordType"),
        payload.get("purpose"),
        payload.get("delivery"),
        payload.get("service"),
        payload.get("message"),
        attachment.get("originalName"),
        attachment.get("storedName"),
        attachment.get("path"),
        json.dumps(payload),
        submission["filePath"],
        submission["receivedAt"],
        submission["receivedAt"],
    )


def safe_sql_identifier(identifier: str) -> str:
    parts = identifier.split(".")
    if not all(re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", part) for part in parts):
        raise ValueError("Invalid MSSQL table name.")
    return ".".join(f"[{part}]" for part in parts)


def initialize_database():
    if not is_database_configured():
        if pyodbc is None:
            print("pyodbc is not installed; SQL Server storage is disabled.")
        return
    try:
        ensure_database_tables()
        info = get_database_info()
        print(f"MSSQL table setup completed for {info['server']} / {info['database']}.")
    except Exception as error:
        print(f"MSSQL table setup failed: {error}")


if __name__ == "__main__":
    port = int(env("PORT", "5174"))
    host = env("HOST", "127.0.0.1")
    print(f"CareVault Python server listening at http://{host}:{port}")
    print(f"Submission notifications go to {notification_to()}")
    print("SMTP email notifications are enabled." if is_email_configured() else "SMTP is not configured; submissions will be stored without email.")
    if is_database_configured():
        info = get_database_info()
        print(f"MSSQL storage is enabled. Server: {info['server']}; Database: {info['database']}.")
    else:
        print("MSSQL is not configured; submissions will be stored locally only.")
    Thread(target=initialize_database, daemon=True).start()
    app.run(host=host, port=port)
