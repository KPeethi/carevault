import json
import mimetypes
import uuid
from datetime import datetime, timezone
from pathlib import Path

from werkzeug.utils import secure_filename

from .config import ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, SUBMISSIONS_DIR, UPLOADS_DIR
from .database import save_submission_to_database


def save_upload(file_storage):
    if not file_storage or not file_storage.filename:
        return None

    original_name = file_storage.filename
    extension = Path(original_name).suffix.lower()
    mime_type = file_storage.mimetype or mimetypes.guess_type(original_name)[0] or ""
    if extension not in ALLOWED_EXTENSIONS or mime_type not in ALLOWED_MIME_TYPES:
        raise ValueError("Authorization upload must be a PDF, JPG, JPEG, PNG, DOC, or DOCX file.")

    stored_name = secure_filename(f"{int(datetime.now(timezone.utc).timestamp() * 1000)}-{uuid.uuid4()}{extension}")
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

    index_entry = {
        "id": submission_id,
        "type": submission_type,
        "receivedAt": submission["receivedAt"],
        "filePath": str(file_path),
    }
    with (SUBMISSIONS_DIR / "submissions.jsonl").open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(index_entry) + "\n")

    saved_database = save_submission_to_database({**submission, "filePath": str(file_path)})
    return {"id": submission_id, "filePath": str(file_path), "savedLocal": True, "savedDatabase": saved_database}
