import mongoose from 'mongoose';

const homeworkSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  dueDate: {
    type: String,
    required: true
  },
  assignedDate: {
    type: String,
    required: true
  },
  teacherId: {
    type: String,
    required: true
  },
  submitted: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Homework', homeworkSchema); 