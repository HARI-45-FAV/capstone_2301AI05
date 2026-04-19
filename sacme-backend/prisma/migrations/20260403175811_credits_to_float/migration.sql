/*
  Warnings:

  - You are about to alter the column `credits` on the `Course` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - Added the required column `updatedAt` to the `FacultyAdvisor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Professor` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "ipAddress" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "credits" REAL NOT NULL,
    "courseType" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("code", "courseType", "createdAt", "credits", "id", "name", "semesterId", "updatedAt") SELECT "code", "courseType", "createdAt", "credits", "id", "name", "semesterId", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
CREATE TABLE "new_FacultyAdvisor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "interests" TEXT,
    "userId" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FacultyAdvisor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FacultyAdvisor" ("department", "facultyId", "id", "name", "userId") SELECT "department", "facultyId", "id", "name", "userId" FROM "FacultyAdvisor";
DROP TABLE "FacultyAdvisor";
ALTER TABLE "new_FacultyAdvisor" RENAME TO "FacultyAdvisor";
CREATE UNIQUE INDEX "FacultyAdvisor_facultyId_key" ON "FacultyAdvisor"("facultyId");
CREATE UNIQUE INDEX "FacultyAdvisor_userId_key" ON "FacultyAdvisor"("userId");
CREATE TABLE "new_Professor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "interests" TEXT,
    "userId" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Professor" ("department", "email", "id", "instructorId", "name", "phone", "userId") SELECT "department", "email", "id", "instructorId", "name", "phone", "userId" FROM "Professor";
DROP TABLE "Professor";
ALTER TABLE "new_Professor" RENAME TO "Professor";
CREATE UNIQUE INDEX "Professor_instructorId_key" ON "Professor"("instructorId");
CREATE UNIQUE INDEX "Professor_email_key" ON "Professor"("email");
CREATE UNIQUE INDEX "Professor_userId_key" ON "Professor"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "account_status" TEXT NOT NULL DEFAULT 'NOT_REGISTERED',
    "activationToken" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" DATETIME,
    "otpHash" TEXT,
    "otpExpiresAt" DATETIME,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("account_status", "activationToken", "createdAt", "email", "failedLoginAttempts", "id", "lockoutUntil", "otpExpiresAt", "otpHash", "passwordHash", "passwordResetExpires", "passwordResetToken", "role", "updatedAt") SELECT "account_status", "activationToken", "createdAt", "email", "failedLoginAttempts", "id", "lockoutUntil", "otpExpiresAt", "otpHash", "passwordHash", "passwordResetExpires", "passwordResetToken", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_activationToken_key" ON "User"("activationToken");
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
