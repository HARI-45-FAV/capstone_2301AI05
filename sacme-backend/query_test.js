const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.quiz.findMany({ take: 10, select: { id: true, securityLevel: true } })
  .then(console.log)
  .finally(() => prisma.$disconnect());
