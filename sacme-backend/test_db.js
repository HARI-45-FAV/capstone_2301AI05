const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking DB...");
    const student = await prisma.student.findFirst({
        where: { rollNo: "2301AI05" },
        include: { attendances: true, semester: true }
    });
    console.log("Student:", student?.name, student?.rollNo);
    console.log("Semester ID:", student?.semesterId);
    console.log("Attendance count:", student?.attendances.length);
    
    if (student) {
        const attendances = await prisma.attendance.findMany({
            where: { studentId: student.id }
        });
        console.log("Raw attendances matching studentId:", attendances.length);
        if (attendances.length > 0) {
            console.log("Sample:", attendances[0]);
        }
    }
}
check().finally(() => prisma.$disconnect());
