const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { notifyCourseStudents } = require('./notificationHelper');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

exports.createAssignment = async (req, res) => {
    try {
        const { courseId, title, description, dueDate, maxMarks, assignmentType, lateSubmissionDeadline, weightage, allowLateSubmission, allowResubmission, submissionMode, autoCloseAfterDeadline, resultsVisible, isPublished, visibleFrom, visibleUntil } = req.body;
        
        if (!courseId || !title || !dueDate) {
            return res.status(400).json({ error: 'Missing required configuration for assignment' });
        }

        const assignment = await prisma.assignment.create({
            data: {
                courseId,
                title,
                description: description || '',
                dueDate: new Date(dueDate),
                maxMarks: maxMarks ? parseFloat(maxMarks) : null,
                assignmentType,
                lateSubmissionDeadline: lateSubmissionDeadline ? new Date(lateSubmissionDeadline) : null,
                weightage: weightage ? parseFloat(weightage) : null,
                allowLateSubmission: allowLateSubmission === 'true' || allowLateSubmission === true,
                allowResubmission: allowResubmission === 'true' || allowResubmission === true,
                submissionMode: submissionMode || 'INDIVIDUAL',
                autoCloseAfterDeadline: autoCloseAfterDeadline === 'true' || autoCloseAfterDeadline === true,
                resultsVisible: resultsVisible === 'true' || resultsVisible === true,
                isPublished: isPublished === 'true' || isPublished === true,
                visibleFrom: visibleFrom ? new Date(visibleFrom) : null,
                visibleUntil: visibleUntil ? new Date(visibleUntil) : null
            }
        });

        // Add files
        if (req.files && req.files.length > 0) {
            const fileData = req.files.map(f => ({
                assignmentId: assignment.id,
                fileUrl: `/public/uploads/${f.filename}`,
                fileName: f.originalname,
                fileType: path.extname(f.originalname).replace('.', '').toUpperCase()
            }));
            await prisma.assignmentFile.createMany({ data: fileData });
        }
        
        // Add Link files if provided
        if (req.body.links) {
            let links = Array.isArray(req.body.links) ? req.body.links : JSON.parse(req.body.links);
            const linkData = links.map(l => ({
                assignmentId: assignment.id,
                fileUrl: l.url,
                fileName: l.name || 'Drive Link',
                fileType: 'LINK'
            }));
            await prisma.assignmentFile.createMany({ data: linkData });
        }

        if (assignment.isPublished) {
            await notifyCourseStudents(courseId, `📢 New Assignment Added: ${title}`);
        }

        res.status(201).json({ message: 'Assignment Created successfully', assignment });
    } catch (error) {
        console.error('Create Assignment Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.updateAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { title, description, dueDate, maxMarks, assignmentType, lateSubmissionDeadline, weightage, allowLateSubmission, allowResubmission, submissionMode, autoCloseAfterDeadline, resultsVisible, isPublished, visibleFrom, visibleUntil } = req.body;
        
        const existing = await prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!existing) return res.status(404).json({ error: 'Assignment not found' });

        const updated = await prisma.assignment.update({
            where: { id: assignmentId },
            data: {
                title,
                description: description || existing.description,
                dueDate: new Date(dueDate),
                maxMarks: maxMarks ? parseFloat(maxMarks) : null,
                assignmentType: assignmentType || existing.assignmentType,
                lateSubmissionDeadline: lateSubmissionDeadline ? new Date(lateSubmissionDeadline) : null,
                weightage: weightage ? parseFloat(weightage) : null,
                allowLateSubmission: allowLateSubmission === 'true' || allowLateSubmission === true,
                allowResubmission: allowResubmission === 'true' || allowResubmission === true,
                submissionMode: submissionMode || existing.submissionMode,
                autoCloseAfterDeadline: autoCloseAfterDeadline === 'true' || autoCloseAfterDeadline === true,
                resultsVisible: resultsVisible === 'true' || resultsVisible === true,
                isPublished: isPublished === 'true' || isPublished === true,
                visibleFrom: visibleFrom ? new Date(visibleFrom) : null,
                visibleUntil: visibleUntil ? new Date(visibleUntil) : null
            }
        });

        // Add new files (append)
        if (req.files && req.files.length > 0) {
            const fileData = req.files.map(f => ({
                assignmentId: assignmentId,
                fileUrl: `/public/uploads/${f.filename}`,
                fileName: f.originalname,
                fileType: path.extname(f.originalname).replace('.', '').toUpperCase()
            }));
            await prisma.assignmentFile.createMany({ data: fileData });
        }
        
        let changedDate = existing.dueDate.getTime() !== new Date(dueDate).getTime();
        let changedMode = (existing.submissionMode !== submissionMode) && submissionMode;
        
        if (updated.isPublished) {
            if (changedDate || changedMode) {
                await notifyCourseStudents(existing.courseId, `📢 Assignment Updated: ${title}. ${changedMode ? 'Mode changed to ' + submissionMode + '.' : ''} Please review changes.`);
            }
        }

        res.status(200).json({ message: 'Assignment Updated successfully', assignment: updated });
    } catch (error) {
        console.error('Update Assignment Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.updateTimeline = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { newDueDate, reason } = req.body;
        if (!newDueDate || !reason) return res.status(400).json({error: "newDueDate and reason required"});

        const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment) return res.status(404).json({error: "Assignment not found"});

        await prisma.$transaction([
            prisma.deadlineHistory.create({
                data: { assignmentId, oldDate: assignment.dueDate, newDate: new Date(newDueDate), reason }
            }),
            prisma.assignment.update({
                where: { id: assignmentId },
                data: { dueDate: new Date(newDueDate) }
            })
        ]);

        await notifyCourseStudents(assignment.courseId, `⏳ Deadline Extended for ${assignment.title}: ${reason}`);

        res.json({ message: "Timeline updated successfully" });
    } catch (error) {
        console.error("Timeline Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.uploadCsvGrades = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No CSV file provided' });
        const { assignmentId } = req.params;
        const { resultsVisible } = req.body;
        
        const updates = [];
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (row) => {
                if (row.RollNo && row.Marks) {
                    updates.push({ rollNo: row.RollNo, marks: parseFloat(row.Marks), feedback: row.Feedback || '' });
                }
            })
            .on('end', async () => {
                let successCount = 0;
                for (const u of updates) {
                    const student = await prisma.student.findFirst({ where: { rollNo: u.rollNo } });
                    if (student) {
                        try {
                            const sub = await prisma.submission.findUnique({ where: { assignmentId_studentId: { assignmentId, studentId: student.id } } });
                            if (sub) {
                                await prisma.submission.update({
                                    where: { id: sub.id },
                                    data: { marks: u.marks, feedback: u.feedback, status: "GRADED" }
                                });
                                successCount++;
                            }
                        } catch(e) {}
                    }
                }
                
                const isVis = resultsVisible === 'true' || resultsVisible === true;
                await prisma.assignment.update({
                    where: { id: assignmentId },
                    data: { resultsVisible: isVis, resultsPublishedAt: isVis ? new Date() : null }
                });

                res.json({ message: `CSV processed. ${successCount} grades updated.` });
            });
    } catch (error) {
        console.error("Upload CSV Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { id, role } = req.user;

        const assignments = await prisma.assignment.findMany({
            where: { courseId },
            orderBy: { dueDate: 'asc' },
            include: {
                submissions: { include: { student: true, files: true, members: { include: { student: true } } } },
                files: true,
                deadlineHistory: true
            }
        });
        
        let processedAssignments = assignments;
        if (role === 'STUDENT') {
            const student = await prisma.student.findUnique({ where: { userId: id } });
            processedAssignments = assignments.filter(a => a.isPublished).map(a => {
                let sub = a.submissions.find(s => s.studentId === student?.id);
                if (!sub) {
                    sub = a.submissions.find(s => s.members.some(m => m.studentId === student?.id));
                }
                
                let studentStatus = 'PENDING';
                if (sub) studentStatus = sub.status;
                else if (new Date() > new Date(a.dueDate)) studentStatus = 'LATE';
                
                return {
                    id: a.id,
                    title: a.title,
                    description: a.description,
                    dueDate: a.dueDate,
                    maxMarks: a.maxMarks,
                    assignmentType: a.assignmentType,
                    weightage: a.weightage,
                    submissionMode: a.submissionMode,
                    allowLateSubmission: a.allowLateSubmission,
                    allowResubmission: a.allowResubmission,
                    files: a.files,
                    studentStatus,
                    submissionDate: sub ? sub.submittedAt : null,
                    marks: (a.resultsVisible && sub) ? sub.marks : null,
                    feedback: (a.resultsVisible && sub) ? sub.feedback : null,
                    submittedFiles: sub ? sub.files : []
                };
            });
        }

        res.status(200).json({ assignments: processedAssignments });
    } catch (error) {
        console.error('Get Assignments Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.uploadSubmission = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { teamMembers } = req.body; 

        const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
        if (!student) return res.status(403).json({ error: 'Unauthorized payload access' });

        const assignment = await prisma.assignment.findUnique({ 
            where: { id: assignmentId },
            include: { course: { include: { courseAssignments: { include: { professor: true } } } } }
        });
        if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

        if (!assignment.allowLateSubmission && new Date() > new Date(assignment.dueDate)) {
             if (assignment.autoCloseAfterDeadline) return res.status(400).json({ error: 'Submissions are closed.' });
        }

        const now = new Date();
        const isLate = now > new Date(assignment.dueDate);
        const status = isLate ? "LATE" : "SUBMITTED";

        const existingSubmission = await prisma.submission.findUnique({
            where: { assignmentId_studentId: { assignmentId, studentId: student.id } }
        });
        
        if (existingSubmission && !assignment.allowResubmission) {
            return res.status(400).json({ error: 'Resubmission not allowed' });
        }

        const newVersion = existingSubmission ? existingSubmission.version + 1 : 1;

        let firstFileUrl = existingSubmission ? existingSubmission.fileUrl : null;
        if (req.files && req.files.length > 0) {
            firstFileUrl = `/public/uploads/${req.files[0].filename}`;
        }

        const submission = await prisma.submission.upsert({
            where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
            update: { status, version: newVersion, submittedAt: now, isLate, ...(firstFileUrl && { fileUrl: firstFileUrl }) },
            create: { assignmentId, studentId: student.id, status, version: newVersion, submittedAt: now, isLate, fileUrl: firstFileUrl }
        });

        if (req.files && req.files.length > 0) {
            await prisma.submissionFile.deleteMany({ where: { submissionId: submission.id } });
            const fileData = req.files.map(f => ({
                submissionId: submission.id,
                fileUrl: `/public/uploads/${f.filename}`,
                fileName: f.originalname
            }));
            await prisma.submissionFile.createMany({ data: fileData });
        }

        if (assignment.submissionMode === 'GROUP' && teamMembers) {
            let membersArray = [];
            try { membersArray = JSON.parse(teamMembers); } catch(e) { membersArray = teamMembers; }
            if (Array.isArray(membersArray)) {
                for (const roll of membersArray) {
                    const memberStudent = await prisma.student.findFirst({ where: { rollNo: roll } });
                    if (memberStudent) {
                        try {
                            await prisma.submissionMember.upsert({
                                where: { submissionId_studentId: { submissionId: submission.id, studentId: memberStudent.id } },
                                update: {},
                                create: { submissionId: submission.id, studentId: memberStudent.id }
                            });
                        } catch(e) { console.error(e) }
                    }
                }
            }
        }

        console.log("Submission saved:", submission.id);

        try {
            const courseAssignment = assignment.course?.courseAssignments?.[0];
            if (courseAssignment && courseAssignment.professor && courseAssignment.professor.userId) {
                const notification = await prisma.notification.create({
                    data: {
                        userId: courseAssignment.professor.userId,
                        type: "SUBMISSION_DONE",
                        title: "New Submission",
                        message: `New submission received from ${student.name} for ${assignment.title}`,
                        linkUrl: `/professor/dashboard?courseId=${assignment.courseId}&assignmentId=${assignmentId}`
                    }
                });
                console.log("Notification created:", notification.id);
            }
        } catch (notifErr) { console.error('Failed to drop notification:', notifErr); }

        res.status(201).json({ message: 'Submission uploaded', submission });
    } catch (error) {
        console.error('Upload Submission Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.raiseQuery = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { subject, message } = req.body;
        const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
        if(!student) return res.status(403).json({ error: "Unauthorized" });

        const query = await prisma.assignmentQuery.create({
            data: { assignmentId, studentId: student.id, subject, message, status: "OPEN" }
        });
        res.status(201).json({ message: "Query raised successfully", query });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.replyQuery = async (req, res) => {
    try {
        const { queryId } = req.params;
        const { reply, status } = req.body;
        const query = await prisma.assignmentQuery.update({
            where: { id: queryId },
            data: { reply, status: status || "RESOLVED" },
            include: { student: { include: { user: true } } }
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: query.student.userId,
                type: 'QUERY_RAISED',
                title: 'Query Reply Received',
                message: `Your query regarding assignment has been ${status.toLowerCase()}.`
            }
        });

        res.json({ message: "Replied successfully", query });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

const archiver = require("archiver");

exports.downloadAllSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const submissions = await prisma.submission.findMany({
            where: { assignmentId },
            include: {
                members: { include: { student: true } },
                student: true,
                assignment: true
            }
        });

        if (!submissions.length) {
            return res.status(404).json({ error: "No submissions found to export" });
        }

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename=Assignment_${assignmentId}_Submissions.zip`);

        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.pipe(res);

        for (const submission of submissions) {
            if (!submission.fileUrl) continue;
            
            // Format file paths securely avoiding absolute OS dependencies
            const filePath = path.join(__dirname, '..', submission.fileUrl.startsWith('/public') ? submission.fileUrl : `/public/uploads/${submission.fileUrl.split('/').pop()}`);

            if (!fs.existsSync(filePath)) {
                console.warn("Attempting ZIP stream but file was missing from system:", filePath);
                continue;
            }

            // Create deduplicated member list names cleanly
            const isGroup = submission.members && submission.members.length > 0;
            let memberNames = "Anonymous";
            if (isGroup) {
                // Prepend original submitter and concatenate all associated members
                memberNames = [submission.student.name, ...submission.members.map(m => m.student.name)].join("_").replace(/\s+/g, '');
            } else {
                memberNames = submission.student.name.replace(/\s+/g, '');
            }

            const assignmentName = submission.assignment.title.replace(/\s+/g, "_");
            const ext = path.extname(filePath);
            const zipFileName = `${isGroup ? 'GroupOf' : 'Individual'}_${memberNames}_${assignmentName}${ext}`;

            archive.file(filePath, { name: zipFileName });
        }

        await archive.finalize();
    } catch (error) {
        console.error("ZIP Bulk Export Error:", error);
        // Only safely send a 500 JSON if the response hasn't already been started and piped!
        if (!res.headersSent) res.status(500).json({ error: "Failed to create submission ZIP package." });
    }
};
