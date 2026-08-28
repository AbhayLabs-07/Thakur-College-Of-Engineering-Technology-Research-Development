import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  erpId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: true,
    default: 'Third Year'
  },
  division: {
    type: String,
    required: true,
    trim: true
  },
  rollNo: {
    type: Number,
    required: true
  },
  role: {
    type: String,
    required: true,
    default: 'student'
  },
  contactNumber: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: 'Research and Development'
  }
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);
export default Student;
