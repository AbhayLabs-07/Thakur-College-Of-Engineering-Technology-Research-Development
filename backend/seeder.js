import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';
import Faculty from './models/Faculty.js';

dotenv.config();

const seedAdminAndFaculty = async () => {
  try {
    await connectDB();

    // Clear existing Admins and Faculty
    await Admin.deleteMany({});
    await Faculty.deleteMany({});

    console.log('Existing Admins and Faculty cleared.');

    // Seed Admin
    const saltAdmin = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('RNDTCET@2026', saltAdmin);

    await Admin.create({
      name: 'Ashish Mudholkar',
      email: 'ashish.mudholkar75@gmail.com',
      contactNumber: '9920123456',
      username: 'Admin',
      password: hashedAdminPassword,
      role: 'admin'
    });
    console.log('Default Admin seeded successfully (Name: Ashish Mudholkar / User: Admin / Email: ashish.mudholkar75@gmail.com / Pass: RNDTCET@2026)');

    // Seed Faculty Mentors
    const saltFaculty = await bcrypt.genSalt(10);
    const facultyData = [
      {
        name: 'Dr. Vinitkumar Dongre',
        email: 'vini.dongre@tcetmumbai.in',
        contactNumber: '9820011111',
        password: await bcrypt.hash('Faculty@VINI#2026', saltFaculty),
        department: 'Research and Development',
        designation: 'Professor & Dean R&D',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      },
      {
        name: 'Dr. Lochan Jolly',
        email: 'lochan.jolly@tcetmumbai.in',
        contactNumber: '9820022222',
        password: await bcrypt.hash('Faculty@LOCH#2026', saltFaculty),
        department: 'Electronics & Telecommunication',
        designation: 'Professor & Dean SSW',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      },
      {
        name: 'Dr. Payel Saha',
        email: 'payel.saha@tcetmumbai.in',
        contactNumber: '9820033333',
        password: await bcrypt.hash('Faculty@PAYE#2026', saltFaculty),
        department: 'Information Technology',
        designation: 'Associate Professor & HOD IT',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      },
      {
        name: 'Dr. Harsh Gagrani',
        email: 'harsh.gagrani@tcetmumbai.in',
        contactNumber: '9820044444',
        password: await bcrypt.hash('Faculty@HARS#2026', saltFaculty),
        department: 'Computer Engineering',
        designation: 'Assistant Professor & CoE Lead',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      },
      {
        name: 'Sharda Birje',
        email: 'sharda.birje@tcetmumbai.in',
        contactNumber: '9820055555',
        password: await bcrypt.hash('Faculty@SHAR#2026', saltFaculty),
        department: 'Information Technology',
        designation: 'Assistant Professor',
        assignedDivisions: ['A', 'B', 'C', 'D'],
        role: 'faculty'
      }
    ];

    await Faculty.insertMany(facultyData);
    console.log(`Successfully seeded ${facultyData.length} faculty mentors.`);

    mongoose.connection.close();
    console.log('DB Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedAdminAndFaculty();
