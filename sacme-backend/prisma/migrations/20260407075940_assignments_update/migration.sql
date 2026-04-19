-- CreateTable
CREATE TABLE "DeadlineHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "oldDate" DATETIME NOT NULL,
    "newDate" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeadlineHistory_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssignmentFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    CONSTRAINT "AssignmentFile_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubmissionMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "SubmissionMember_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubmissionMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubmissionFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    CONSTRAINT "SubmissionFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssignmentQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reply" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssignmentQuery_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssignmentQuery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "maxMarks" REAL,
    "assignmentType" TEXT,
    "lateSubmissionDeadline" DATETIME,
    "weightage" REAL,
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
    "allowResubmission" BOOLEAN NOT NULL DEFAULT false,
    "submissionMode" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "autoCloseAfterDeadline" BOOLEAN NOT NULL DEFAULT true,
    "resultsVisible" BOOLEAN NOT NULL DEFAULT false,
    "resultsPublishedAt" DATETIME,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "visibleFrom" DATETIME,
    "visibleUntil" DATETIME,
    "maxFiles" INTEGER NOT NULL DEFAULT 5,
    CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("courseId", "description", "dueDate", "id", "maxMarks", "title") SELECT "courseId", "description", "dueDate", "id", "maxMarks", "title" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "title" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "isRead", "message", "userId") SELECT "createdAt", "id", "isRead", "message", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" DATETIME,
    "marks" REAL,
    "feedback" TEXT,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("assignmentId", "fileUrl", "id", "status", "studentId", "submittedAt", "version") SELECT "assignmentId", "fileUrl", "id", "status", "studentId", "submittedAt", "version" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE INDEX "Submission_assignmentId_idx" ON "Submission"("assignmentId");
CREATE INDEX "Submission_studentId_idx" ON "Submission"("studentId");
CREATE UNIQUE INDEX "Submission_assignmentId_studentId_key" ON "Submission"("assignmentId", "studentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionMember_submissionId_studentId_key" ON "SubmissionMember"("submissionId", "studentId");

-- CreateIndex
CREATE INDEX "AssignmentQuery_assignmentId_idx" ON "AssignmentQuery"("assignmentId");

-- CreateIndex
CREATE INDEX "AssignmentQuery_studentId_idx" ON "AssignmentQuery"("studentId");
