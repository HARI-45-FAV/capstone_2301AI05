const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking Logic...");
    const studentId = '8a5f1c13-c784-4595-8f29-e16f76e81840';
    const courseId = '8cd69903-4ce7-4192-9d29-a8c841b939f0';

    let whereClause = { studentId };
    if (courseId) {
         whereClause.courseId = courseId;
    }

    try {
        const distinctDates = await prisma.attendance.groupBy({
             by: ['date'],
             where: courseId ? { courseId } : {}
        });
        const totalClasses = distinctDates.length;

        const studentRecords = await prisma.attendance.findMany({
            where: whereClause,
            include: { course: true },
            orderBy: { date: 'desc' }
        });

        const attended = studentRecords.filter(r => r.status === "Present").length;
        const percentage = totalClasses === 0 ? 0 : Math.round((attended / totalClasses) * 100);

        console.log("Total Classes:", totalClasses);
        console.log("Attended:", attended);
        console.log("Percentage:", percentage);
        console.log("Records length:", studentRecords.length);
    } catch (err) {
        console.error("CRASH:", err);
    }
}
check().finally(() => prisma.$disconnect());
