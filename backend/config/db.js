import dns from 'node:dns';
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch (e) {}
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import Faculty from '../models/Faculty.js';

const ensureAdmin = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345678', salt);

    let admin = await Admin.findOne({
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
    console.log('Admin auto-sync notice:', err.message);
  }
};

const ensureDefaultFaculties = async () => {
  try {
    const saltFaculty = await bcrypt.genSalt(10);
    const facultiesList = [
      {
        name: 'Dr. Prachi Janrao',
        email: 'prachi.janrao@tcetmumbai.in',
        password: await bcrypt.hash('Faculty@PRAC#2026', saltFaculty),
        department: 'Artificial Intelligence & Data Science (AI&DS)',
        designation: 'HoD / Associate Professor',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      },
      {
        name: 'Dr. Vinitkumar Dongre',
        email: 'vini.dongre@tcetmumbai.in',
        password: await bcrypt.hash('Faculty@VINI#2026', saltFaculty),
        department: 'Research and Development',
        designation: 'Professor & Dean R&D',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      },
      {
        name: 'Dr. Lochan Jolly',
        email: 'lochan.jolly@tcetmumbai.in',
        password: await bcrypt.hash('Faculty@LOCH#2026', saltFaculty),
        department: 'Electronics & Telecommunication',
        designation: 'Professor & Dean SSW',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      },
      {
        name: 'Dr. Payel Saha',
        email: 'payel.saha@tcetmumbai.in',
        password: await bcrypt.hash('Faculty@PAYE#2026', saltFaculty),
        department: 'Information Technology',
        designation: 'Associate Professor & HOD IT',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      },
      {
        name: 'Dr. Harsh Gagrani',
        email: 'harsh.gagrani@tcetmumbai.in',
        password: await bcrypt.hash('Faculty@HARS#2026', saltFaculty),
        department: 'Computer Engineering',
        designation: 'Assistant Professor & CoE Lead',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      },
      {
        name: 'Sharda Birje',
        email: 'sharda.birje@tcetmumbai.in',
        password: await bcrypt.hash('Faculty@SHAR#2026', saltFaculty),
        department: 'Information Technology',
        designation: 'Assistant Professor',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      }
    ];

    for (const fac of facultiesList) {
      const existing = await Faculty.findOne({
        $or: [
          { email: fac.email },
          { name: { $regex: new RegExp(fac.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
        ]
      });

      if (existing) {
        if (!existing.email) existing.email = fac.email;
        if (!existing.password) existing.password = fac.password;
        await existing.save();
      } else {
        await Faculty.create(fac);
      }
    }
  } catch (err) {
    console.log('Faculty auto-sync notice:', err.message);
  }
};

import BorrowRecord from '../models/BorrowRecord.js';

const cleanupDuplicateBorrowRecords = async () => {
  try {
    const pendingRecords = await BorrowRecord.find({ status: 'pending_faculty' }).sort({ createdAt: 1 });
    const seen = new Map();
    const duplicateIds = [];

    for (const record of pendingRecords) {
      if (!record.student || !record.facultyMentor || !record.projectTitle) continue;
      const key = `${record.student.toString()}_${record.facultyMentor.toString()}_${record.projectTitle.trim().toLowerCase()}`;
      if (seen.has(key)) {
        duplicateIds.push(record._id);
      } else {
        seen.set(key, record._id);
      }
    }

    if (duplicateIds.length > 0) {
      await BorrowRecord.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`Cleaned up ${duplicateIds.length} duplicate pending borrow requests.`);
    }
  } catch (err) {
    console.log('Cleanup notice:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_inventory');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await ensureAdmin();
    await ensureDefaultFaculties();
    await cleanupDuplicateBorrowRecords();
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
