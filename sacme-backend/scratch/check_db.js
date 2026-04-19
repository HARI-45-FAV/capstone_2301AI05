const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const backupUrl = process.env.DATABASE_URL;
    console.log(`Checking database at: ${backupUrl}`);
    
    const tables = ['user', 'student', 'course', 'quiz', 'questionBank', 'quizSubmission'];
    const results = {};

    for (const table of tables) {
        try {
            results[table] = await prisma[table].count();
        } catch (e) {
            results[table] = 'MISSING/ERROR';
        }
    }

    console.log(JSON.stringify(results, null, 2));
    await prisma.$disconnect();
}

check();
