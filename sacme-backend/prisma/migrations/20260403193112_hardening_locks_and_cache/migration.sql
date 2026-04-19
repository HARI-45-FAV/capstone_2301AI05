-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" DATETIME,
    CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attendance_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("courseId", "date", "id", "status", "studentId") SELECT "courseId", "date", "id", "status", "studentId" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE INDEX "Attendance_courseId_date_idx" ON "Attendance"("courseId", "date");
CREATE INDEX "Attendance_courseId_studentId_idx" ON "Attendance"("courseId", "studentId");
CREATE INDEX "Attendance_studentId_courseId_idx" ON "Attendance"("studentId", "courseId");
CREATE INDEX "Attendance_courseId_idx" ON "Attendance"("courseId");
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");
CREATE UNIQUE INDEX "Attendance_studentId_courseId_date_key" ON "Attendance"("studentId", "courseId", "date");
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("assignmentId", "fileUrl", "id", "status", "studentId", "submittedAt") SELECT "assignmentId", "fileUrl", "id", "status", "studentId", "submittedAt" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE INDEX "Submission_assignmentId_idx" ON "Submission"("assignmentId");
CREATE INDEX "Submission_studentId_idx" ON "Submission"("studentId");
CREATE UNIQUE INDEX "Submission_assignmentId_studentId_key" ON "Submission"("assignmentId", "studentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
