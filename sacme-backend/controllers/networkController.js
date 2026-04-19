const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const NodeCache = require('node-cache');
const networkCache = new NodeCache({ stdTTL: 600 }); // 10 minute cache

exports.clearNetworkCache = () => {
    networkCache.del('full_network_map');
};

exports.manualClearCache = (req, res) => {
    networkCache.del('full_network_map');
    res.status(200).json({ message: "Cache manually cleared successfully" });
};

exports.getNetworkMap = async (req, res) => {
    try {
        const cachedMap = networkCache.get('full_network_map');
        if (cachedMap) {
            return res.json(cachedMap);
        }

        const adminUsers = await prisma.admin.findMany();
        
        const branches = await prisma.branch.findMany({
            include: {
                semesters: {
                    include: {
                        facultyMappings: {
                            include: {
                                facultyAdvisor: true
                            }
                        },
                        courses: {
                            include: {
                                courseAssignments: {
                                    include: {
                                        professor: true
                                    }
                                },
                                _count: {
                                    select: {
                                        courseAssignments: false // We don't really need assignments count, but the student count is tied to branch/semester.
                                    }
                                }
                            }
                        },
                        _count: {
                            select: {
                                students: true
                            }
                        }
                    }
                }
            }
        });

        // Assemble the hierarchical json response
        // MAIN ADMIN -> BRANCHES -> FACULTY ADVISORS -> PROFESSORS -> COURSES -> STUDENTS_COUNT Node (aggregated by course/semester)

        const mainAdmins = adminUsers.map(admin => ({
            id: admin.id,
            name: admin.name,
            nodeType: 'ADMIN_NODE'
        }));

        const resultBranches = branches.map(branch => {
            // Get all faculty advisors for this branch across its semesters
            const mappedFadvisorsMap = new Map();
            // Get all courses mapped by professor
            const coursesByProfMap = new Map();

            branch.semesters.forEach(sem => {
                // Collect Faculty Advisors
                sem.facultyMappings.forEach(mapping => {
                    if (!mappedFadvisorsMap.has(mapping.facultyAdvisor.id)) {
                        mappedFadvisorsMap.set(mapping.facultyAdvisor.id, {
                           ...mapping.facultyAdvisor,
                           // Initialize professors array under this advisor conceptually
                           professorsMap: new Map() // By department or just generally attached to this branch's semesters
                        });
                    }
                });

                // Collect courses and map to professors
                sem.courses.forEach(course => {
                    const studentCount = sem._count.students; // Approximation given schema limitations
                    
                    course.courseAssignments.forEach(ca => {
                        const prof = ca.professor;
                        if (!coursesByProfMap.has(prof.id)) {
                            coursesByProfMap.set(prof.id, {
                                ...prof,
                                coursesList: []
                            });
                        }
                        coursesByProfMap.get(prof.id).coursesList.push({
                            id: course.id,
                            name: course.name,
                            code: course.code,
                            credits: course.credits,
                            nodeType: 'COURSE_NODE',
                            studentsCount: studentCount,
                            studentNodeType: 'STUDENT_COUNT_NODE'
                        });
                    });
                });
            });

            // Since there is no explicit link between FacultyAdvisor and Professor in the db,
            // we will group professors under the first Faculty Advisor of the branch (or distribute them).
            // Usually there is 1 Faculty Advisor per branch or per semester.
            const branchProfessors = Array.from(coursesByProfMap.values()).map(p => ({
                id: p.id,
                name: p.name,
                department: p.department,
                avatar: p.avatarUrl,
                interests: p.interests,
                nodeType: 'PROFESSOR_NODE',
                courses: p.coursesList
            }));

            const branchAdvisors = Array.from(mappedFadvisorsMap.values()).map((fa, index) => ({
                id: fa.id,
                name: fa.name,
                department: fa.department,
                avatar: fa.avatarUrl,
                interests: fa.interests,
                nodeType: 'ADVISOR_NODE',
                // If it's the primary FA (index 0), give them all the branch professors, otherwise empty
                professors: index === 0 ? branchProfessors : []
            }));

            // If a branch has professors but no advisors, we can still structure it or just return both
            
            return {
                id: branch.id,
                name: branch.name,
                code: branch.code,
                nodeType: 'BRANCH_NODE',
                facultyAdvisors: branchAdvisors,
                // fallback if branch has 0 advisors but has professors:
                professors: branchAdvisors.length === 0 ? branchProfessors : []
            };
        });

        // The top level is the Main Admin Node(s), containing branches
        const networkMap = {
            admins: mainAdmins.map(admin => ({
                ...admin,
                branches: resultBranches
            }))
        };

        networkCache.set('full_network_map', networkMap);

        res.json(networkMap);
    } catch (err) {
        console.error('Network Map Error:', err);
        res.status(500).json({ error: 'Failed to fetch network map', details: err.message });
    }
};
