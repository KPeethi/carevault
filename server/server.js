import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import odbcSql from "msnodesqlv8";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const submissionsDir = path.join(rootDir, "submissions");
const uploadsDir = path.join(submissionsDir, "uploads");
const distDir = path.join(rootDir, "dist");

try {
  process.loadEnvFile(path.join(rootDir, ".env"));
} catch {
  // .env is optional. Environment variables from the hosting platform also work.
}

const app = express();
const port = Number(process.env.PORT || 5174);
const notificationTo = process.env.ADMIN_EMAIL || process.env.NOTIFICATION_TO || "kulkarni.preethi99@gmail.com";
const submissionsTable = process.env.MSSQL_SUBMISSIONS_TABLE || "CareVaultSubmissions";
const requestsTable = process.env.MSSQL_REQUESTS_TABLE || "CareVaultRequests";
const allowedUploadExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"]);
const allowedUploadMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

await fs.mkdir(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname || "");
      callback(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  }),
  fileFilter: (_req, file, callback) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (allowedUploadExtensions.has(ext) && allowedUploadMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(new Error("Authorization upload must be a PDF, JPG, JPEG, PNG, DOC, or DOCX file."));
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    notificationTo,
    emailConfigured: isEmailConfigured(),
    databaseConfigured: isDatabaseConfigured(),
    databaseServer: getDatabaseInfo().server,
    databaseName: getDatabaseInfo().database,
    requestsTable,
    submissionsTable,
  });
});

