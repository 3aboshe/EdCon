import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const getAdminCode = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edcon');
    console.log('Connected to MongoDB');

    const adminUser = await User.findOne({ role: 'admin' });

    if (adminUser) {
      console.log(`Admin login code: ${adminUser.id}`);
    } else {
      console.log('No admin user found in the database.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error fetching admin code:', error);
    process.exit(1);
  }
};

getAdminCode(); 