import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  assignment: {
    type: String,
    required: true
  },
  marksObtained: {
    type: Number,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['quiz', 'test', 'homework', 'project', 'exam'],
    default: 'quiz'
  }
});

export default mongoose.model('Grade', gradeSchema); 