app.post("/api/contact", async (req, res, next) => {
  try {
    const payload = pick(req.body, ["name", "organization", "role", "email", "phone", "service", "message"]);
    requireFields(payload, ["name", "email", "message"]);

    const submission = await saveSubmission("contact", payload);
    const ownerEmailSent = await sendEmail({
      to: notificationTo,
      subject: `New CareVault consultation request: ${payload.name}`,
      text: [
        "A new consultation request was submitted.",
        "",
        `Submission ID: ${submission.id}`,
        `Name: ${payload.name}`,
        `Organization: ${payload.organization || "Not provided"}`,
        `Role: ${payload.role || "Not provided"}`,
        `Email: ${payload.email}`,
        `Phone: ${payload.phone || "Not provided"}`,
        `Service: ${payload.service || "Not provided"}`,
        "",
        "Message:",
        payload.message,
      ].join("\n"),
    });
    const requesterEmailSent = await sendEmail({
      to: payload.email,
      subject: `CareVault request submitted: ${submission.id}`,
      text: [
        "Thank you for contacting CareVault.",
        "",
        `Your request was submitted successfully. Your unique request ID is ${submission.id}.`,
        "",
        "Please keep this ID for future reference.",
        "CareVault",
        "Protecting Patient Records, Preserving Trust.",
      ].join("\n"),
    });

    const emailSent = getEmailStatus([ownerEmailSent, requesterEmailSent]);
    res.json({
      ok: true,
      id: submission.id,
      savedLocal: submission.savedLocal,
      savedDatabase: submission.savedDatabase,
      emailSent,
      uploadSaved: false,
      emailConfigured: isEmailConfigured(),
      ownerEmailSent,
      requesterEmailSent,
      databaseConfigured: isDatabaseConfigured(),
      databaseSaved: submission.savedDatabase,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/records-request", upload.single("authorization"), async (req, res, next) => {
  try {
    const payload = pick(req.body, [
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
    ]);
    requireFields(payload, ["patientName", "dateOfBirth", "provider", "recordType", "purpose", "delivery", "consent"]);
    requireAtLeastOneField(payload, ["requesterEmail", "phone", "contact"], "requester email or phone");
    if (String(payload.consent).toLowerCase() !== "yes") {
      const error = new Error("Consent is required before submitting a records request.");
      error.status = 400;
      throw error;
    }

    const attachment = req.file
      ? {
          originalName: req.file.originalname,
          storedName: req.file.filename,
          size: req.file.size,
          mimeType: req.file.mimetype,
          path: req.file.path,
        }
      : null;

    const requesterEmail = payload.requesterEmail || extractEmail(payload.contact);
    const submission = await saveSubmission("records-request", payload, attachment);
    const ownerEmailSent = await sendEmail({
      to: notificationTo,
      subject: `New CareVault records request: ${submission.id}`,
      text: [
        "A new medical records request was submitted.",
        "",
        `Submission ID: ${submission.id}`,
        `Provider/Clinic: ${payload.provider}`,
        `Record Type: ${payload.recordType}`,
        `Delivery Preference: ${payload.delivery}`,
        `Authorization Upload: ${attachment ? attachment.originalName : "Not uploaded"}`,
        "",
        "Patient details were intentionally not included in this email.",
        `Review the stored submission on the server at: ${submission.filePath}`,
      ].join("\n"),
    });
    const requesterEmailSent = await sendEmail({
      to: requesterEmail,
      subject: `CareVault records request submitted: ${submission.id}`,
      text: [
        "Your CareVault records request was submitted successfully.",
        "",
        `Your unique request ID is ${submission.id}.`,
        "",
        "For privacy, this confirmation email does not include patient details.",
        "Please keep this ID for future reference.",
        "",
        "CareVault",
        "Protecting Patient Records, Preserving Trust.",
      ].join("\n"),
    });

    const emailSent = getEmailStatus([ownerEmailSent, requesterEmailSent]);
    res.json({
      ok: true,
      id: submission.id,
      savedLocal: submission.savedLocal,
      savedDatabase: submission.savedDatabase,
      emailSent,
      uploadSaved: Boolean(attachment),
      emailConfigured: isEmailConfigured(),
      ownerEmailSent,
      requesterEmailSent,
      databaseConfigured: isDatabaseConfigured(),
      databaseSaved: submission.savedDatabase,
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "API endpoint not found." });
});

app.use(express.static(distDir));
app.use((_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError || error.message?.startsWith("Authorization upload must")) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Authorization upload must be 10MB or smaller." : error.message;
    res.status(400).json({ ok: false, error: message });
    return;
  }

  const status = error.status || 500;
  res.status(status).json({
    ok: false,
    error: status === 500 ? "Submission failed. Please try again." : error.message,
  });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`CareVault server listening at http://127.0.0.1:${port}`);
  console.log(`Submission notifications go to ${notificationTo}`);
  console.log(isEmailConfigured() ? `SMTP email notifications are enabled for ${process.env.SMTP_USER}.` : "SMTP is not configured; submissions will be stored without email.");
  if (isDatabaseConfigured()) {
    const dbInfo = getDatabaseInfo();
    console.log(`MSSQL storage is enabled. Server: ${dbInfo.server || "from connection string"}; Database: ${dbInfo.database || "from connection string"}.`);
  } else {
    console.log("MSSQL is not configured; submissions will be stored locally only.");
  }
  initializeDatabase();
});

function pick(source, keys) {
  return Object.fromEntries(keys.map((key) => [key, clean(source?.[key])]));
}

function clean(value) {
  if (Array.isArray(value)) return value.map(clean).join(", ");
  return String(value ?? "").trim();
}

function requireFields(payload, fields) {
  const missing = fields.filter((field) => !payload[field]);
  if (missing.length) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

function requireAtLeastOneField(payload, fields, label) {
  if (fields.some((field) => payload[field])) return;
  const error = new Error(`Missing required field: ${label}`);
  error.status = 400;
  throw error;
}

async function saveSubmission(type, payload, attachment = null) {
  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
  const submission = {
    id,
    type,
    receivedAt: now.toISOString(),
    payload,
    attachment,
  };
  const filePath = path.join(submissionsDir, `${id}.json`);
  await fs.writeFile(filePath, `${JSON.stringify(submission, null, 2)}\n`, "utf8");
  await fs.appendFile(path.join(submissionsDir, "submissions.jsonl"), `${JSON.stringify({ id, type, receivedAt: submission.receivedAt, filePath })}\n`, "utf8");

  const savedDatabase = await saveSubmissionToDatabase({ ...submission, filePath });
  return { id, filePath, savedLocal: true, savedDatabase };
}

function isEmailConfigured() {
  const password = String(process.env.SMTP_PASS || "").trim();
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && password && password !== "GMAIL_APP_PASSWORD_HERE");
}

function isDatabaseConfigured() {
  return Boolean(getDatabaseConnectionString());
}

function extractEmail(value) {
  const match = String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "";
}

function getEmailStatus(results) {
  const attempted = results.filter((result) => result !== null);
  return attempted.length > 0 && attempted.every(Boolean);
}

async function sendEmail({ to, subject, text }) {
  if (!isEmailConfigured() || !extractEmail(to)) return null;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false",
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 8000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 8000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 8000),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (error) {
    console.error(`Email send failed for ${to}:`, error.message);
    return false;
  }
}

async function saveSubmissionToDatabase(submission) {
  if (!isDatabaseConfigured()) return false;

  try {
    await ensureDatabaseTables();
    await queryDatabase(`
      INSERT INTO ${safeSqlIdentifier(submissionsTable)}
        (Id, SubmissionType, ReceivedAt, PayloadJson, AttachmentJson, LocalFilePath)
      VALUES
        (${sqlString(submission.id)},
         ${sqlString(submission.type)},
         ${sqlString(submission.receivedAt)},
         ${sqlString(JSON.stringify(submission.payload))},
         ${sqlString(submission.attachment ? JSON.stringify(submission.attachment) : null)},
         ${sqlString(submission.filePath)})
    `);
    await saveRequestToDatabase(submission);
    return true;
  } catch (error) {
    console.error("MSSQL submission save failed:", error.message);
    if (String(process.env.MSSQL_REQUIRE_SUCCESS || "false").toLowerCase() === "true") {
      throw error;
    }
    return false;
  }
}

function getDatabaseConnectionString() {
  const explicitConnectionString = String(process.env.CAREVAULT_MSSQL_CONNECTION_STRING || "").trim();
  if (explicitConnectionString) return explicitConnectionString;

  const server = String(process.env.DB_SERVER || "").trim();
  const database = String(process.env.DB_DATABASE || "CareVault").trim();
  if (!server || !database) return "";

  const driver = String(process.env.DB_DRIVER || "ODBC Driver 17 for SQL Server").trim();
  const trusted = String(process.env.DB_TRUSTED_CONNECTION || "yes").trim();
  const parts = [`Driver={${driver}}`, `Server=${server}`, `Database=${database}`, "Connection Timeout=5"];
  if (process.env.DB_USER && process.env.DB_PASSWORD) {
    parts.push(`Uid=${process.env.DB_USER}`, `Pwd=${process.env.DB_PASSWORD}`);
  } else {
    parts.push(`Trusted_Connection=${trusted}`);
  }
  if (process.env.DB_ENCRYPT) parts.push(`Encrypt=${process.env.DB_ENCRYPT}`);
  if (process.env.DB_TRUST_SERVER_CERTIFICATE) parts.push(`TrustServerCertificate=${process.env.DB_TRUST_SERVER_CERTIFICATE}`);
  return `${parts.join(";")};`;
}

async function initializeDatabase() {
  if (!isDatabaseConfigured()) return;

  try {
    await ensureDatabaseTables();
    await migrateExistingSubmissionsToRequests();
    console.log(`MSSQL table setup completed for ${getDatabaseInfo().server} / ${getDatabaseInfo().database}.`);
  } catch (error) {
    console.error("MSSQL table setup failed:", error.message);
  }
}

function getDatabaseInfo() {
  return {
    server: process.env.DB_SERVER || parseConnectionValue("Server") || null,
    database: process.env.DB_DATABASE || parseConnectionValue("Database") || null,
  };
}

function parseConnectionValue(key) {
  const connectionString = String(process.env.CAREVAULT_MSSQL_CONNECTION_STRING || "");
  const match = connectionString.match(new RegExp(`${key}=([^;]+)`, "i"));
  return match ? match[1] : "";
}

