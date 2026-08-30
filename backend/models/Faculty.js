import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  contactNumber: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: false
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
  specialization: {
    type: String,
    default: '',
    trim: true
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
