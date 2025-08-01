import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const prisma = new PrismaClient();

// Import avatars for student assignment
const allAvatars = [
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Bandit`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Bear`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Bella`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Buddy`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Buster`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Callie`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Casper`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Charlie`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Chester`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Cuddles`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Dexter`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Diesel`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Dusty`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Felix`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Gizmo`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Lily&primaryColor=f472b6,c084fc&secondaryColor=f9a8d4,e9d5ff`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Zoe&primaryColor=a78bfa,60a5fa&secondaryColor=d8b4fe,bfdbfe`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Mia&primaryColor=22d3ee,34d399&secondaryColor=a5f3fc,a7f3d0`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Ava&primaryColor=f87171,fb923c&secondaryColor=fecaca,fed7aa`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sophie&primaryColor=e879f9,d946ef&secondaryColor=f5d0fe,f0abfc`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Isabella&primaryColor=fbbf24,f59e0b&secondaryColor=fef08a,fde68a`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Grace&primaryColor=5eead4,2dd4bf&secondaryColor=99f6e4,5eead4`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Hannah&primaryColor=818cf8,a78bfa&secondaryColor=c7d2fe,d8b4fe`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Nora&primaryColor=f472b6,ec4899&secondaryColor=fbcfe8,fce7f3`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Layla&primaryColor=6ee7b7,34d399&secondaryColor=a7f3d0,6ee7b7`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Aria&primaryColor=7dd3fc,38bdf8&secondaryColor=e0f2fe,bae6fd`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Ella&primaryColor=c4b5fd,a78bfa&secondaryColor=e0e7ff,d8b4fe`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Scarlett&primaryColor=fb7185,f43f5e&secondaryColor=fecdd3,ffdde1`,
];

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await prisma.message.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.grade.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.homework.deleteMany();
    await prisma.user.deleteMany();
    await prisma.class.deleteMany();
    await prisma.subject.deleteMany();

    console.log('Cleared existing data');

    // Create Classes (Grades 1-12)
    const classes = [
        { id: 'G1A', name: 'Grade 1A' },
        { id: 'G1B', name: 'Grade 1B' },
        { id: 'G2A', name: 'Grade 2A' },
        { id: 'G2B', name: 'Grade 2B' },
        { id: 'G3A', name: 'Grade 3A' },
        { id: 'G3B', name: 'Grade 3B' },
        { id: 'G4A', name: 'Grade 4A' },
        { id: 'G4B', name: 'Grade 4B' },
        { id: 'G5A', name: 'Grade 5A' },
        { id: 'G5B', name: 'Grade 5B' },
        { id: 'G6A', name: 'Grade 6A' },
        { id: 'G6B', name: 'Grade 6B' },
        { id: 'G7A', name: 'Grade 7A' },
        { id: 'G7B', name: 'Grade 7B' },
        { id: 'G8A', name: 'Grade 8A' },
        { id: 'G8B', name: 'Grade 8B' },
        { id: 'G9A', name: 'Grade 9A' },
        { id: 'G9B', name: 'Grade 9B' },
        { id: 'G10A', name: 'Grade 10A' },
        { id: 'G10B', name: 'Grade 10B' },
        { id: 'G11A', name: 'Grade 11A' },
        { id: 'G11B', name: 'Grade 11B' },
        { id: 'G12A', name: 'Grade 12A' },
        { id: 'G12B', name: 'Grade 12B' },
    ];

    // Create Subjects
    const subjects = [
        { id: 'MATH', name: 'Mathematics' },
        { id: 'SCI', name: 'Science' },
        { id: 'ENG', name: 'English' },
        { id: 'HIST', name: 'History' },
        { id: 'GEO', name: 'Geography' },
        { id: 'ART', name: 'Art' },
        { id: 'PE', name: 'Physical Education' },
        { id: 'MUSIC', name: 'Music' },
        { id: 'COMP', name: 'Computer Science' },
        { id: 'LANG', name: 'Foreign Language' },
    ];

    // Insert classes and subjects
    for (const classData of classes) {
        await prisma.class.create({ data: classData });
    }
    console.log('Created classes');

    for (const subjectData of subjects) {
        await prisma.subject.create({ data: subjectData });
    }
    console.log('Created subjects');

    // Create Admin user
    const adminUser = await prisma.user.create({
        data: {
            id: 'UdBu1F3',
            name: 'Admin',
            role: 'ADMIN',
            avatar: allAvatars[0],
        }
    });
    console.log('Created admin user:', adminUser.name);

    // Create some sample parents
    const parents = [
        { id: 'P001', name: 'Sarah Johnson', role: 'PARENT', avatar: allAvatars[1] },
        { id: 'P002', name: 'Michael Chen', role: 'PARENT', avatar: allAvatars[2] },
        { id: 'P003', name: 'Emily Davis', role: 'PARENT', avatar: allAvatars[3] },
    ];

    for (const parentData of parents) {
        await prisma.user.create({
            data: {
                ...parentData,
                childrenIds: [],
        }
    });
    }
    console.log('Created parent users');

    // Create some sample teachers
    const teachers = [
        { id: 'T001', name: 'Dr. Smith', role: 'TEACHER', subject: 'Mathematics', avatar: allAvatars[4], classIds: ['G1A', 'G1B'] },
        { id: 'T002', name: 'Ms. Wilson', role: 'TEACHER', subject: 'Science', avatar: allAvatars[5], classIds: ['G2A', 'G2B'] },
        { id: 'T003', name: 'Mr. Brown', role: 'TEACHER', subject: 'English', avatar: allAvatars[6], classIds: ['G3A', 'G3B'] },
    ];

    for (const teacherData of teachers) {
        await prisma.user.create({
            data: {
                ...teacherData,
                childrenIds: [],
            }
        });
    }
    console.log('Created teacher users');

    // Create some sample students
    const students = [
        { id: 'S001', name: 'Alex Johnson', role: 'STUDENT', classId: 'G1A', parentId: 'P001', avatar: allAvatars[7] },
        { id: 'S002', name: 'Emma Chen', role: 'STUDENT', classId: 'G1B', parentId: 'P002', avatar: allAvatars[8] },
        { id: 'S003', name: 'Liam Davis', role: 'STUDENT', classId: 'G2A', parentId: 'P003', avatar: allAvatars[9] },
    ];

    for (const studentData of students) {
        await prisma.user.create({
            data: {
                ...studentData,
                childrenIds: [],
            }
        });
        }
    console.log('Created student users');

    // Update parents with their children
    await prisma.user.update({
        where: { id: 'P001' },
        data: { childrenIds: ['S001'] }
    });
    await prisma.user.update({
        where: { id: 'P002' },
        data: { childrenIds: ['S002'] }
    });
    await prisma.user.update({
        where: { id: 'P003' },
        data: { childrenIds: ['S003'] }
    });
    console.log('Updated parent-child relationships');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run the seed function
seedData()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  }); 