async function ensureDatabaseTables() {
  await queryDatabase(`
    IF OBJECT_ID(N'${submissionsTable.replace(/'/g, "''")}', N'U') IS NULL
    BEGIN
      CREATE TABLE ${safeSqlIdentifier(submissionsTable)} (
        Id NVARCHAR(100) NOT NULL PRIMARY KEY,
        SubmissionType NVARCHAR(50) NOT NULL,
        ReceivedAt DATETIME2 NOT NULL,
        PayloadJson NVARCHAR(MAX) NOT NULL,
        AttachmentJson NVARCHAR(MAX) NULL,
        LocalFilePath NVARCHAR(1024) NULL
      );
    END
  `);
  await queryDatabase(`
    IF OBJECT_ID(N'${requestsTable.replace(/'/g, "''")}', N'U') IS NULL
    BEGIN
      CREATE TABLE ${safeSqlIdentifier(requestsTable)} (
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
  `);
}

function safeSqlIdentifier(identifier) {
  const parts = String(identifier).split(".");
  if (!parts.every((part) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(part))) {
    throw new Error("Invalid MSSQL_SUBMISSIONS_TABLE value.");
  }
  return parts.map((part) => `[${part}]`).join(".");
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `N'${String(value).replace(/'/g, "''")}'`;
}

function queryDatabase(query) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutMs = Number(process.env.DB_QUERY_TIMEOUT_MS || 8000);
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`MSSQL query timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    odbcSql.query(getDatabaseConnectionString(), query, (error, rows) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) {
        reject(error);
        return;
      }
      resolve(rows);
    });
  });
}

async function saveRequestToDatabase(submission) {
  const payload = submission.payload || {};
  const attachment = submission.attachment || {};
  const requesterName = submission.type === "contact" ? payload.name : "";
  const requesterEmail = submission.type === "contact" ? payload.email : payload.requesterEmail;
  const phone = payload.phone || payload.contact || "";
  await queryDatabase(`
    IF NOT EXISTS (SELECT 1 FROM ${safeSqlIdentifier(requestsTable)} WHERE Id = ${sqlString(submission.id)})
    BEGIN
      INSERT INTO ${safeSqlIdentifier(requestsTable)}
        (Id, RequestType, Status, PatientName, DateOfBirth, RequesterName, RequesterEmail, Phone,
         Organization, Role, ProviderName, RecordType, Purpose, DeliveryPreference, ServiceInterested,
         Message, AuthorizationFileName, AuthorizationStoredName, AuthorizationPath, PayloadJson,
         LocalFilePath, CreatedAt, UpdatedAt)
      VALUES
        (${sqlString(submission.id)},
         ${sqlString(submission.type)},
         N'New',
         ${sqlString(payload.patientName)},
         ${sqlDate(payload.dateOfBirth)},
         ${sqlString(requesterName)},
         ${sqlString(requesterEmail)},
         ${sqlString(phone)},
         ${sqlString(payload.organization)},
         ${sqlString(payload.role)},
         ${sqlString(payload.provider)},
         ${sqlString(payload.recordType)},
         ${sqlString(payload.purpose)},
         ${sqlString(payload.delivery)},
         ${sqlString(payload.service)},
         ${sqlString(payload.message)},
         ${sqlString(attachment.originalName)},
         ${sqlString(attachment.storedName)},
         ${sqlString(attachment.path)},
         ${sqlString(JSON.stringify(payload))},
         ${sqlString(submission.filePath)},
         ${sqlString(submission.receivedAt)},
         ${sqlString(submission.receivedAt)})
    END
  `);
}

async function migrateExistingSubmissionsToRequests() {
  const rows = await queryDatabase(`
    SELECT
      s.Id,
      s.SubmissionType,
      s.ReceivedAt,
      s.PayloadJson,
      s.AttachmentJson,
      s.LocalFilePath
    FROM ${safeSqlIdentifier(submissionsTable)} s
    WHERE NOT EXISTS (
      SELECT 1 FROM ${safeSqlIdentifier(requestsTable)} r WHERE r.Id = s.Id
    )
  `);

  for (const row of rows) {
    await saveRequestToDatabase({
      id: row.Id,
      type: row.SubmissionType,
      receivedAt: formatDateValue(row.ReceivedAt),
      payload: parseJson(row.PayloadJson),
      attachment: parseJson(row.AttachmentJson),
      filePath: row.LocalFilePath,
    });
  }
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function sqlDate(value) {
  if (!value) return "NULL";
  return `TRY_CONVERT(date, ${sqlString(value)}, 23)`;
}

function formatDateValue(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
