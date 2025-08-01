import express from 'express';
import Class from '../models/Class.js';

const router = express.Router();

// Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find({});
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 