const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createAcademicYear = async (req, res) => {
    try {
        const { name, startDate, endDate, status } = req.body;
        
        // Only MAIN_ADMIN can create
        if (req.user.role !== 'MAIN_ADMIN') return res.status(403).json({ error: 'Unauthorized' });

        let newYear;
        const requestedStatus = status || 'ACTIVE';

        if (requestedStatus === 'ACTIVE') {
            await prisma.$transaction(async (tx) => {
                await tx.academicYear.updateMany({
                    data: { status: 'ARCHIVED' }
                });
                newYear = await tx.academicYear.create({
                    data: { 
                        name, 
                        startDate: new Date(startDate), 
                        endDate: new Date(endDate), 
                        status: 'ACTIVE' 
                    }
                });
            });
        } else {
             newYear = await prisma.academicYear.create({
                data: { 
                    name, 
                    startDate: new Date(startDate), 
                    endDate: new Date(endDate), 
                    status: requestedStatus 
                }
            });
        }

        res.status(201).json({ message: 'Academic Year created successfully', year: newYear });
    } catch (error) {
        console.error('Create AcademicYear Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.setActiveYear = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'MAIN_ADMIN') return res.status(403).json({ error: 'Unauthorized' });

        await prisma.$transaction(async (tx) => {
            await tx.academicYear.updateMany({
                where: { id: { not: id } },
                data: { status: 'ARCHIVED' }
            });
            await tx.academicYear.update({
                where: { id: id },
                data: { status: 'ACTIVE' }
            });
        });

        res.status(200).json({ message: 'Academic Year set to Active successfully' });
    } catch (error) {
        console.error('Set Active Year Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getAcademicYears = async (req, res) => {
    try {
        const years = await prisma.academicYear.findMany({ orderBy: { createdAt: 'desc' } });
        res.status(200).json({ years });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.createBranch = async (req, res) => {
    try {
        const { name, code, programType, totalSemesters, academicYearId } = req.body;
        
        if (req.user.role !== 'MAIN_ADMIN') return res.status(403).json({ error: 'Unauthorized' });

        if (!name || !code || !programType || !totalSemesters || !academicYearId) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Logic to Auto-Generate Semesters
        const semestersData = [];
        for (let i = 1; i <= totalSemesters; i++) {
            semestersData.push({
                semesterNumber: i,
                semesterType: i % 2 !== 0 ? 'ODD' : 'EVEN',
                season: i % 2 !== 0 ? 'AUTUMN' : 'SPRING',
                academicYearId: academicYearId
            });
        }

        const newBranch = await prisma.branch.create({
            data: {
                name,
                code,
                programType,
                totalSemesters: parseInt(totalSemesters),
                semesters: {
                    create: semestersData
                }
            },
            include: { semesters: true }
        });

        res.status(201).json({ message: 'Branch created and Semesters Auto-Generated successfully', branch: newBranch });
    } catch (error) {
        console.error('Create Branch Error:', error);
        // Prisma P2002 -> Unique constraint failed
        if (error.code === 'P2002') return res.status(400).json({ error: 'Branch code already exists.' });
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getBranches = async (req, res) => {
    try {
        const branches = await prisma.branch.findMany({
            include: { semesters: { orderBy: { semesterNumber: 'asc' } } },
            orderBy: { name: 'asc' }
        });
        res.status(200).json({ branches });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getGlobalStats = async (req, res) => {
    try {
        if (req.user.role !== 'MAIN_ADMIN') return res.status(403).json({ error: 'Unauthorized' });

        const [totalStudents, totalAssigns, totalMaterials, totalSubmissions] = await Promise.all([
            prisma.student.count({ where: { isDeleted: false } }),
            prisma.assignment.count(),
            prisma.courseMaterial.count(),
            prisma.submission.count()
        ]);

        res.status(200).json({ 
            stats: { totalStudents, totalAssigns, totalMaterials, totalSubmissions }
        });
    } catch (error) {
        console.error('Global Stats Fetch Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getSystemHeatmap = async (req, res) => {
    try {
        const days = 30;
        const start = new Date();
        start.setDate(start.getDate() - days);
        start.setUTCHours(0, 0, 0, 0);

        const [submissions, attendances, materials, assignments] = await Promise.all([
            prisma.submission.findMany({ where: { submittedAt: { gte: start } }, select: { submittedAt: true } }),
            prisma.attendance.findMany({ where: { date: { gte: start } }, select: { date: true } }),
            prisma.courseMaterial.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
            prisma.assignment.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } })
        ]);

        // Build day-keyed map
        const map = {};
        const addToMap = (items, dateField) => {
            items.forEach(item => {
                const d = new Date(item[dateField]).toISOString().split('T')[0];
                if (!map[d]) map[d] = { date: d, submissions: 0, attendances: 0, materials: 0, assignments: 0, total: 0 };
                map[d][dateField === 'submittedAt' ? 'submissions' : dateField === 'date' ? 'attendances' : dateField === 'createdAt' && item.title !== undefined ? 'assignments' : 'materials']++;
            });
        };

        // More reliable approach - aggregate separately
        const dayMap = {};
        const ensureDay = d => { if (!dayMap[d]) dayMap[d] = { date: d, submissions: 0, attendances: 0, materials: 0, assignments: 0 }; };

        submissions.forEach(s => { const d = s.submittedAt.toISOString().split('T')[0]; ensureDay(d); dayMap[d].submissions++; });
        attendances.forEach(a => { const d = a.date.toISOString().split('T')[0]; ensureDay(d); dayMap[d].attendances++; });
        materials.forEach(m => { const d = m.createdAt.toISOString().split('T')[0]; ensureDay(d); dayMap[d].materials++; });
        assignments.forEach(a => { const d = a.createdAt.toISOString().split('T')[0]; ensureDay(d); dayMap[d].assignments++; });

        const heatmap = Object.values(dayMap)
            .map(d => ({ ...d, total: d.submissions + d.attendances + d.materials + d.assignments }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json({ heatmap, days });
    } catch (error) {
        console.error('Heatmap Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};
