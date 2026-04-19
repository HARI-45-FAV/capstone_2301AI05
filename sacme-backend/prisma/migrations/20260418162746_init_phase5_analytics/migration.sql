-- CreateTable
CREATE TABLE "LeaderboardCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaderboardCache_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "avgScore" REAL NOT NULL DEFAULT 0,
    "highestScore" REAL NOT NULL DEFAULT 0,
    "lowestScore" REAL NOT NULL DEFAULT 0,
    "passRate" REAL NOT NULL DEFAULT 0,
    "failRate" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizAnalytics_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "difficultyIndex" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionAnalytics_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionBank" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardCache_quizId_studentId_key" ON "LeaderboardCache"("quizId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAnalytics_quizId_key" ON "QuizAnalytics"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAnalytics_questionId_key" ON "QuestionAnalytics"("questionId");
