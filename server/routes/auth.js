import express from 'express';
import User from '../models/User.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// Helper to generate unique code by role
function generateCode(role) {
  if (role === 'student') {
    const prefix = 'S';
    return prefix + nanoid(6);
  } else if (role === 'teacher') {
    // Simpler teacher codes: T + 3 digits
    const prefix = 'T';
    let code;
    do {
      code = prefix + Math.floor(Math.random() * 900 + 100); // 100-999
    } while (code.length !== 4);
    return code;
  } else if (role === 'parent') {
    // Simpler parent codes: P + 3 digits
    const prefix = 'P';
    let code;
    do {
      code = prefix + Math.floor(Math.random() * 900 + 100); // 100-999
    } while (code.length !== 4);
    return code;
  } else {
    return 'U' + nanoid(6);
  }
}

// Create user (admin only)
router.post('/create', async (req, res) => {
  try {
    const { name, role, avatar, ...rest } = req.body;
    if (!name || !role) {
      return res.status(400).json({ message: 'Name and role are required.' });
    }
    // Generate unique code
    let code;
    let exists = true;
    while (exists) {
      code = generateCode(role);
      exists = await User.findOne({ id: code });
    }
    const user = new User({ id: code, name, role, avatar: avatar || '', ...rest });
    await user.save();
    res.status(201).json({ success: true, code, user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with better error handling
router.get('/users', async (req, res) => {
  try {
    console.log('Attempting to fetch users from MongoDB...');
    const users = await User.find({}).sort({ name: 1 });
    console.log(`Successfully fetched ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user by code with better error handling
router.get('/user/:code', async (req, res) => {
  try {
    console.log('Attempting to fetch user by code:', req.params.code);
    const user = await User.findOne({ id: req.params.code });
    if (!user) {
      console.log('User not found for code:', req.params.code);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User found:', user.name);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by code:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Login with better error handling
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for code:', req.body.code);
    const { code } = req.body;
    
    if (!code) {
      console.log('No code provided');
      return res.status(400).json({ message: 'Code is required' });
    }
    
    const user = await User.findOne({ id: code });
    if (!user) {
      console.log('User not found for login code:', code);
      return res.status(404).json({ message: 'Invalid code' });
    }
    
    console.log('Login successful for user:', user.name);
    res.json(user);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user codes for admin panel
router.get('/codes', async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query).select('id name role');
    res.json(users);
  } catch (error) {
    console.error('Get codes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndDelete({ id });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optional: Clean up related data (e.g., remove student from parent's childrenIds)
    if (user.role === 'student') {
      await User.updateMany(
        { childrenIds: user.id },
        { $pull: { childrenIds: user.id } }
      );
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 