-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuizSubmission" (
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
    "analyticsProcessed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "QuizSubmission_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuizSubmission" ("attemptMode", "grade", "id", "isAutoSubmit", "percentage", "quizId", "score", "startedAt", "status", "studentId", "submittedAt", "terminationReason", "violations") SELECT "attemptMode", "grade", "id", "isAutoSubmit", "percentage", "quizId", "score", "startedAt", "status", "studentId", "submittedAt", "terminationReason", "violations" FROM "QuizSubmission";
DROP TABLE "QuizSubmission";
ALTER TABLE "new_QuizSubmission" RENAME TO "QuizSubmission";
CREATE UNIQUE INDEX "QuizSubmission_quizId_studentId_key" ON "QuizSubmission"("quizId", "studentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
