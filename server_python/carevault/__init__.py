from flask import Flask

from .config import DIST_DIR, ensure_runtime_directories, notification_to
from .routes import register_routes


def create_app() -> Flask:
    ensure_runtime_directories()
    app = Flask(__name__, static_folder=None)
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
    app.config["NOTIFICATION_TO"] = notification_to()
    app.config["DIST_DIR"] = DIST_DIR
    register_routes(app)
    return app
