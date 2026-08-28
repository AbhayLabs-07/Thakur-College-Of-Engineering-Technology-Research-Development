import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  year: { type: String, required: true, default: 'Third Year' },
  division: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true }, // e.g. Leader, Hardware Engineer, Software Engineer
  contact: { type: String, required: true, trim: true }
});

const cartItemSchema = new mongoose.Schema({
  component: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const borrowRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  teamMembers: {
    type: [teamMemberSchema],
    default: []
  },
  facultyMentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  projectTitle: {
    type: String,
    required: true,
    trim: true
  },
  projectDomain: {
    type: String,
    required: true,
    trim: true
  },
  projectDescription: {
    type: String,
    required: true,
    trim: true
  },
  cartItems: {
    type: [cartItemSchema],
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending_faculty', 'pending_admin', 'approved', 'handed_out', 'returned', 'rejected'],
    default: 'pending_faculty'
  },
  qrToken: {
    type: String,
    required: true,
    unique: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnedAt: {
    type: Date
  },
  facultyDecision: {
    approved: { type: Boolean },
    timestamp: { type: Date },
    remarks: { type: String }
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);
export default BorrowRecord;
