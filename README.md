# CareVault

Protecting Patient Records, Preserving Trust.

CareVault is a React/Vite and Express website for healthcare records management services. It includes public pages for services, security, contact, and records-request intake, with backend form handling for local JSON backups, SQL Server storage, uploads, and SMTP notifications.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Express
- SQL Server via `msnodesqlv8`
- Nodemailer
- Multer

## Local Setup

Install dependencies:

```powershell
npm install
```

Create a local `.env` from `.env.example` and update the values:

```powershell
Copy-Item .env.example .env
```

Build and run the combined website/API server:

```powershell
npm run build
npm run api
```

Open:

```text
http://127.0.0.1:5174
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

## Environment Variables

Do not commit `.env`. Use `.env.example` as the template.

Important variables:

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
- `MSSQL_SUBMISSIONS_TABLE`
- `MSSQL_REQUESTS_TABLE`

For Gmail, use a Gmail App Password. A normal Gmail password will not work.

## Security Note

This app should not be used for production patient data until it is deployed with HTTPS, secure hosting, authenticated internal access, protected storage for uploads, encrypted backups, and reviewed privacy/retention workflows.
