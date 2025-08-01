import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Grade from './models/Grade.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const clearUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const deleteResult = await User.deleteMany({ role: { $in: ['student', 'parent', 'teacher'] } });
    console.log(`Deleted ${deleteResult.deletedCount} users (students, parents, teachers).`);

    const gradeDeleteResult = await Grade.deleteMany({});
    console.log(`Deleted ${gradeDeleteResult.deletedCount} grades.`);

    console.log('Non-admin users and associated data have been cleared.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing users:', error);
    process.exit(1);
  }
};

clearUsers(); 