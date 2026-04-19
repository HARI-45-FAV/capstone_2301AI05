const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==========================================
// QUESTION BANK CONTROLS
// ==========================================

exports.createQuestion = async (req, res) => {
    try {
        const { courseId, questionText, type, difficulty, marks, negativeMarks, options } = req.body;
        
        // options should be an array of { optionText: String, isCorrect: Boolean }
        
        const question = await prisma.questionBank.create({
            data: {
                courseId,
                questionText,
                type: type || 'MCQ',
                difficulty: difficulty || 'MEDIUM',
                marks: parseFloat(marks) || 1.0,
                negativeMarks: parseFloat(negativeMarks) || 0.0,
                createdBy: req.user.id,
                options: {
                    create: options.map(opt => ({
                        optionText: opt.optionText,
                        isCorrect: opt.isCorrect
                    }))
                }
            },
            include: { options: true }
        });

        res.status(201).json({ message: "Question Bank populated", question });
    } catch (e) {
        console.error("Create Question Error:", e);
        res.status(500).json({ error: "Server Error establishing question." });
    }
};

exports.getQuestionBank = async (req, res) => {
    try {
        const { courseId } = req.params;
        const questions = await prisma.questionBank.findMany({
            where: { courseId },
            include: { options: true }
        });
        res.status(200).json({ questions });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server Error fetching questions." });
    }
};

// ==========================================
// QUIZ CORE CONTROLS
// ==========================================

exports.createQuiz = async (req, res) => {
    try {
        const { title, courseId, duration, allowLate, shuffleQuestions, shuffleOptions, maxAttempts, selectedQuestionIds } = req.body;
        
        // selectedQuestionIds is an array of QuestionBank IDs to link

        const questionsData = await prisma.questionBank.findMany({
            where: { id: { in: selectedQuestionIds } }
        });

        const totalMarks = questionsData.reduce((sum, q) => sum + q.marks, 0);

        const quiz = await prisma.quiz.create({
            data: {
                title,
                courseId,
                duration: parseInt(duration),
                totalMarks,
                allowLate: allowLate || false,
                shuffleQuestions: shuffleQuestions !== undefined ? shuffleQuestions : true,
                shuffleOptions: shuffleOptions !== undefined ? shuffleOptions : true,
                maxAttempts: parseInt(maxAttempts) || 1,
                createdBy: req.user.id,
                questions: {
                    create: selectedQuestionIds.map(qid => ({
                        questionId: qid
                    }))
                }
            },
            include: { questions: { include: { question: { include: { options: true } } } } }
        });

        res.status(201).json({ message: "Quiz configured successfully.", quiz });
    } catch (e) {
        console.error("Create Quiz Error:", e);
        res.status(500).json({ error: "Server Error compiling Quiz Engine." });
    }
};

exports.createMockQuiz = async (req, res) => {
    try {
        const { courseId } = req.body;
        if (!courseId) return res.status(400).json({ error: "courseId required" });

        const mockQuestions = [
            { text: "OSI Layer 3 is?", options: ["Network", "Transport", "Session", "Physical"], correctIndex: 0 },
            { text: "TCP stands for?", options: ["Transmission Control Protocol", "Transfer Control Path", "Transport Core Protocol", "Terminal Control Process"], correctIndex: 0 },
            { text: "Which protocol operates at the Application layer?", options: ["HTTP", "IP", "TCP", "Ethernet"], correctIndex: 0 },
            { text: "What is the standard port for HTTPS?", options: ["443", "80", "22", "53"], correctIndex: 0 },
            { text: "IPv4 addresses are how many bits long?", options: ["32", "64", "128", "256"], correctIndex: 0 },
            { text: "Which device operates at Layer 2?", options: ["Switch", "Router", "Hub", "Gateway"], correctIndex: 0 },
            { text: "What protocol resolves IP addresses to MAC addresses?", options: ["ARP", "DNS", "DHCP", "ICMP"], correctIndex: 0 },
            { text: "Which of the following is a private IP address?", options: ["192.168.1.1", "8.8.8.8", "172.64.1.1", "11.0.0.1"], correctIndex: 0 },
            { text: "What does DNS stand for?", options: ["Domain Name System", "Digital Network Service", "Dynamic Network Setup", "Data Node Standard"], correctIndex: 0 },
            { text: "Which protocol is connectionless?", options: ["UDP", "TCP", "SPX", "FTP"], correctIndex: 0 }
        ];

        const createdQuestions = [];
        for (const q of mockQuestions) {
             const created = await prisma.questionBank.create({
                 data: {
                     courseId,
                     questionText: q.text,
                     type: 'MCQ',
                     difficulty: 'MEDIUM',
                     marks: 1.0,
                     negativeMarks: 0.0,
                     createdBy: req.user.id,
                     options: {
                         create: q.options.map((opt, i) => ({
                             optionText: opt,
                             isCorrect: i === q.correctIndex
                         }))
                     }
                 }
             });
             createdQuestions.push(created.id);
        }

        const quiz = await prisma.quiz.create({
            data: {
                title: "Mock System Validation Quiz",
                courseId,
                duration: 30,
                totalMarks: 10.0,
                status: "READY",
                createdBy: req.user.id,
                questions: {
                    create: createdQuestions.map((qid, idx) => ({ orderIndex: idx, questionId: qid }))
                }
            }
        });

        res.status(201).json({ message: "Mock test assembled.", quiz });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server failed to bundle mock test." });
    }
};

