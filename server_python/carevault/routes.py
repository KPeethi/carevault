from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import RequestEntityTooLarge

from .config import requests_table, submissions_table
from .database import get_database_info, is_database_configured
from .mail import extract_email, is_email_configured, send_email
from .responses import api_error, submission_response
from .storage import save_submission, save_upload
from .validation import pick, require_at_least_one_field, require_fields


def register_routes(app: Flask) -> None:
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
                "notificationTo": app.config["NOTIFICATION_TO"],
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
        owner_email_sent = send_contact_owner_email(app.config["NOTIFICATION_TO"], payload, submission)
        requester_email_sent = send_contact_requester_email(payload, submission)
        return jsonify(submission_response(submission, owner_email_sent, requester_email_sent, upload_saved=False))

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
        owner_email_sent = send_records_owner_email(app.config["NOTIFICATION_TO"], payload, attachment, submission)
        requester_email_sent = send_records_requester_email(requester_email, submission)
        return jsonify(submission_response(submission, owner_email_sent, requester_email_sent, upload_saved=attachment is not None))

    @app.route("/api/<path:_path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    def api_not_found(_path):
        return api_error("API endpoint not found.", 404)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        dist_dir = app.config["DIST_DIR"]
        if path and (dist_dir / path).is_file():
            return send_from_directory(dist_dir, path)
        return send_from_directory(dist_dir, "index.html")

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


def send_contact_owner_email(to, payload, submission):
    return send_email(
        to=to,
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


def send_contact_requester_email(payload, submission):
    return send_email(
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


def send_records_owner_email(to, payload, attachment, submission):
    return send_email(
        to=to,
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


def send_records_requester_email(to, submission):
    return send_email(
        to=to,
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
