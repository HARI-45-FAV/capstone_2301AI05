-- CreateTable
CREATE TABLE "User" (
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
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FacultyAdvisor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "FacultyAdvisor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Professor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rollNo" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "branchId" TEXT,
    "semesterId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'SUPER',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Institute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collegeName" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "address" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "totalSemesters" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "semesterNumber" INTEGER NOT NULL,
    "semesterType" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "academicYearId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Semester_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemesterFacultyMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "semesterId" TEXT NOT NULL,
    "facultyAdvisorId" TEXT NOT NULL,
    CONSTRAINT "SemesterFacultyMapping_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SemesterFacultyMapping_facultyAdvisorId_fkey" FOREIGN KEY ("facultyAdvisorId") REFERENCES "FacultyAdvisor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "courseType" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    CONSTRAINT "CourseAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CourseAssignment_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attachment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_activationToken_key" ON "User"("activationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyAdvisor_facultyId_key" ON "FacultyAdvisor"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyAdvisor_userId_key" ON "FacultyAdvisor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_instructorId_key" ON "Professor"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_email_key" ON "Professor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_userId_key" ON "Professor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNo_key" ON "Student"("rollNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_adminId_key" ON "Admin"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SemesterFacultyMapping_semesterId_facultyAdvisorId_key" ON "SemesterFacultyMapping"("semesterId", "facultyAdvisorId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CourseAssignment_courseId_professorId_key" ON "CourseAssignment"("courseId", "professorId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketId_key" ON "Ticket"("ticketId");