exports.getCourseQuizzes = async (req, res) => {
    try {
        const { courseId } = req.params;
        const isStudent = req.user.role === 'STUDENT';

        // Students only see READY or STARTED quizzes; professors see all
        const whereClause = { courseId };
        if (isStudent) {
            whereClause.status = { in: ['READY', 'STARTED'] };
        }

        const quizzes = await prisma.quiz.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { 
                _count: { select: { submissions: true, questions: true } }
            }
        });
        res.status(200).json({ quizzes });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server Error fetching quizzes." });
    }
};

exports.getQuizDetails = async (req, res) => {
    try {
        const { quizId } = req.params;
        const isStudent = req.user.role === 'STUDENT';

        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: {
                    include: { 
                        question: { 
                            include: { 
                                options: {
                                    select: {
                                        id: true,
                                        optionText: true,
                                        // Only send isCorrect to non-students
                                        ...(isStudent ? {} : { isCorrect: true })
                                    }
                                }
                            } 
                        } 
                    }
                }
            }
        });

        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        res.status(200).json({ quiz });
    } catch (e) {
        console.error("Fetch Quiz Details:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Lightweight status-only endpoint for frontend polling fallback
exports.getQuizStatus = async (req, res) => {
    try {
        const { quizId } = req.params;
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            select: { id: true, status: true, startTime: true, duration: true }
        });
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });
        res.status(200).json({ status: quiz.status, startTime: quiz.startTime, duration: quiz.duration });
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
};

exports.changeQuizStatus = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { status } = req.body; // READY, STARTED, ENDED

        // Check bounds
        const validStatuses = ['DRAFT', 'READY', 'STARTED', 'ENDED'];
        if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status lock" });

        const updateData = { status };
        if (status === 'STARTED') updateData.startTime = new Date();
        if (status === 'ENDED') updateData.endTime = new Date();

        const quiz = await prisma.quiz.update({
            where: { id: quizId },
            data: updateData
        });

        if (status === 'ENDED' && !quiz.leaderboardGenerated) {
            await rebuildAnalytics(quizId);
            await prisma.quiz.update({
                where: { id: quizId },
                data: { leaderboardGenerated: true }
            });
            console.log("Leaderboard generated");
        }

        // 🟢 FIRE REAL-TIME SOCKET BINDING 🟢
        const io = req.app.get('io');
        if (io) {
            io.to(`quiz_${quizId}`).emit(`quiz_status_change`, { quizId, newStatus: status, startTime: updateData.startTime });
            console.log(`[Socket Broadcast] Quiz ${quizId} status changed to ${status}`);
        }

        res.status(200).json({ message: `Quiz officially shifted to ${status}`, quiz });
    } catch (e) {
        console.error("Quiz Status Update Error:", e);
        res.status(500).json({ error: "Internal Server Error mapping runtime constraints." });
    }
};

// ==========================================
// STUDENT EXECUTION (MVP PHASE 1)
// ==========================================

