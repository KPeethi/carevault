# CareVault

Protecting Patient Records, Preserving Trust.

CareVault is a healthcare records management website with public service pages and backend form handling for contact requests and authorized records requests.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Python Flask backend
- Optional Express backend
- SQL Server
- SMTP email
- File uploads

## Public Pages

- Home
- Services
- How It Works
- Who We Help
- Compliance & Security
- Request Records
- Contact

There is no public admin page in this app.

## Local Setup

Install frontend dependencies:

```powershell
npm install
```

Install Python backend dependencies:

```powershell
python -m pip install -r requirements.txt
```

Create a local `.env` from `.env.example` and update the values:

```powershell
Copy-Item .env.example .env
```

Build the React frontend:

```powershell
npm run build
```

Run the Python backend:

```powershell
npm run api:py
```

Open:

```text
http://127.0.0.1:5174
```

## Python Backend Structure

The Python backend is split by responsibility:

```text
server_python/app.py                 Server entry point
server_python/carevault/__init__.py  Flask app factory
server_python/carevault/config.py    Environment variables and paths
server_python/carevault/routes.py    API routes and frontend serving
server_python/carevault/storage.py   JSON backups and file uploads
server_python/carevault/database.py  SQL Server connection and inserts
server_python/carevault/mail.py      SMTP email notifications
server_python/carevault/validation.py Form validation helpers
server_python/carevault/responses.py API response helpers
```

## Optional Node Backend

The original Express backend is still available:

```powershell
npm run api
```

## Database Setup

The SQL setup script is:

```text
server/setup-carevault.sql
```

For the local SQL Server instance:

```powershell
sqlcmd -S "(local)\MSSQL2025" -E -i "server\setup-carevault.sql"
```

The app also tries to create required tables at startup and when saving submissions.

## Environment Variables

Do not commit `.env`. Use `.env.example` as the template.

Important variables:

- `PORT`
- `HOST`
- `ADMIN_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `DB_SERVER`
- `DB_DATABASE`
- `DB_DRIVER`
- `DB_TRUSTED_CONNECTION`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ENCRYPT`
- `DB_TRUST_SERVER_CERTIFICATE`
- `MSSQL_SUBMISSIONS_TABLE`
- `MSSQL_REQUESTS_TABLE`

For Gmail, use a Gmail App Password. A normal Gmail password will not work.

## Backend Responses

Form submissions return:

- `savedLocal`
- `savedDatabase`
- `emailSent`
- `uploadSaved`

If SQL Server or SMTP is unavailable, the request can still save locally and return a warning status through these flags.

## Security Note

This app should not be used for production patient data until it is deployed with HTTPS, secure hosting, authenticated internal access, protected storage for uploads, encrypted backups, and reviewed privacy/retention workflows.
