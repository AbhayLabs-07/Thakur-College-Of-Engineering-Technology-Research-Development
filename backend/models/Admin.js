import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'System Administrator'
  },
  contactNumber: {
    type: String,
    default: ''
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: 'admin'
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    default: 'admin'
  }
}, {
  timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