exports.submitQuiz = async (req, res) => {
    try {
        let { quizId, responses, isAutoSubmit, terminationReason } = req.body;
        
        // Resolve Student record from the logged-in User
        const studentRecord = await prisma.student.findFirst({ where: { userId: req.user.id }, include: { user: true } });
        if (!studentRecord) return res.status(403).json({ error: 'No student profile linked to this account.' });

        let score = 0;
        let evaluatedAnswers = [];

        for (const resp of responses) {
            const questionData = await prisma.questionBank.findUnique({
                where: { id: resp.questionId },
                include: { options: true }
            });

            if (!questionData) continue;

            let isAnswerCorrect = false;
            let marksObtained = 0.0;

            if (!resp.selectedOptionId || resp.selectedOptionId === "SKIPPED") {
                 score += 0;
            } else {
                const correctOption = questionData.options.find(opt => opt.isCorrect);
                isAnswerCorrect = correctOption && correctOption.id === resp.selectedOptionId;

                if (isAnswerCorrect) {
                     marksObtained = questionData.marks;
                     score += questionData.marks;
                } else {
                     marksObtained = -Math.abs(questionData.negativeMarks || 0);
                     score += marksObtained;
                }
            }

            evaluatedAnswers.push({
                questionId: resp.questionId,
                selectedOption: resp.selectedOptionId || "SKIPPED",
                isCorrect: isAnswerCorrect,
                marksObtained
            });
        } // end for loop

        const quizData = await prisma.quiz.findUnique({ where: { id: quizId } });
        if (!quizData) return res.status(404).json({ error: "Quiz not found" });

        if (quizData.startTime && quizData.duration) {
             const endTime = new Date(quizData.startTime);
             endTime.setMinutes(endTime.getMinutes() + quizData.duration);
             // 15 seconds network grace period
             endTime.setSeconds(endTime.getSeconds() + 15);
             
             if (new Date() > endTime) {
                  isAutoSubmit = true;
                  terminationReason = 'TIMEOUT';
             }
        }

        const percentage = quizData.totalMarks > 0 ? (Math.max(0, score) / quizData.totalMarks) * 100 : 0;
        
        let grade = "F";
        if (percentage >= 90) grade = "A";
        else if (percentage >= 80) grade = "B";
        else if (percentage >= 70) grade = "C";

        const existing = await prisma.quizSubmission.findUnique({
            where: { quizId_studentId: { quizId, studentId: studentRecord.id } }
        });

        if (existing && existing.status === 'SUBMITTED') {
             return res.status(403).json({ error: "Multiple final submissions are not allowed." });
        }

        const finalTermination = terminationReason || (isAutoSubmit ? 'TIMEOUT' : 'MANUAL_SUBMIT');

        let subRecord;
        if (existing) {
            await prisma.quizAnswer.deleteMany({ where: { submissionId: existing.id } });
            subRecord = await prisma.quizSubmission.update({
                where: { id: existing.id },
                data: { score, percentage, grade, status: 'SUBMITTED', submittedAt: new Date(), isAutoSubmit: isAutoSubmit || false, terminationReason: finalTermination,
                         answers: { create: evaluatedAnswers } }
            });
        } else {
            subRecord = await prisma.quizSubmission.create({
                data: { quizId, studentId: studentRecord.id, score, percentage, grade, status: 'SUBMITTED',
                         submittedAt: new Date(), isAutoSubmit: isAutoSubmit || false, terminationReason: finalTermination,
                         answers: { create: evaluatedAnswers } }
            });
        }

        // Leaderboard generation shifted to changeQuizStatus when quiz ends.

        const lbRecord = await prisma.leaderboardCache.findUnique({
             where: { quizId_studentId: { quizId, studentId: studentRecord.id } }
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`quiz_${quizId}`).emit('student_submitted', { studentId: studentRecord.id, name: studentRecord.user?.name || 'Unknown', score, percentage, rank: lbRecord?.rank, terminationReason: finalTermination });
        }

        res.status(201).json({ message: "Quiz evaluated successfully.", score, percentage, rank: lbRecord?.rank });
    } catch (error) {
        console.error("Quiz Submission Error:", error);
        res.status(500).json({ error: "Failed to evaluate answers server-side." });
    }
};

