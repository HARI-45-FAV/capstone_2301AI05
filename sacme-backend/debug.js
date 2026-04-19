const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.courseAssignment.findMany({ include: { professor: true, course: true } }).then(a => console.log(JSON.stringify(a, null, 2))).finally(() => prisma.$disconnect());
