IF DB_ID(N'CareVault') IS NULL
BEGIN
  CREATE DATABASE [CareVault];
END
GO

USE [CareVault];
GO

IF OBJECT_ID(N'dbo.CareVaultSubmissions', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CareVaultSubmissions (
    Id NVARCHAR(100) NOT NULL PRIMARY KEY,
    SubmissionType NVARCHAR(50) NOT NULL,
    ReceivedAt DATETIME2 NOT NULL,
    PayloadJson NVARCHAR(MAX) NOT NULL,
    AttachmentJson NVARCHAR(MAX) NULL,
    LocalFilePath NVARCHAR(1024) NULL
  );
END
GO

IF OBJECT_ID(N'dbo.CareVaultRequests', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CareVaultRequests (
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
GO
