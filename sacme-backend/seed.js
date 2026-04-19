const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({}); // Clear existing DB
  
  const bcrypt = require('bcrypt');
  const studentPassword = await bcrypt.hash('Secret*123', 10);
  
  // 1. Seed Main Admin (Status: ACTIVE)
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.create({
    data: {
      email: "admin@college.edu",
      role: "MAIN_ADMIN",
      account_status: "ACTIVE", // Main Admin is always active
      passwordHash: adminPassword,
      admin: {
        create: {
          name: "Super Admin",
          adminId: "ADMIN_001",
          level: "SUPER"
        }
      }
    }
  });

  // 2. Seed Faculty Advisor (Status: NOT_REGISTERED - requires activation)
  await prisma.user.create({
    data: {
      email: "ramesh@college.edu",
      role: "FACULTY_ADVISOR",
      account_status: "NOT_REGISTERED",
      facultyAdvisor: {
        create: {
          name: "Dr Ramesh",
          facultyId: "FAC001",
          department: "Computer Science"
        }
      }
    }
  });

  // 3. Seed Professor (Status: NOT_REGISTERED - requires activation)
  await prisma.user.create({
    data: {
      email: "kumar@college.edu",
      role: "PROFESSOR",
      account_status: "NOT_REGISTERED",
      professor: {
        create: {
          name: "Dr Kumar",
          instructorId: "FAC203",
          email: "kumar@college.edu",
          phone: "9876543210",
          department: "Computer Science"
        }
      }
    }
  });

  // 4. Seed Student (Status: ACTIVE, doesn't need to signup, logs in via Roll No.)
  await prisma.user.create({
    data: {
      email: "ravi.cs@college.edu",
      role: "STUDENT",
      account_status: "ACTIVE", // Already active from bulk upload
      passwordHash: studentPassword,
      student: {
        create: {
          name: "Ravi",
          rollNo: "21CS101",
          email: "ravi.cs@college.edu",
          phone: "1234567890"
        }
      }
    }
  });

  console.log("Database Seeded with Mock Accounts");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
