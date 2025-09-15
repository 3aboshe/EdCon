import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const checkAdmin = async () => {
  try {
    console.log('Checking for admin users in Prisma database...');
    
    // Find all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });
    
    if (adminUsers.length > 0) {
      console.log(`Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(admin => {
        console.log(`Admin code: ${admin.id}, Name: ${admin.name}`);
      });
    } else {
      console.log('No admin users found in the database.');
      console.log('Creating admin user...');
      
      // Create an admin user
      const adminUser = await prisma.user.create({
        data: {
          id: 'admin',
          name: 'Administrator',
          role: 'ADMIN',
          avatar: '',
        }
      });
      
      console.log(`Created admin user with code: ${adminUser.id}`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

checkAdmin();
