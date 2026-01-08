import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { hashPassword, generateTempPassword } from './utils/password.js';
import { buildAccessCode } from './utils/codeGenerator.js';

dotenv.config();

const prisma = new PrismaClient();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding for multi-school architecture...');

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'super@edcon.app';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin#2025';

    let superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', email: superAdminEmail } });
    if (!superAdmin) {
      const hashed = await hashPassword(superAdminPassword);
      superAdmin = await prisma.user.create({
        data: {
          accessCode: buildAccessCode('SUPER_ADMIN', 'EDCON'),
          name: 'Global Super Admin',
          email: superAdminEmail,
          role: 'SUPER_ADMIN',
          passwordHash: hashed,
          status: 'ACTIVE',
        },
      });
      console.log(`✅ Created super admin (${superAdminEmail})`);
    } else {
      console.log('✅ Super admin already exists');
    }

    const schoolCode = process.env.DEMO_SCHOOL_CODE || 'DEMO1234';
    const school = await prisma.school.upsert({
      where: { code: schoolCode },
      update: {},
      create: {
        name: 'Demo Academy',
        code: schoolCode,
        address: '123 Education Way',
        timezone: 'UTC',
      },
    });
    console.log(`🏫 Seed school ready (${school.code})`);

    const schoolAdminEmail = 'admin@demoacademy.edu';
    let schoolAdmin = await prisma.user.findFirst({ where: { email: schoolAdminEmail } });
    if (!schoolAdmin) {
      const adminPassword = generateTempPassword(14);
      const adminHash = await hashPassword(adminPassword);
      const adminAccessCode = buildAccessCode('SCHOOL_ADMIN', school.code);
      schoolAdmin = await prisma.user.create({
        data: {
          accessCode: adminAccessCode,
          name: 'Demo School Admin',
          email: schoolAdminEmail,
          role: 'SCHOOL_ADMIN',
          schoolId: school.id,
          schoolCode: school.code,
          passwordHash: adminHash,
          temporaryPasswordHash: adminHash,
          temporaryPasswordIssuedAt: new Date(),
          requiresPasswordReset: true,
          status: 'ACTIVE',
          createdById: superAdmin.id,
        },
      });
      console.log('👩‍💼 School admin created (OTP below)');
      console.log(`   Access Code: ${adminAccessCode} | Temp Password: ${adminPassword}`);
    } else {
      console.log('👩‍💼 School admin already exists');
    }

    const classA = await prisma.class.upsert({
      where: { id: 'demo-grade-1a' },
      update: {},
      create: { id: 'demo-grade-1a', name: 'Grade 1A', schoolId: school.id },
    });

    const mathSubject = await prisma.subject.upsert({
      where: { id: 'demo-math' },
      update: {},
      create: { id: 'demo-math', name: 'Mathematics', schoolId: school.id },
    });

    await prisma.class.update({
      where: { id: classA.id },
      data: { subjectIds: { set: [mathSubject.id] } }
    });

    const teacherEmail = 'mathias@demoacademy.edu';
    let teacher = await prisma.user.findFirst({ where: { email: teacherEmail } });
    if (!teacher) {
      const teacherPassword = await hashPassword('Teacher#2025');
      const teacherAccessCode = buildAccessCode('TEACHER', school.code);
      teacher = await prisma.user.create({
        data: {
          accessCode: teacherAccessCode,
          name: 'Mr. Mathias',
          email: teacherEmail,
          role: 'TEACHER',
          schoolId: school.id,
          schoolCode: school.code,
          passwordHash: teacherPassword,
          subject: 'Mathematics',
          classIds: [classA.id],
          status: 'ACTIVE',
          createdById: superAdmin.id,
        },
      });
      console.log('👨‍🏫 Teacher account created with default password (Teacher#2025)');
    } else {
      console.log('👨‍🏫 Teacher account already exists');
    }

    const parentEmail = 'sarah.parent@demoacademy.edu';
    let parent = await prisma.user.findFirst({ where: { email: parentEmail } });
    if (!parent) {
      const parentPassword = generateTempPassword(12);
      const parentHash = await hashPassword(parentPassword);
      const parentAccessCode = buildAccessCode('PARENT', school.code);
      parent = await prisma.user.create({
        data: {
          accessCode: parentAccessCode,
          name: 'Sarah Parent',
          email: parentEmail,
          role: 'PARENT',
          schoolId: school.id,
          schoolCode: school.code,
          passwordHash: parentHash,
          temporaryPasswordHash: parentHash,
          temporaryPasswordIssuedAt: new Date(),
          requiresPasswordReset: true,
          status: 'INVITED',
          createdById: superAdmin.id,
        },
      });
      console.log('👩 Parent account created (OTP below)');
      console.log(`   Access Code: ${parent.accessCode} | Temp Password: ${parentPassword}`);
    } else {
      console.log('👩 Parent account already exists');
    }

    const studentEmail = 'tommy.learner@demoacademy.edu';
    let student = await prisma.user.findFirst({ where: { email: studentEmail } });
    if (!student) {
      const studentAccessCode = buildAccessCode('STUDENT', school.code);
      student = await prisma.user.create({
        data: {
          accessCode: studentAccessCode,
          name: 'Tommy Learner',
          email: studentEmail,
          role: 'STUDENT',
          schoolId: school.id,
          schoolCode: school.code,
          passwordHash: await hashPassword('Student#2025'),
          classId: classA.id,
          parentId: parent.id,
          createdById: superAdmin.id,
        },
      });
      console.log('🧒 Student account created with default password (Student#2025)');
    } else {
      console.log('🧒 Student account already exists');
    }

    await prisma.user.update({
      where: { id: parent.id },
      data: { childrenIds: { set: [student.id] } }
    });

    console.log('👨‍👩‍👦 Demo family seeded with OTP flow');
    console.log('   Use parent OTP output above if newly created');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedDatabase();