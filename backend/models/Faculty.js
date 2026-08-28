import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true,
    default: 'Research and Development'
  },
  designation: {
    type: String,
    required: true,
    trim: true,
    default: 'Assistant Professor'
  },
  assignedDivisions: {
    type: [String],
    default: ['A', 'B', 'C']
  },
  role: {
    type: String,
    required: true,
    default: 'faculty'
  }
}, {
  timestamps: true
});

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
