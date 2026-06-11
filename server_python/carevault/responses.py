from flask import jsonify

from .database import is_database_configured
from .mail import is_email_configured


def api_error(message: str, status: int):
    return jsonify({"ok": False, "error": message}), status


def submission_response(submission, owner_email_sent, requester_email_sent, upload_saved):
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
