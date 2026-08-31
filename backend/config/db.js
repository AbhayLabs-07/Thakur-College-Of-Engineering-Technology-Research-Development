import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';

const ensureAdmin = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('RNDTCET@2026', salt);

    const admin = await Admin.findOne({
      $or: [
        { username: { $regex: /^admin$/i } },
        { email: 'ashish.mudholkar75@gmail.com' }
      ]
    });

    if (admin) {
      admin.name = 'Ashish Mudholkar';
      admin.email = 'ashish.mudholkar75@gmail.com';
      admin.username = 'Admin';
      admin.password = hashedPassword;
      admin.role = 'admin';
      if (!admin.contactNumber) admin.contactNumber = '9920123456';
      await admin.save();
    } else {
      await Admin.create({
        name: 'Ashish Mudholkar',
        email: 'ashish.mudholkar75@gmail.com',
        username: 'Admin',
        password: hashedPassword,
        role: 'admin',
        contactNumber: '9920123456'
      });
    }
  } catch (err) {
    // Non-blocking log if schema or connection is busy
    console.log('Admin auto-sync notice:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_inventory');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await ensureAdmin();
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
