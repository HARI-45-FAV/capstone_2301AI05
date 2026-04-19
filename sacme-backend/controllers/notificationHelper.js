const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Silently dispatches notifications to all active students enrolled in a course.
 */
exports.notifyCourseStudents = async (courseId, message) => {
    try {
        const course = await prisma.course.findUnique({ 
            where: { id: courseId }, 
            include: { 
                semester: { 
                    include: { 
                        students: { 
                            where: { isDeleted: false } 
                        } 
                    } 
                } 
            } 
        });
        
        if (course && course.semester && course.semester.students.length > 0) {
            const notifications = course.semester.students.map(student => ({
                userId: student.userId,
                message: message
            }));
            
            await prisma.notification.createMany({ data: notifications });
        }
    } catch (e) {
        console.error('Silent Notification Error Wrapper:', e);
    }
};
