from threading import Thread

from carevault import create_app
from carevault.config import env
from carevault.database import get_database_info, initialize_database, is_database_configured
from carevault.mail import is_email_configured


app = create_app()


if __name__ == "__main__":
    port = int(env("PORT", "5174"))
    host = env("HOST", "127.0.0.1")

    print(f"CareVault Python server listening at http://{host}:{port}")
    print(f"Submission notifications go to {app.config['NOTIFICATION_TO']}")
    print("SMTP email notifications are enabled." if is_email_configured() else "SMTP is not configured; submissions will be stored without email.")

    if is_database_configured():
        info = get_database_info()
        print(f"MSSQL storage is enabled. Server: {info['server']}; Database: {info['database']}.")
    else:
        print("MSSQL is not configured; submissions will be stored locally only.")

    Thread(target=initialize_database, daemon=True).start()
    app.run(host=host, port=port)
