import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Attendance', attendanceSchema); 