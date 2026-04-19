-- CreateIndex
CREATE INDEX "Attendance_courseId_studentId_idx" ON "Attendance"("courseId", "studentId");

-- CreateIndex
CREATE INDEX "Attendance_courseId_idx" ON "Attendance"("courseId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "CourseAssignment_courseId_idx" ON "CourseAssignment"("courseId");

-- CreateIndex
CREATE INDEX "CourseAssignment_professorId_idx" ON "CourseAssignment"("professorId");

-- CreateIndex
CREATE INDEX "Submission_assignmentId_idx" ON "Submission"("assignmentId");

-- CreateIndex
CREATE INDEX "Submission_studentId_idx" ON "Submission"("studentId");
