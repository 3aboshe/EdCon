import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
});

export default mongoose.model('Class', classSchema); 