import json
import re

from .config import env, requests_table, submissions_table

try:
    import pyodbc
except ImportError:
    pyodbc = None


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


def get_database_info() -> dict:
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
    timeout_seconds = max(1, int(env("DB_QUERY_TIMEOUT_MS", "8000")) // 1000)
    return pyodbc.connect(get_database_connection_string(), timeout=timeout_seconds, autocommit=True)


def save_submission_to_database(submission: dict) -> bool:
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


def ensure_database_tables() -> None:
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


def save_request_to_database(cursor, submission: dict) -> None:
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


def initialize_database() -> None:
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
