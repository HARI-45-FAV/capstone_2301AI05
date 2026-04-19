const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters.' });
        }

        const query = q.trim();
        const like = { contains: query, mode: 'insensitive' };

        const [students, materials, assignments] = await Promise.all([
            prisma.student.findMany({
                where: { isDeleted: false, OR: [{ name: like }, { rollNo: like }, { email: like }] },
                select: { id: true, name: true, rollNo: true, email: true },
                take: 10
            }),
            prisma.courseMaterial.findMany({
                where: { title: like },
                include: { course: { select: { name: true } } },
                take: 10
            }),
            prisma.assignment.findMany({
                where: { title: like },
                include: { course: { select: { name: true } } },
                take: 10
            })
        ]);

        res.json({
            query,
            results: {
                students: students.map(s => ({ type: 'STUDENT', id: s.id, title: s.name, subtitle: `${s.rollNo} • ${s.email}` })),
                materials: materials.map(m => ({ type: 'MATERIAL', id: m.id, title: m.title, subtitle: m.course?.name || 'Unknown Course' })),
                assignments: assignments.map(a => ({ type: 'ASSIGNMENT', id: a.id, title: a.title, subtitle: a.course?.name || 'Unknown Course' }))
            },
            total: students.length + materials.length + assignments.length
        });
    } catch (error) {
        console.error('Global Search Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};
