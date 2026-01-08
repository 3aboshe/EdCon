import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function getCredentials() {
    try {
        const users = await prisma.user.findMany({
            select: {
                accessCode: true,
                email: true,
                role: true,
                name: true
            }
        });

        console.log('--- TEST CREDENTIALS ---');
        users.forEach(user => {
            console.log(`Role: ${user.role} | Name: ${user.name} | Access Code: ${user.accessCode} | Email: ${user.email || 'N/A'}`);
        });
        console.log('--- DEFAULT PASSWORDS ---');
        console.log('Super Admin: SuperAdmin#2025');
        console.log('Teacher (Mr. Mathias): Teacher#2025');
        console.log('Student (Tommy Learner): Student#2025');
        console.log('Others: Check seed-db.js logs for temp passwords');
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getCredentials();
