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
  srNo: {
    type: Number
  },
  doj: {
    type: String,
    default: '',
    trim: true
  },
  dojDate: {
    type: Date,
    default: null
  },
  hierarchyTier: {
    type: Number,
    default: 9 // 1: Principal, 2: Vice Principal, 3: Dean, 4: Associate Dean, 5: HOD, 6: Dy HOD, 7: Professor, 8: Assoc Prof, 9: Asst Prof, 10: Lecturer, 11: Other
  },
  hierarchyLabel: {
    type: String,
    default: 'Assistant Professor',
    trim: true
  },
  seniorityOrder: {
    type: Number,
    default: 999
  },
  deptSeniorityOrder: {
    type: Number,
    default: 999
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

facultySchema.index({ seniorityOrder: 1 });
facultySchema.index({ department: 1, deptSeniorityOrder: 1 });
facultySchema.index({ hierarchyTier: 1, dojDate: 1 });

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
