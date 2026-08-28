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
    const hashedAdminPassword = await bcrypt.hash('admin123', saltAdmin);

    await Admin.create({
      username: 'admin',
      password: hashedAdminPassword,
      role: 'admin'
    });
    console.log('Default Admin seeded successfully (User: admin / Pass: admin123)');

    // Seed Faculty Mentors
    const saltFaculty = await bcrypt.genSalt(10);
    const facultyData = [
      {
        name: 'Dr. Vinitkumar Dongre',
        email: 'vini.dongre@tcetmumbai.in',
        password: await bcrypt.hash('Faculty@VINI#2026', saltFaculty),
        department: 'Research and Development',
        designation: 'Professor & Dean R&D',
        assignedDivisions: ['A', 'B', 'C'],
        role: 'faculty'
      },
      {
        name: 'Dr. Lochan Jolly',
        email: 'lochan.jolly@tcetmumbai.in',
        password: await bcrypt.hash('Faculty@LOCH#2026', saltFaculty),
        department: 'Electronics & Telecommunication',
        designation: 'Professor & Dean SSW',
        assignedDivisions: ['A', 'B', 'C'],
        role: 'faculty'
      },
      {
        name: 'Dr. Payel Saha',
        email: 'payel.saha@tcetmumbai.in',
        password: await bcrypt.hash('Faculty@PAYE#2026', saltFaculty),
        department: 'Information Technology',
        designation: 'Associate Professor & HOD IT',
        assignedDivisions: ['A', 'B', 'C'],
        role: 'faculty'
      },
      {
        name: 'Dr. Harsh Gagrani',
        email: 'harsh.gagrani@tcetmumbai.in',
        password: await bcrypt.hash('Faculty@HARS#2026', saltFaculty),
        department: 'Computer Engineering',
        designation: 'Assistant Professor & CoE Lead',
        assignedDivisions: ['A', 'B', 'C'],
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