exports.autoSaveQuiz = async (req, res) => {
    try {
        const { quizId, responses } = req.body;
        
        // Resolve student record from User
        const studentRecord = await prisma.student.findFirst({ where: { userId: req.user.id } });
        if (!studentRecord) return res.status(403).json({ error: 'No student profile linked.' });

        const evaluatedAnswers = responses.map((r) => ({
            questionId: r.questionId,
            selectedOption: r.selectedOptionId || "SKIPPED"
        }));

        let submission = await prisma.quizSubmission.findUnique({
            where: { quizId_studentId: { quizId, studentId: studentRecord.id } }
        });

        if (!submission) {
            submission = await prisma.quizSubmission.create({
                data: { quizId, studentId: studentRecord.id, status: 'IN_PROGRESS', startedAt: new Date() }
            });
        } else if (submission.status === 'SUBMITTED') {
            return res.status(403).json({ error: "Cannot autosave after submission." });
        }

        await prisma.quizAnswer.deleteMany({ where: { submissionId: submission.id } });
        
        if (evaluatedAnswers.length > 0) {
            await prisma.quizAnswer.createMany({
                data: evaluatedAnswers.map(ans => ({ ...ans, submissionId: submission.id }))
            });
        }

        res.status(200).json({ message: "Autosaved cleanly." });
    } catch(e) {
        console.error("Autosave Crash:", e);
        res.status(500).json({ error: "Server constraints blocked ping" });
    }
}

exports.getLatestAutosave = async (req, res) => {
    try {
        const { quizId } = req.params;
        const studentRecord = await prisma.student.findFirst({ where: { userId: req.user.id } });
        if (!studentRecord) return res.status(403).json({ error: 'No student profile.' });

        const submission = await prisma.quizSubmission.findUnique({
            where: { quizId_studentId: { quizId, studentId: studentRecord.id } },
            include: { answers: true }
        });

        if (!submission) return res.status(200).json({ responses: {} });

        const formatted = {};
        submission.answers.forEach(ans => {
            formatted[ans.questionId] = ans.selectedOption;
        });

        res.status(200).json({ responses: formatted, violations: submission.violations });
    } catch(e) {
        console.error("Restore Crash:", e);
        res.status(500).json({ error: "Server restore failed." });
    }
}

exports.logViolation = async (req, res) => {
    try {
        const { quizId, type } = req.body;
        const studentRecord = await prisma.student.findFirst({ where: { userId: req.user.id } });
        if (!studentRecord) return res.status(403).json({ error: 'Not authorized.' });

        const existing = await prisma.quizSubmission.findUnique({
             where: { quizId_studentId: { quizId, studentId: studentRecord.id } }
        });
        
        let vCount = 1;
        if (existing) {
             const updated = await prisma.quizSubmission.update({
                  where: { id: existing.id },
                  data: { violations: { increment: 1 } }
             });
             vCount = updated.violations;
        }

        const log = await prisma.violationLog.create({
            data: {
                quizId,
                studentId: studentRecord.id,
                type: type || 'DOM_OVERRIDE',
                severity: 'HIGH'
            }
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`quiz_${quizId}`).emit('violation_detected', {
                studentId: studentRecord.id,
                type: log.type,
                timestamp: log.timestamp,
                violationCount: vCount
            });
        }

        res.status(200).json({ message: "Violation securely logged.", log });
    } catch (e) {
        console.error("Violation Logging Error:", e);
        res.status(500).json({ error: "Server constraints blocked log request." });
    }
}

// ==========================================
// RESULT PUBLISHING & ANALYTICS
// ==========================================

exports.getQuizAnalytics = async (req, res) => {
    try {
        const { quizId } = req.params;

        const [analytics, leaderboardCache, questionsData] = await Promise.all([
             prisma.quizAnalytics.findUnique({ where: { quizId } }),
             prisma.leaderboardCache.findMany({ 
                 where: { quizId }, 
                 orderBy: { rank: 'asc' }
             }),
             prisma.quizQuestion.findMany({
                 where: { quizId },
                 include: { question: { include: { analytics: true } } }
             })
        ]);

        if (!analytics) return res.status(200).json({ 
            average: 0, highest: 0, lowest: 0, passRate: 0, failRate: 0, leaderboard: [], submissionCount: 0, questions: []
        });

        const leaderboard = await Promise.all(leaderboardCache.map(async lb => {
             const student = await prisma.student.findUnique({ where: { id: lb.studentId }, include: { user: true } });
             return {
                 studentName: student?.user?.name || 'Unknown',
                 rollNo: student?.rollNo || '—',
                 score: lb.score,
                 timeTaken: lb.timeTaken,
                 rank: lb.rank
             };
        }));

        res.status(200).json({
            submissionCount: leaderboard.length,
            average: analytics.avgScore.toFixed(2),
            highest: analytics.highestScore,
            lowest: analytics.lowestScore,
            passRate: analytics.passRate.toFixed(2),
            failRate: analytics.failRate.toFixed(2),
            leaderboard,
            questions: questionsData.map(q => ({
                 questionText: q.question.questionText,
                 difficultyIndex: q.question.analytics?.difficultyIndex || 0,
                 totalAttempts: q.question.analytics?.totalAttempts || 0,
                 correctAttempts: q.question.analytics?.correctAttempts || 0
            }))
        });
    } catch (e) {
        console.error("Quiz Analytics Failed:", e);
        res.status(500).json({ error: "Server mapping failed." });
    }
}

