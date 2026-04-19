/*
  Warnings:

  - Added the required column `materialType` to the `CourseMaterial` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedBy` to the `CourseMaterial` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekNumber` to the `CourseMaterial` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Student_rollNo_key";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "linkUrl" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MCQ',
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "marks" REAL NOT NULL DEFAULT 1.0,
    "negativeMarks" REAL NOT NULL DEFAULT 0.0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionBank" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalMarks" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startTime" DATETIME,
    "endTime" DATETIME,
    "createdBy" TEXT NOT NULL,
    "allowLate" BOOLEAN NOT NULL DEFAULT false,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuizQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionBank" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "score" REAL,
    "percentage" REAL,
    "violations" INTEGER NOT NULL DEFAULT 0,
    "isAutoSubmit" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "grade" TEXT,
    "terminationReason" TEXT,
    "attemptMode" TEXT NOT NULL DEFAULT 'NORMAL',
    CONSTRAINT "QuizSubmission_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOption" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "marksObtained" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "QuizAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "QuizSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ViolationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    CONSTRAINT "ViolationLog_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CourseMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "linkUrl" TEXT,
    "fileName" TEXT,
    "materialType" TEXT NOT NULL,
    "weekNumber" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseMaterial_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CourseMaterial" ("courseId", "fileUrl", "id", "title") SELECT "courseId", "fileUrl", "id", "title" FROM "CourseMaterial";
DROP TABLE "CourseMaterial";
ALTER TABLE "new_CourseMaterial" RENAME TO "CourseMaterial";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_quizId_questionId_key" ON "QuizQuestion"("quizId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizSubmission_quizId_studentId_key" ON "QuizSubmission"("quizId", "studentId");
