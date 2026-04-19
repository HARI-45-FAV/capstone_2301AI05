const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile-images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/profile-images/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/jpg") {
      cb(null, true);
    } else {
      cb(new Error("Only image/jpeg or image/png allowed"));
    }
  }
});

exports.uploadAvatar = uploadAvatar;

exports.handleAvatarUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file format' });
  }

  // Profile-hijacking prevention: if profileId check is requested by client payload
  if (req.body.profileId && req.user.id !== req.body.profileId) {
     return res.status(403).json({ error: 'Unauthorized to modify another user\'s profile' });
  }

  try {
    // 1. Determine frontend friendly path since the file is already uploaded by multer
    const avatarUrl = '/public/uploads/profile-images/' + req.file.filename;

    // 2. Fetch existing user to find old avatar
    let existingUser = null;
    if (req.user.role === 'FACULTY_ADVISOR') {
      existingUser = await prisma.facultyAdvisor.findUnique({ where: { userId: req.user.id } });
    } else if (req.user.role === 'PROFESSOR') {
      existingUser = await prisma.professor.findUnique({ where: { userId: req.user.id } });
    } else if (req.user.role === 'STUDENT') {
      existingUser = await prisma.student.findUnique({ where: { userId: req.user.id } });
    }

    // 3. Delete old avatar if it exists
    if (existingUser && existingUser.avatarUrl) {
      const oldAvatarPath = path.normalize(path.join(__dirname, '..', existingUser.avatarUrl));
      fs.unlink(oldAvatarPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error("Failed to delete old avatar:", err);
        }
      });
    }

    // 5. Update Database Record
    if (req.user.role === 'FACULTY_ADVISOR') {
      await prisma.facultyAdvisor.update({
        where: { userId: req.user.id },
        data: { avatarUrl }
      });
    } else if (req.user.role === 'PROFESSOR') {
      await prisma.professor.update({
        where: { userId: req.user.id },
        data: { avatarUrl }
      });
    } else if (req.user.role === 'STUDENT') {
      await prisma.student.update({
        where: { userId: req.user.id },
        data: { avatarUrl }
      });
    }

    res.json({ message: 'Avatar updated', avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, phone, department, interests } = req.body;

  try {
    if (req.user.role === 'FACULTY_ADVISOR') {
      const updated = await prisma.facultyAdvisor.update({
        where: { userId: req.user.id },
        data: { name, department, interests }
      });
      res.json(updated);
    } else if (req.user.role === 'PROFESSOR') {
      const updated = await prisma.professor.update({
        where: { userId: req.user.id },
        data: { name, department, phone, interests }
      });
      res.json(updated);
    } else {
      res.status(400).json({ error: 'Profile update not implemented for this role' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

exports.getStudentDashboardStats = async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { userId: req.user.id },
            include: { attendances: true, submissions: true }
        });
        
        if (!student || !student.semesterId) return res.status(200).json({ stats: null });

        const courses = await prisma.course.findMany({
            where: { semesterId: student.semesterId },
            include: { assignments: true, materials: true }
        });

        let materialsAvailable = 0;
        let pending = 0;
        let upcoming = 0;

        courses.forEach(c => {
            materialsAvailable += c.materials.length;
            c.assignments.forEach(a => {
                const sub = student.submissions.find(s => s.assignmentId === a.id);
                if (!sub) pending++;

                const msDiff = new Date(a.dueDate).getTime() - Date.now();
                const daysLeft = msDiff / (1000 * 60 * 60 * 24);
                if (!sub && daysLeft >= 0 && daysLeft <= 7) upcoming++;
            });
        });

        const totalMarked = student.attendances.length;
        const present = student.attendances.filter(a => a.status === 'Present').length;
        const attendancePercentage = totalMarked > 0 ? Math.round((present / totalMarked) * 100) : 100;

        const maxSub = student.submissions.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
        const lastSubmissionDate = maxSub ? maxSub.submittedAt : null;

        res.status(200).json({
            stats: { assignmentsPending: pending, upcomingDeadlines: upcoming, attendancePercentage, materialsAvailable, lastSubmissionDate },
            profile: {
                name: student.name,
                rollNo: student.rollNo,
                email: student.email,
                avatarUrl: student.avatarUrl
            }
        });
    } catch (e) {
        console.error("Stats Error:", e);
        res.status(500).json({ error: 'Server Error' });
    }
};