// ----------------------------------------------------
// Phase 5 Background Analytics Rebuilder (Idempotent)
// ----------------------------------------------------
async function rebuildAnalytics(quizId, triggeringStudentId = null) {
    try {
        // Idempotency Guard — if triggering student already processed, skip entirely
        if (triggeringStudentId) {
            const sub = await prisma.quizSubmission.findUnique({
                where: { quizId_studentId: { quizId, studentId: triggeringStudentId } }
            });
            if (sub?.analyticsProcessed) {
                console.log(`[Analytics] Already processed for student ${triggeringStudentId}, skipping.`);
                return;
            }
        }

        // Pull ALL SUBMITTED records for this quiz
        const submissions = await prisma.quizSubmission.findMany({
            where: { quizId, status: 'SUBMITTED' },
            include: { answers: true }
        });
        if (!submissions.length) return;

        let totalScore = 0;
        let passCount = 0;
        let highest = -Infinity;
        let lowest = Infinity;
        const qStats = {};

        const lbData = submissions.map(sub => {
            const score = sub.score || 0;
            totalScore += score;
            if (score > highest) highest = score;
            if (score < lowest) lowest = score;
            if ((sub.percentage || 0) >= 50) passCount++;

            let timeTaken = 0;
            if (sub.startedAt && sub.submittedAt) {
                timeTaken = Math.floor((new Date(sub.submittedAt).getTime() - new Date(sub.startedAt).getTime()) / 1000);
            }

            sub.answers.forEach(ans => {
                if (ans.selectedOption && ans.selectedOption !== "SKIPPED") {
                    if (!qStats[ans.questionId]) qStats[ans.questionId] = { attempts: 0, correct: 0 };
                    qStats[ans.questionId].attempts++;
                    if (ans.isCorrect) qStats[ans.questionId].correct++;
                }
            });

            return { quizId, studentId: sub.studentId, score, timeTaken };
        });

        // Sort Leaderboard: Score DESC, Time Taken ASC (tie-break)
        lbData.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken);

        // === Atomic Transaction — prevents race conditions on concurrent submissions ===
        await prisma.$transaction(async (tx) => {
            // Rebuild leaderboard from scratch (always full recalculation — no partial updates)
            await tx.leaderboardCache.deleteMany({ where: { quizId } });
            const inserts = lbData.map((data, index) => ({ ...data, rank: index + 1 }));
            if (inserts.length > 0) {
                await tx.leaderboardCache.createMany({ data: inserts });
            }

            // Upsert aggregate quiz-level metrics
            const avgScore = totalScore / submissions.length;
            const passRate = (passCount / submissions.length) * 100;
            const failRate = 100 - passRate;
            await tx.quizAnalytics.upsert({
                where: { quizId },
                update: { avgScore, highestScore: highest, lowestScore: lowest, passRate, failRate },
                create: { quizId, avgScore, highestScore: highest, lowestScore: lowest, passRate, failRate }
            });

            // Upsert per-question difficulty indices
            for (const qId of Object.keys(qStats)) {
                const diff = qStats[qId].attempts > 0 ? (qStats[qId].correct / qStats[qId].attempts) * 100 : 0;
                await tx.questionAnalytics.upsert({
                    where: { questionId: qId },
                    update: { totalAttempts: qStats[qId].attempts, correctAttempts: qStats[qId].correct, difficultyIndex: diff },
                    create: { questionId: qId, totalAttempts: qStats[qId].attempts, correctAttempts: qStats[qId].correct, difficultyIndex: diff }
                });
            }

            // Mark triggering submission as analytics-processed (idempotency seal)
            if (triggeringStudentId) {
                await tx.quizSubmission.update({
                    where: { quizId_studentId: { quizId, studentId: triggeringStudentId } },
                    data: { analyticsProcessed: true }
                });
            }
        });

        console.log(`[Analytics] Rebuild complete for quiz ${quizId} — ${submissions.length} submissions processed.`);
    } catch (e) {
        console.error("Background Analytics Rebuild Failed:", e);
    }
}
