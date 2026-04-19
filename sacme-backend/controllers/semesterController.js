const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSemesterDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const semester = await prisma.semester.findUnique({
            where: { id },
            include: {
                branch: true,
                academicYear: true,
                students: { where: { isDeleted: false }, orderBy: { rollNo: 'asc' } },
                courses: {
                    where: { isDeleted: false },
                    include: { courseAssignments: { include: { professor: true } } },
                    orderBy: { code: 'asc' }
                },
                facultyMappings: {
                    include: { facultyAdvisor: { include: { user: true } } }
                }
            }
        });
        if (!semester) return res.status(404).json({ error: 'Not found' });
        res.status(200).json({ semester });
    } catch (error) {
        console.error('getSemesterDetails error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Assign Faculty Advisor to Semester. (MAIN ADMIN ONLY)
 * Expects name, email, department, facultyId in req.body to create them if they do not exist.
 */
exports.assignFaculty = async (req, res) => {
    try {
        const { semesterId } = req.params;
        const { name, email, department, facultyId } = req.body;

        if (!name || !email || !department || !facultyId) {
             return res.status(400).json({ error: 'name, email, department, and facultyId are required.' });
        }

        // 1. Check if the User / Faculty Advisor already exists
        let advisor = await prisma.facultyAdvisor.findUnique({
             where: { facultyId }
        });

        if (!advisor) {
            // Check if email is already used by another user to prevent crashes
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                 return res.status(400).json({ error: 'Email is already registered in the system.' });
            }

            // Create new User & Faculty Advisor
            const newUser = await prisma.user.create({
                data: {
                    email,
                    role: 'FACULTY_ADVISOR',
                    account_status: 'NOT_REGISTERED',
                    facultyAdvisor: {
                        create: { name, facultyId, department }
                    }
                },
                include: { facultyAdvisor: true }
            });
            advisor = newUser.facultyAdvisor;
        }

        // 2. Map Advisor to Semester
        const existingMapping = await prisma.semesterFacultyMapping.findUnique({
            where: {
                semesterId_facultyAdvisorId: {
                    semesterId: semesterId,
                    facultyAdvisorId: advisor.id
                }
            }
        });

        if (existingMapping) {
            return res.status(400).json({ error: 'Faculty Advisor is already assigned to this semester.' });
        }

        const mapping = await prisma.semesterFacultyMapping.create({
            data: {
                semesterId,
                facultyAdvisorId: advisor.id
            },
            include: { facultyAdvisor: true, semester: true }
        });

        res.status(201).json({ message: 'Faculty Advisor created and assigned successfully', mapping });
    } catch (error) {
        console.error('assignFaculty Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * Get all available Faculty Advisors (So Main Admin can select one to map)
 */
exports.getAllFacultyAdvisors = async (req, res) => {
    try {
        const advisors = await prisma.facultyAdvisor.findMany({
            include: { user: true }
        });
        res.status(200).json({ advisors });
    } catch (error) {
        console.error('getAllFacultyAdvisors error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};
