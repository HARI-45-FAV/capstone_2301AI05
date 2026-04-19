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
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Course_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("code", "courseType", "createdAt", "credits", "id", "name", "semesterId", "updatedAt") SELECT "code", "courseType", "createdAt", "credits", "id", "name", "semesterId", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
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
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Professor" ("avatarUrl", "department", "email", "id", "instructorId", "interests", "name", "phone", "updatedAt", "userId") SELECT "avatarUrl", "department", "email", "id", "instructorId", "interests", "name", "phone", "updatedAt", "userId" FROM "Professor";
DROP TABLE "Professor";
ALTER TABLE "new_Professor" RENAME TO "Professor";
CREATE UNIQUE INDEX "Professor_instructorId_key" ON "Professor"("instructorId");
CREATE UNIQUE INDEX "Professor_email_key" ON "Professor"("email");
CREATE UNIQUE INDEX "Professor_userId_key" ON "Professor"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
