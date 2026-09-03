import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_inventory');
const Faculty = (await import('./models/Faculty.js')).default;

const allFaculties = await Faculty.find({}).lean();
console.log(`Total Faculty in DB: ${allFaculties.length}`);

let withPass = 0, withEmail = 0, withSpecialization = 0, withContact = 0;
for (const f of allFaculties) {
  if (f.password) withPass++;
  if (f.email) withEmail++;
  if (f.specialization) withSpecialization++;
  if (f.contactNumber) withContact++;
}

console.log(`With Password: ${withPass}`);
console.log(`With Email: ${withEmail}`);
console.log(`With Specialization: ${withSpecialization}`);
console.log(`With ContactNumber: ${withContact}`);

const depts = {};
for (const f of allFaculties) {
  depts[f.department] = (depts[f.department] || 0) + 1;
}
console.log('\nDepartment counts in DB:');
console.table(depts);

// Also check BorrowRecords: are any faculty mentors referenced in BorrowRecord?
const BorrowRecord = (await import('./models/BorrowRecord.js')).default;
const borrowCount = await BorrowRecord.countDocuments();
const recordsWithFaculty = await BorrowRecord.find({ facultyMentor: { $exists: true } }).select('facultyMentor status').lean();
console.log(`\nTotal BorrowRecords: ${borrowCount}, with faculty: ${recordsWithFaculty.length}`);

await mongoose.connection.close();
