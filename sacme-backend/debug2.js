const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    // Get all assignments
    const assignments = await prisma.courseAssignment.findMany({ include: { professor: { include: { user: true } }, course: true }});
    console.log("Assignments Length:", assignments.length);
    
    for (const ca of assignments) {
        console.log(`Assigned to Prof: ${ca.professor.name} | UserID: ${ca.professor.userId} | Course: ${ca.course.name}`);
        
        // Emulate the controller logic
        const testProf = await prisma.professor.findUnique({
             where: { userId: ca.professor.userId, isDeleted: false },
             include: { courseAssignments: { include: { course: true } } }
        });
        
        console.log(`Controller Query Result for ${ca.professor.userId}:`, testProf ? `Found with ${testProf.courseAssignments.length} courses` : 'NOT FOUND');
    }
}
check().finally(() => prisma.$disconnect());
