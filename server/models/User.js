import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'admin'],
    required: true
  },
  email: {
    type: String,
    required: false
  },
  avatar: {
    type: String,
    default: ''
  },
  // Student-specific
  classId: { type: String },
  parentId: { type: String },

  // Parent-specific
  childrenIds: { type: [String] },

  // Teacher-specific
  subject: { type: String },
  classIds: { type: [String] },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema); 